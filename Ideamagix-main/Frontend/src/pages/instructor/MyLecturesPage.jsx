import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { useAuth } from '../../contexts/AuthContext';
import { useData } from '../../contexts/DataContext';

const MyLecturesPage = () => {
  const { user } = useAuth();
  const { getLecturesByInstructor } = useData();
  const [filter, setFilter] = useState('upcoming');

  const instructorId = user?._id || user?.id;
  const lectures = instructorId ? getLecturesByInstructor(instructorId) : [];
  
  const filteredLectures = lectures.filter(lecture => {
    const lectureDate = new Date(lecture.date);
    lectureDate.setHours(0, 0, 0, 0);
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (filter === 'upcoming') return lectureDate > today;
    if (filter === 'completed') return lectureDate <= today;
    
    return true;
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>My Lectures</CardTitle>
        <div className="flex gap-2 mt-4">
          <Button 
            variant={filter === 'upcoming' ? 'default' : 'outline'} 
            onClick={() => setFilter('upcoming')}
            size="sm"
          >
            Upcoming
          </Button>
          <Button 
            variant={filter === 'completed' ? 'default' : 'outline'} 
            onClick={() => setFilter('completed')}
            size="sm"
          >
            Completed
          </Button>
          <Button 
            variant={filter === 'all' ? 'default' : 'outline'} 
            onClick={() => setFilter('all')}
            size="sm"
          >
            All
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-muted-foreground uppercase bg-muted/50">
              <tr>
                <th scope="col" className="px-6 py-3">Course</th>
                <th scope="col" className="px-6 py-3">Lecture</th>
                <th scope="col" className="px-6 py-3">Date</th>
                <th scope="col" className="px-6 py-3">Duration</th>
              </tr>
            </thead>
            <tbody>
              {filteredLectures.length === 0 ? (
                <tr>
                  <td colSpan="4" className="px-6 py-4 text-center text-muted-foreground">
                    No lectures found
                  </td>
                </tr>
              ) : (
                filteredLectures.map(lecture => {
                  const lectureId = lecture._id || lecture.id;
                  return (
                    <tr key={lectureId} className="border-b">
                      <td className="px-6 py-4 font-medium">{lecture.courseName}</td>
                      <td className="px-6 py-4">{lecture.title}</td>
                      <td className="px-6 py-4">{new Date(lecture.date).toLocaleDateString()}</td>
                      <td className="px-6 py-4">{lecture.duration} mins</td>
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

export default MyLecturesPage;