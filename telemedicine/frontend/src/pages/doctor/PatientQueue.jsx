import React from 'react'

function EmergencyBadge({ level }) {
  return <span className={`badge badge-level-${level}`}>Level {level}</span>
}

function formatWaitTime(minutes) {
  if (!minutes && minutes !== 0) return '—'
  if (minutes < 60) return `${minutes}m`
  return `${Math.floor(minutes / 60)}h ${minutes % 60}m`
}

export default function PatientQueue({ patients, onStartSession }) {
  if (!patients || patients.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '2.5rem', color: '#64748B' }}>
        <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>👥</div>
        <p style={{ fontWeight: 500 }}>No patients in queue</p>
        <p style={{ fontSize: '0.875rem', marginTop: '0.25rem' }}>New patients will appear here automatically.</p>
      </div>
    )
  }

  const sorted = [...patients].sort((a, b) => (b.priorityScore || 0) - (a.priorityScore || 0))

  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
        <thead>
          <tr style={{ borderBottom: '2px solid #E2E8F0' }}>
            {['Name', 'Age', 'Emergency', 'Priority Score', 'Wait Time', 'Predicted Duration', 'Action'].map(col => (
              <th key={col} style={{
                padding: '0.625rem 0.75rem', textAlign: 'left',
                color: '#64748B', fontWeight: 600, fontSize: '0.75rem',
                textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap',
              }}>{col}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sorted.map((patient, idx) => (
            <tr key={patient._id || patient.id || idx} style={{
              borderBottom: '1px solid #F1F5F9',
              background: patient.emergencyLevel === 5 ? '#FFF5F5' : 'transparent',
              transition: 'background 0.15s',
            }}
              onMouseEnter={e => e.currentTarget.style.background = patient.emergencyLevel === 5 ? '#FEE2E2' : '#F8FAFC'}
              onMouseLeave={e => e.currentTarget.style.background = patient.emergencyLevel === 5 ? '#FFF5F5' : 'transparent'}
            >
              <td style={{ padding: '0.75rem 0.75rem' }}>
                <div style={{ fontWeight: 600, color: '#1E293B' }}>{patient.name || 'Unknown'}</div>
                <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.1rem' }}>{patient.symptoms?.substring(0, 40)}{patient.symptoms?.length > 40 ? '…' : ''}</div>
              </td>
              <td style={{ padding: '0.75rem 0.75rem', color: '#475569' }}>{patient.age || '—'}</td>
              <td style={{ padding: '0.75rem 0.75rem' }}>
                <EmergencyBadge level={patient.emergencyLevel || 1} />
              </td>
              <td style={{ padding: '0.75rem 0.75rem', color: '#475569', fontWeight: 600 }}>
                {patient.priorityScore ? patient.priorityScore.toFixed(1) : '—'}
              </td>
              <td style={{ padding: '0.75rem 0.75rem', color: '#475569' }}>
                {formatWaitTime(patient.waitingTime)}
              </td>
              <td style={{ padding: '0.75rem 0.75rem', color: '#475569' }}>
                {patient.predictedDuration ? `${patient.predictedDuration}m` : '—'}
              </td>
              <td style={{ padding: '0.75rem 0.75rem' }}>
                <button
                  onClick={() => onStartSession(patient)}
                  style={{
                    background: '#2563EB', color: '#fff', border: 'none',
                    padding: '0.4rem 0.875rem', borderRadius: 6, cursor: 'pointer',
                    fontSize: '0.8rem', fontWeight: 600, whiteSpace: 'nowrap',
                    transition: 'background 0.2s',
                  }}
                  onMouseEnter={e => e.target.style.background = '#1D4ED8'}
                  onMouseLeave={e => e.target.style.background = '#2563EB'}
                >
                  ▶ Start Session
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
