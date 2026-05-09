// ============================================================
//  useChat.js — manages message state and LLM calls
// ============================================================

import { useState, useCallback, useRef } from 'react'
import { sendCommand } from '../services/ollamaService'

const WELCOME = {
  id: 0,
  role: 'assistant',
  text: "Hello! I'm your Phi-3 drone navigation AI. Try commands like:\n• \"fly forward 1 meter\"\n• \"rotate 90 degrees clockwise\"\n• \"ascend 0.5 meters then hover\"\n• \"land\"",
  parsed: null,
  latency: null,
  streaming: false,
}

export function useChat(onParsedCommand) {
  const [messages,  setMessages]  = useState([WELCOME])
  const [isLoading, setIsLoading] = useState(false)
  const [history,   setHistory]   = useState([])
  const idRef = useRef(1)

  const nextId = () => ++idRef.current

  const send = useCallback(async (text) => {
    if (!text.trim() || isLoading) return

    const userMsg = { id: nextId(), role: 'user', text, parsed: null, latency: null, streaming: false }
    const asstId  = nextId()
    const asstMsg = { id: asstId, role: 'assistant', text: '', parsed: null, latency: null, streaming: true }

    setMessages(m => [...m, userMsg, asstMsg])
    setIsLoading(true)
    setHistory(h => [{ text, time: new Date().toLocaleTimeString() }, ...h.slice(0, 19)])

    try {
      const { text: fullText, parsed, latency } = await sendCommand(text, (chunk) => {
        setMessages(m => m.map(x => x.id === asstId ? { ...x, text: chunk } : x))
      })

      setMessages(m => m.map(x =>
        x.id === asstId ? { ...x, text: fullText, parsed, latency, streaming: false } : x
      ))

      if (parsed) {
        // Pass both the parsed JSON and the original user text
        onParsedCommand?.(parsed, text)
      }

      return { parsed, error: parsed ? null : 'Could not parse LLM response as valid JSON' }

    } catch (err) {
      const errText = `⚠️ ${err.message}`
      setMessages(m => m.map(x => x.id === asstId ? { ...x, text: errText, streaming: false } : x))
      return { parsed: null, error: err.message }

    } finally {
      setIsLoading(false)
    }
  }, [isLoading, onParsedCommand])

  const clear = useCallback(() => setMessages([WELCOME]), [])

  return { messages, isLoading, history, send, clear }
}