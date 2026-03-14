import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { login as loginApi } from '../services/api.js'
import { useAuth } from '../contexts/AuthContext.jsx'
import LoadingSpinner from '../components/LoadingSpinner.jsx'
import './LoginPage.css'

const ROLES = ['patient', 'doctor', 'admin']

const ROLE_REDIRECTS = {
  patient: '/patient',
  doctor: '/doctor',
  admin: '/admin',
}

export default function LoginPage() {
  const navigate = useNavigate()
  const { login } = useAuth()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState('patient')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (!email || !password) { setError('Please fill in all fields.'); return }
    setLoading(true)
    try {
      const res = await loginApi({ email, password, role })
      const { user, token } = res.data
      login(user, token)
      navigate(ROLE_REDIRECTS[user.role] || '/')
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please check your credentials.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-header">
          <div className="login-icon">🏥</div>
          <h1>Welcome Back</h1>
          <p>Sign in to your HeySara account</p>
        </div>

        {error && <div className="error-msg">{error}</div>}

        <form onSubmit={handleSubmit} noValidate>
          <div className="role-tabs">
            {ROLES.map(r => (
              <button
                key={r}
                type="button"
                className={`role-tab ${role === r ? 'active' : ''}`}
                onClick={() => setRole(r)}
              >
                {r === 'patient' ? '🧑‍⚕️' : r === 'doctor' ? '👨‍⚕️' : '🛡️'} {r.charAt(0).toUpperCase() + r.slice(1)}
              </button>
            ))}
          </div>

          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com"
              autoComplete="email"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Enter your password"
              autoComplete="current-password"
              required
            />
          </div>

          <button type="submit" className="login-submit-btn" disabled={loading}>
            {loading ? <LoadingSpinner size="small" color="#fff" center={false} /> : 'Login'}
          </button>
        </form>

        <p className="login-footer-text">
          Don&apos;t have an account?{' '}
          <Link to="/register">Create one</Link>
        </p>
      </div>
    </div>
  )
}
