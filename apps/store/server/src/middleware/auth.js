import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import { env } from '../config/env.js';
import { User } from '../models/User.js';
import { AppError, asyncHandler } from './errorHandler.js';

export const auth = asyncHandler(async (req, _res, next) => {
  const [scheme, token] = (req.headers.authorization || '').split(' ');
  if (scheme !== 'Bearer' || !token) {
    throw new AppError(401, 'Authentication required', 'UNAUTHENTICATED');
  }

  let payload;
  try {
    payload = jwt.verify(token, env.JWT_SECRET, { algorithms: ['HS256'] });
  } catch {
    throw new AppError(401, 'Invalid or expired token', 'INVALID_TOKEN');
  }

  if (!mongoose.isValidObjectId(payload.sub)) {
    throw new AppError(401, 'Invalid or expired token', 'INVALID_TOKEN');
  }
  const user = await User.findById(payload.sub);
  if (!user) throw new AppError(401, 'Invalid or expired token', 'INVALID_TOKEN');

  req.user = user;
  next();
});
