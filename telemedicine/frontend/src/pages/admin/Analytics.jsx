import React, { useState, useEffect } from 'react'
import { getAnalytics } from '../../services/api.js'
import LoadingSpinner from '../../components/LoadingSpinner.jsx'
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, BarElement, PointElement, LineElement,
  ArcElement, Tooltip, Legend, Title, Filler,
} from 'chart.js'
import { Bar, Line } from 'react-chartjs-2'

ChartJS.register(
  CategoryScale, LinearScale, BarElement, PointElement, LineElement,
  ArcElement, Tooltip, Legend, Title, Filler
)

const MOCK_DATA = {
  avgWaitTime: 14,
  maxWaitTime: 42,
  doctorIdlePercent: 18,
  patientThroughput: 7.3,
  waitOverTime: {
    labels: ['Day 1', 'Day 2', 'Day 3', 'Day 4', 'Day 5', 'Day 6', 'Day 7'],
    fifo: [35, 42, 38, 45, 40, 36, 44],
    optimized: [20, 22, 19, 24, 21, 18, 23],
  },
  waitByEmergency: {
    1: 25,
    2: 20,
    3: 14,
    4: 8,
    5: 3,
  },
}

export default function Analytics() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const res = await getAnalytics()
        if (!cancelled) setData(res.data)
      } catch {
        if (!cancelled) setData(MOCK_DATA)
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => { cancelled = true }
  }, [])

  const d = data || MOCK_DATA

  const lineChartData = {
    labels: d.waitOverTime?.labels || MOCK_DATA.waitOverTime.labels,
    datasets: [
      {
        label: 'FIFO Queue',
        data: d.waitOverTime?.fifo || MOCK_DATA.waitOverTime.fifo,
        borderColor: '#DC2626',
        backgroundColor: 'rgba(220,38,38,0.08)',
        tension: 0.4,
        fill: true,
        pointRadius: 4,
        pointBackgroundColor: '#DC2626',
      },
      {
        label: 'Optimized Queue',
        data: d.waitOverTime?.optimized || MOCK_DATA.waitOverTime.optimized,
        borderColor: '#2563EB',
        backgroundColor: 'rgba(37,99,235,0.08)',
        tension: 0.4,
        fill: true,
        pointRadius: 4,
        pointBackgroundColor: '#2563EB',
      },
    ],
  }

  const waitByEmergency = d.waitByEmergency || MOCK_DATA.waitByEmergency
  const barColors = ['#16A34A', '#22c55e', '#D97706', '#EA580C', '#DC2626']
  const emergencyBarData = {
    labels: ['Level 1', 'Level 2', 'Level 3', 'Level 4', 'Level 5'],
    datasets: [{
      label: 'Avg Wait Time (min)',
      data: [1, 2, 3, 4, 5].map(l => waitByEmergency[l] || 0),
      backgroundColor: barColors,
      borderRadius: 6,
    }],
  }

  const chartOptions = (title) => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'bottom' },
      title: { display: false },
    },
    scales: {
      y: {
        grid: { color: '#F1F5F9' },
        ticks: { color: '#94a3b8', font: { size: 11 } },
      },
      x: {
        grid: { color: 'transparent' },
        ticks: { color: '#94a3b8', font: { size: 11 } },
      },
    },
  })

  const statCards = [
    { label: 'Avg Wait Time', value: `${d.avgWaitTime ?? '—'}m`, icon: '⏱', color: '#2563EB' },
    { label: 'Max Wait Time', value: `${d.maxWaitTime ?? '—'}m`, icon: '⚠️', color: '#DC2626' },
    { label: 'Doctor Idle Time', value: `${d.doctorIdlePercent ?? '—'}%`, icon: '💤', color: '#D97706' },
    { label: 'Patient Throughput', value: `${d.patientThroughput ?? '—'}/hr`, icon: '📈', color: '#16A34A' },
  ]

  return (
    <div style={{ minHeight: 'calc(100vh - 60px)', background: '#F8FAFC', paddingBottom: '3rem' }}>
      <div className="page-container">
        <div style={{ marginBottom: '1.5rem' }}>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 700, color: '#1E293B' }}>📊 Queue Analytics</h1>
          <p style={{ color: '#64748B', fontSize: '0.9rem', marginTop: '0.25rem' }}>
            AI-powered insights into queue performance and optimization.
          </p>
        </div>

        {loading ? (
          <LoadingSpinner />
        ) : (
          <>
            {/* Stats row */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
              {statCards.map(s => (
                <div key={s.label} className="card" style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem', padding: '1.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontSize: '1.5rem' }}>{s.icon}</span>
                    <span style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      {s.label}
                    </span>
                  </div>
                  <span style={{ fontSize: '2rem', fontWeight: 800, color: s.color }}>
                    {s.value}
                  </span>
                </div>
              ))}
            </div>

            {/* Line chart: FIFO vs Optimized */}
            <div className="card" style={{ marginBottom: '1.5rem' }}>
              <h3 style={{ fontSize: '1.05rem', fontWeight: 600, color: '#1E293B', marginBottom: '1rem' }}>
                Wait Time Comparison: FIFO vs Optimized Queue (Last 7 Days)
              </h3>
              <div style={{ height: 300, position: 'relative' }}>
                <Line data={lineChartData} options={chartOptions('Wait Time Comparison')} />
              </div>
            </div>

            {/* Bar chart: wait by emergency level */}
            <div className="card">
              <h3 style={{ fontSize: '1.05rem', fontWeight: 600, color: '#1E293B', marginBottom: '1rem' }}>
                Average Wait Time by Emergency Level
              </h3>
              <div style={{ height: 300, position: 'relative' }}>
                <Bar data={emergencyBarData} options={chartOptions('Wait by Emergency Level')} />
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
