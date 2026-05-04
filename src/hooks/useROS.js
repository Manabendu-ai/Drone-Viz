// ============================================================
//  useROS.js — React hook wrapping rosService
// ============================================================

import { useState, useEffect, useCallback, useRef } from 'react'
import { rosService } from '../services/rosService'

const INITIAL_TELEMETRY = {
  x: 0, y: 0, z: 1.2,
  vx: 0, vy: 0, vz: 0,
  yaw: 0,
  battery: 87,   // battery not in /odom — mock or wire to a separate topic
}

export function useROS() {
  const [rosStatus, setRosStatus]     = useState('disconnected')
  const [telemetry, setTelemetry]     = useState(INITIAL_TELEMETRY)
  const simTimer                       = useRef(null)

  // Simulation fallback — runs while ROS is offline so the UI has live data
  const startSim = useCallback(() => {
    clearInterval(simTimer.current)
    simTimer.current = setInterval(() => {
      const t = Date.now() / 1000
      setTelemetry(prev => ({
        ...prev,
        x:       prev.x + Math.sin(t * 0.3) * 0.018,
        y:       prev.y + Math.cos(t * 0.25) * 0.013,
        z:       1.2 + Math.sin(t * 0.5) * 0.09,
        vx:      Math.sin(t * 0.3) * 0.28,
        vy:      Math.cos(t * 0.25) * 0.19,
        vz:      Math.sin(t * 0.5) * 0.08,
        yaw:     (prev.yaw + 0.12) % 360,
        battery: Math.max(20, prev.battery - 0.0015),
      }))
    }, 250)
  }, [])

  const stopSim = useCallback(() => clearInterval(simTimer.current), [])

  useEffect(() => {
    startSim()  // always start sim; real /odom data will override when connected

    rosService.connect(
      (status) => {
        setRosStatus(status)
        if (status === 'connected') stopSim()
        else                        startSim()
      },
      (data) => {
        setTelemetry(prev => ({ ...prev, ...data }))
      }
    )

    return () => {
      stopSim()
      rosService.disconnect()
    }
  }, [startSim, stopSim])

  const publishCmd = useCallback((linear, angular) => {
    return rosService.publishTwist(linear, angular)
  }, [])

  const emergencyStop = useCallback(() => {
    return rosService.emergencyStop()
  }, [])

  return { rosStatus, telemetry, publishCmd, emergencyStop }
}
