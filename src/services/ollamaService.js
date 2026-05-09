// ============================================================
//  ollamaService.js
//  Handles all communication with the local Ollama instance.
// ============================================================

import { config } from './config'

const SYSTEM_PROMPT = `Drone command translator. Reply with ONLY this exact JSON, no other text:
{"action":"move","linear":{"x":0.0,"y":0.0,"z":0.0},"angular":{"z":0.0},"description":"summary","confidence":1.0}

Actions: move rotate hover takeoff land stop
x=forward/back y=left/right z=up/down
Limits: linear [-${config.maxLinearVel},${config.maxLinearVel}] angular [-${config.maxAngularVel},${config.maxAngularVel}]`

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
    throw new Error(`Ollama HTTP ${res.status}. Is it running on ${config.ollamaUrl}?`)
  }

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
      } catch { }
    }
  }

  const latency = Date.now() - start
  const parsed  = parseAndValidate(fullText)
  return { text: fullText, parsed, latency }
}

function parseAndValidate(raw) {
  try {
    const clamp = (v, min, max) => Math.min(max, Math.max(min, Number(v) || 0))

    // Strategy 1: standard JSON parse after cleanup
    try {
      let clean = raw.replace(/```json/gi, '').replace(/```/g, '').trim()
      const s = clean.indexOf('{')
      const e = clean.lastIndexOf('}')
      if (s !== -1 && e !== -1 && e > s) {
        const obj = JSON.parse(clean.slice(s, e + 1))
        if (obj.action) return buildResult(obj, clamp)
      }
    } catch { }

    // Strategy 2: field-by-field regex extraction
    // Works even when Phi3 forgets closing braces or adds prose
    console.warn('[ollama] Full JSON parse failed, using field extraction')

    const action     = extractString(raw, 'action') || 'hover'
    const desc       = extractString(raw, 'description') || action
    const lx         = extractNumber(raw, '"x"', 1)
    const ly         = extractNumber(raw, '"y"', 1)
    const lz         = extractNumber(raw, '"z"', 1)
    const az         = extractNumber(raw, '"z"', 2)
    const confidence = extractFloat(raw, 'confidence') ?? 1.0

    const validActions = ['move', 'rotate', 'hover', 'takeoff', 'land', 'stop']

    return {
      action:      validActions.includes(action) ? action : 'hover',
      linear:      { x: clamp(lx, -config.maxLinearVel, config.maxLinearVel), y: clamp(ly, -config.maxLinearVel, config.maxLinearVel), z: clamp(lz, -config.maxLinearVel, config.maxLinearVel) },
      angular:     { z: clamp(az, -config.maxAngularVel, config.maxAngularVel) },
      description: desc,
      confidence:  clamp(confidence, 0, 1),
    }

  } catch (err) {
    console.error('[ollama] Parse completely failed:', err, '\nRaw:', raw)
    return null
  }
}

function buildResult(obj, clamp) {
  const validActions = ['move', 'rotate', 'hover', 'takeoff', 'land', 'stop']
  if (!validActions.includes(obj.action)) obj.action = 'hover'
  obj.linear      = { x: clamp(obj.linear?.x, -config.maxLinearVel, config.maxLinearVel), y: clamp(obj.linear?.y, -config.maxLinearVel, config.maxLinearVel), z: clamp(obj.linear?.z, -config.maxLinearVel, config.maxLinearVel) }
  obj.angular     = { z: clamp(obj.angular?.z, -config.maxAngularVel, config.maxAngularVel) }
  obj.confidence  = clamp(obj.confidence ?? 1.0, 0, 1)
  obj.description = obj.description || obj.action
  return obj
}

function extractString(text, key) {
  const m = text.match(new RegExp(`"${key}"\\s*:\\s*"([^"]+)"`))
  return m ? m[1] : null
}

function extractNumber(text, key, nth = 1) {
  const re = new RegExp(`${key}\\s*:\\s*(-?[\\d.]+)`, 'g')
  let match, count = 0
  while ((match = re.exec(text)) !== null) {
    if (++count === nth) return parseFloat(match[1])
  }
  return 0
}

function extractFloat(text, key) {
  const m = text.match(new RegExp(`"${key}"\\s*:\\s*(-?[\\d.]+)`))
  return m ? parseFloat(m[1]) : null
}