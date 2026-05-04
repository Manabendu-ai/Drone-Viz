import React, { useEffect, useState } from 'react'

/** Animated drone SVG with hover physics and spinning props */
export default function DroneViz({ telemetry }) {
  const [tick, setTick] = useState(0)

  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 50)
    return () => clearInterval(id)
  }, [])

  const t       = Date.now() / 1000
  const hoverY  = Math.sin(t * 1.2) * 5
  const propRot = (tick * 12) % 360
  const arms    = [[130, 120], [270, 120], [130, 180], [270, 180]]

  return (
    <svg viewBox="0 0 400 300" style={{ width: '80%', maxWidth: 400 }}>
      {/* Ground shadow */}
      <ellipse cx="200" cy={230 + hoverY * 0.15} rx="55" ry="7" fill="rgba(100,150,255,0.07)" />

      {/* Body glow */}
      <circle cx="200" cy={150 + hoverY} r="48" fill="rgba(26,108,255,0.06)" />

      {/* Arms */}
      {arms.map(([ax, ay], i) => (
        <line key={i} x1="200" y1={150 + hoverY} x2={ax} y2={ay + hoverY}
          stroke="#3a3a3a" strokeWidth="2.5" strokeLinecap="round" />
      ))}

      {/* Propellers */}
      {arms.map(([ax, ay], i) => (
        <g key={i} transform={`rotate(${i % 2 === 0 ? propRot : -propRot}, ${ax}, ${ay + hoverY})`}>
          <ellipse cx={ax} cy={ay + hoverY} rx="20" ry="3.5"
            fill="rgba(255,255,255,0.2)" stroke="rgba(255,255,255,0.35)" strokeWidth="0.5" />
          <ellipse cx={ax} cy={ay + hoverY} rx="3.5" ry="20"
            fill="rgba(255,255,255,0.2)" stroke="rgba(255,255,255,0.35)" strokeWidth="0.5" />
        </g>
      ))}

      {/* Motor mounts */}
      {arms.map(([ax, ay], i) => (
        <circle key={i} cx={ax} cy={ay + hoverY} r="5" fill="#222" stroke="#444" strokeWidth="1" />
      ))}

      {/* Main body */}
      <rect x="184" y={140 + hoverY} width="32" height="21" rx="7" fill="#1e1e1e" stroke="#333" strokeWidth="1" />

      {/* Center LED (accent) */}
      <circle cx="200" cy={150 + hoverY} r="7" fill="#1a6cff" opacity="0.85" />
      <circle cx="200" cy={150 + hoverY} r="3" fill="#60a5fa" />

      {/* Status LEDs */}
      <circle cx="196" cy={163 + hoverY} r="2.5" fill="#ef4444" opacity={0.4 + 0.5 * Math.sin(t * 2.5)} />
      <circle cx="204" cy={163 + hoverY} r="2.5" fill="#22c55e" opacity="0.9" />

      {/* Landing gear */}
      {[[-18, 0], [18, 0]].map(([dx], i) => (
        <g key={i}>
          <line x1={200 + dx} y1={158 + hoverY} x2={200 + dx} y2={175 + hoverY}
            stroke="#333" strokeWidth="1.5" />
          <line x1={200 + dx - 8} y1={175 + hoverY} x2={200 + dx + 8} y2={175 + hoverY}
            stroke="#333" strokeWidth="1.5" strokeLinecap="round" />
        </g>
      ))}
    </svg>
  )
}
