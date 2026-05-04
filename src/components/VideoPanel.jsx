import React, { useState, useEffect, useRef, useCallback } from 'react'
import { RefreshCw, Video } from 'lucide-react'
import { config } from '../services/config'
import DroneViz from './DroneViz'

export default function VideoPanel({ telemetry }) {
  const [mode,   setMode]   = useState('sim')   // 'sim' | 'stream' | 'error'
  const [loaded, setLoaded] = useState(false)
  const imgRef = useRef(null)

  const tryStream = useCallback(() => {
    setMode('stream')
    setLoaded(false)
  }, [])

  const handleImgLoad  = () => setLoaded(true)
  const handleImgError = () => { setMode('error'); setLoaded(false) }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header */}
      <div style={{ padding: '14px 16px 12px', borderBottom: '1px solid var(--border)', background: 'var(--surface)', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 600 }}>Simulation Feed</div>
          <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 1, fontFamily: "'DM Mono', monospace" }}>{config.videoUrl}</div>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <button
            onClick={tryStream}
            title="Switch to live ROS stream"
            style={{ width: 32, height: 32, border: '1px solid var(--border)', borderRadius: 'var(--radius)', background: 'var(--surface)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <Video size={13} color="var(--text2)" />
          </button>
          <button
            onClick={() => { setMode('sim'); setLoaded(false) }}
            title="Return to simulation view"
            style={{ width: 32, height: 32, border: '1px solid var(--border)', borderRadius: 'var(--radius)', background: 'var(--surface)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <RefreshCw size={13} color="var(--text2)" />
          </button>
        </div>
      </div>

      {/* Video area */}
      <div style={{ flex: 1, position: 'relative', background: '#0a0a0a', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>

        {/* Simulation view */}
        {mode === 'sim' && (
          <>
            <DroneViz telemetry={telemetry} />
            <Overlay telemetry={telemetry} />
          </>
        )}

        {/* Live stream */}
        {mode === 'stream' && (
          <>
            {!loaded && <Spinner />}
            <img
              ref={imgRef}
              src={config.videoUrl}
              alt="Live drone feed"
              onLoad={handleImgLoad}
              onError={handleImgError}
              style={{ width: '100%', height: '100%', objectFit: 'contain', display: loaded ? 'block' : 'none' }}
            />
            {loaded && <Overlay telemetry={telemetry} live />}
          </>
        )}

        {/* Error / offline */}
        {mode === 'error' && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, color: '#777' }}>
            <Video size={40} color="#444" />
            <p style={{ fontSize: 13 }}>Stream unavailable</p>
            <p style={{ fontSize: 11, color: '#555', fontFamily: 'monospace' }}>{config.videoUrl}</p>
            <button onClick={() => setMode('sim')} style={{ padding: '6px 14px', background: 'rgba(255,255,255,0.1)', color: '#fff', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 8, fontSize: 12, cursor: 'pointer' }}>
              Use Simulation View
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

function Spinner() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, color: '#666' }}>
      <div style={{ width: 28, height: 28, border: '2px solid #333', borderTopColor: '#1a6cff', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
      <p style={{ fontSize: 12 }}>Connecting to stream…</p>
    </div>
  )
}

function Overlay({ telemetry, live }) {
  const { x, y, z } = telemetry
  return (
    <>
      {/* Top-left label */}
      <div style={{ position: 'absolute', top: 12, left: 12, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', color: '#fff', padding: '4px 10px', borderRadius: 99, fontSize: 11, fontWeight: 500, border: '1px solid rgba(255,255,255,0.1)' }}>
        {live && <span style={{ display: 'inline-block', width: 6, height: 6, background: '#ef4444', borderRadius: '50%', marginRight: 6, animation: 'recPulse 1s infinite' }} />}
        {live ? 'Live Feed' : 'Simulation Feed'}
      </div>

      {/* Bottom position overlay */}
      <div style={{ position: 'absolute', bottom: 12, left: 12, display: 'flex', gap: 6 }}>
        {[['X', x], ['Y', y], ['Z', z]].map(([label, val]) => (
          <div key={label} style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', color: '#fff', padding: '4px 8px', borderRadius: 6, fontSize: 11, fontFamily: "'DM Mono', monospace", border: '1px solid rgba(255,255,255,0.1)' }}>
            <span style={{ color: '#888', fontSize: 9 }}>{label} </span>{Number(val).toFixed(2)}
          </div>
        ))}
      </div>

      {/* Top-right timestamp */}
      <div style={{ position: 'absolute', top: 12, right: 12, background: 'rgba(0,0,0,0.6)', color: '#666', padding: '4px 8px', borderRadius: 6, fontSize: 10, fontFamily: "'DM Mono', monospace", border: '1px solid rgba(255,255,255,0.08)' }}>
        {new Date().toLocaleTimeString()}
      </div>
    </>
  )
}
