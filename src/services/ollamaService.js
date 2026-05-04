// ============================================================
//  ollamaService.js
//  Handles all communication with the local Ollama instance.
//  Model and URL are pulled from config / .env — no hardcoding.
// ============================================================

import { config } from './config'

const SYSTEM_PROMPT = `You are a drone navigation AI. Convert user natural-language instructions into structured JSON commands for a GPS-denied autonomous drone.

Respond ONLY with a single valid JSON object. No prose, no markdown fences, no explanation.

Schema (all fields required):
{
  "action": "move" | "rotate" | "hover" | "takeoff" | "land" | "stop",
  "linear":  { "x": float, "y": float, "z": float },
  "angular": { "z": float },
  "description": "concise human-readable summary of what the drone will do",
  "confidence": 0.0–1.0
}

Rules:
- linear  values must be in range [-${config.maxLinearVel},  ${config.maxLinearVel}]  m/s
- angular values must be in range [-${config.maxAngularVel}, ${config.maxAngularVel}] rad/s
- Clamp any values that exceed these bounds — never exceed them
- If the command is ambiguous, unsafe, or you cannot parse it: set action="hover", confidence < 0.5
- Never include any text outside the JSON object`

/**
 * Send a user command to Ollama and stream the response back.
 *
 * @param {string}   userText  - Natural language command from the user
 * @param {Function} onChunk   - Called with the accumulated text as each chunk arrives
 * @returns {{ text: string, parsed: object|null, latency: number }}
 */
export async function sendCommand(userText, onChunk) {
  const start = Date.now()

  const res = await fetch(`${config.ollamaUrl}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: config.ollamaModel,
      stream: true,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user',   content: userText },
      ],
    }),
  })

  if (!res.ok) {
    throw new Error(`Ollama responded with HTTP ${res.status}. Is it running on ${config.ollamaUrl}?`)
  }

  // Stream the response
  const reader  = res.body.getReader()
  const decoder = new TextDecoder()
  let fullText  = ''

  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    const raw = decoder.decode(value)
    for (const line of raw.split('\n')) {
      if (!line.trim()) continue
      try {
        const obj = JSON.parse(line)
        if (obj.message?.content) {
          fullText += obj.message.content
          onChunk?.(fullText)
        }
      } catch {
        // partial JSON line — skip
      }
    }
  }

  const latency = Date.now() - start
  const parsed  = parseAndValidate(fullText)
  return { text: fullText, parsed, latency }
}

/**
 * Parse the raw LLM text into a validated command object.
 * Returns null if parsing or validation fails.
 */
function parseAndValidate(raw) {
  try {
    // Strip any accidental markdown fences
    const clean = raw.replace(/```json|```/gi, '').trim()
    const obj   = JSON.parse(clean)

    // Validate required fields
    const validActions = ['move', 'rotate', 'hover', 'takeoff', 'land', 'stop']
    if (!validActions.includes(obj.action)) {
      console.warn('[ollama] Unknown action:', obj.action)
      obj.action = 'hover'
    }

    // Clamp velocity values
    const clamp = (v, min, max) => Math.min(max, Math.max(min, Number(v) || 0))
    obj.linear  = {
      x: clamp(obj.linear?.x, -config.maxLinearVel,  config.maxLinearVel),
      y: clamp(obj.linear?.y, -config.maxLinearVel,  config.maxLinearVel),
      z: clamp(obj.linear?.z, -config.maxLinearVel,  config.maxLinearVel),
    }
    obj.angular = {
      z: clamp(obj.angular?.z, -config.maxAngularVel, config.maxAngularVel),
    }
    obj.confidence = clamp(obj.confidence, 0, 1)
    obj.description = obj.description || obj.action

    return obj
  } catch (err) {
    console.error('[ollama] Failed to parse response:', err, '\nRaw:', raw)
    return null
  }
}
