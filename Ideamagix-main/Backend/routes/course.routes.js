import express from 'express';
import { 
  getCourses, 
  getCourseById, 
  createCourse, 
  updateCourse, 
  deleteCourse,
  addLecture,
  getCourseInstructors
} from '../controllers/course.controller.js';
import { protect, admin } from '../middleware/auth.middleware.js';

const router = express.Router();

router.route('/')
  .get(protect, getCourses)
  .post(protect, admin, createCourse);

router.route('/:id')
  .get(protect, getCourseById)
  .put(protect, admin, updateCourse)
  .delete(protect, admin, deleteCourse);

router.post('/:id/lectures', protect, admin, addLecture);
router.get('/:id/instructors', protect, getCourseInstructors);

export default router;