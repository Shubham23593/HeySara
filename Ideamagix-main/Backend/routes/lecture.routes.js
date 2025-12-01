import express from 'express';
import { 
  getAllLectures, 
  getUnassignedLectures, 
  getLecturesByInstructor,
  assignLecture,
  updateLecture,
  deleteLecture
} from '../controllers/lecture.controller.js';
import { protect, admin } from '../middleware/auth.middleware.js';

const router = express.Router();

router.get('/', protect, getAllLectures);
router.get('/unassigned', protect, admin, getUnassignedLectures);
router.get('/instructor/:instructorId', protect, getLecturesByInstructor);
router.put('/assign', protect, admin, assignLecture);
router.put('/:courseId/:lectureId', protect, admin, updateLecture);
router.delete('/:courseId/:lectureId', protect, admin, deleteLecture);

export default router;