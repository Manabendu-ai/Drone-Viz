// ============================================================
//  rosService.js
//  Manages the rosbridge WebSocket connection, topic pub/sub,
//  and automatic reconnection.
// ============================================================

import ROSLIB from 'roslib'
import { config } from './config'

class RosService {
  constructor() {
    this.ros          = null
    this.cmdVelTopic  = null
    this.odomTopic    = null
    this._onStatus    = null
    this._onTelemetry = null
    this._retryTimer  = null
    this._retryDelay  = 3000
  }

  /** Connect to rosbridge. Retries automatically on disconnect. */
  connect(onStatus, onTelemetry) {
    this._onStatus    = onStatus
    this._onTelemetry = onTelemetry

    if (this.ros) {
      try { this.ros.close() } catch {}
    }

    this.ros = new ROSLIB.Ros({ url: config.rosWsUrl })

    this.ros.on('connection', () => {
      console.info('[ros] Connected to', config.rosWsUrl)
      onStatus?.('connected')
      this._setupTopics()
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

  _setupTopics() {
    // ── Publisher: /user_command (std_msgs/String) ───────
    this.cmdVelTopic = new ROSLIB.Topic({
      ros:         this.ros,
      name:        '/user_command',
      messageType: 'std_msgs/String',
    })

    // ── Subscriber: /odom ────────────────────────────────
    this.odomTopic = new ROSLIB.Topic({
      ros:           this.ros,
      name:          '/odom',
      messageType:   'nav_msgs/Odometry',
      throttle_rate: 200,
    })

    this.odomTopic.subscribe((msg) => {
      if (!this._onTelemetry) return

      const pos = msg.pose.pose.position
      const ori = msg.pose.pose.orientation
      const vel = msg.twist.twist

      // Quaternion → yaw
      const yaw = Math.atan2(
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
   * Publish a natural language command string to /user_command.
   * @param {string} commandText - e.g. "fly forward 2 meters"
   * @returns {boolean} true if published successfully
   */
  publishCommand(commandText) {
    if (!this.cmdVelTopic) return false
    const msg = new ROSLIB.Message({ data: commandText })
    try {
      this.cmdVelTopic.publish(msg)
      console.info('[ros] Published command:', commandText)
      return true
    } catch (err) {
      console.error('[ros] Publish failed:', err)
      return false
    }
  }

  /**
   * Keep this for compatibility with existing hook calls.
   * Converts Twist linear/angular back to a stop command.
   */
  publishTwist(linear, angular) {
    // If all zeros → emergency stop
    if (!linear.x && !linear.y && !linear.z && !angular.z) {
      return this.publishCommand('stop')
    }
    return this.publishCommand('move')
  }

  /** Emergency stop */
  emergencyStop() {
    return this.publishCommand('stop')
  }

  disconnect() {
    clearTimeout(this._retryTimer)
    this.odomTopic?.unsubscribe()
    try { this.ros?.close() } catch {}
  }
}

// Export a singleton
export const rosService = new RosService()