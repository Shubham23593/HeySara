import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useData } from '../../contexts/DataContext';
import toast from 'react-hot-toast';
import CourseForm from '../../components/admin/CourseForm';

const EditCoursePage = () => {
  const navigate = useNavigate();
  const { courseId } = useParams();
  const { getCourseById, updateCourse } = useData();

  const course = getCourseById(courseId);

  const handleEditCourse = (updatedData) => {
    updateCourse(courseId, updatedData);
    toast.success('Course updated successfully!');
    navigate('/admin/courses');
  };

  if (!course) {
    return <div>Course not found.</div>;
  }

  return (
    <CourseForm
      onSubmit={handleEditCourse}
      initialData={course}
      title="Edit Course"
      description="Update the course details below."
      buttonText="Save Changes"
    />
  );
};

export default EditCoursePage;
