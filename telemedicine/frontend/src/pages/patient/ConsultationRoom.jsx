import React, { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext.jsx'
import { useSocket } from '../../contexts/SocketContext.jsx'
import { endSession } from '../../services/api.js'

const STUN_CONFIG = { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] }

function formatTime(seconds) {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}m ${s.toString().padStart(2, '0')}s`
}

export default function ConsultationRoom() {
  const { user } = useAuth()
  const { socket } = useSocket()
  const navigate = useNavigate()
  const location = useLocation()

  // Mode
  const [mode, setMode] = useState(() => {
    return location.state?.mode || sessionStorage.getItem('consultationMode') || 'chat'
  })

  // Consultation data
  const consultationData = (() => {
    try {
      return location.state?.consultation || JSON.parse(sessionStorage.getItem('consultationData') || '{}')
    } catch { return {} }
  })()

  // Chat
  const [messages, setMessages] = useState([])
  const [inputMsg, setInputMsg] = useState('')
  const messagesEndRef = useRef(null)

  // Video
  const localVideoRef = useRef(null)
  const remoteVideoRef = useRef(null)
  const pcRef = useRef(null)
  const localStreamRef = useRef(null)
  const [cameraOn, setCameraOn] = useState(true)
  const [micOn, setMicOn] = useState(true)
  const [videoReady, setVideoReady] = useState(false)

  // Timer
  const [elapsed, setElapsed] = useState(0)
  const timerRef = useRef(null)
  const predictedDuration = consultationData.predictedDuration || 15

  useEffect(() => {
    timerRef.current = setInterval(() => setElapsed(s => s + 1), 1000)
    return () => clearInterval(timerRef.current)
  }, [])

  // Scroll chat to bottom
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

  // WebRTC setup (patient = offerer)
  const setupWebRTC = useCallback(async () => {
    if (!socket) return
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
            to: consultationData.doctorId,
          })
        }
      }

      // Patient creates offer
      const offer = await pc.createOffer()
      await pc.setLocalDescription(offer)
      socket.emit('videoSignal', {
        type: 'offer',
        payload: offer,
        to: consultationData.doctorId,
      })

      setVideoReady(true)
    } catch (err) {
      console.error('WebRTC setup error:', err)
    }
  }, [socket, consultationData.doctorId])

  // Socket: video signaling
  useEffect(() => {
    if (!socket || mode !== 'video') return

    const handleSignal = async ({ type, payload }) => {
      const pc = pcRef.current
      if (!pc) return
      try {
        if (type === 'answer') {
          await pc.setRemoteDescription(new RTCSessionDescription(payload))
        } else if (type === 'ice-candidate') {
          await pc.addIceCandidate(new RTCIceCandidate(payload))
        }
      } catch (err) {
        console.error('Signal handling error:', err)
      }
    }

    socket.on('videoSignal', handleSignal)
    return () => socket.off('videoSignal', handleSignal)
  }, [socket, mode])

  // Start video when mode changes to video
  useEffect(() => {
    if (mode === 'video') {
      setupWebRTC()
    } else {
      // Stop tracks if switching away from video
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(t => t.stop())
        localStreamRef.current = null
      }
      if (pcRef.current) {
        pcRef.current.close()
        pcRef.current = null
      }
      setVideoReady(false)
    }
    return () => {
      // Cleanup on mode switch but do full cleanup on unmount
    }
  }, [mode, setupWebRTC])

  // Full cleanup on unmount
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
      senderName: user?.name || 'You',
      timestamp: new Date().toISOString(),
    }
    socket.emit('chatMessage', { ...msg, to: consultationData.doctorId })
    setMessages(m => [...m, { ...msg, received: false }])
    setInputMsg('')
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage() }
  }

  const toggleCamera = () => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0]
      if (videoTrack) { videoTrack.enabled = !videoTrack.enabled; setCameraOn(v => !v) }
    }
  }

  const toggleMic = () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0]
      if (audioTrack) { audioTrack.enabled = !audioTrack.enabled; setMicOn(v => !v) }
    }
  }

  const handleEndConsultation = async () => {
    clearInterval(timerRef.current)
    if (localStreamRef.current) localStreamRef.current.getTracks().forEach(t => t.stop())
    if (pcRef.current) pcRef.current.close()
    try {
      await endSession(consultationData.patientId || user?._id || user?.id, Math.floor(elapsed / 60))
    } catch { /* ignore */ }
    sessionStorage.removeItem('consultationMode')
    sessionStorage.removeItem('consultationData')
    navigate('/patient')
  }

  const sessionStyle = {
    background: '#1E293B',
    color: '#94a3b8',
    padding: '0.5rem 1.5rem',
    fontSize: '0.8rem',
    display: 'flex',
    flexWrap: 'wrap',
    gap: '1rem',
    alignItems: 'center',
  }

  const timerStyle = {
    marginLeft: 'auto',
    display: 'flex',
    gap: '1rem',
    alignItems: 'center',
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 60px)', background: '#F8FAFC' }}>
      {/* Session info bar */}
      <div style={sessionStyle}>
        <span>👤 Patient: <strong style={{ color: '#e2e8f0' }}>{user?.name || 'You'}</strong></span>
        {consultationData.doctorName && (
          <span>👨‍⚕️ Doctor: <strong style={{ color: '#e2e8f0' }}>{consultationData.doctorName}</strong></span>
        )}
        <div style={timerStyle}>
          <span>⏱ Predicted: <strong style={{ color: '#e2e8f0' }}>{predictedDuration}m</strong></span>
          <span>| Actual: <strong style={{ color: elapsed > predictedDuration * 60 ? '#fbbf24' : '#34d399' }}>
            {formatTime(elapsed)} (live)
          </strong></span>
        </div>
      </div>

      {/* Mode switcher */}
      <div style={{ display: 'flex', gap: '0.5rem', padding: '0.75rem 1.5rem', background: '#fff', borderBottom: '1px solid #E2E8F0' }}>
        {['chat', 'video'].map(m => (
          <button key={m} onClick={() => setMode(m)} style={{
            padding: '0.4rem 1rem', borderRadius: 7, border: '1.5px solid',
            borderColor: mode === m ? '#2563EB' : '#E2E8F0',
            background: mode === m ? '#EFF6FF' : '#F8FAFC',
            color: mode === m ? '#2563EB' : '#64748B',
            fontWeight: mode === m ? 600 : 400,
            cursor: 'pointer', fontSize: '0.875rem', transition: 'all 0.2s',
          }}>
            {m === 'chat' ? '💬 Chat' : '📹 Video Call'}
          </button>
        ))}
        <button onClick={handleEndConsultation} style={{
          marginLeft: 'auto', padding: '0.4rem 1rem', borderRadius: 7,
          background: '#DC2626', color: '#fff', border: 'none', cursor: 'pointer',
          fontWeight: 600, fontSize: '0.875rem',
        }}>
          End Consultation
        </button>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        {mode === 'chat' ? (
          <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            {/* Messages */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '1rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
              {messages.length === 0 && (
                <div style={{ textAlign: 'center', color: '#94a3b8', marginTop: '2rem' }}>
                  <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>💬</div>
                  <p>Start the consultation by sending a message.</p>
                </div>
              )}
              {messages.map((msg, idx) => (
                <div key={idx} style={{ display: 'flex', justifyContent: msg.received ? 'flex-start' : 'flex-end' }}>
                  <div style={{
                    maxWidth: '70%', padding: '0.625rem 0.875rem', borderRadius: 12,
                    background: msg.received ? '#F1F5F9' : '#2563EB',
                    color: msg.received ? '#1E293B' : '#fff',
                    borderBottomRightRadius: msg.received ? 12 : 4,
                    borderBottomLeftRadius: msg.received ? 4 : 12,
                    boxShadow: '0 1px 2px rgba(0,0,0,0.08)',
                  }}>
                    {msg.received && (
                      <div style={{ fontSize: '0.7rem', fontWeight: 600, marginBottom: '0.2rem', opacity: 0.7 }}>
                        {msg.senderName || 'Doctor'}
                      </div>
                    )}
                    <div style={{ fontSize: '0.9rem', lineHeight: 1.5 }}>{msg.content}</div>
                    <div style={{ fontSize: '0.7rem', opacity: 0.6, marginTop: '0.25rem', textAlign: 'right' }}>
                      {msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                    </div>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
            {/* Input */}
            <div style={{ padding: '0.875rem 1.5rem', background: '#fff', borderTop: '1px solid #E2E8F0', display: 'flex', gap: '0.625rem' }}>
              <input
                style={{ flex: 1, padding: '0.625rem 0.875rem', border: '1.5px solid #E2E8F0', borderRadius: 8, fontSize: '0.9rem', outline: 'none', fontFamily: 'inherit' }}
                placeholder="Type your message…"
                value={inputMsg}
                onChange={e => setInputMsg(e.target.value)}
                onKeyDown={handleKeyDown}
                onFocus={e => e.target.style.borderColor = '#2563EB'}
                onBlur={e => e.target.style.borderColor = '#E2E8F0'}
              />
              <button onClick={sendMessage} style={{
                padding: '0.625rem 1.25rem', background: '#2563EB', color: '#fff', border: 'none',
                borderRadius: 8, fontWeight: 600, cursor: 'pointer', fontSize: '0.9rem',
              }}>
                Send
              </button>
            </div>
          </div>
        ) : (
          <div style={{ flex: 1, background: '#0f172a', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {/* Remote video */}
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              style={{ width: '100%', height: '100%', objectFit: 'cover', background: '#1e293b' }}
            />
            {!videoReady && (
              <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>
                <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📹</div>
                <p>Connecting to doctor…</p>
              </div>
            )}
            {/* Local video (PiP) */}
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              style={{
                position: 'absolute', bottom: 80, right: 16,
                width: 160, height: 120, borderRadius: 10, border: '2px solid #334155',
                objectFit: 'cover', background: '#1e293b',
              }}
            />
            {/* Controls */}
            <div style={{
              position: 'absolute', bottom: 0, left: 0, right: 0,
              background: 'rgba(15,23,42,0.85)', backdropFilter: 'blur(8px)',
              padding: '0.875rem', display: 'flex', justifyContent: 'center', gap: '1rem',
            }}>
              <button onClick={toggleCamera} title="Toggle Camera" style={{
                width: 48, height: 48, borderRadius: '50%', border: 'none', cursor: 'pointer',
                background: cameraOn ? '#334155' : '#DC2626', color: '#fff', fontSize: '1.2rem',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {cameraOn ? '🎥' : '🚫'}
              </button>
              <button onClick={toggleMic} title="Toggle Mic" style={{
                width: 48, height: 48, borderRadius: '50%', border: 'none', cursor: 'pointer',
                background: micOn ? '#334155' : '#DC2626', color: '#fff', fontSize: '1.2rem',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {micOn ? '🎤' : '🔇'}
              </button>
              <button onClick={handleEndConsultation} title="End Call" style={{
                width: 48, height: 48, borderRadius: '50%', border: 'none', cursor: 'pointer',
                background: '#DC2626', color: '#fff', fontSize: '1.2rem',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                🔴
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
