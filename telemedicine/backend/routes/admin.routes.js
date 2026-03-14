import express from 'express';
import {
  getDashboard,
  getAllDoctors,
  getAllQueues,
  getAnalytics,
} from '../controllers/admin.controller.js';
import authMiddleware from '../middleware/auth.middleware.js';
import { requireRole } from '../middleware/auth.middleware.js';

const router = express.Router();

router.use(authMiddleware, requireRole('admin'));

router.get('/dashboard', getDashboard);
router.get('/doctors', getAllDoctors);
router.get('/queues', getAllQueues);
router.get('/analytics', getAnalytics);

export default router;
