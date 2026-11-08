import { Router } from 'express';
import { z } from 'zod';
import { auth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { clearCart, getCart, putItem } from '../controllers/cart.js';

const itemSchema = z.object({
  productId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid product id'),
  qty: z.number().int().min(0).max(1000),
});

const router = Router();
router.use(auth);
router.get('/', getCart);
router.put('/items', validate(itemSchema), putItem);
router.delete('/', clearCart);
export default router;
