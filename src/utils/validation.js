// ============================================================
//  validation.js  — Command validation helpers
// ============================================================

import { config } from '../services/config'

/** Returns true if the parsed command object is safe to publish. */
export function isCommandSafe(cmd) {
  if (!cmd || !cmd.action) return false
  const { linear, angular } = cmd
  const inRange = (v, lim) => Math.abs(v) <= lim
  return (
    inRange(linear.x,  config.maxLinearVel)  &&
    inRange(linear.y,  config.maxLinearVel)  &&
    inRange(linear.z,  config.maxLinearVel)  &&
    inRange(angular.z, config.maxAngularVel)
  )
}

/** Clamp a number between min and max. */
export const clamp = (v, min, max) => Math.min(max, Math.max(min, v))

/** Format a float for display. */
export const fmt = (v, decimals = 2) => Number(v).toFixed(decimals)
