import React, { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSocket } from '../../contexts/SocketContext.jsx'
import { getDashboard, getDoctors, getQueues } from '../../services/api.js'
import LoadingSpinner from '../../components/LoadingSpinner.jsx'
import Notification from '../../components/Notification.jsx'
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement,
  ArcElement, Tooltip, Legend, Title,
} from 'chart.js'
import { Bar, Pie } from 'react-chartjs-2'
import './AdminDashboard.css'

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend, Title)

const SURGE_THRESHOLD = 20

export default function AdminDashboard() {
  const { socket } = useSocket()
  const navigate = useNavigate()

  const [stats, setStats] = useState(null)
  const [doctors, setDoctors] = useState([])
  const [queues, setQueues] = useState([])
  const [loading, setLoading] = useState(true)
  const [surgAlert, setSurgAlert] = useState(false)
  const [notifications, setNotifications] = useState([])

  const addNotification = useCallback((message, type = 'info') => {
    const id = Date.now()
    setNotifications(n => [...n, { id, message, type }])
  }, [])

  const removeNotification = useCallback((id) => {
    setNotifications(n => n.filter(x => x.id !== id))
  }, [])

  const fetchAll = useCallback(async () => {
    try {
      const [dashRes, docRes, queueRes] = await Promise.all([
        getDashboard(),
        getDoctors(),
        getQueues(),
      ])
      setStats(dashRes.data.data)
      setDoctors(docRes.data.data || [])
      const qs = queueRes.data.data || []
      setQueues(qs)
      const totalQ = qs.reduce((a, q) => a + (q.totalWaiting || 0), 0)
      if (totalQ > SURGE_THRESHOLD) setSurgAlert(true)
    } catch (err) {
      addNotification(err.response?.data?.message || 'Failed to load dashboard data.', 'error')
    } finally {
      setLoading(false)
    }
  }, [addNotification])

  useEffect(() => {
    fetchAll()
    const interval = setInterval(fetchAll, 30000)
    return () => clearInterval(interval)
  }, [fetchAll])

  useEffect(() => {
    if (!socket) return
    const onCritical = () => { setSurgAlert(true); addNotification('🚨 Critical surge detected!', 'error') }
    const onQueueUpdated = () => fetchAll()
    const onDoctorStatusChanged = () => fetchAll()
    socket.on('criticalAlert', onCritical)
    socket.on('queueUpdated', onQueueUpdated)
    socket.on('doctorStatusChanged', onDoctorStatusChanged)
    return () => {
      socket.off('criticalAlert', onCritical)
      socket.off('queueUpdated', onQueueUpdated)
      socket.off('doctorStatusChanged', onDoctorStatusChanged)
    }
  }, [socket, fetchAll, addNotification])

  // Chart data: queue length per specialization
  const queueBarData = {
    labels: queues.map(q => q.specialization || 'Unknown'),
    datasets: [{
      label: 'Queue Length',
      data: queues.map(q => q.totalWaiting || 0),
      backgroundColor: ['#2563EB', '#16A34A', '#7C3AED', '#D97706', '#DC2626', '#0891b2', '#db2777'],
      borderRadius: 6,
    }],
  }

  // Chart data: emergency level distribution from stats
  const emergencyDist = stats?.emergencyDistribution || { 1: 5, 2: 10, 3: 8, 4: 3, 5: 1 }
  const pieData = {
    labels: ['Level 1', 'Level 2', 'Level 3', 'Level 4', 'Level 5'],
    datasets: [{
      data: [
        emergencyDist['1'] || 0,
        emergencyDist['2'] || 0,
        emergencyDist['3'] || 0,
        emergencyDist['4'] || 0,
        emergencyDist['5'] || 0,
      ],
      backgroundColor: ['#16A34A', '#22c55e', '#D97706', '#DC2626', '#991B1B'],
      borderWidth: 1,
    }],
  }

  const chartOptions = {
    responsive: true,
    plugins: { legend: { position: 'bottom' } },
    maintainAspectRatio: false,
  }

  const statCards = [
    { label: 'Total Doctors', value: stats?.totalDoctors ?? doctors.length, icon: '👨‍⚕️' },
    { label: 'Active Doctors', value: stats?.activeDoctors ?? doctors.filter(d => d.status === 'ACTIVE').length, icon: '🟢' },
    { label: 'Patients in Queue', value: stats?.waitingPatients ?? queues.reduce((a, q) => a + (q.totalWaiting || 0), 0), icon: '👥' },
    { label: 'Avg Wait Time', value: `${stats?.avgWaitMinutes ?? 0}m`, icon: '⏱' },
  ]

  return (
    <div className="admin-dashboard">
      {notifications.map(n => (
        <Notification key={n.id} message={n.message} type={n.type} onClose={() => removeNotification(n.id)} />
      ))}

      <div className="page-container">
        <div className="ad-header">
          <h1>Admin Dashboard 🛡️</h1>
          <button className="btn btn-secondary" onClick={() => navigate('/admin/analytics')}>
            📈 View Analytics
          </button>
        </div>

        {surgAlert && (
          <div className="ad-surge-banner">
            🚨 CRITICAL SURGE — Patient queue has exceeded normal capacity. Consider activating additional doctors.
            <button className="ad-banner-close" onClick={() => setSurgAlert(false)}>×</button>
          </div>
        )}

        {/* Stats cards */}
        <div className="ad-stats-row">
          {statCards.map(s => (
            <div key={s.label} className="ad-stat-card card">
              <span className="ad-stat-icon">{s.icon}</span>
              <span className="ad-stat-value">{loading ? '—' : s.value}</span>
              <span className="ad-stat-label">{s.label}</span>
            </div>
          ))}
        </div>

        {loading ? <LoadingSpinner /> : (
          <>
            {/* Live queue table */}
            <div className="card ad-section">
              <h3>Live Queue by Specialization</h3>
              {queues.length === 0 ? (
                <p style={{ color: '#64748B', padding: '1rem 0' }}>No queue data available.</p>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table className="ad-table">
                    <thead>
                      <tr>
                        {['Specialization', 'Queue Length', 'Avg Wait (min)', 'Status'].map(col => (
                          <th key={col}>{col}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {queues.map((q, i) => (
                        <tr key={i}>
                          <td style={{ fontWeight: 600 }}>{q.specialization}</td>
                          <td>
                            <span style={{
                              background: (q.totalWaiting || 0) > 10 ? '#FEE2E2' : '#DCFCE7',
                              color: (q.totalWaiting || 0) > 10 ? '#991B1B' : '#15803D',
                              padding: '0.2rem 0.5rem', borderRadius: 999, fontSize: '0.8rem', fontWeight: 600,
                            }}>
                              {q.totalWaiting || 0}
                            </span>
                          </td>
                          <td>{q.avgWait || 0}</td>
                          <td>
                            <span style={{
                              padding: '0.2rem 0.625rem', borderRadius: 999, fontSize: '0.75rem', fontWeight: 600,
                              background: q.doctorStatus === 'ACTIVE' ? '#DCFCE7' : '#F1F5F9',
                              color: q.doctorStatus === 'ACTIVE' ? '#15803D' : '#64748B',
                            }}>
                              {q.doctorStatus || 'active'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Doctor status list */}
            <div className="card ad-section">
              <h3>Doctor Status</h3>
              {doctors.length === 0 ? (
                <p style={{ color: '#64748B', padding: '1rem 0' }}>No doctor data available.</p>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table className="ad-table">
                    <thead>
                      <tr>
                        {['Name', 'Specialization', 'Status', 'Current Patient'].map(col => (
                          <th key={col}>{col}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {doctors.map((doc, i) => (
                        <tr key={i}>
                          <td style={{ fontWeight: 600 }}>Dr. {doc.name}</td>
                          <td>{doc.specialization}</td>
                          <td>
                            <span style={{
                              padding: '0.2rem 0.625rem', borderRadius: 999, fontSize: '0.75rem', fontWeight: 600,
                              background: doc.status === 'ACTIVE' ? '#DCFCE7' : '#F1F5F9',
                              color: doc.status === 'ACTIVE' ? '#15803D' : '#64748B',
                            }}>
                              {doc.status === 'ACTIVE' ? '🟢 Active' : '⚫ Inactive'}
                            </span>
                          </td>
                          <td style={{ color: '#64748B', fontSize: '0.875rem' }}>
                            {doc.currentPatient || '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Charts */}
            <div className="ad-charts-row">
              <div className="card ad-chart-card">
                <h3>Queue Length by Specialization</h3>
                <div className="ad-chart-wrap">
                  <Bar data={queueBarData} options={chartOptions} />
                </div>
              </div>
              <div className="card ad-chart-card">
                <h3>Emergency Level Distribution</h3>
                <div className="ad-chart-wrap">
                  <Pie data={pieData} options={chartOptions} />
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
