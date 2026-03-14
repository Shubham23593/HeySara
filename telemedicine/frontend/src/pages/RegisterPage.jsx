import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { register as registerApi } from '../services/api.js'
import LoadingSpinner from '../components/LoadingSpinner.jsx'
import './LoginPage.css'

const SPECIALIZATIONS = [
  'General', 'Cardiology', 'Neurology', 'Orthopedics',
  'Pediatrics', 'Dermatology', 'Psychiatry',
]

export default function RegisterPage() {
  const navigate = useNavigate()
  const [form, setForm] = useState({
    name: '', email: '', password: '', confirmPassword: '',
    role: 'patient', specialization: 'General', age: '', gender: 'Male',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const set = (field) => (e) => setForm(f => ({ ...f, [field]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (!form.name || !form.email || !form.password || !form.confirmPassword) {
      setError('Please fill in all required fields.'); return
    }
    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match.'); return
    }
    if (form.password.length < 6) {
      setError('Password must be at least 6 characters.'); return
    }
    if (form.role === 'patient' && (!form.age || parseInt(form.age) <= 0)) {
      setError('Please enter a valid age.'); return
    }
    setLoading(true)
    try {
      const payload = {
        name: form.name,
        email: form.email,
        password: form.password,
        role: form.role,
        ...(form.role === 'doctor' && { specialization: form.specialization }),
        ...(form.role === 'patient' && { age: parseInt(form.age), gender: form.gender }),
      }
      await registerApi(payload)
      setSuccess('Account created! Redirecting to login…')
      setTimeout(() => navigate('/login'), 1800)
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const cardStyle = {
    background: '#fff', borderRadius: 16, padding: '2.5rem 2rem',
    maxWidth: 460, width: '100%',
    boxShadow: '0 10px 25px rgba(0,0,0,0.08), 0 4px 10px rgba(0,0,0,0.05)',
    animation: 'fadeIn 0.3s ease',
  }

  const pageStyle = {
    minHeight: 'calc(100vh - 60px)', display: 'flex', alignItems: 'center',
    justifyContent: 'center', background: 'linear-gradient(135deg, #EFF6FF 0%, #F0FDF4 100%)',
    padding: '2rem 1rem',
  }

  const inputStyle = {
    padding: '0.625rem 0.875rem', border: '1.5px solid #E2E8F0', borderRadius: 8,
    fontSize: '0.9rem', color: '#1E293B', background: '#fff', outline: 'none',
    width: '100%', fontFamily: 'inherit',
  }

  const labelStyle = { fontSize: '0.875rem', fontWeight: 500, color: '#1E293B', display: 'block', marginBottom: 4 }

  return (
    <div style={pageStyle}>
      <div style={cardStyle}>
        <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
          <div style={{ fontSize: '3rem', marginBottom: 8 }}>🏥</div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#1E293B', marginBottom: 4 }}>Create Account</h1>
          <p style={{ color: '#64748B', fontSize: '0.9rem' }}>Join HeySara Telemedicine</p>
        </div>

        {error && <div className="error-msg">{error}</div>}
        {success && <div className="success-msg">{success}</div>}

        <form onSubmit={handleSubmit} noValidate>
          {/* Role tabs */}
          <div style={{ display: 'flex', gap: 6, marginBottom: 20, background: '#F1F5F9', padding: 4, borderRadius: 10 }}>
            {['patient', 'doctor'].map(r => (
              <button key={r} type="button" onClick={() => setForm(f => ({ ...f, role: r }))}
                style={{
                  flex: 1, padding: '0.5rem', border: 'none', borderRadius: 7, cursor: 'pointer',
                  background: form.role === r ? '#fff' : 'transparent',
                  color: form.role === r ? '#2563EB' : '#64748B',
                  fontWeight: form.role === r ? 600 : 500,
                  boxShadow: form.role === r ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                  transition: 'all 0.2s', fontSize: '0.875rem', fontFamily: 'inherit',
                }}>
                {r === 'patient' ? '🧑‍⚕️ Patient' : '👨‍⚕️ Doctor'}
              </button>
            ))}
          </div>

          {/* Full Name */}
          <div style={{ marginBottom: 14 }}>
            <label style={labelStyle}>Full Name *</label>
            <input style={inputStyle} type="text" value={form.name} onChange={set('name')} placeholder="John Doe" required />
          </div>

          {/* Email */}
          <div style={{ marginBottom: 14 }}>
            <label style={labelStyle}>Email Address *</label>
            <input style={inputStyle} type="email" value={form.email} onChange={set('email')} placeholder="you@example.com" required />
          </div>

          {/* Password */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
            <div>
              <label style={labelStyle}>Password *</label>
              <input style={inputStyle} type="password" value={form.password} onChange={set('password')} placeholder="Min 6 chars" required />
            </div>
            <div>
              <label style={labelStyle}>Confirm Password *</label>
              <input style={inputStyle} type="password" value={form.confirmPassword} onChange={set('confirmPassword')} placeholder="Repeat password" required />
            </div>
          </div>

          {/* Doctor fields */}
          {form.role === 'doctor' && (
            <div style={{ marginBottom: 14 }}>
              <label style={labelStyle}>Specialization *</label>
              <select style={inputStyle} value={form.specialization} onChange={set('specialization')}>
                {SPECIALIZATIONS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          )}

          {/* Patient fields */}
          {form.role === 'patient' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 14 }}>
              <div>
                <label style={labelStyle}>Age *</label>
                <input style={inputStyle} type="number" min="1" max="120" value={form.age} onChange={set('age')} placeholder="e.g. 30" required />
              </div>
              <div>
                <label style={labelStyle}>Gender *</label>
                <select style={inputStyle} value={form.gender} onChange={set('gender')}>
                  <option>Male</option>
                  <option>Female</option>
                  <option>Other</option>
                </select>
              </div>
            </div>
          )}

          <button type="submit" className="login-submit-btn" disabled={loading} style={{ marginTop: 8 }}>
            {loading ? <LoadingSpinner size="small" color="#fff" center={false} /> : 'Create Account'}
          </button>
        </form>

        <p className="login-footer-text" style={{ marginTop: '1.25rem', textAlign: 'center', fontSize: '0.875rem', color: '#64748B' }}>
          Already have an account? <Link to="/login" style={{ color: '#2563EB', fontWeight: 500 }}>Sign in</Link>
        </p>
      </div>
    </div>
  )
}
