import { Router } from 'express';
import { auth } from '../middleware/auth.js';
import { getOrder, listOrders } from '../controllers/orders.js';

const router = Router();
router.use(auth);
router.get('/', listOrders);
router.get('/:id', getOrder);
export default router;
