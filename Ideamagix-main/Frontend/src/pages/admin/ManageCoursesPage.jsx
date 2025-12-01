import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { useData } from '../../contexts/DataContext';
import { PlusCircle, Edit, BookOpen, UserPlus, UserCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import AssignInstructorModal from '../../components/admin/AssignInstructorModal';

const ManageCoursesPage = () => {
  const { courses, getInstructorsForCourse } = useData();
  const navigate = useNavigate();
  const [modalState, setModalState] = useState({ isOpen: false, course: null });

  const handleOpenModal = (course) => {
    setModalState({ isOpen: true, course });
  };

  const handleCloseModal = () => {
    setModalState({ isOpen: false, course: null });
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Manage Courses</h2>
        <Button onClick={() => navigate('/admin/add-course')}>
          <PlusCircle className="mr-2 h-4 w-4" /> Add New Course
        </Button>
      </div>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {courses.map(course => {
          // ✅ दोन्ही _id आणि id handle करा
          const courseId = course._id || course.id;
          const assignedInstructors = getInstructorsForCourse(courseId);
          
          return (
            <Card key={courseId} className="flex flex-col">
              <CardHeader className="p-0">
                <img src={course.imageUrl} alt={course.name} className="rounded-t-lg object-cover h-40 w-full" />
              </CardHeader>
              <CardContent className="p-4 flex-grow">
                <div className="flex justify-between items-start">
                  <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
                    course.level === 'Beginner' 
                      ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300' 
                      : course.level === 'Intermediate' 
                      ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300' 
                      : 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300'
                  }`}>
                    {course.level}
                  </span>
                  {assignedInstructors.length > 0 && (
                     <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <UserCheck className="h-4 w-4" />
                        <span>{assignedInstructors.length} Assigned</span>
                     </div>
                  )}
                </div>
                <CardTitle className="mt-2 text-lg">{course.name}</CardTitle>
                <CardDescription className="mt-1 text-xs line-clamp-2">{course.description}</CardDescription>
              </CardContent>
              <CardFooter className="p-4 pt-0 grid grid-cols-3 gap-2">
                {/* ✅ courseId वापरा */}
                <Button variant="outline" size="sm" onClick={() => navigate(`/admin/edit-course/${courseId}`)}>
                  <Edit className="h-4 w-4 mr-1" /> Edit
                </Button>
                <Button variant="outline" size="sm" onClick={() => navigate(`/admin/courses/${courseId}`)}>
                  <BookOpen className="h-4 w-4 mr-1" /> Batches
                </Button>
                <Button size="sm" onClick={() => handleOpenModal(course)}>
                  <UserPlus className="h-4 w-4 mr-1" /> Assign
                </Button>
              </CardFooter>
            </Card>
          )
        })}
      </div>
      {modalState.isOpen && (
        <AssignInstructorModal
          course={modalState.course}
          isOpen={modalState.isOpen}
          onClose={handleCloseModal}
        />
      )}
    </div>
  );
};

export default ManageCoursesPage;