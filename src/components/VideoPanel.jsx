import React, { useState, useEffect, useRef, useCallback } from 'react'
import { RefreshCw, Video } from 'lucide-react'
import { config } from '../services/config'
import DroneViz from './DroneViz'

const BASE    = `http://${import.meta.env.VITE_ROS_SERVER_IP}:${import.meta.env.VITE_VIDEO_PORT || 8080}`
const TOPIC   = import.meta.env.VITE_CAMERA_TOPIC || '/gimbal/camera/image'
const SNAP_URL = `${BASE}/snapshot?topic=${TOPIC}&type=jpeg`
const STREAM_URL = `${BASE}/stream?topic=${TOPIC}&type=mjpeg`

function freshSnap() {
  return `${SNAP_URL}&_t=${Date.now()}`
}

export default function VideoPanel({ telemetry }) {
  const [mode,  setMode]  = useState('stream')
  const [src,   setSrc]   = useState(freshSnap)
  const [error, setError] = useState(false)
  const timerRef = useRef(null)

  const startPolling = useCallback(() => {
    clearInterval(timerRef.current)
    setError(false)
    setSrc(freshSnap())
    timerRef.current = setInterval(() => setSrc(freshSnap()), 100) // 10fps
  }, [])

  const stopPolling = useCallback(() => clearInterval(timerRef.current), [])

  useEffect(() => {
    if (mode === 'stream') startPolling()
    else stopPolling()
    return stopPolling
  }, [mode, startPolling, stopPolling])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header */}
      <div style={{ padding: '14px 16px 12px', borderBottom: '1px solid var(--border)', background: 'var(--surface)', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 600 }}>{mode === 'stream' ? 'Live Feed' : 'Simulation Feed'}</div>
          <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 1, fontFamily: "'DM Mono', monospace" }}>{SNAP_URL}</div>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <button onClick={() => setMode('stream')} title="Live camera"
            style={{ width: 32, height: 32, border: `1px solid ${mode === 'stream' ? 'var(--accent)' : 'var(--border)'}`, borderRadius: 'var(--radius)', background: mode === 'stream' ? 'var(--accent-soft)' : 'var(--surface)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Video size={13} color={mode === 'stream' ? 'var(--accent)' : 'var(--text2)'} />
          </button>
          <button onClick={() => setMode('sim')} title="3D sim view"
            style={{ width: 32, height: 32, border: `1px solid ${mode === 'sim' ? 'var(--accent)' : 'var(--border)'}`, borderRadius: 'var(--radius)', background: mode === 'sim' ? 'var(--accent-soft)' : 'var(--surface)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <RefreshCw size={13} color={mode === 'sim' ? 'var(--accent)' : 'var(--text2)'} />
          </button>
        </div>
      </div>

      {/* Video area */}
      <div style={{ flex: 1, position: 'relative', background: '#0a0a0a', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>

        {mode === 'sim' && (
          <>
            <DroneViz telemetry={telemetry} />
            <Overlay telemetry={telemetry} />
          </>
        )}

        {mode === 'stream' && (
          <>
            {error ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, color: '#777' }}>
                <Video size={40} color="#444" />
                <p style={{ fontSize: 13 }}>Stream unavailable</p>
                <p style={{ fontSize: 11, color: '#555', fontFamily: 'monospace' }}>{SNAP_URL}</p>
                <button onClick={startPolling}
                  style={{ padding: '6px 14px', background: 'rgba(255,255,255,0.1)', color: '#fff', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 8, fontSize: 12, cursor: 'pointer' }}>
                  Retry
                </button>
              </div>
            ) : (
              <img
                src={src}
                alt="Live drone feed"
                onError={() => setError(true)}
                style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }}
              />
            )}
            {!error && <Overlay telemetry={telemetry} live />}
          </>
        )}
      </div>
    </div>
  )
}

function Overlay({ telemetry, live }) {
  const { x, y, z } = telemetry
  return (
    <>
      <div style={{ position: 'absolute', top: 12, left: 12, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', color: '#fff', padding: '4px 10px', borderRadius: 99, fontSize: 11, fontWeight: 500, border: '1px solid rgba(255,255,255,0.1)', pointerEvents: 'none' }}>
        {live && <span style={{ display: 'inline-block', width: 6, height: 6, background: '#ef4444', borderRadius: '50%', marginRight: 6, animation: 'recPulse 1s infinite' }} />}
        {live ? 'Live Feed' : 'Simulation Feed'}
      </div>
      <div style={{ position: 'absolute', bottom: 12, left: 12, display: 'flex', gap: 6, pointerEvents: 'none' }}>
        {[['X', x], ['Y', y], ['Z', z]].map(([label, val]) => (
          <div key={label} style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', color: '#fff', padding: '4px 8px', borderRadius: 6, fontSize: 11, fontFamily: "'DM Mono', monospace", border: '1px solid rgba(255,255,255,0.1)' }}>
            <span style={{ color: '#888', fontSize: 9 }}>{label} </span>{Number(val).toFixed(2)}
          </div>
        ))}
      </div>
      <div style={{ position: 'absolute', top: 12, right: 12, background: 'rgba(0,0,0,0.6)', color: '#666', padding: '4px 8px', borderRadius: 6, fontSize: 10, fontFamily: "'DM Mono', monospace", border: '1px solid rgba(255,255,255,0.08)', pointerEvents: 'none' }}>
        {new Date().toLocaleTimeString()}
      </div>
    </>
  )
}