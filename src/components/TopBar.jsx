import React from 'react'
import { Cpu, Zap, Wifi, WifiOff, Loader } from 'lucide-react'
import { config } from '../services/config'

const pill = {
  display: 'flex', alignItems: 'center', gap: 6,
  padding: '4px 10px', borderRadius: 99,
  fontSize: 12, fontWeight: 500, border: '1px solid',
}

function StatusPill({ status }) {
  const map = {
    connected:    { bg: 'var(--green-soft)',  border: '#bbf7d0', color: 'var(--green)',  label: 'ROS Connected',    Icon: Wifi    },
    disconnected: { bg: 'var(--red-soft)',    border: '#fecaca', color: 'var(--red)',    label: 'ROS Offline',      Icon: WifiOff },
    error:        { bg: 'var(--red-soft)',    border: '#fecaca', color: 'var(--red)',    label: 'ROS Error',        Icon: WifiOff },
    connecting:   { bg: 'var(--amber-soft)', border: '#fde68a', color: 'var(--amber)', label: 'Connecting…',      Icon: Loader  },
  }
  const s = map[status] || map.disconnected
  return (
    <div style={{ ...pill, background: s.bg, borderColor: s.border, color: s.color }}>
      <s.Icon size={11} className={status === 'connecting' ? 'animate-spin' : ''} />
      {s.label}
    </div>
  )
}

export default function TopBar({ rosStatus, onEmergencyStop }) {
  return (
    <header style={{
      height: 52, background: 'var(--surface)', borderBottom: '1px solid var(--border)',
      display: 'flex', alignItems: 'center', padding: '0 20px', gap: 16, flexShrink: 0, zIndex: 10,
    }}>
      {/* Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
        <div style={{
          width: 30, height: 30, background: 'var(--text)', borderRadius: 8,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
            <circle cx="12" cy="12" r="3"/>
            <path d="M6 3l2 3M18 3l-2 3M6 21l2-3M18 21l-2-3"/>
            <circle cx="4"  cy="6"  r="2"/><circle cx="20" cy="6"  r="2"/>
            <circle cx="4"  cy="18" r="2"/><circle cx="20" cy="18" r="2"/>
          </svg>
        </div>
        <div>
          <div style={{ fontWeight: 600, fontSize: 14, letterSpacing: '-0.01em' }}>LLM Drone Control</div>
          <div style={{ fontSize: 10, color: 'var(--text3)' }}>GPS-Denied Autonomous · {config.ollamaModel}</div>
        </div>
      </div>

      <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 10 }}>
        <StatusPill status={rosStatus} />

        <div style={{ ...pill, background: '#eef3ff', borderColor: 'var(--accent-border)', color: 'var(--accent)' }}>
          <Cpu size={11} />
          Phi-3 · Ollama
        </div>

        <button
          onClick={onEmergencyStop}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '5px 14px', background: 'var(--red)', color: '#fff',
            border: 'none', borderRadius: 'var(--radius)', fontSize: 12,
            fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
            letterSpacing: '0.04em', transition: 'opacity 0.15s',
          }}
          onMouseEnter={e => e.currentTarget.style.opacity = 0.85}
          onMouseLeave={e => e.currentTarget.style.opacity = 1}
        >
          <Zap size={12} />
          E-STOP
        </button>
      </div>
    </header>
  )
}
