import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { CalendarCheck, Clock } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useData } from '../../contexts/DataContext';

const InstructorDashboardPage = () => {
  const { user } = useAuth();
  const { getLecturesByInstructor } = useData();
  
  const instructorId = user?._id || user?.id;
  const lectures = instructorId ? getLecturesByInstructor(instructorId) : [];
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const upcomingLectures = lectures.filter(l => {
    const lectureDate = new Date(l.date);
    lectureDate.setHours(0, 0, 0, 0);
    return lectureDate > today;
  });

  return (
    <div>
      <Card className="mb-6 bg-gradient-to-r from-primary to-primary/80 text-primary-foreground">
        <CardHeader>
          <CardTitle>Welcome back, {user?.name}!</CardTitle>
        </CardHeader>
      </Card>

      <div className="grid gap-6 md:grid-cols-2 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Upcoming Lectures</CardTitle>
            <CalendarCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{upcomingLectures.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Lectures Assigned</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{lectures.length}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Upcoming Lectures</CardTitle>
        </CardHeader>
        <CardContent>
          {upcomingLectures.length > 0 ? (
            <div className="space-y-4">
              {upcomingLectures.slice(0, 5).map(lecture => {
                const lectureId = lecture._id || lecture.id;
                return (
                  <div key={lectureId} className="flex items-center justify-between border-b pb-3">
                    <div>
                      <p className="font-semibold">{lecture.title}</p>
                      <p className="text-sm text-muted-foreground">{lecture.courseName}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">{new Date(lecture.date).toLocaleDateString()}</p>
                      <p className="text-xs text-muted-foreground">{lecture.duration} mins</p>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-4">No upcoming lectures scheduled.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default InstructorDashboardPage;