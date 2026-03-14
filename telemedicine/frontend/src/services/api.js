import axios from 'axios'

const api = axios.create({ baseURL: '/api' })

api.interceptors.request.use(config => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Auth
export const login = (data) => api.post('/auth/login', data)
export const register = (data) => api.post('/auth/register', data)

// Patient
export const joinQueue = (data) => api.post('/patient/join-queue', data)
export const getStatus = (patientId) => api.get(`/patient/status/${patientId}`)
export const urgentRequest = (data) => api.post('/patient/urgent-request', data)
export const getQueuePosition = (patientId) => api.get(`/patient/queue-position/${patientId}`)

// Doctor
export const getQueue = () => api.get('/doctor/queue')
export const updateStatus = (status) => api.post('/doctor/status', { status })
export const startSession = (patientId) => api.post(`/doctor/start-session/${patientId}`)
export const endSession = (patientId, duration) => api.post(`/doctor/end-session/${patientId}`, { duration })
export const acceptUrgent = (patientId) => api.post(`/doctor/accept-urgent/${patientId}`)

// Admin
export const getDashboard = () => api.get('/admin/dashboard')
export const getDoctors = () => api.get('/admin/doctors')
export const getQueues = () => api.get('/admin/queues')
export const getAnalytics = () => api.get('/admin/analytics')

// Queue
export const getLiveQueue = () => api.get('/queue/live')
export const recalculateQueue = () => api.post('/queue/recalculate')

export default api
