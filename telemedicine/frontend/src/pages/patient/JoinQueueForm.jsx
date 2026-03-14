import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext.jsx'
import { joinQueue } from '../../services/api.js'
import LoadingSpinner from '../../components/LoadingSpinner.jsx'
import './JoinQueueForm.css'

const STAGES = [
  { label: 'AI analyzing symptoms…', duration: 2000 },
  { label: 'Predicting consultation time…', duration: 1000 },
]

function EmergencyBadge({ level }) {
  return <span className={`badge badge-level-${level}`}>Level {level}</span>
}

export default function JoinQueueForm() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const [form, setForm] = useState({
    name: user?.name || '',
    age: user?.age?.toString() || '',
    gender: user?.gender || 'Male',
    visitType: 'Checkup',
    previousVisits: '',
    symptoms: '',
  })
  const [loading, setLoading] = useState(false)
  const [loadingStage, setLoadingStage] = useState('')
  const [error, setError] = useState('')
  const [result, setResult] = useState(null)

  const set = (field) => (e) => setForm(f => ({ ...f, [field]: e.target.value }))

  const runStages = async () => {
    for (const stage of STAGES) {
      setLoadingStage(stage.label)
      await new Promise(r => setTimeout(r, stage.duration))
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (!form.symptoms.trim()) { setError('Please describe your symptoms.'); return }
    if (!form.age || parseInt(form.age) <= 0) { setError('Please enter a valid age.'); return }
    setLoading(true)
    try {
      const [res] = await Promise.all([
        joinQueue({
          patientId: user._id || user.id,
          name: form.name,
          age: parseInt(form.age),
          gender: form.gender,
          visitType: form.visitType,
          previousVisits: form.visitType === 'Follow-up' ? parseInt(form.previousVisits) || 0 : 0,
          symptoms: form.symptoms,
        }),
        runStages(),
      ])
      setResult(res.data)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to join queue. Please try again.')
    } finally {
      setLoading(false)
      setLoadingStage('')
    }
  }

  if (result) {
    return (
      <div className="join-page">
        <div className="page-container">
          <div className="join-result card">
            <div className="join-result-header">
              <span className="join-result-icon">✅</span>
              <h2>Successfully Joined Queue!</h2>
            </div>

            {result.isCriticalOperationToday && (
              <div className="join-critical-alert">
                🚨 CRITICAL - Fast-tracked to emergency queue
              </div>
            )}

            <div className="join-result-grid">
              <div className="join-result-item">
                <span className="join-result-label">Emergency Level</span>
                <EmergencyBadge level={result.emergencyLevel || 1} />
              </div>
              <div className="join-result-item">
                <span className="join-result-label">Your Position</span>
                <span className="join-result-value">#{result.position || 1}</span>
              </div>
              <div className="join-result-item">
                <span className="join-result-label">Specialization</span>
                <span className="join-result-value">{result.specialization || '—'}</span>
              </div>
              <div className="join-result-item">
                <span className="join-result-label">Predicted Duration</span>
                <span className="join-result-value">{result.predictedDuration || 15} min</span>
              </div>
              <div className="join-result-item">
                <span className="join-result-label">Est. Wait Time</span>
                <span className="join-result-value">{result.estimatedWait || 10} min</span>
              </div>
              <div className="join-result-item">
                <span className="join-result-label">Priority Score</span>
                <span className="join-result-value">{result.priorityScore ? result.priorityScore.toFixed(1) : '—'}</span>
              </div>
            </div>

            <div className="join-result-actions">
              <button className="btn btn-primary" onClick={() => navigate('/patient/status')}>
                View Queue Status →
              </button>
              <button className="btn btn-secondary" onClick={() => navigate('/patient')}>
                Back to Dashboard
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="join-page">
      <div className="page-container">
        <div className="join-card card">
          <div className="join-header">
            <h2>Join Queue</h2>
            <p>Fill in your details and describe your symptoms</p>
          </div>

          {error && <div className="error-msg">{error}</div>}

          {loading ? (
            <div className="join-loading">
              <LoadingSpinner size="large" color="#2563EB" />
              <p className="join-loading-stage">{loadingStage}</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} noValidate>
              <div className="join-form-row">
                <div className="form-group">
                  <label>Full Name</label>
                  <input type="text" value={form.name} onChange={set('name')} placeholder="Your name" />
                </div>
                <div className="form-group">
                  <label>Age *</label>
                  <input type="number" min="1" max="120" value={form.age} onChange={set('age')} placeholder="Your age" required />
                </div>
                <div className="form-group">
                  <label>Gender</label>
                  <select value={form.gender} onChange={set('gender')}>
                    <option>Male</option>
                    <option>Female</option>
                    <option>Other</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>Visit Type</label>
                <div className="join-radio-group">
                  {['Checkup', 'Follow-up'].map(type => (
                    <label key={type} className={`join-radio-label ${form.visitType === type ? 'active' : ''}`}>
                      <input
                        type="radio"
                        name="visitType"
                        value={type}
                        checked={form.visitType === type}
                        onChange={set('visitType')}
                      />
                      {type === 'Checkup' ? '🔍 Checkup' : '🔄 Follow-up'}
                    </label>
                  ))}
                </div>
              </div>

              {form.visitType === 'Follow-up' && (
                <div className="form-group">
                  <label>Number of Previous Visits</label>
                  <input
                    type="number"
                    min="1"
                    value={form.previousVisits}
                    onChange={set('previousVisits')}
                    placeholder="e.g. 3"
                  />
                </div>
              )}

              <div className="form-group">
                <label>Describe Your Symptoms *</label>
                <textarea
                  rows={5}
                  value={form.symptoms}
                  onChange={set('symptoms')}
                  placeholder="Please describe your symptoms in detail. The more specific you are, the better our AI can assess your situation and prioritize your care…"
                  required
                  style={{ resize: 'vertical' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
                  🏥 Join Queue
                </button>
                <button type="button" className="btn btn-secondary" onClick={() => navigate('/patient')}>
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
