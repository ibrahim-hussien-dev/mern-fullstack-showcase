import { Cart } from '../models/Cart.js';
import { Product } from '../models/Product.js';
import { AppError, asyncHandler } from '../middleware/errorHandler.js';
import { subtotalCents } from '../services/pricing.js';

export const MAX_LINE_QTY = 10;

async function ensureCart(userId) {
  try {
    return await Cart.findOneAndUpdate(
      { user: userId },
      { $setOnInsert: { user: userId, items: [] } },
      { upsert: true, new: true },
    );
  } catch (err) {
    if (err.code === 11000) return Cart.findOne({ user: userId }); // lost the upsert race, cart exists now
    throw err;
  }
}

async function cartView(userId) {
  const cart = await Cart.findOne({ user: userId }).populate('items.product');
  const items = (cart?.items ?? []).filter((i) => i.product).map((i) => ({ product: i.product, qty: i.qty }));
  return { items, subtotal: subtotalCents(items) };
}

export const getCart = asyncHandler(async (req, res) => {
  res.json(await cartView(req.user._id));
});

export const putItem = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const { productId, qty } = req.body;

  await ensureCart(userId);

  if (qty === 0) {
    await Cart.updateOne({ user: userId }, { $pull: { items: { product: productId } } });
    return res.json(await cartView(userId));
  }

  const product = await Product.findById(productId);
  if (!product) throw new AppError(404, 'Product not found', 'PRODUCT_NOT_FOUND');

  const max = Math.min(product.stock, MAX_LINE_QTY);
  if (max < 1) throw new AppError(409, 'Product is out of stock', 'OUT_OF_STOCK');
  const finalQty = Math.min(Math.max(qty, 1), max); // clamp to 1..min(stock, 10)

  const updated = await Cart.updateOne(
    { user: userId, 'items.product': product._id },
    { $set: { 'items.$.qty': finalQty } },
  );
  if (updated.matchedCount === 0) {
    await Cart.updateOne(
      { user: userId, 'items.product': { $ne: product._id } },
      { $push: { items: { product: product._id, qty: finalQty } } },
    );
  }
  return res.json(await cartView(userId));
});

export const clearCart = asyncHandler(async (req, res) => {
  await Cart.updateOne({ user: req.user._id }, { $set: { items: [] } });
  res.status(204).end();
});
