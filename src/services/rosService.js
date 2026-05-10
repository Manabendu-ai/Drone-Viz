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
      console.warn('[ros] Disconnected — retrying in', this._retryDelay, 'ms')
      onStatus?.('disconnected')
      clearTimeout(this._retryTimer)
      this._retryTimer = setTimeout(() => this.connect(onStatus, onTelemetry), this._retryDelay)
    })
  }

  _setupTopics() {
    // ── Publisher: /user_command ──────────────────────────
    this.cmdVelTopic = new ROSLIB.Topic({
      ros:         this.ros,
      name:        '/user_command',
      messageType: 'std_msgs/String',
    })

    // ── Subscriber: /fmu/out/vehicle_local_position_v1 ───
    // Real PX4 local position at 100Hz
    this.odomTopic = new ROSLIB.Topic({
      ros:           this.ros,
      name:          '/fmu/out/vehicle_local_position_v1',
      messageType:   'px4_msgs/msg/VehicleLocalPosition',
      throttle_rate: 200, // limit to 5Hz for the UI
    })

    this.odomTopic.subscribe((msg) => {
      if (!this._onTelemetry) return

      // PX4 local frame: x=North, y=East, z=Down (NED)
      // Convert z to altitude: negate z since NED z is down
      this._onTelemetry({
        x:   msg.x   ?? 0,
        y:   msg.y   ?? 0,
        z:   -(msg.z ?? 0),          // NED → altitude (positive up)
        vx:  msg.vx  ?? 0,
        vy:  msg.vy  ?? 0,
        vz:  -(msg.vz ?? 0),         // NED → positive up
        yaw: (msg.heading ?? 0) * (180 / Math.PI), // rad → degrees
      })
    })
  }

  publishCommand(commandText) {
    if (!this.cmdVelTopic) return false
    const msg = new ROSLIB.Message({ data: commandText })
    try {
      this.cmdVelTopic.publish(msg)
      console.info('[ros] Published:', commandText)
      return true
    } catch (err) {
      console.error('[ros] Publish failed:', err)
      return false
    }
  }

  emergencyStop() {
    return this.publishCommand('stop')
  }

  publishTwist(linear, angular) {
    if (!linear.x && !linear.y && !linear.z && !angular.z) {
      return this.publishCommand('stop')
    }
    return this.publishCommand('move')
  }

  disconnect() {
    clearTimeout(this._retryTimer)
    this.odomTopic?.unsubscribe()
    try { this.ros?.close() } catch {}
  }
}

export const rosService = new RosService()