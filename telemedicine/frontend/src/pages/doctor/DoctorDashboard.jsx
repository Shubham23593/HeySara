import React, { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext.jsx'
import { useSocket } from '../../contexts/SocketContext.jsx'
import { getQueue, updateStatus, startSession } from '../../services/api.js'
import LoadingSpinner from '../../components/LoadingSpinner.jsx'
import Notification from '../../components/Notification.jsx'
import PatientQueue from './PatientQueue.jsx'
import './DoctorDashboard.css'

export default function DoctorDashboard() {
  const { user } = useAuth()
  const { socket } = useSocket()
  const navigate = useNavigate()

  const [queue, setQueue] = useState([])
  const [loading, setLoading] = useState(true)
  const [doctorStatus, setDoctorStatus] = useState('inactive')
  const [statusLoading, setStatusLoading] = useState(false)
  const [urgentPopup, setUrgentPopup] = useState(null)
  const [urgentCountdown, setUrgentCountdown] = useState(30)
  const [criticalAlert, setCriticalAlert] = useState(false)
  const [notifications, setNotifications] = useState([])
  const countdownRef = useRef(null)

  const addNotification = useCallback((message, type = 'info') => {
    const id = Date.now()
    setNotifications(n => [...n, { id, message, type }])
  }, [])

  const removeNotification = useCallback((id) => {
    setNotifications(n => n.filter(x => x.id !== id))
  }, [])

  const fetchQueue = useCallback(async () => {
    try {
      const res = await getQueue()
      const patients = Array.isArray(res.data) ? res.data : (res.data.queue || [])
      setQueue(patients)
      setCriticalAlert(patients.some(p => p.emergencyLevel === 5))
    } catch (err) {
      addNotification(err.response?.data?.message || 'Failed to fetch queue.', 'error')
    } finally {
      setLoading(false)
    }
  }, [addNotification])

  useEffect(() => {
    fetchQueue()
    const interval = setInterval(fetchQueue, 30000)
    return () => clearInterval(interval)
  }, [fetchQueue])

  useEffect(() => {
    if (!socket) return
    const onQueueUpdated = () => fetchQueue()
    const onUrgentRequest = (data) => {
      setUrgentPopup(data)
      setUrgentCountdown(30)
    }
    const onCriticalAlert = () => setCriticalAlert(true)
    socket.on('queueUpdated', onQueueUpdated)
    socket.on('urgentRequest', onUrgentRequest)
    socket.on('criticalAlert', onCriticalAlert)
    return () => {
      socket.off('queueUpdated', onQueueUpdated)
      socket.off('urgentRequest', onUrgentRequest)
      socket.off('criticalAlert', onCriticalAlert)
    }
  }, [socket, fetchQueue])

  // Countdown for urgent popup
  useEffect(() => {
    if (!urgentPopup) return
    countdownRef.current = setInterval(() => {
      setUrgentCountdown(c => {
        if (c <= 1) {
          clearInterval(countdownRef.current)
          setUrgentPopup(null)
          return 30
        }
        return c - 1
      })
    }, 1000)
    return () => clearInterval(countdownRef.current)
  }, [urgentPopup])

  const handleToggleStatus = async () => {
    const newStatus = doctorStatus === 'active' ? 'inactive' : 'active'
    setStatusLoading(true)
    try {
      await updateStatus(newStatus)
      setDoctorStatus(newStatus)
      addNotification(`Status set to ${newStatus}`, 'success')
    } catch {
      addNotification('Failed to update status.', 'error')
    } finally {
      setStatusLoading(false)
    }
  }

  const handleStartSession = async (patient) => {
    try {
      const res = await startSession(patient._id || patient.id)
      sessionStorage.setItem('consultationData', JSON.stringify({
        ...res.data,
        patientId: patient._id || patient.id,
        patientName: patient.name,
        emergencyLevel: patient.emergencyLevel,
        symptoms: patient.symptoms,
        predictedDuration: patient.predictedDuration || 15,
      }))
      navigate('/doctor/consultation', { state: { patient, consultation: res.data } })
    } catch (err) {
      addNotification(err.response?.data?.message || 'Failed to start session.', 'error')
    }
  }

  const handleAcceptUrgent = () => {
    if (!urgentPopup) return
    clearInterval(countdownRef.current)
    handleStartSession(urgentPopup)
    setUrgentPopup(null)
  }

  const handleDeclineUrgent = () => {
    clearInterval(countdownRef.current)
    setUrgentPopup(null)
    if (socket) socket.emit('urgentDeclined', { patientId: urgentPopup?.patientId })
  }

  return (
    <div className="doctor-dashboard">
      {notifications.map(n => (
        <Notification key={n.id} message={n.message} type={n.type} onClose={() => removeNotification(n.id)} />
      ))}

      <div className="page-container">
        <div className="dd-header">
          <div>
            <h1>Dr. {user?.name || 'Doctor'} 👨‍⚕️</h1>
            <p className="dd-subtitle">{user?.specialization || 'General'} · Telemedicine Dashboard</p>
          </div>
          <button
            className={`dd-status-btn ${doctorStatus === 'active' ? 'active' : 'inactive'}`}
            onClick={handleToggleStatus}
            disabled={statusLoading}
          >
            {statusLoading ? <LoadingSpinner size="small" center={false} color="#fff" /> :
              doctorStatus === 'active' ? '🟢 Set Inactive' : '⚫ Go Active'}
          </button>
        </div>

        {criticalAlert && (
          <div className="dd-critical-banner">
            🔴 CRITICAL CASE ALERT — A patient with emergency level 5 is in your queue. Please attend immediately.
            <button className="dd-banner-close" onClick={() => setCriticalAlert(false)}>×</button>
          </div>
        )}

        <div className="dd-stats-row">
          <div className="dd-stat-card card">
            <span className="dd-stat-label">Patients in Queue</span>
            <span className="dd-stat-value">{queue.length}</span>
          </div>
          <div className="dd-stat-card card">
            <span className="dd-stat-label">Critical Cases</span>
            <span className="dd-stat-value dd-stat-red">{queue.filter(p => p.emergencyLevel === 5).length}</span>
          </div>
          <div className="dd-stat-card card">
            <span className="dd-stat-label">Avg Priority Score</span>
            <span className="dd-stat-value">
              {queue.length > 0
                ? (queue.reduce((a, p) => a + (p.priorityScore || 0), 0) / queue.length).toFixed(1)
                : '—'}
            </span>
          </div>
          <div className="dd-stat-card card">
            <span className="dd-stat-label">Your Status</span>
            <span className={`dd-stat-value ${doctorStatus === 'active' ? 'dd-stat-green' : 'dd-stat-gray'}`}>
              {doctorStatus === 'active' ? 'Active' : 'Inactive'}
            </span>
          </div>
        </div>

        <div className="card">
          <div className="dd-queue-header">
            <h3>Patient Queue</h3>
            <button className="btn btn-secondary" onClick={fetchQueue} style={{ fontSize: '0.8rem', padding: '0.35rem 0.75rem' }}>
              🔄 Refresh
            </button>
          </div>
          {loading ? (
            <LoadingSpinner />
          ) : (
            <PatientQueue patients={queue} onStartSession={handleStartSession} />
          )}
        </div>
      </div>

      {/* Urgent Request Popup */}
      {urgentPopup && (
        <div className="modal-overlay">
          <div className="modal-content dd-urgent-modal">
            <div className="dd-urgent-header">
              <span className="dd-urgent-icon">🚨</span>
              <h3>Urgent Request</h3>
              <div className="dd-urgent-countdown">{urgentCountdown}s</div>
            </div>
            <p className="dd-urgent-patient">Patient: <strong>{urgentPopup.patientName || 'Unknown'}</strong></p>
            <div className="dd-urgent-symptoms">
              <strong>Symptoms:</strong>
              <p>{urgentPopup.symptoms || 'Not specified'}</p>
            </div>
            <div className="dd-urgent-progress">
              <div className="dd-urgent-progress-bar" style={{ width: `${(urgentCountdown / 30) * 100}%` }} />
            </div>
            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem' }}>
              <button className="btn btn-success" style={{ flex: 1 }} onClick={handleAcceptUrgent}>
                ✓ Accept
              </button>
              <button className="btn btn-secondary" style={{ flex: 1 }} onClick={handleDeclineUrgent}>
                ✗ Decline
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
