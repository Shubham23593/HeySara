import React from 'react'

const sizeMap = {
  small: { width: 20, height: 20, border: 3 },
  medium: { width: 40, height: 40, border: 4 },
  large: { width: 64, height: 64, border: 5 },
}

export default function LoadingSpinner({ size = 'medium', color = '#2563EB', center = true }) {
  const dims = sizeMap[size] || sizeMap.medium

  const spinnerStyle = {
    width: dims.width,
    height: dims.height,
    border: `${dims.border}px solid #E2E8F0`,
    borderTop: `${dims.border}px solid ${color}`,
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
    display: 'inline-block',
    flexShrink: 0,
  }

  const wrapperStyle = center
    ? {
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '2rem',
        width: '100%',
      }
    : { display: 'inline-flex' }

  return (
    <div style={wrapperStyle}>
      <div style={spinnerStyle} aria-label="Loading" role="status" />
    </div>
  )
}
