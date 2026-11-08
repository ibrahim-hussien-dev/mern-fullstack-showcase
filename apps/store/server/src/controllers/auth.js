import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { User } from '../models/User.js';
import { AppError, asyncHandler } from '../middleware/errorHandler.js';

// Compared against when the email is unknown, so response time doesn't reveal whether an account exists.
const DUMMY_HASH = bcrypt.hashSync('timing-equalisation-password', env.BCRYPT_COST);

function signToken(user) {
  return jwt.sign({ sub: user._id.toString(), role: user.role }, env.JWT_SECRET, {
    algorithm: 'HS256',
    expiresIn: '1h',
  });
}

export const register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body; // role can never be supplied by the client
  const passwordHash = await bcrypt.hash(password, env.BCRYPT_COST);

  let user;
  try {
    user = await User.create({ name, email, passwordHash });
  } catch (err) {
    if (err.code === 11000) throw new AppError(409, 'Email is already registered', 'EMAIL_TAKEN');
    throw err;
  }
  res.status(201).json({ user: user.toJSON(), token: signToken(user) });
});

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email }).select('+passwordHash');
  const ok = await bcrypt.compare(password, user?.passwordHash ?? DUMMY_HASH);
  if (!user || !ok) throw new AppError(401, 'Invalid credentials', 'INVALID_CREDENTIALS');
  res.json({ user: user.toJSON(), token: signToken(user) });
});

export const me = (req, res) => {
  res.json({ user: req.user.toJSON() });
};
