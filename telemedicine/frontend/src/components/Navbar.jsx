import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext.jsx'
import './Navbar.css'

export default function Navbar() {
  const { user, isAuthenticated, logout } = useAuth()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)

  const handleLogout = () => {
    logout()
    navigate('/')
    setMenuOpen(false)
  }

  const patientLinks = [
    { to: '/patient', label: 'Dashboard' },
    { to: '/patient/join', label: 'Join Queue' },
    { to: '/patient/status', label: 'Queue Status' },
  ]

  const doctorLinks = [
    { to: '/doctor', label: 'Dashboard' },
    { to: '/doctor/consultation', label: 'My Queue' },
  ]

  const adminLinks = [
    { to: '/admin', label: 'Dashboard' },
    { to: '/admin/analytics', label: 'Analytics' },
  ]

  const roleLinks = {
    patient: patientLinks,
    doctor: doctorLinks,
    admin: adminLinks,
  }

  const links = user ? (roleLinks[user.role] || []) : []

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <Link to="/" className="navbar-logo" onClick={() => setMenuOpen(false)}>
          <span className="navbar-logo-icon">🏥</span>
          <span className="navbar-logo-text">HeySara</span>
          <span className="navbar-logo-sep">|</span>
          <span className="navbar-logo-sub">Telemedicine</span>
        </Link>

        <button
          className={`navbar-hamburger ${menuOpen ? 'open' : ''}`}
          onClick={() => setMenuOpen(o => !o)}
          aria-label="Toggle menu"
        >
          <span /><span /><span />
        </button>

        <div className={`navbar-menu ${menuOpen ? 'open' : ''}`}>
          <div className="navbar-links">
            {links.map(l => (
              <Link key={l.to} to={l.to} className="navbar-link" onClick={() => setMenuOpen(false)}>
                {l.label}
              </Link>
            ))}
          </div>

          <div className="navbar-actions">
            {isAuthenticated ? (
              <>
                <span className="navbar-user">
                  <span className="navbar-role-badge">{user?.role}</span>
                  {user?.name || user?.email}
                </span>
                <button className="navbar-logout-btn" onClick={handleLogout}>Logout</button>
              </>
            ) : (
              <>
                <Link to="/login" className="navbar-link" onClick={() => setMenuOpen(false)}>Login</Link>
                <Link to="/register" className="navbar-cta" onClick={() => setMenuOpen(false)}>Sign Up</Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}
