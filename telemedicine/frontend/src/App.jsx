import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext.jsx'
import { SocketProvider } from './contexts/SocketContext.jsx'
import Navbar from './components/Navbar.jsx'
import HomePage from './pages/HomePage.jsx'
import LoginPage from './pages/LoginPage.jsx'
import RegisterPage from './pages/RegisterPage.jsx'
import PatientDashboard from './pages/patient/PatientDashboard.jsx'
import JoinQueueForm from './pages/patient/JoinQueueForm.jsx'
import QueueStatus from './pages/patient/QueueStatus.jsx'
import ConsultationRoom from './pages/patient/ConsultationRoom.jsx'
import DoctorDashboard from './pages/doctor/DoctorDashboard.jsx'
import ConsultationSession from './pages/doctor/ConsultationSession.jsx'
import AdminDashboard from './pages/admin/AdminDashboard.jsx'
import Analytics from './pages/admin/Analytics.jsx'

function ProtectedRoute({ children, role }) {
  const { isAuthenticated, user } = useAuth()
  if (!isAuthenticated) return <Navigate to="/login" replace />
  if (role && user?.role !== role) return <Navigate to="/" replace />
  return children
}

function AppRoutes() {
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/patient" element={
          <ProtectedRoute role="patient"><PatientDashboard /></ProtectedRoute>
        } />
        <Route path="/patient/join" element={
          <ProtectedRoute role="patient"><JoinQueueForm /></ProtectedRoute>
        } />
        <Route path="/patient/status" element={
          <ProtectedRoute role="patient"><QueueStatus /></ProtectedRoute>
        } />
        <Route path="/patient/consultation" element={
          <ProtectedRoute role="patient"><ConsultationRoom /></ProtectedRoute>
        } />
        <Route path="/doctor" element={
          <ProtectedRoute role="doctor"><DoctorDashboard /></ProtectedRoute>
        } />
        <Route path="/doctor/consultation" element={
          <ProtectedRoute role="doctor"><ConsultationSession /></ProtectedRoute>
        } />
        <Route path="/admin" element={
          <ProtectedRoute role="admin"><AdminDashboard /></ProtectedRoute>
        } />
        <Route path="/admin/analytics" element={
          <ProtectedRoute role="admin"><Analytics /></ProtectedRoute>
        } />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <SocketProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </SocketProvider>
    </AuthProvider>
  )
}
