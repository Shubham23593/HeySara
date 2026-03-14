import React from 'react'
import { useNavigate } from 'react-router-dom'
import './HomePage.css'

const features = [
  { icon: '🤖', title: 'AI-Powered Triage', desc: 'Machine learning algorithms analyze symptoms to prioritize patients intelligently.' },
  { icon: '⚡', title: 'Real-Time Updates', desc: 'Live queue updates via WebSockets keep everyone informed instantly.' },
  { icon: '🔒', title: 'Secure & Private', desc: 'End-to-end encrypted consultations and HIPAA-compliant data storage.' },
  { icon: '📹', title: 'Video Consultation', desc: 'High-quality WebRTC video calls connect patients with doctors seamlessly.' },
]

const portals = [
  {
    icon: '🧑‍⚕️',
    title: 'Patient Portal',
    desc: 'Join the queue, track your position in real-time, and consult with doctors via secure video or chat.',
    color: 'blue',
  },
  {
    icon: '👨‍⚕️',
    title: 'Doctor Portal',
    desc: 'Manage your patient queue, receive AI-prioritized cases, and conduct consultations efficiently.',
    color: 'green',
  },
  {
    icon: '🛡️',
    title: 'Admin Portal',
    desc: 'Monitor all queues, track system analytics, and ensure optimal resource allocation.',
    color: 'purple',
  },
]

export default function HomePage() {
  const navigate = useNavigate()

  return (
    <div className="home-page">
      {/* Hero */}
      <section className="home-hero">
        <div className="home-hero-content">
          <div className="home-hero-badge">🏥 AI-Powered Healthcare</div>
          <h1 className="home-hero-title">Smart Telemedicine<br />Queue System</h1>
          <p className="home-hero-sub">
            Experience the future of healthcare with our AI-powered queue optimization.
            Reduce wait times, improve patient outcomes, and streamline doctor workflows.
          </p>
          <div className="home-hero-actions">
            <button className="home-btn-primary" onClick={() => navigate('/login')}>
              Get Started →
            </button>
            <button className="home-btn-ghost" onClick={() => navigate('/register')}>
              Create Account
            </button>
          </div>
          <div className="home-hero-stats">
            <div className="home-stat">
              <span className="home-stat-value">40%</span>
              <span className="home-stat-label">Less Wait Time</span>
            </div>
            <div className="home-stat-divider" />
            <div className="home-stat">
              <span className="home-stat-value">99%</span>
              <span className="home-stat-label">Uptime</span>
            </div>
            <div className="home-stat-divider" />
            <div className="home-stat">
              <span className="home-stat-value">5x</span>
              <span className="home-stat-label">Faster Triage</span>
            </div>
          </div>
        </div>
        <div className="home-hero-graphic">
          <div className="home-hero-circle">
            <span className="home-hero-emoji">🏥</span>
          </div>
          <div className="home-hero-ring home-hero-ring-1" />
          <div className="home-hero-ring home-hero-ring-2" />
        </div>
      </section>

      {/* Portals */}
      <section className="home-portals">
        <div className="home-section-header">
          <h2>Choose Your Portal</h2>
          <p>Select the portal that matches your role to get started.</p>
        </div>
        <div className="home-portals-grid">
          {portals.map(p => (
            <div key={p.title} className={`home-portal-card home-portal-${p.color}`}>
              <div className="home-portal-icon">{p.icon}</div>
              <h3>{p.title}</h3>
              <p>{p.desc}</p>
              <button className="home-portal-btn" onClick={() => navigate('/login')}>
                Get Started →
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="home-features">
        <div className="home-section-header">
          <h2>Why Choose HeySara?</h2>
          <p>Built with cutting-edge technology to deliver the best telemedicine experience.</p>
        </div>
        <div className="home-features-grid">
          {features.map(f => (
            <div key={f.title} className="home-feature-item">
              <div className="home-feature-icon">{f.icon}</div>
              <h4>{f.title}</h4>
              <p>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="home-footer">
        <p>© 2024 HeySara Telemedicine. All rights reserved.</p>
      </footer>
    </div>
  )
}
