import Course from '../models/Course.js';
import User from '../models/User.js';

// @desc    Get all lectures
// @route   GET /api/lectures
// @access  Private
export const getAllLectures = async (req, res) => {
  try {
    const courses = await Course.find().populate('lectures.instructorId', 'name email');
    
    const allLectures = [];
    courses.forEach(course => {
      course.lectures.forEach(lecture => {
        allLectures.push({
          ...lecture.toObject(),
          courseName: course.name,
          courseId: course._id
        });
      });
    });

    // Sort by date
    allLectures.sort((a, b) => new Date(a.date) - new Date(b.date));
    
    res.json(allLectures);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get unassigned lectures
// @route   GET /api/lectures/unassigned
// @access  Private/Admin
export const getUnassignedLectures = async (req, res) => {
  try {
    const courseId = req.query.courseId;
    let courses;

    if (courseId) {
      courses = await Course.find({ _id: courseId });
    } else {
      courses = await Course.find();
    }

    const unassignedLectures = [];
    courses.forEach(course => {
      course.lectures.forEach(lecture => {
        if (!lecture.instructorId) {
          unassignedLectures.push({
            ...lecture.toObject(),
            courseName: course.name,
            courseId: course._id
          });
        }
      });
    });

    // Sort by date
    unassignedLectures.sort((a, b) => new Date(a.date) - new Date(b.date));
    
    res.json(unassignedLectures);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get lectures by instructor
// @route   GET /api/lectures/instructor/:instructorId
// @access  Private
export const getLecturesByInstructor = async (req, res) => {
  try {
    const instructorId = req.params.instructorId;
    const courses = await Course.find().populate('lectures.instructorId', 'name email');

    const instructorLectures = [];
    courses.forEach(course => {
      course.lectures.forEach(lecture => {
        if (lecture.instructorId && lecture.instructorId._id.toString() === instructorId) {
          instructorLectures.push({
            ...lecture.toObject(),
            courseName: course.name,
            courseId: course._id
          });
        }
      });
    });

    // Sort by date
    instructorLectures.sort((a, b) => new Date(a.date) - new Date(b.date));
    
    res.json(instructorLectures);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Assign lecture to instructor
// @route   PUT /api/lectures/assign
// @access  Private/Admin
export const assignLecture = async (req, res) => {
  try {
    const { lectureId, courseId, instructorId } = req.body;

    // Verify instructor exists
    const instructor = await User.findById(instructorId);
    if (!instructor || instructor.role !== 'instructor') {
      return res.status(404).json({ message: 'Instructor not found' });
    }

    // Find course and update lecture
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    const lecture = course.lectures.id(lectureId);
    if (!lecture) {
      return res.status(404).json({ message: 'Lecture not found' });
    }

    // Check if instructor has another lecture on the same day
    const lectureDate = new Date(lecture.date).toDateString();
    const allCourses = await Course.find();
    
    for (const c of allCourses) {
      for (const l of c.lectures) {
        if (l.instructorId && 
            l.instructorId.toString() === instructorId && 
            new Date(l.date).toDateString() === lectureDate &&
            l._id.toString() !== lectureId) {
          return res.status(400).json({ 
            message: 'Instructor already has a lecture scheduled on this day' 
          });
        }
      }
    }

    lecture.instructorId = instructorId;
    await course.save();

    const populatedCourse = await Course.findById(courseId).populate('lectures.instructorId', 'name email');
    
    res.json(populatedCourse);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Update lecture
// @route   PUT /api/lectures/:courseId/:lectureId
// @access  Private/Admin
export const updateLecture = async (req, res) => {
  try {
    const { courseId, lectureId } = req.params;
    const { title, date, duration } = req.body;

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    const lecture = course.lectures.id(lectureId);
    if (!lecture) {
      return res.status(404).json({ message: 'Lecture not found' });
    }

    lecture.title = title || lecture.title;
    lecture.date = date || lecture.date;
    lecture.duration = duration || lecture.duration;

    await course.save();
    res.json(course);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Delete lecture
// @route   DELETE /api/lectures/:courseId/:lectureId
// @access  Private/Admin
export const deleteLecture = async (req, res) => {
  try {
    const { courseId, lectureId } = req.params;

    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    course.lectures.pull(lectureId);
    await course.save();

    res.json({ message: 'Lecture removed' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};