import React from 'react'
import { LineChart, Line, ResponsiveContainer, Tooltip } from 'recharts'
import { Navigation, Activity, Zap, Radio } from 'lucide-react'
import { config } from '../services/config'

const card = {
  background: 'var(--surface)', border: '1px solid var(--border)',
  borderRadius: 'var(--radius-lg)', padding: 12,
  boxShadow: 'var(--shadow)',
}

const miniCard = {
  background: 'var(--surface2)', borderRadius: 'var(--radius)', padding: '8px 10px',
}

function TeleCard({ title, icon: Icon, children }) {
  return (
    <div style={card}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
        {Icon && <Icon size={11} color="var(--text3)" />}
        <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text2)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{title}</span>
      </div>
      {children}
    </div>
  )
}

function MiniVal({ label, value, color }) {
  return (
    <div style={miniCard}>
      <div style={{ fontSize: 10, color: 'var(--text3)', marginBottom: 3 }}>{label}</div>
      <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 14, fontWeight: 500, color: color || 'var(--text)' }}>{value}</div>
    </div>
  )
}

function SparkLine({ data, color = '#1a6cff' }) {
  return (
    <ResponsiveContainer width="100%" height={70}>
      <LineChart data={data}>
        <Line type="monotone" dataKey="v" stroke={color} strokeWidth={1.5} dot={false} isAnimationActive={false} />
        <Tooltip
          contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 11 }}
          formatter={v => [v.toFixed(3), 'm/s']}
          labelFormatter={() => ''}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}

