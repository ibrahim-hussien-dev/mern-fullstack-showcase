import { Product } from '../models/Product.js';
import { Order } from '../models/Order.js';
import { Cart } from '../models/Cart.js';
import { getStripe } from '../config/stripe.js';

/**
 * Atomically decrements stock line by line (`stock >= qty` guard in the filter so it can never go negative).
 * If any line fails, previously applied decrements are rolled back (compensating rollback).
 */
export async function decrementStock(items) {
  const applied = [];
  for (const item of items) {
    const updated = await Product.findOneAndUpdate(
      { _id: item.product, stock: { $gte: item.qty } },
      { $inc: { stock: -item.qty } },
    );
    if (!updated) {
      await restoreStock(applied);
      return { ok: false, failedProduct: item.product };
    }
    applied.push(item);
  }
  return { ok: true };
}

export async function restoreStock(items) {
  for (const item of items) {
    await Product.updateOne({ _id: item.product }, { $inc: { stock: item.qty } });
  }
}

/**
 * Handles `payment_intent.succeeded`. Idempotent per paymentIntentId:
 * the order is "claimed" atomically, so duplicate / concurrent deliveries of the same event do nothing.
 */
export async function fulfillPaidOrder(paymentIntentId) {
  const order = await Order.findOneAndUpdate(
    {
      paymentIntentId,
      fulfillmentClaimed: { $ne: true },
      // A declined card leaves the PaymentIntent open; the customer may retry and succeed on the same intent.
      $or: [{ status: 'pending' }, { status: 'failed', failureReason: 'PAYMENT_FAILED' }],
    },
    { $set: { fulfillmentClaimed: true } },
    { new: true },
  );
  if (!order) return { outcome: 'skipped' }; // unknown, already paid/failed, or being processed

  let decremented = false;
  let committed = false;
  try {
    const result = await decrementStock(order.items);

    if (!result.ok) {
      order.status = 'failed';
      order.failureReason = 'OUT_OF_STOCK';
      await order.save();
      committed = true;
      try {
        const refund = await getStripe().refunds.create({ payment_intent: paymentIntentId });
        order.refundId = refund.id;
        await order.save();
      } catch (err) {
        console.error(`Refund failed for order ${order._id}:`, err.message);
      }
      return { outcome: 'failed_out_of_stock' };
    }

    decremented = true;
    order.status = 'paid';
    order.failureReason = undefined;
    await order.save();
    committed = true;
    await Cart.deleteOne({ user: order.user });
    return { outcome: 'paid' };
  } catch (err) {
    if (!committed) {
      // Unexpected failure before the order was finalised: undo and release the claim so Stripe's retry can run again.
      if (decremented) await restoreStock(order.items);
      await Order.updateOne({ _id: order._id, status: { $in: ['pending', 'failed'] } }, { $set: { fulfillmentClaimed: false } });
    }
    throw err;
  }
}

export async function markPaymentFailed(paymentIntentId) {
  await Order.updateOne(
    { paymentIntentId, status: 'pending' },
    { $set: { status: 'failed', failureReason: 'PAYMENT_FAILED' } },
  );
}
