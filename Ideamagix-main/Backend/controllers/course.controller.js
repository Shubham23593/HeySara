import Course from '../models/Course.js';

// @desc    Get all courses
// @route   GET /api/courses
// @access  Private
export const getCourses = async (req, res) => {
  try {
    const courses = await Course.find().populate('lectures.instructorId', 'name email');
    res.json(courses);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get course by ID
// @route   GET /api/courses/:id
// @access  Private
export const getCourseById = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id).populate('lectures.instructorId', 'name email');
    
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }
    
    res.json(course);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create course
// @route   POST /api/courses
// @access  Private/Admin
export const createCourse = async (req, res) => {
  try {
    const { name, level, description, imageUrl } = req.body;

    const course = await Course.create({
      name,
      level,
      description,
      imageUrl,
      lectures: []
    });

    res.status(201).json(course);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Update course
// @route   PUT /api/courses/:id
// @access  Private/Admin
export const updateCourse = async (req, res) => {
  try {
    const { name, level, description, imageUrl } = req.body;

    const course = await Course.findById(req.params.id);

    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    course.name = name || course.name;
    course.level = level || course.level;
    course.description = description || course.description;
    course.imageUrl = imageUrl || course.imageUrl;

    const updatedCourse = await course.save();
    res.json(updatedCourse);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Delete course
// @route   DELETE /api/courses/:id
// @access  Private/Admin
export const deleteCourse = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);

    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    await course.deleteOne();
    res.json({ message: 'Course removed' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Add lecture to course
// @route   POST /api/courses/:id/lectures
// @access  Private/Admin
export const addLecture = async (req, res) => {
  try {
    const { title, date, duration } = req.body;
    const course = await Course.findById(req.params.id);

    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    const lecture = {
      title,
      date,
      duration,
      courseId: course._id
    };

    course.lectures.push(lecture);
    const updatedCourse = await course.save();
    
    res.status(201).json(updatedCourse);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Get instructors for a course
// @route   GET /api/courses/:id/instructors
// @access  Private
export const getCourseInstructors = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id).populate('lectures.instructorId', 'name email avatarUrl');
    
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    // Get unique instructors
    const instructorIds = new Set();
    const instructors = [];

    course.lectures.forEach(lecture => {
      if (lecture.instructorId && !instructorIds.has(lecture.instructorId._id.toString())) {
        instructorIds.add(lecture.instructorId._id.toString());
        instructors.push(lecture.instructorId);
      }
    });

    res.json(instructors);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};