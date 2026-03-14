import express from 'express';
import {
  joinQueue,
  getPatientStatus,
  urgentRequest,
  getQueuePosition,
} from '../controllers/patient.controller.js';
import authMiddleware from '../middleware/auth.middleware.js';
import { apiLimiter } from '../middleware/rateLimiter.middleware.js';

const router = express.Router();

router.use(apiLimiter);

// Join queue is public (form submission without login required)
router.post('/join-queue', joinQueue);

router.get('/status/:patientId', getPatientStatus);
router.post('/urgent-request', urgentRequest);
router.get('/queue-position/:patientId', getQueuePosition);

export default router;
