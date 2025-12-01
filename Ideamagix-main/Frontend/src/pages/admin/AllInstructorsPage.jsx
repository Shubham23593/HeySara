import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { useData } from '../../contexts/DataContext';

const AllInstructorsPage = () => {
  const { instructors, courses } = useData();

  const getAssignedCourse = (instructorId) => {
    let assigned = null;
    courses.forEach((course) => {
      course.lectures.forEach(lecture => {
        // ✅ दोन्ही _id आणि id check करा
        const lectureInstructorId = lecture.instructorId?._id || lecture.instructorId;
        if (lectureInstructorId === instructorId) {
          if (!assigned || new Date(lecture.date) > new Date(assigned.lectureDate)) {
            assigned = { courseName: course.name, lectureDate: lecture.date };
          }
        }
      });
    });
    return assigned;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>All Instructors</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-muted-foreground uppercase bg-muted/50">
              <tr>
                <th scope="col" className="px-6 py-3">Instructor Name</th>
                <th scope="col" className="px-6 py-3">Email</th>
                <th scope="col" className="px-6 py-3">Assigned Course</th>
              </tr>
            </thead>
            <tbody>
              {instructors.length === 0 ? (
                <tr>
                  <td colSpan="3" className="px-6 py-4 text-center text-muted-foreground">
                    No instructors found
                  </td>
                </tr>
              ) : (
                instructors.map(instructor => {
                  // ✅ _id वापरा
                  const instructorId = instructor._id || instructor.id;
                  const assignedInfo = getAssignedCourse(instructorId);
                  
                  return (
                    <tr key={instructorId} className="border-b">
                      <td className="px-6 py-4 font-medium whitespace-nowrap flex items-center gap-3">
                        {instructor.avatarUrl && (
                          <img src={instructor.avatarUrl} alt={instructor.name} className="h-8 w-8 rounded-full" />
                        )}
                        {instructor.name}
                      </td>
                      <td className="px-6 py-4">{instructor.email}</td>
                      <td className="px-6 py-4">
                        {assignedInfo ? (
                          <div>
                            <p className="font-semibold">{assignedInfo.courseName}</p>
                            <p className="text-xs text-muted-foreground">
                              Next on: {new Date(assignedInfo.lectureDate).toLocaleDateString()}
                            </p>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">Not Assigned</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
};

export default AllInstructorsPage;