import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext.jsx'
import { useSocket } from '../../contexts/SocketContext.jsx'
import { getStatus } from '../../services/api.js'
import LoadingSpinner from '../../components/LoadingSpinner.jsx'
import './QueueStatus.css'

function EmergencyBadge({ level }) {
  return <span className={`badge badge-level-${level}`}>Level {level}</span>
}

export default function QueueStatus() {
  const { user } = useAuth()
  const { socket } = useSocket()
  const navigate = useNavigate()

  const [status, setStatus] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [selectedMode, setSelectedMode] = useState(null)

  const fetchStatus = useCallback(async () => {
    if (!user) return
    setLoading(true)
    try {
      const res = await getStatus(user._id || user.id)
      setStatus(res.data)
      if (res.data?.position === 1 || res.data?.consultationReady) {
        setShowModal(true)
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch queue status.')
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    fetchStatus()
    const interval = setInterval(fetchStatus, 30000)
    return () => clearInterval(interval)
  }, [fetchStatus])

  useEffect(() => {
    if (!socket) return
    const handleQueueUpdated = () => fetchStatus()
    const handleConsultationStarted = (data) => {
      sessionStorage.setItem('consultationData', JSON.stringify(data))
      setShowModal(true)
    }
    socket.on('queueUpdated', handleQueueUpdated)
    socket.on('consultationStarted', handleConsultationStarted)
    return () => {
      socket.off('queueUpdated', handleQueueUpdated)
      socket.off('consultationStarted', handleConsultationStarted)
    }
  }, [socket, fetchStatus])

  const handleModeSelect = (mode) => {
    setSelectedMode(mode)
    sessionStorage.setItem('consultationMode', mode)
    navigate('/patient/consultation')
  }

  const progressPercent = status && status.totalInQueue && status.position
    ? Math.max(0, Math.min(100, ((status.totalInQueue - status.position) / status.totalInQueue) * 100))
    : 0

  return (
    <div className="qs-page">
      <div className="page-container">
        <div className="qs-header">
          <h2>Queue Status</h2>
          <button className="btn btn-secondary" onClick={fetchStatus} disabled={loading}>
            {loading ? <LoadingSpinner size="small" center={false} /> : '🔄 Refresh'}
          </button>
        </div>

        {error && <div className="error-msg">{error}</div>}

        {loading && !status ? (
          <LoadingSpinner />
        ) : !status ? (
          <div className="card qs-not-found">
            <div style={{ fontSize: '3rem', marginBottom: '0.75rem' }}>📭</div>
            <h3>Not in Queue</h3>
            <p>You are not currently in any queue.</p>
            <button className="btn btn-primary" onClick={() => navigate('/patient/join')} style={{ marginTop: '1rem' }}>
              Join Queue
            </button>
          </div>
        ) : (
          <>
            <div className="card qs-card">
              <div className="qs-position-row">
                <div className="qs-position">
                  <span className="qs-pos-label">Your Position</span>
                  <span className="qs-pos-number">#{status.position}</span>
                  <span className="qs-pos-of">of {status.totalInQueue || '?'} patients</span>
                </div>
                <EmergencyBadge level={status.emergencyLevel || 1} />
              </div>

              <div className="qs-progress-bar-wrap">
                <div className="qs-progress-bar-label">
                  <span>Progress to Consultation</span>
                  <span>{Math.round(progressPercent)}%</span>
                </div>
                <div className="qs-progress-bar-bg">
                  <div className="qs-progress-bar-fill" style={{ width: `${progressPercent}%` }} />
                </div>
              </div>

              <div className="qs-info-grid">
                <div className="qs-info-item">
                  <span className="qs-info-label">⏱ Est. Wait</span>
                  <span className="qs-info-value">{status.estimatedWait || 0} min</span>
                </div>
                <div className="qs-info-item">
                  <span className="qs-info-label">👨‍⚕️ Doctor</span>
                  <span className="qs-info-value">{status.doctorName || 'TBD'}</span>
                </div>
                <div className="qs-info-item">
                  <span className="qs-info-label">🏥 Specialty</span>
                  <span className="qs-info-value">{status.specialization || '—'}</span>
                </div>
                <div className="qs-info-item">
                  <span className="qs-info-label">📅 Joined</span>
                  <span className="qs-info-value">
                    {status.joinedAt ? new Date(status.joinedAt).toLocaleTimeString() : '—'}
                  </span>
                </div>
              </div>

              {status.position === 1 && (
                <div className="qs-ready-banner">
                  🎉 You&apos;re next! The doctor is almost ready for you.
                </div>
              )}
            </div>

            <div style={{ textAlign: 'center', marginTop: '1rem' }}>
              <button className="btn btn-secondary" onClick={() => navigate('/patient')}>
                ← Back to Dashboard
              </button>
            </div>
          </>
        )}
      </div>

      {/* Doctor Ready Modal */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content qs-modal">
            <div className="qs-modal-icon">🩺</div>
            <h3>Doctor is Ready!</h3>
            <p>Your doctor is ready to see you. Choose your consultation mode:</p>
            <div className="qs-mode-buttons">
              <button
                className={`qs-mode-btn ${selectedMode === 'chat' ? 'selected' : ''}`}
                onClick={() => handleModeSelect('chat')}
              >
                <span>💬</span>
                <span>Chat</span>
              </button>
              <button
                className={`qs-mode-btn ${selectedMode === 'video' ? 'selected' : ''}`}
                onClick={() => handleModeSelect('video')}
              >
                <span>📹</span>
                <span>Video Call</span>
              </button>
            </div>
            <button className="btn btn-secondary" style={{ width: '100%', marginTop: '0.75rem' }}
              onClick={() => setShowModal(false)}>
              Not Yet
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
