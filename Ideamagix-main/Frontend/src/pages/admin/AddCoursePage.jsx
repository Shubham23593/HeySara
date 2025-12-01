import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from '../../contexts/DataContext';
import toast from 'react-hot-toast';
import CourseForm from '../../components/admin/CourseForm';

const AddCoursePage = () => {
  const navigate = useNavigate();
  const { addCourse } = useData();

  const handleAddCourse = (courseData) => {
    addCourse(courseData);
    toast.success('Course added successfully!');
    navigate('/admin/courses');
  };

  return (
    <CourseForm
      onSubmit={handleAddCourse}
      title="Add New Course"
      description="Fill in the details below to create a new course."
      buttonText="Create Course"
    />
  );
};

export default AddCoursePage;
