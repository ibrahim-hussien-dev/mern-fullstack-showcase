import mongoose from 'mongoose';
import { Order } from '../models/Order.js';
import { AppError, asyncHandler } from '../middleware/errorHandler.js';

export const listOrders = asyncHandler(async (req, res) => {
  const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 });
  res.json(orders);
});

export const getOrder = asyncHandler(async (req, res) => {
  const notFound = new AppError(404, 'Order not found', 'NOT_FOUND'); // same answer for "not yours" and "doesn't exist"
  if (!mongoose.isValidObjectId(req.params.id)) throw notFound;
  const order = await Order.findOne({ _id: req.params.id, user: req.user._id });
  if (!order) throw notFound;
  res.json(order);
});
