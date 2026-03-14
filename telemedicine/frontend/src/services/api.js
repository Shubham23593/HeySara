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
export const joinQueue = (data) => api.post('/queue/join', data)
export const getStatus = (patientId) => api.get(`/queue/status/${patientId}`)
export const urgentRequest = (data) => api.post('/queue/urgent', data)
export const getQueuePosition = (patientId) => api.get(`/queue/position/${patientId}`)

// Doctor
export const getQueue = () => api.get('/doctor/queue')
export const updateStatus = (status) => api.put('/doctor/status', { status })
export const startSession = (patientId) => api.post(`/doctor/session/start/${patientId}`)
export const endSession = (patientId, duration) => api.post(`/doctor/session/end/${patientId}`, { duration })
export const acceptUrgent = (patientId) => api.post(`/doctor/urgent/accept/${patientId}`)

// Admin
export const getDashboard = () => api.get('/admin/dashboard')
export const getDoctors = () => api.get('/admin/doctors')
export const getQueues = () => api.get('/admin/queues')
export const getAnalytics = () => api.get('/admin/analytics')

// Queue
export const getLiveQueue = () => api.get('/queue/live')
export const recalculateQueue = () => api.post('/queue/recalculate')

export default api
