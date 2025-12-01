import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { useData } from '../../contexts/DataContext';

const AllLecturesPage = () => {
  const { getAllLectures, getInstructorById } = useData();
  const allLectures = getAllLectures();

  return (
    <Card>
      <CardHeader>
        <CardTitle>All Lectures / Batches</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-muted-foreground uppercase bg-muted/50">
              <tr>
                <th scope="col" className="px-6 py-3">Lecture Title</th>
                <th scope="col" className="px-6 py-3">Course</th>
                <th scope="col" className="px-6 py-3">Date</th>
                <th scope="col" className="px-6 py-3">Duration</th>
                <th scope="col" className="px-6 py-3">Instructor</th>
              </tr>
            </thead>
            <tbody>
              {allLectures.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-4 text-center text-muted-foreground">
                    No lectures found
                  </td>
                </tr>
              ) : (
                allLectures.map(lecture => {
                  // ✅ CHANGED: Properly extract instructor ID (handle both object and string)
                  const instructorId = lecture.instructorId?._id || lecture.instructorId;
                  const instructor = instructorId ? getInstructorById(instructorId) : null;
                  
                  // ✅ CHANGED: Handle both _id and id for lecture key
                  const lectureId = lecture._id || lecture.id;
                  
                  return (
                    <tr key={lectureId} className="border-b">
                      <td className="px-6 py-4 font-medium">{lecture.title}</td>
                      <td className="px-6 py-4">{lecture.courseName}</td>
                      <td className="px-6 py-4">{new Date(lecture.date).toLocaleDateString()}</td>
                      <td className="px-6 py-4">{lecture.duration} mins</td>
                      <td className="px-6 py-4">
                        {instructor ? (
                          <div className="flex items-center gap-2">
                            {instructor.avatarUrl && (
                              <img 
                                src={instructor.avatarUrl} 
                                alt={instructor.name} 
                                className="h-6 w-6 rounded-full" 
                              />
                            )}
                            <span>{instructor.name}</span>
                          </div>
                        ) : (
                          <span className="text-xs font-semibold px-2 py-1 rounded-full bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300">
                            Unassigned
                          </span>
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

export default AllLecturesPage;