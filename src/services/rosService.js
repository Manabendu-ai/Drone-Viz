// ============================================================
//  rosService.js
//  Manages the rosbridge WebSocket connection, topic pub/sub,
//  and automatic reconnection.
// ============================================================

import { config } from './config'

// We load ROSLIB via CDN in index.html for environments that
// can't resolve the npm package. If using npm, import normally:
// import ROSLIB from 'roslib'

function getRosLib() {
  if (typeof window !== 'undefined' && window.ROSLIB) return window.ROSLIB
  // npm import fallback
  try { return require('roslib') } catch { return null }
}

class RosService {
  constructor() {
    this.ros          = null
    this.cmdVelTopic  = null
    this.odomTopic    = null
    this._onStatus    = null   // (status: 'connected'|'disconnected'|'error') => void
    this._onTelemetry = null   // (data: TelemetryObject) => void
    this._retryTimer  = null
    this._retryDelay  = 3000
  }

  /** Connect to rosbridge. Retries automatically on disconnect. */
  connect(onStatus, onTelemetry) {
    const ROSLIB = getRosLib()
    if (!ROSLIB) {
      console.error('[ros] ROSLIB not available')
      return
    }

    this._onStatus    = onStatus
    this._onTelemetry = onTelemetry

    if (this.ros) {
      try { this.ros.close() } catch {}
    }

    this.ros = new ROSLIB.Ros({ url: config.rosWsUrl })

    this.ros.on('connection', () => {
      console.info('[ros] Connected to', config.rosWsUrl)
      onStatus?.('connected')
      this._setupTopics(ROSLIB)
    })

    this.ros.on('error', (err) => {
      console.error('[ros] Error:', err)
      onStatus?.('error')
    })

    this.ros.on('close', () => {
      console.warn('[ros] Connection closed — retrying in', this._retryDelay, 'ms')
      onStatus?.('disconnected')
      clearTimeout(this._retryTimer)
      this._retryTimer = setTimeout(() => this.connect(onStatus, onTelemetry), this._retryDelay)
    })
  }

  _setupTopics(ROSLIB) {
    // ── Publisher: /cmd_vel ──────────────────────────────
    this.cmdVelTopic = new ROSLIB.Topic({
      ros:           this.ros,
      name:          config.topicCmdVel,
      messageType:   'geometry_msgs/Twist',
      throttle_rate: 100,
    })

    // ── Subscriber: /odom ────────────────────────────────
    this.odomTopic = new ROSLIB.Topic({
      ros:           this.ros,
      name:          config.topicOdom,
      messageType:   'nav_msgs/Odometry',
      throttle_rate: 200,
    })

    this.odomTopic.subscribe((msg) => {
      if (!this._onTelemetry) return

      const pos  = msg.pose.pose.position
      const ori  = msg.pose.pose.orientation
      const vel  = msg.twist.twist

      // Quaternion → yaw
      const yaw  = Math.atan2(
        2 * (ori.w * ori.z + ori.x * ori.y),
        1 - 2 * (ori.y * ori.y + ori.z * ori.z)
      ) * (180 / Math.PI)

      this._onTelemetry({
        x:   pos.x,
        y:   pos.y,
        z:   pos.z,
        vx:  vel.linear.x,
        vy:  vel.linear.y,
        vz:  vel.linear.z,
        yaw,
      })
    })
  }

  /**
   * Publish a Twist message to /cmd_vel.
   * @param {{ x, y, z }} linear
   * @param {{ z }}        angular
   * @returns {boolean} true if published successfully
   */
  publishTwist(linear, angular) {
    if (!this.cmdVelTopic) return false
    const clamp = (v, lim) => Math.min(lim, Math.max(-lim, v))

    const msg = new (getRosLib().Message)({
      linear: {
        x: clamp(linear.x, config.maxLinearVel),
        y: clamp(linear.y, config.maxLinearVel),
        z: clamp(linear.z, config.maxLinearVel),
      },
      angular: {
        x: 0,
        y: 0,
        z: clamp(angular.z, config.maxAngularVel),
      },
    })

    try {
      this.cmdVelTopic.publish(msg)
      return true
    } catch (err) {
      console.error('[ros] Publish failed:', err)
      return false
    }
  }

  /** Publish zero velocity — emergency stop. */
  emergencyStop() {
    return this.publishTwist({ x: 0, y: 0, z: 0 }, { z: 0 })
  }

  disconnect() {
    clearTimeout(this._retryTimer)
    this.odomTopic?.unsubscribe()
    try { this.ros?.close() } catch {}
  }
}

// Export a singleton
export const rosService = new RosService()
