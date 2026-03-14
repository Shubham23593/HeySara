import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext.jsx'
import { useSocket } from '../../contexts/SocketContext.jsx'
import { getStatus, urgentRequest as urgentApi } from '../../services/api.js'
import Notification from '../../components/Notification.jsx'
import LoadingSpinner from '../../components/LoadingSpinner.jsx'
import './PatientDashboard.css'

function EmergencyBadge({ level }) {
  return <span className={`badge badge-level-${level}`}>Level {level}</span>
}

export default function PatientDashboard() {
  const { user } = useAuth()
  const { socket } = useSocket()
  const navigate = useNavigate()

  const [queueInfo, setQueueInfo] = useState(null)
  const [loading, setLoading] = useState(true)
  const [urgentModal, setUrgentModal] = useState(false)
  const [urgentSymptoms, setUrgentSymptoms] = useState('')
  const [urgentLoading, setUrgentLoading] = useState(false)
  const [urgentStage, setUrgentStage] = useState('')
  const [notifications, setNotifications] = useState([])

  const addNotification = useCallback((message, type = 'info') => {
    const id = Date.now()
    setNotifications(n => [...n, { id, message, type }])
  }, [])

  const removeNotification = useCallback((id) => {
    setNotifications(n => n.filter(x => x.id !== id))
  }, [])

  const fetchStatus = useCallback(async () => {
    if (!user) return
    try {
      const res = await getStatus(user._id || user.id)
      setQueueInfo(res.data)
    } catch {
      setQueueInfo(null)
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    fetchStatus()
  }, [fetchStatus])

  useEffect(() => {
    if (!socket) return
    const handleNotification = ({ message, type }) => addNotification(message, type)
    const handleConsultationStarted = (data) => {
      addNotification('Your consultation is starting!', 'success')
      sessionStorage.setItem('consultationMode', 'chat')
      sessionStorage.setItem('consultationData', JSON.stringify(data))
      navigate('/patient/consultation')
    }
    socket.on('notification', handleNotification)
    socket.on('consultationStarted', handleConsultationStarted)
    return () => {
      socket.off('notification', handleNotification)
      socket.off('consultationStarted', handleConsultationStarted)
    }
  }, [socket, addNotification, navigate])

  const handleUrgentSubmit = async (e) => {
    e.preventDefault()
    if (!urgentSymptoms.trim()) return
    setUrgentLoading(true)
    setUrgentStage('AI analyzing your symptoms…')
    try {
      await new Promise(r => setTimeout(r, 2000))
      setUrgentStage('Sending urgent request to available doctors…')
      await urgentApi({ patientId: user._id || user.id, symptoms: urgentSymptoms })
      await new Promise(r => setTimeout(r, 800))
      addNotification('Urgent request sent! A doctor will respond shortly.', 'success')
      setUrgentModal(false)
      setUrgentSymptoms('')
      fetchStatus()
    } catch (err) {
      addNotification(err.response?.data?.message || 'Failed to send urgent request.', 'error')
    } finally {
      setUrgentLoading(false)
      setUrgentStage('')
    }
  }

  const patientName = user?.name || user?.email || 'Patient'

  return (
    <div className="patient-dashboard">
      {notifications.map(n => (
        <Notification key={n.id} message={n.message} type={n.type} onClose={() => removeNotification(n.id)} />
      ))}

      <div className="page-container">
        <div className="pd-header">
          <div>
            <h1>Welcome, {patientName} 👋</h1>
            <p className="pd-subtitle">Manage your healthcare appointments</p>
          </div>
          <button className="btn btn-danger pd-urgent-btn" onClick={() => setUrgentModal(true)}>
            🚨 Urgent Request
          </button>
        </div>

        {loading ? (
          <LoadingSpinner />
        ) : queueInfo ? (
          <div className="pd-status-card card">
            <div className="pd-status-header">
              <h3>📋 Your Queue Status</h3>
              <EmergencyBadge level={queueInfo.emergencyLevel || 1} />
            </div>
            <div className="pd-status-grid">
              <div className="pd-status-item">
                <span className="pd-status-label">Position</span>
                <span className="pd-status-value">#{queueInfo.position || '—'}</span>
              </div>
              <div className="pd-status-item">
                <span className="pd-status-label">Est. Wait</span>
                <span className="pd-status-value">{queueInfo.estimatedWait || '—'} min</span>
              </div>
              <div className="pd-status-item">
                <span className="pd-status-label">Doctor</span>
                <span className="pd-status-value">{queueInfo.doctorName || 'Assigned'}</span>
              </div>
              <div className="pd-status-item">
                <span className="pd-status-label">Specialization</span>
                <span className="pd-status-value">{queueInfo.specialization || '—'}</span>
              </div>
            </div>
            <button className="btn btn-primary" onClick={() => navigate('/patient/status')}>
              View Detailed Status →
            </button>
          </div>
        ) : (
          <div className="pd-no-queue card">
            <div className="pd-no-queue-icon">📋</div>
            <h3>Not in Queue</h3>
            <p>You are not currently in any queue. Join a queue to see a doctor.</p>
          </div>
        )}

        <div className="pd-actions-grid">
          <div className="pd-action-card card" onClick={() => navigate('/patient/join')}>
            <div className="pd-action-icon">➕</div>
            <h3>Join Queue</h3>
            <p>Register your symptoms and join the AI-optimized queue</p>
          </div>
          <div className="pd-action-card card" onClick={() => navigate('/patient/status')}>
            <div className="pd-action-icon">📊</div>
            <h3>Check Status</h3>
            <p>View your current position and estimated wait time</p>
          </div>
          <div className="pd-action-card card pd-action-urgent" onClick={() => setUrgentModal(true)}>
            <div className="pd-action-icon">🚨</div>
            <h3>Urgent Request</h3>
            <p>Need immediate attention? Send an urgent care request</p>
          </div>
        </div>
      </div>

      {/* Urgent Modal */}
      {urgentModal && (
        <div className="modal-overlay" onClick={() => !urgentLoading && setUrgentModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h3>🚨 Urgent Care Request</h3>
            <p style={{ color: '#64748B', marginBottom: '1rem', fontSize: '0.9rem' }}>
              Describe your symptoms. Our AI will analyze and fast-track your request.
            </p>
            {urgentLoading ? (
              <div className="pd-urgent-loading">
                <LoadingSpinner size="medium" color="#DC2626" />
                <p className="pd-urgent-stage">{urgentStage}</p>
              </div>
            ) : (
              <form onSubmit={handleUrgentSubmit}>
                <div className="form-group">
                  <label>Describe your symptoms *</label>
                  <textarea
                    rows={5}
                    value={urgentSymptoms}
                    onChange={e => setUrgentSymptoms(e.target.value)}
                    placeholder="e.g. Severe chest pain, difficulty breathing, dizziness..."
                    required
                    style={{ resize: 'vertical' }}
                  />
                </div>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <button type="submit" className="btn btn-danger" style={{ flex: 1 }}>
                    Send Urgent Request
                  </button>
                  <button type="button" className="btn btn-secondary" onClick={() => setUrgentModal(false)}>
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
