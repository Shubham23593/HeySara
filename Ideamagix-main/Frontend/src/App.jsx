import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext.jsx';
import PropTypes from 'prop-types';

import MainLayout from './components/layout/MainLayout.jsx';
import InstructorLoginPage from './pages/InstructorLoginPage.jsx';
import InstructorSignupPage from './pages/InstructorSignupPage.jsx';
import AdminLoginPage from './pages/AdminLoginPage.jsx';

// Admin Imports
import AdminDashboardPage from './pages/admin/DashboardPage.jsx';
import AllInstructorsPage from './pages/admin/AllInstructorsPage.jsx';
import ManageCoursesPage from './pages/admin/ManageCoursesPage.jsx';
import AddCoursePage from './pages/admin/AddCoursePage.jsx';
import EditCoursePage from './pages/admin/EditCoursePage.jsx';
import CourseBatchesPage from './pages/admin/CourseBatchesPage.jsx';
import AssignLecturePage from './pages/admin/AssignLecturePage.jsx';
import AllLecturesPage from './pages/admin/AllLecturesPage.jsx';
import { LayoutDashboard, Users, Book, PlusCircle, CalendarPlus, ListTodo } from 'lucide-react';

// Instructor Imports
import InstructorDashboardPage from './pages/instructor/DashboardPage.jsx';
import MyLecturesPage from './pages/instructor/MyLecturesPage.jsx';
import ProfilePage from './pages/instructor/ProfilePage.jsx';
import { UserSquare } from 'lucide-react';

const adminNavItems = [
  { href: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/courses', label: 'Manage Courses', icon: Book },
  { href: '/admin/add-course', label: 'Add Course', icon: PlusCircle },
  { href: '/admin/instructors', label: 'All Instructors', icon: Users },
  { href: '/admin/assign-lecture', label: 'Assign Lecture', icon: CalendarPlus },
  { href: '/admin/all-lectures', label: 'All Lectures', icon: ListTodo },
];

const instructorNavItems = [
  { href: '/instructor/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/instructor/my-lectures', label: 'My Lectures', icon: ListTodo },
  { href: '/instructor/profile', label: 'Profile', icon: UserSquare },
];

const ProtectedRoute = ({ role, children }) => {
  const { isAuthenticated, user } = useAuth();
  if (!isAuthenticated) {
    const loginPath = role === 'admin' ? '/login/admin' : '/login';
    return <Navigate to={loginPath} replace />;
  }
  if (user?.role !== role) {
    return <Navigate to={user?.role === 'admin' ? '/admin' : '/instructor'} replace />;
  }
  return <>{children}</>;
};

ProtectedRoute.propTypes = {
  role: PropTypes.oneOf(['admin', 'instructor']).isRequired,
  children: PropTypes.node.isRequired,
};

function App() {
  const { user, isAuthenticated } = useAuth();

  return (
    <Routes>
      {/* Auth Routes */}
      <Route path="/login" element={<InstructorLoginPage />} />
      <Route path="/login/admin" element={<AdminLoginPage />} />
      <Route path="/signup" element={<InstructorSignupPage />} />
      
      {/* Admin Routes */}
      <Route path="/admin" element={
        <ProtectedRoute role="admin">
          <MainLayout navItems={adminNavItems} />
        </ProtectedRoute>
      }>
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<AdminDashboardPage />} />
        <Route path="instructors" element={<AllInstructorsPage />} />
        <Route path="courses" element={<ManageCoursesPage />} />
        <Route path="add-course" element={<AddCoursePage />} />
        <Route path="edit-course/:courseId" element={<EditCoursePage />} />
        <Route path="courses/:courseId" element={<CourseBatchesPage />} />
        <Route path="assign-lecture" element={<AssignLecturePage />} />
        <Route path="all-lectures" element={<AllLecturesPage />} />
      </Route>

      {/* Instructor Routes */}
      <Route path="/instructor" element={
        <ProtectedRoute role="instructor">
          <MainLayout navItems={instructorNavItems} />
        </ProtectedRoute>
      }>
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<InstructorDashboardPage />} />
        <Route path="my-lectures" element={<MyLecturesPage />} />
        <Route path="profile" element={<ProfilePage />} />
      </Route>

      {/* Fallback Route - ✅ FIXED */}
      <Route 
        path="*" 
        element={
          <Navigate 
            to={
              isAuthenticated && user 
                ? (user.role === 'admin' ? '/admin/dashboard' : '/instructor/dashboard')
                : '/login'
            } 
            replace 
          />
        } 
      />
    </Routes>
  );
}

export default App;