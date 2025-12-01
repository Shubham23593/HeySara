import React, { createContext, useContext, useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { apiCall, getToken } from '../config/api';

const DataContext = createContext(undefined);

export const DataProvider = ({ children }) => {
  const [courses, setCourses] = useState([]);
  const [instructors, setInstructors] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchInitialData();
    
    // ✅ CHANGED: Listen for login/logout events
    const handleLogin = () => {
      console.log('User logged in, refreshing data...');
      fetchInitialData();
    };
    
    const handleLogout = () => {
      console.log('User logged out, clearing data...');
      setCourses([]);
      setInstructors([]);
    };
    
    window.addEventListener('user-logged-in', handleLogin);
    window.addEventListener('user-logged-out', handleLogout);
    
    // Cleanup
    return () => {
      window.removeEventListener('user-logged-in', handleLogin);
      window.removeEventListener('user-logged-out', handleLogout);
    };
  }, []);

  const fetchInitialData = async () => {
    try {
      const token = getToken();
      if (!token) {
        console.log('No token found, skipping data fetch');
        setLoading(false);
        return;
      }

      setLoading(true);

      const [coursesData, instructorsData] = await Promise.all([
        apiCall('/courses'),
        apiCall('/users/instructors'),
      ]);
      
      console.log('Fetched courses:', coursesData.length);
      console.log('Fetched instructors:', instructorsData.length);
      
      setCourses(coursesData);
      setInstructors(instructorsData);
    } catch (error) {
      console.error('Error fetching initial data:', error);
      if (error.message.includes('authorized') || error.message.includes('token')) {
        localStorage.removeItem('token');
      }
    } finally {
      setLoading(false);
    }
  };

  const addInstructor = async (instructorData) => {
    try {
      const newInstructor = await apiCall('/auth/register', {
        method: 'POST',
        body: JSON.stringify(instructorData),
      });
      setInstructors(prev => [...prev, newInstructor]);
      return newInstructor;
    } catch (error) {
      console.error('Error adding instructor:', error);
      throw error;
    }
  };

  const updateInstructor = async (instructorId, updatedData) => {
    try {
      const updatedInstructor = await apiCall('/users/profile', {
        method: 'PUT',
        body: JSON.stringify(updatedData),
      });
      
      setInstructors(prev => prev.map(i => 
        i._id === instructorId ? updatedInstructor : i
      ));
      return updatedInstructor;
    } catch (error) {
      console.error('Error updating instructor:', error);
      throw error;
    }
  };

  const getInstructorById = (id) => {
    return instructors.find(i => i._id === id || i.id === id);
  };

  const addCourse = async (courseData) => {
    try {
      const newCourse = await apiCall('/courses', {
        method: 'POST',
        body: JSON.stringify(courseData),
      });
      setCourses(prev => [...prev, newCourse]);
      return newCourse;
    } catch (error) {
      console.error('Error adding course:', error);
      throw error;
    }
  };

  const updateCourse = async (courseId, updatedData) => {
    try {
      const updatedCourse = await apiCall(`/courses/${courseId}`, {
        method: 'PUT',
        body: JSON.stringify(updatedData),
      });
      
      setCourses(prev => prev.map(c => 
        c._id === courseId ? updatedCourse : c
      ));
      return updatedCourse;
    } catch (error) {
      console.error('Error updating course:', error);
      throw error;
    }
  };

  const getCourseById = (id) => {
    return courses.find(c => c._id === id || c.id === id);
  };

  const addLecture = async (courseId, lectureData) => {
    try {
      const updatedCourse = await apiCall(`/courses/${courseId}/lectures`, {
        method: 'POST',
        body: JSON.stringify(lectureData),
      });
      
      setCourses(prev => prev.map(c => 
        c._id === courseId ? updatedCourse : c
      ));
      return updatedCourse;
    } catch (error) {
      console.error('Error adding lecture:', error);
      throw error;
    }
  };

  const assignLecture = async (lectureId, courseId, instructorId) => {
    try {
      const updatedCourse = await apiCall('/lectures/assign', {
        method: 'PUT',
        body: JSON.stringify({ lectureId, courseId, instructorId }),
      });
      
      setCourses(prev => prev.map(c => 
        c._id === courseId ? updatedCourse : c
      ));
      return updatedCourse;
    } catch (error) {
      console.error('Error assigning lecture:', error);
      throw error;
    }
  };

  const getLecturesByInstructor = (instructorId) => {
    const assignedLectures = [];
    courses.forEach(course => {
      if (course.lectures && Array.isArray(course.lectures)) {
        course.lectures.forEach(lecture => {
          const lectureInstructorId = lecture.instructorId?._id || lecture.instructorId;
          if (lectureInstructorId === instructorId) {
            assignedLectures.push({ 
              ...lecture, 
              courseName: course.name,
              courseId: course._id 
            });
          }
        });
      }
    });
    return assignedLectures.sort((a, b) => new Date(a.date) - new Date(b.date));
  };

  const getUnassignedLectures = (courseId = null) => {
    let lecturesToFilter = courseId 
      ? courses.find(c => c._id === courseId)?.lectures || [] 
      : courses.flatMap(c => c.lectures || []);

    return lecturesToFilter
      .filter(lecture => !lecture.instructorId)
      .map(lecture => {
        const course = courses.find(c => c._id === (lecture.courseId || courseId));
        return { 
          ...lecture, 
          courseName: course?.name,
          courseId: course?._id 
        };
      })
      .sort((a, b) => new Date(a.date) - new Date(b.date));
  };
  
  const getAllLectures = () => {
    return courses.flatMap(course => 
      (course.lectures || []).map(lecture => ({ 
        ...lecture, 
        courseName: course.name,
        courseId: course._id 
      }))
    ).sort((a, b) => new Date(a.date) - new Date(b.date));
  };

  const getInstructorsForCourse = (courseId) => {
    const course = courses.find(c => c._id === courseId);
    if (!course || !course.lectures) return [];
    
    const instructorIds = new Set(
      course.lectures
        .map(l => l.instructorId?._id || l.instructorId)
        .filter(Boolean)
    );
    
    return Array.from(instructorIds).map(id => getInstructorById(id)).filter(Boolean);
  };

  return (
    <DataContext.Provider value={{ 
      courses, 
      instructors, 
      loading,
      addCourse, 
      updateCourse, 
      addLecture, 
      assignLecture, 
      getInstructorById, 
      getCourseById, 
      getLecturesByInstructor, 
      getUnassignedLectures, 
      getAllLectures, 
      getInstructorsForCourse, 
      addInstructor, 
      updateInstructor,
      fetchInitialData
    }}>
      {children}
    </DataContext.Provider>
  );
};

DataProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};