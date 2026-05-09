import React, { useState, useCallback } from 'react'
import TopBar          from './components/TopBar'
import ChatPanel       from './components/ChatPanel'
import VideoPanel      from './components/VideoPanel'
import TelemetryPanel  from './components/TelemetryPanel'
import { useROS }              from './hooks/useROS'
import { useChat }             from './hooks/useChat'
import { useTelemetryHistory } from './hooks/useTelemetryHistory'
import { isCommandSafe }       from './utils/validation'

export default function App() {
  const { rosStatus, telemetry, publishCmd, emergencyStop } = useROS()
  const [alerts, setAlerts] = useState([])
  const { velHistory, altHistory } = useTelemetryHistory(telemetry)

  const addAlert = useCallback((msg, type = 'error') => {
    const id = Date.now()
    setAlerts(a => [...a.slice(-2), { id, msg, type }])
    setTimeout(() => setAlerts(a => a.filter(x => x.id !== id)), 5000)
  }, [])

  // parsed = validated JSON from LLM, originalText = what the user typed
  const handleParsedCommand = useCallback((parsed, originalText) => {
    if (!isCommandSafe(parsed)) {
      addAlert('Command exceeds safety limits — blocked.', 'error')
      return
    }
    if (parsed.confidence < 0.5) {
      addAlert('Low confidence — drone hovering instead of executing.', 'warning')
      return
    }
    // Send the original natural language text to ROS as std_msgs/String
    const ok = publishCmd(originalText)
    if (!ok && rosStatus === 'connected') {
      addAlert('Failed to publish to /user_command — check ROS bridge.', 'warning')
    }
  }, [publishCmd, rosStatus, addAlert])

  const { messages, isLoading, history, send } = useChat(handleParsedCommand)

  const handleSend = useCallback(async (text) => {
    const result = await send(text)
    if (result?.error && !result?.parsed) {
      addAlert(result.error, 'error')
    }
  }, [send, addAlert])

  const handleEmergencyStop = useCallback(() => {
    emergencyStop()
    addAlert('Emergency stop triggered — all velocities zeroed.', 'warning')
  }, [emergencyStop, addAlert])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
      <TopBar rosStatus={rosStatus} onEmergencyStop={handleEmergencyStop} />

      <div style={{ display: 'grid', gridTemplateColumns: '380px 1fr 300px', flex: 1, overflow: 'hidden' }}>
        <div style={{ borderRight: '1px solid var(--border)', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <ChatPanel
            messages={messages}
            isLoading={isLoading}
            history={history}
            onSend={handleSend}
            alerts={alerts}
          />
        </div>

        <div style={{ borderRight: '1px solid var(--border)', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <VideoPanel telemetry={telemetry} />
        </div>

        <div style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <TelemetryPanel
            telemetry={telemetry}
            rosStatus={rosStatus}
            velHistory={velHistory}
            altHistory={altHistory}
          />
        </div>
      </div>
    </div>
  )
}