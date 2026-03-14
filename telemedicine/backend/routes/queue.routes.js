import express from 'express';
import { getLiveQueue, recalculateQueues } from '../controllers/queue.controller.js';
import authMiddleware from '../middleware/auth.middleware.js';
import { requireRole } from '../middleware/auth.middleware.js';

const router = express.Router();

router.get('/live', getLiveQueue);
router.post('/recalculate', authMiddleware, requireRole('admin', 'doctor'), recalculateQueues);

export default router;
