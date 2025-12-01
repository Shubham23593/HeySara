import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useData } from '../../contexts/DataContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/Card';
import { User, UserPlus } from 'lucide-react';
import AddBatchForm from '../../components/admin/AddBatchForm';
import { Button } from '../../components/ui/Button';
import AssignInstructorModal from '../../components/admin/AssignInstructorModal';

const CourseBatchesPage = () => {
  const { courseId } = useParams();
  const { getCourseById, getInstructorById, addLecture } = useData();
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const course = getCourseById(courseId);
  if (!course) return <div>Course not found</div>;

  // ✅ FIX: फक्त आजच्या आणि पुढच्या तारीखांचे batches दाखवा
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const courseLectures = course.lectures
    .filter(lecture => {
      const lectureDate = new Date(lecture.date);
      lectureDate.setHours(0, 0, 0, 0);
      return lectureDate >= today;
    })
    .sort((a,b) => new Date(a.date) - new Date(b.date));

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Add Batches for "{course.name}"</CardTitle>
          <CardDescription>Add new lectures or batches for this course.</CardDescription>
        </CardHeader>
        <CardContent>
          <AddBatchForm courseId={courseId} onAddBatch={addLecture} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Existing Batches</CardTitle>
            <CardDescription>View and manage batches for this course (Today & Upcoming only).</CardDescription>
          </div>
          <Button onClick={() => setIsModalOpen(true)}>
            <UserPlus className="mr-2 h-4 w-4" /> Assign Instructor
          </Button>
        </CardHeader>
        <CardContent>
          {courseLectures.length > 0 ? (
            <div className="space-y-4">
              {courseLectures.map(lecture => {
                const lectureId = lecture._id || lecture.id;
                
                const instructorId = lecture.instructorId?._id || lecture.instructorId;
                const assignedInstructor = instructorId ? getInstructorById(instructorId) : null;
                
                return (
                  <div key={lectureId} className="border p-4 rounded-lg flex justify-between items-center">
                    <div>
                      <p className="font-semibold">{lecture.title}</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(lecture.date).toLocaleDateString()} - {lecture.duration} mins
                      </p>
                    </div>
                    {assignedInstructor ? (
                      <div className="flex items-center gap-2 text-sm font-medium">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span>{assignedInstructor.name}</span>
                      </div>
                    ) : (
                      <span className="text-xs font-semibold px-2 py-1 rounded-full bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300">
                        Unassigned
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center text-muted-foreground py-8">
              <p>No upcoming batches for this course.</p>
            </div>
          )}
        </CardContent>
      </Card>
      {isModalOpen && (
        <AssignInstructorModal
          course={course}
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
        />
      )}
    </div>
  );
};

export default CourseBatchesPage;