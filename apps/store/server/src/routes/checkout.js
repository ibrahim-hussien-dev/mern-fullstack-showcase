import { Router } from 'express';
import { auth } from '../middleware/auth.js';
import { createSession } from '../controllers/checkout.js';

// NOTE: POST /checkout/webhook is mounted directly in app.js (needs the raw body, before express.json()).
const router = Router();
router.post('/session', auth, createSession);
export default router;