export default function TelemetryPanel({ telemetry, rosStatus, velHistory, altHistory }) {
  const { x, y, z, vx, vy, vz, yaw, battery } = telemetry
  const speed     = Math.sqrt(vx ** 2 + vy ** 2 + vz ** 2)
  const batColor  = battery > 60 ? 'var(--green)' : battery > 30 ? 'var(--amber)' : 'var(--red)'
  const batBg     = battery > 60 ? 'var(--green)'  : battery > 30 ? 'var(--amber)' : 'var(--red)'
  const yawDeg    = ((yaw % 360) + 360) % 360
  const connected = rosStatus === 'connected'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Header */}
      <div style={{ padding: '14px 16px 12px', borderBottom: '1px solid var(--border)', background: 'var(--surface)', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 600 }}>Telemetry</div>
          <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 1 }}>Real-time drone state</div>
        </div>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 5, fontSize: 10, fontWeight: 500,
          padding: '3px 8px', borderRadius: 99, border: '1px solid',
          background: connected ? 'var(--green-soft)' : 'var(--red-soft)',
          borderColor: connected ? '#bbf7d0' : '#fecaca',
          color: connected ? 'var(--green)' : 'var(--red)',
        }}>
          <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'currentColor', animation: connected ? 'pulse 1.5s infinite' : 'none' }} />
          {connected ? '/odom' : 'simulated'}
        </div>
      </div>

      {/* Scroll area */}
      <div style={{ flex: 1, overflowY: 'auto', padding: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>

        {/* Position */}
        <TeleCard title="Position" icon={Navigation}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 7 }}>
            <MiniVal label="X" value={`${x.toFixed(2)} m`} />
            <MiniVal label="Y" value={`${y.toFixed(2)} m`} />
            <MiniVal label="Z (alt)" value={`${z.toFixed(2)} m`} color="var(--accent)" />
            <MiniVal label="YAW" value={`${yawDeg.toFixed(1)}°`} />
          </div>
        </TeleCard>

        {/* Velocity */}
        <TeleCard title="Velocity" icon={Activity}>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 6 }}>
            <span style={{ fontSize: 10, color: 'var(--text3)' }}>Total speed</span>
            <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 20, fontWeight: 500 }}>
              {speed.toFixed(2)}<span style={{ fontSize: 11, color: 'var(--text3)', fontFamily: "'DM Sans', sans-serif" }}> m/s</span>
            </span>
          </div>
          <SparkLine data={velHistory} color="#1a6cff" />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6, marginTop: 6 }}>
            <MiniVal label="VX" value={vx.toFixed(3)} />
            <MiniVal label="VY" value={vy.toFixed(3)} />
            <MiniVal label="VZ" value={vz.toFixed(3)} />
          </div>
        </TeleCard>

        {/* Altitude chart */}
        <TeleCard title="Altitude">
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 4 }}>
            <span style={{ fontSize: 10, color: 'var(--text3)' }}>AGL</span>
            <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 18, fontWeight: 500, color: 'var(--accent)' }}>
              {z.toFixed(2)}<span style={{ fontSize: 11, color: 'var(--text3)', fontFamily: "'DM Sans', sans-serif" }}> m</span>
            </span>
          </div>
          <SparkLine data={altHistory} color="#059669" />
        </TeleCard>

        {/* Orientation compass */}
        <TeleCard title="Orientation">
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <svg viewBox="0 0 60 60" width="60" height="60">
              <circle cx="30" cy="30" r="26" fill="none" stroke="var(--border)" strokeWidth="1" />
              <circle cx="30" cy="30" r="20" fill="none" stroke="var(--border)" strokeWidth="0.5" strokeDasharray="2 4" />
              {['N','E','S','W'].map((d, i) => {
                const angle = i * 90 * Math.PI / 180
                const r2 = 24
                return <text key={d} x={30 + r2 * Math.sin(angle)} y={30 - r2 * Math.cos(angle) + 3} textAnchor="middle" fontSize="6" fill="var(--text3)">{d}</text>
              })}
              <line
                x1="30" y1="30"
                x2={30 + 17 * Math.sin(yawDeg * Math.PI / 180)}
                y2={30 - 17 * Math.cos(yawDeg * Math.PI / 180)}
                stroke="var(--accent)" strokeWidth="2" strokeLinecap="round"
              />
              <circle cx="30" cy="30" r="3" fill="var(--accent)" />
            </svg>
            <div>
              <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 22, fontWeight: 500 }}>{yawDeg.toFixed(1)}°</div>
              <div style={{ fontSize: 10, color: 'var(--text3)' }}>Yaw heading</div>
            </div>
          </div>
        </TeleCard>

        {/* Battery */}
        <TeleCard title="Battery" icon={Zap}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
            <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 22, fontWeight: 500, color: batColor }}>
              {battery.toFixed(1)}%
            </span>
            <span style={{ fontSize: 11, color: 'var(--text3)' }}>
              {battery > 60 ? 'Nominal' : battery > 30 ? 'Low — monitor' : '⚠️ Critical'}
            </span>
          </div>
          <div style={{ height: 6, background: 'var(--surface2)', borderRadius: 99, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${battery}%`, background: batBg, borderRadius: 99, transition: 'width 0.6s ease' }} />
          </div>
        </TeleCard>

        {/* ROS Topics */}
        <TeleCard title="ROS Topics" icon={Radio}>
          {[
            { topic: config.topicOdom,   type: 'nav_msgs/Odometry',      dir: 'SUB' },
            { topic: config.topicCmdVel, type: 'geometry_msgs/Twist',     dir: 'PUB' },
            { topic: '/camera/image_raw', type: 'sensor_msgs/Image',      dir: 'SUB' },
          ].map(({ topic, type, dir }) => (
            <div key={topic} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '5px 0', borderBottom: '1px solid var(--border)' }}>
              <div>
                <div style={{ fontFamily: "'DM Mono', monospace", fontSize: 11, color: 'var(--accent)' }}>{topic}</div>
                <div style={{ fontSize: 10, color: 'var(--text3)' }}>{type}</div>
              </div>
              <span style={{
                fontSize: 9, fontWeight: 600, padding: '2px 6px', borderRadius: 99,
                background: dir === 'SUB' ? 'var(--accent-soft)' : 'var(--green-soft)',
                color:      dir === 'SUB' ? 'var(--accent)'      : 'var(--green)',
                border:     `1px solid ${dir === 'SUB' ? 'var(--accent-border)' : '#bbf7d0'}`,
              }}>{dir}</span>
            </div>
          ))}
        </TeleCard>
      </div>
    </div>
  )
}
