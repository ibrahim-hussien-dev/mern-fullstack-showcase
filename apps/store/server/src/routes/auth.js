import { Router } from 'express';
import { z } from 'zod';
import { validate } from '../middleware/validate.js';
import { auth } from '../middleware/auth.js';
import { login, me, register } from '../controllers/auth.js';

const email = z.string().trim().toLowerCase().email().max(254);

const registerSchema = z.object({
  name: z.string().trim().min(1).max(80),
  email,
  password: z.string().min(8).max(72), // 72 = bcrypt's input limit
});
const loginSchema = z.object({ email, password: z.string().min(1).max(72) });

const router = Router();
router.post('/register', validate(registerSchema), register);
router.post('/login', validate(loginSchema), login);
router.get('/me', auth, me);
export default router;
