import React, { useEffect, useState } from 'react'

const typeStyles = {
  success: { background: '#DCFCE7', color: '#15803D', border: '1px solid #bbf7d0', icon: '✅' },
  error:   { background: '#FEE2E2', color: '#991B1B', border: '1px solid #fecaca', icon: '❌' },
  warning: { background: '#FEF9C3', color: '#854D0E', border: '1px solid #fde68a', icon: '⚠️' },
  info:    { background: '#EFF6FF', color: '#1D4ED8', border: '1px solid #bfdbfe', icon: 'ℹ️' },
}

export default function Notification({ message, type = 'info', onClose }) {
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false)
      setTimeout(() => onClose && onClose(), 300)
    }, 4000)
    return () => clearTimeout(timer)
  }, [onClose])

  const style = typeStyles[type] || typeStyles.info

  const containerStyle = {
    position: 'fixed',
    top: '1rem',
    right: '1rem',
    zIndex: 9999,
    maxWidth: 360,
    width: '90%',
    padding: '0.875rem 1rem',
    borderRadius: 10,
    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
    display: 'flex',
    alignItems: 'flex-start',
    gap: '0.625rem',
    animation: visible ? 'slideInRight 0.3s ease' : 'none',
    opacity: visible ? 1 : 0,
    transform: visible ? 'translateX(0)' : 'translateX(120%)',
    transition: 'opacity 0.3s ease, transform 0.3s ease',
    ...style,
  }

  return (
    <div style={containerStyle} role="alert">
      <span style={{ fontSize: '1.1rem', lineHeight: 1.3 }}>{style.icon}</span>
      <div style={{ flex: 1, fontSize: '0.875rem', lineHeight: 1.5 }}>{message}</div>
      <button
        onClick={() => { setVisible(false); setTimeout(() => onClose && onClose(), 300) }}
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          color: 'inherit',
          opacity: 0.7,
          fontSize: '1rem',
          padding: '0 0.2rem',
          lineHeight: 1,
        }}
        aria-label="Close notification"
      >
        ×
      </button>
    </div>
  )
}
