import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext.jsx'
import { useSocket } from '../../contexts/SocketContext.jsx'
import { endSession } from '../../services/api.js'
import Notification from '../../components/Notification.jsx'
import './ConsultationSession.css'

const STUN_CONFIG = { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] }

function formatTime(seconds) {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}m ${s.toString().padStart(2, '0')}s`
}

export default function ConsultationSession() {
  const { user } = useAuth()
  const { socket } = useSocket()
  const navigate = useNavigate()
  const location = useLocation()

  const [mode, setMode] = useState('chat')

  const patient = (() => {
    try {
      return location.state?.patient || JSON.parse(sessionStorage.getItem('consultationData') || '{}')
    } catch { return {} }
  })()

  const predictedDuration = patient.predictedDuration || 15

  // Chat
  const [messages, setMessages] = useState([])
  const [inputMsg, setInputMsg] = useState('')
  const messagesEndRef = useRef(null)

  // Video (doctor = answerer)
  const localVideoRef = useRef(null)
  const remoteVideoRef = useRef(null)
  const pcRef = useRef(null)
  const localStreamRef = useRef(null)
  const [cameraOn, setCameraOn] = useState(true)
  const [micOn, setMicOn] = useState(true)
  const [videoConnecting, setVideoConnecting] = useState(false)

  // Timer
  const [elapsed, setElapsed] = useState(0)
  const timerRef = useRef(null)
  const [notifications, setNotifications] = useState([])

  const addNotification = useCallback((message, type = 'info') => {
    const id = Date.now()
    setNotifications(n => [...n, { id, message, type }])
  }, [])

  const removeNotification = useCallback((id) => {
    setNotifications(n => n.filter(x => x.id !== id))
  }, [])

  useEffect(() => {
    timerRef.current = setInterval(() => setElapsed(s => s + 1), 1000)
    return () => clearInterval(timerRef.current)
  }, [])

  // Cascade warning when actual > predicted * 1.2
  useEffect(() => {
    if (elapsed > predictedDuration * 60 * 1.2 && elapsed % 60 === 0 && elapsed > 0) {
      addNotification(
        `⚠️ Session is ${Math.floor(elapsed / 60)}m — exceeds predicted ${predictedDuration}m by 20%`,
        'warning'
      )
    }
  }, [elapsed, predictedDuration, addNotification])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Socket: chat
  useEffect(() => {
    if (!socket) return
    const handleChat = (data) => {
      setMessages(m => [...m, { ...data, received: true }])
    }
    socket.on('chatMessage', handleChat)
    return () => socket.off('chatMessage', handleChat)
  }, [socket])

  // WebRTC setup for doctor (answerer)
  const setupVideoAsAnswerer = useCallback(async () => {
    if (!socket) return
    setVideoConnecting(true)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      localStreamRef.current = stream
      if (localVideoRef.current) localVideoRef.current.srcObject = stream

      const pc = new RTCPeerConnection(STUN_CONFIG)
      pcRef.current = pc

      stream.getTracks().forEach(track => pc.addTrack(track, stream))

      pc.ontrack = (event) => {
        if (remoteVideoRef.current && event.streams[0]) {
          remoteVideoRef.current.srcObject = event.streams[0]
        }
      }

      pc.onicecandidate = (event) => {
        if (event.candidate && socket) {
          socket.emit('videoSignal', {
            type: 'ice-candidate',
            payload: event.candidate,
            to: patient.patientId,
          })
        }
      }

      // Doctor listens for offer, then answers
      const handleSignal = async ({ type, payload }) => {
        try {
          if (type === 'offer') {
            await pc.setRemoteDescription(new RTCSessionDescription(payload))
            const answer = await pc.createAnswer()
            await pc.setLocalDescription(answer)
            socket.emit('videoSignal', {
              type: 'answer',
              payload: answer,
              to: patient.patientId,
            })
            setVideoConnecting(false)
          } else if (type === 'ice-candidate') {
            await pc.addIceCandidate(new RTCIceCandidate(payload))
          }
        } catch (err) {
          console.error('Doctor signal handling error:', err)
        }
      }

      socket.on('videoSignal', handleSignal)
      return () => socket.off('videoSignal', handleSignal)
    } catch (err) {
      console.error('Doctor WebRTC error:', err)
      setVideoConnecting(false)
    }
  }, [socket, patient.patientId])

  useEffect(() => {
    if (mode === 'video') {
      const cleanup = setupVideoAsAnswerer()
      return () => {
        cleanup?.then(fn => fn?.())
        if (localStreamRef.current) {
          localStreamRef.current.getTracks().forEach(t => t.stop())
          localStreamRef.current = null
        }
        if (pcRef.current) {
          pcRef.current.close()
          pcRef.current = null
        }
      }
    }
  }, [mode, setupVideoAsAnswerer])

  // Full cleanup
  useEffect(() => {
    return () => {
      clearInterval(timerRef.current)
      if (localStreamRef.current) localStreamRef.current.getTracks().forEach(t => t.stop())
      if (pcRef.current) pcRef.current.close()
    }
  }, [])

  const sendMessage = () => {
    if (!inputMsg.trim() || !socket) return
    const msg = {
      content: inputMsg.trim(),
      sender: user?._id || user?.id,
      senderName: `Dr. ${user?.name || 'Doctor'}`,
      timestamp: new Date().toISOString(),
    }
    socket.emit('chatMessage', { ...msg, to: patient.patientId })
    setMessages(m => [...m, { ...msg, received: false }])
    setInputMsg('')
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() }
  }

  const toggleCamera = () => {
    if (localStreamRef.current) {
      const vt = localStreamRef.current.getVideoTracks()[0]
      if (vt) { vt.enabled = !vt.enabled; setCameraOn(v => !v) }
    }
  }

  const toggleMic = () => {
    if (localStreamRef.current) {
      const at = localStreamRef.current.getAudioTracks()[0]
      if (at) { at.enabled = !at.enabled; setMicOn(v => !v) }
    }
  }

  const handleEndSession = async () => {
    clearInterval(timerRef.current)
    if (localStreamRef.current) localStreamRef.current.getTracks().forEach(t => t.stop())
    if (pcRef.current) pcRef.current.close()
    try {
      await endSession(patient.patientId || patient._id, Math.floor(elapsed / 60))
    } catch { /* ignore */ }
    sessionStorage.removeItem('consultationData')
    navigate('/doctor')
  }

  const isOverPredicted = elapsed > predictedDuration * 60

  return (
    <div className="cs-page">
      {notifications.map(n => (
        <Notification key={n.id} message={n.message} type={n.type} onClose={() => removeNotification(n.id)} />
      ))}

      {/* Session header */}
      <div className="cs-header">
        <div className="cs-patient-info">
          <div className="cs-patient-main">
            <span className="cs-patient-name">{patient.patientName || 'Patient'}</span>
            {patient.emergencyLevel && (
              <span className={`badge badge-level-${patient.emergencyLevel}`}>Level {patient.emergencyLevel}</span>
            )}
          </div>
          {patient.symptoms && (
            <div className="cs-symptoms">
              <span>Symptoms: </span>{patient.symptoms}
            </div>
          )}
        </div>
        <div className="cs-timer-block">
          <div className={`cs-timer ${isOverPredicted ? 'over' : ''}`}>
            ⏱ {formatTime(elapsed)}
          </div>
          <div className="cs-timer-sub">
            Predicted: {predictedDuration}m
            {isOverPredicted && <span className="cs-over-warn"> ⚠️ Over</span>}
          </div>
        </div>
      </div>

      {/* Mode switcher */}
      <div className="cs-mode-bar">
        {['chat', 'video'].map(m => (
          <button key={m} onClick={() => setMode(m)} className={`cs-mode-btn ${mode === m ? 'active' : ''}`}>
            {m === 'chat' ? '💬 Chat' : '📹 Video Call'}
          </button>
        ))}
        <button className="cs-end-btn" onClick={handleEndSession}>
          🔴 End Session
        </button>
      </div>

      {/* Content */}
      <div className="cs-content">
        {mode === 'chat' ? (
          <div className="cs-chat">
            <div className="cs-messages">
              {messages.length === 0 && (
                <div className="cs-no-messages">
                  <div>💬</div>
                  <p>Consultation chat is ready. Send a message to begin.</p>
                </div>
              )}
              {messages.map((msg, idx) => (
                <div key={idx} className={`cs-msg-row ${msg.received ? 'received' : 'sent'}`}>
                  <div className={`cs-msg-bubble ${msg.received ? 'received' : 'sent'}`}>
                    {msg.received && <div className="cs-msg-sender">{msg.senderName || 'Patient'}</div>}
                    <div className="cs-msg-text">{msg.content}</div>
                    <div className="cs-msg-time">
                      {msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                    </div>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
            <div className="cs-input-bar">
              <input
                className="cs-input"
                placeholder="Type your message…"
                value={inputMsg}
                onChange={e => setInputMsg(e.target.value)}
                onKeyDown={handleKeyDown}
              />
              <button className="cs-send-btn" onClick={sendMessage}>Send</button>
            </div>
          </div>
        ) : (
          <div className="cs-video">
            <video ref={remoteVideoRef} autoPlay playsInline className="cs-remote-video" />
            {videoConnecting && (
              <div className="cs-video-overlay">
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📹</div>
                <p>Waiting for patient to connect…</p>
              </div>
            )}
            <video ref={localVideoRef} autoPlay playsInline muted className="cs-local-video" />
            <div className="cs-video-controls">
              <button className={`cs-ctrl-btn ${!cameraOn ? 'off' : ''}`} onClick={toggleCamera}>
                {cameraOn ? '🎥' : '🚫'}
              </button>
              <button className={`cs-ctrl-btn ${!micOn ? 'off' : ''}`} onClick={toggleMic}>
                {micOn ? '🎤' : '🔇'}
              </button>
              <button className="cs-ctrl-btn end" onClick={handleEndSession}>🔴</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
