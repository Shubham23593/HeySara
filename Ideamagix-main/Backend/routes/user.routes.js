import express from 'express';
import { 
  getInstructors, 
  getInstructorById, 
  updateProfile, 
  deleteUser 
} from '../controllers/user.controller.js';
import { protect, admin } from '../middleware/auth.middleware.js';

const router = express.Router();

router.get('/instructors', protect, getInstructors);
router.get('/instructors/:id', protect, getInstructorById);
router.put('/profile', protect, updateProfile);
router.delete('/:id', protect, admin, deleteUser);

export default router;