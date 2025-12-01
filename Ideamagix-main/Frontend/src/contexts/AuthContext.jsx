import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import PropTypes from 'prop-types';
import toast from 'react-hot-toast';
import { apiCall, getToken, setToken as saveToken, removeToken } from '../config/api';

const AuthContext = createContext(undefined);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const token = getToken();
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      // ✅ CHANGED: Use correct endpoint /auth/me
      const userData = await apiCall('/auth/me');
      setUser(userData);
    } catch (error) {
      console.error('Auth check failed:', error);
      removeToken();
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      const data = await apiCall('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      
      // Save token
      saveToken(data.token);
      
      // Set user data
      const userData = data.user || data;
      setUser(userData);
      localStorage.setItem('user', JSON.stringify(userData));
      
      // Show success message
      toast.success(`Welcome back, ${userData.name}!`);
      
      // ✅ CHANGED: Trigger a custom event to refresh data
      window.dispatchEvent(new Event('user-logged-in'));
      
      // Navigate based on role
      if (userData.role === 'admin') {
        navigate('/admin/dashboard');
      } else {
        navigate('/instructor/dashboard');
      }
      
      return data;
    } catch (error) {
      toast.error(error.message || 'Invalid email or password');
      throw error;
    }
  };

  const signup = async (userData) => {
    try {
      const data = await apiCall('/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          ...userData,
          role: 'instructor'
        }),
      });
      
      toast.success('Account created successfully! Please log in.');
      navigate('/login');
      return data;
    } catch (error) {
      toast.error(error.message || 'An account with this email already exists.');
      throw error;
    }
  };

  const logout = () => {
    setUser(null);
    removeToken();
    localStorage.removeItem('user');
    
    // ✅ CHANGED: Trigger event to clear data
    window.dispatchEvent(new Event('user-logged-out'));
    
    toast.success('Logged out successfully');
    navigate('/login');
  };

  const updateProfile = async (updatedData) => {
    if (!user) return;
    
    try {
      const data = await apiCall('/users/profile', {
        method: 'PUT',
        body: JSON.stringify(updatedData),
      });
      
      setUser(data);
      localStorage.setItem('user', JSON.stringify(data));
      toast.success('Profile updated successfully!');
      return data;
    } catch (error) {
      toast.error(error.message || 'Failed to update profile.');
      throw error;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ 
      user, 
      login, 
      signup,
      logout, 
      updateProfile, 
      isAuthenticated: !!user,
      loading
    }}>
      {children}
    </AuthContext.Provider>
  );
};

AuthProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};