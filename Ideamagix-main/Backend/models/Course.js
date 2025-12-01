import mongoose from 'mongoose';

const lectureSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Lecture title is required'],
    trim: true
  },
  date: {
    type: Date,
    required: [true, 'Lecture date is required']
  },
  duration: {
    type: Number,
    required: [true, 'Duration is required'],
    min: 15
  },
  instructorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  courseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true
  }
}, {
  timestamps: true
});

const courseSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Course name is required'],
    trim: true
  },
  level: {
    type: String,
    enum: ['Beginner', 'Intermediate', 'Advanced'],
    default: 'Beginner'
  },
  description: {
    type: String,
    trim: true
  },
  imageUrl: {
    type: String
  },
  lectures: [lectureSchema]
}, {
  timestamps: true
});

const Course = mongoose.model('Course', courseSchema);

export default Course;