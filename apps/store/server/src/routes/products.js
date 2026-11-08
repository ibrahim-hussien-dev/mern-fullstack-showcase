import { Router } from 'express';
import { z } from 'zod';
import { validate } from '../middleware/validate.js';
import { getProduct, listProducts } from '../controllers/products.js';

const querySchema = z.object({
  q: z.string().trim().max(100).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(12),
});

const router = Router();
router.get('/', validate(querySchema, 'query'), listProducts);
router.get('/:id', getProduct);
export default router;
