import { env } from '../config/env.js';
import { getStripe } from '../config/stripe.js';
import { Cart } from '../models/Cart.js';
import { Order } from '../models/Order.js';
import { AppError, asyncHandler } from '../middleware/errorHandler.js';
import { buildOrderLines } from '../services/pricing.js';
import { fulfillPaidOrder, markPaymentFailed } from '../services/inventory.js';

export const createSession = asyncHandler(async (req, res) => {
  const cart = await Cart.findOne({ user: req.user._id }).populate('items.product');
  const { lines, totalCents } = buildOrderLines(cart?.items ?? []); // re-priced from the DB
  if (lines.length === 0) throw new AppError(400, 'Cart is empty', 'EMPTY_CART');

  const shortages = cart.items
    .filter((i) => i.product && i.product.stock < i.qty)
    .map((i) => ({
      productId: i.product._id.toString(),
      name: i.product.name,
      requested: i.qty,
      available: i.product.stock,
    }));
  if (shortages.length > 0) {
    throw new AppError(409, 'Insufficient stock for some items', 'INSUFFICIENT_STOCK', shortages);
  }

  const order = await Order.create({ user: req.user._id, items: lines, totalCents, status: 'pending' });

  let intent;
  try {
    intent = await getStripe().paymentIntents.create(
      {
        amount: totalCents,
        currency: 'usd',
        metadata: { orderId: order._id.toString(), userId: req.user._id.toString() },
        automatic_payment_methods: { enabled: true },
      },
      { idempotencyKey: `order_${order._id}` },
    );
  } catch (err) {
    console.error('Stripe PaymentIntent creation failed:', err.message);
    order.status = 'failed';
    order.failureReason = 'PAYMENT_PROVIDER_ERROR';
    await order.save();
    throw new AppError(502, 'Payment provider error', 'PAYMENT_PROVIDER_ERROR');
  }

  order.paymentIntentId = intent.id;
  await order.save();
  res.json({ clientSecret: intent.client_secret, orderId: order._id.toString() });
});

/** Mounted in app.js BEFORE express.json() with express.raw(); req.body is a Buffer here. */
export const webhook = asyncHandler(async (req, res) => {
  const signature = req.headers['stripe-signature'];
  let event;
  try {
    if (!signature) throw new Error('Missing signature');
    event = getStripe().webhooks.constructEvent(req.body, signature, env.STRIPE_WEBHOOK_SECRET);
  } catch {
    throw new AppError(400, 'Invalid webhook signature', 'INVALID_SIGNATURE');
  }

  const paymentIntentId = event.data?.object?.id;
  switch (event.type) {
    case 'payment_intent.succeeded':
      await fulfillPaidOrder(paymentIntentId);
      break;
    case 'payment_intent.payment_failed':
      await markPaymentFailed(paymentIntentId);
      break;
    default:
      break; // ignore other events
  }
  res.status(200).json({ received: true });
});
