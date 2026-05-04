// ============================================================
//  useTelemetryHistory.js
//  Keeps a rolling window of telemetry values for charts.
// ============================================================

import { useState, useEffect, useRef } from 'react'

const WINDOW = 40  // number of samples to keep

export function useTelemetryHistory(telemetry) {
  const [velHistory, setVelHistory] = useState([])
  const [altHistory, setAltHistory] = useState([])
  const tickRef = useRef(0)

  useEffect(() => {
    const speed = Math.sqrt(telemetry.vx ** 2 + telemetry.vy ** 2 + telemetry.vz ** 2)
    const tick  = tickRef.current++

    setVelHistory(h => [...h.slice(-(WINDOW - 1)), { t: tick, v: +speed.toFixed(3) }])
    setAltHistory(h => [...h.slice(-(WINDOW - 1)), { t: tick, v: +telemetry.z.toFixed(3) }])
  }, [telemetry])

  return { velHistory, altHistory }
}
