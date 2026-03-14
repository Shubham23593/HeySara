import express from 'express';
import {
  getDoctorQueue,
  toggleStatus,
  startSession,
  endSession,
  acceptUrgent,
} from '../controllers/doctor.controller.js';
import authMiddleware from '../middleware/auth.middleware.js';
import { requireRole } from '../middleware/auth.middleware.js';

const router = express.Router();

router.use(authMiddleware, requireRole('doctor'));

router.get('/queue', getDoctorQueue);
router.post('/status', toggleStatus);
router.post('/start-session/:patientId', startSession);
router.post('/end-session/:patientId', endSession);
router.post('/accept-urgent/:patientId', acceptUrgent);

export default router;
