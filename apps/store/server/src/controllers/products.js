import mongoose from 'mongoose';
import { Product } from '../models/Product.js';
import { AppError, asyncHandler } from '../middleware/errorHandler.js';

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export const listProducts = asyncHandler(async (req, res) => {
  const { q, page, limit } = req.query;
  const filter = q
    ? { $or: [{ name: { $regex: escapeRegex(q), $options: 'i' } }, { description: { $regex: escapeRegex(q), $options: 'i' } }] }
    : {};
  const [items, total] = await Promise.all([
    Product.find(filter)
      .sort({ createdAt: 1, _id: 1 })
      .skip((page - 1) * limit)
      .limit(limit),
    Product.countDocuments(filter),
  ]);
  res.json({ items, total });
});

export const getProduct = asyncHandler(async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) throw new AppError(404, 'Product not found', 'NOT_FOUND');
  const product = await Product.findById(req.params.id);
  if (!product) throw new AppError(404, 'Product not found', 'NOT_FOUND');
  res.json(product);
});
