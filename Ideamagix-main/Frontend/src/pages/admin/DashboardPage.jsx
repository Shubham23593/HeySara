import React from 'react';
import { BookOpen, Users, CalendarClock, CalendarCheck } from 'lucide-react';
import { useData } from '../../contexts/DataContext';
import DashboardStatCard from '../../components/admin/DashboardStatCard';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/Card';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui/Button';

const AdminDashboardPage = () => {
  const { instructors, courses, getAllLectures } = useData();
  const navigate = useNavigate();

  const allLectures = getAllLectures();
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const upcomingLectures = allLectures.filter(l => {
    const lectureDate = new Date(l.date);
    lectureDate.setHours(0, 0, 0, 0);
    return lectureDate > today;
  });
  
  const recentCourses = courses.slice(-4);

  const stats = [
    { title: 'Total Courses', value: courses.length, icon: BookOpen, color: 'text-blue-500' },
    { title: 'Total Instructors', value: instructors.length, icon: Users, color: 'text-green-500' },
    { title: 'Upcoming Lectures', value: upcomingLectures.length, icon: CalendarClock, color: 'text-purple-500' },
    { title: 'Total Lectures', value: allLectures.length, icon: CalendarCheck, color: 'text-orange-500' },
  ];

  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <DashboardStatCard key={stat.title} {...stat} />
        ))}
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Recent Courses</CardTitle>
          <CardDescription>A quick look at the most recently added courses.</CardDescription>
        </CardHeader>
        <CardContent>
          {recentCourses.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2">
              {recentCourses.map(course => {
                const courseId = course._id || course.id;
                
                return (
                  <div key={courseId} className="border rounded-lg p-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <img 
                        src={course.imageUrl} 
                        alt={course.name} 
                        className="h-16 w-16 object-cover rounded-md"
                      />
                      <div>
                        <p className="font-semibold">{course.name}</p>
                        <p className="text-sm text-muted-foreground">{course.level}</p>
                      </div>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => navigate(`/admin/courses/${courseId}`)}
                    >
                      View
                    </Button>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-4">No courses added yet.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminDashboardPage;