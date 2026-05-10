import React, { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Send, Mic, History, ChevronDown, Clock } from 'lucide-react'
import JSONView from './JSONView'

/* ── Message Bubble ─────────────────────────────────────── */
function Message({ msg, showJSON }) {
  const isUser = msg.role === 'user'
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      style={{ display: 'flex', flexDirection: 'column', alignItems: isUser ? 'flex-end' : 'flex-start', gap: 4 }}
    >
      <div style={{ fontSize: 10, color: 'var(--text3)', fontWeight: 500, padding: '0 4px' }}>
        {isUser ? 'You' : 'Phi-3'}
      </div>

      {/* Show bubble while streaming (spinner), hide once parsed JSON is ready */}
      {(!msg.parsed || isUser || msg.streaming) && (
        <div style={{
          padding: '8px 13px', borderRadius: 14, maxWidth: '90%', fontSize: 13, lineHeight: 1.55,
          whiteSpace: 'pre-wrap',
          background: isUser ? 'var(--accent)' : 'var(--surface)',
          color:      isUser ? '#fff' : 'var(--text)',
          border:     isUser ? 'none' : '1px solid var(--border)',
          borderBottomRightRadius: isUser ? 4 : 14,
          borderBottomLeftRadius:  isUser ? 14 : 4,
        }}>
          {msg.streaming && !msg.text
            ? <span style={{ display: 'inline-block', width: 16, height: 16, border: '2px solid #ccc', borderTopColor: 'var(--accent)', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
            : msg.text
          }
        </div>
      )}

      {/* Parsed output */}
      {msg.parsed && showJSON && (
        <div style={{ width: '90%' }}>
          <JSONView data={msg.parsed} />
        </div>
      )}
      {msg.parsed && !showJSON && (
        <div style={{
          width: '90%', background: 'var(--surface)', border: '1px solid var(--border)',
          borderRadius: 'var(--radius)', padding: '8px 12px',
        }}>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
            <span style={{
              background: 'var(--accent-soft)', color: 'var(--accent)',
              padding: '2px 9px', borderRadius: 99, fontWeight: 600, fontSize: 12,
            }}>{msg.parsed.action}</span>
            <span style={{ fontSize: 12, color: 'var(--text2)' }}>{msg.parsed.description}</span>
          </div>
          {msg.parsed.confidence !== undefined && (
            <div style={{ marginTop: 6, fontSize: 11, color: 'var(--text3)' }}>
              Confidence: {(msg.parsed.confidence * 100).toFixed(0)}%
            </div>
          )}
        </div>
      )}

      {msg.latency != null && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, color: 'var(--text3)', padding: '0 4px' }}>
          <Clock size={9} /> {msg.latency} ms
        </div>
      )}
    </motion.div>
  )
}

/* ── Alert Banner ───────────────────────────────────────── */
function Alert({ msg, type }) {
  const colors = {
    error:   { bg: 'var(--red-soft)',    border: '#fecaca', color: 'var(--red)'   },
    warning: { bg: 'var(--amber-soft)', border: '#fde68a', color: 'var(--amber)' },
    success: { bg: 'var(--green-soft)', border: '#bbf7d0', color: 'var(--green)' },
  }
  const c = colors[type] || colors.error
  return (
    <motion.div
      initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
      style={{ ...c, border: `1px solid ${c.border}`, borderRadius: 'var(--radius)', padding: '7px 12px', fontSize: 12 }}
    >
      {msg}
    </motion.div>
  )
}

/* ── Main ChatPanel ─────────────────────────────────────── */
export default function ChatPanel({ messages, isLoading, history, onSend, alerts }) {
  const [input,       setInput]       = useState('')
  const [showJSON,    setShowJSON]    = useState(true)
  const [showHistory, setShowHistory] = useState(false)
  const bottomRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = useCallback(() => {
    if (!input.trim() || isLoading) return
    onSend(input.trim())
    setInput('')
  }, [input, isLoading, onSend])

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ padding: '14px 16px 12px', borderBottom: '1px solid var(--border)', background: 'var(--surface)', flexShrink: 0 }}>
        <div style={{ fontSize: 13, fontWeight: 600 }}>LLM Command Interface</div>
        <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 1 }}>Natural language → drone command</div>
      </div>

      {/* Alerts */}
      <AnimatePresence>
        {alerts.length > 0 && (
          <div style={{ padding: '8px', display: 'flex', flexDirection: 'column', gap: 6, flexShrink: 0 }}>
            {alerts.map(a => <Alert key={a.id} msg={a.msg} type={a.type} />)}
          </div>
        )}
      </AnimatePresence>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: 12, display: 'flex', flexDirection: 'column', gap: 10, background: 'var(--bg)' }}>
        <AnimatePresence initial={false}>
          {messages.map(m => <Message key={m.id} msg={m} showJSON={showJSON} />)}
        </AnimatePresence>
        <div ref={bottomRef} />
      </div>

      {/* History */}
      <div style={{ borderTop: '1px solid var(--border)', flexShrink: 0 }}>
        <button
          onClick={() => setShowHistory(s => !s)}
          style={{
            width: '100%', padding: '9px 16px', background: 'none', border: 'none',
            fontFamily: 'inherit', fontSize: 12, color: 'var(--text2)', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}
        >
          <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <History size={12} /> Command History ({history.length})
          </span>
          <ChevronDown size={12} style={{ transform: showHistory ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
        </button>

        <AnimatePresence>
          {showHistory && (
            <motion.div
              initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }}
              style={{ overflow: 'hidden' }}
            >
              <div style={{ padding: 8, display: 'flex', flexDirection: 'column', gap: 4, maxHeight: 130, overflowY: 'auto' }}>
                {history.length === 0 && <div style={{ fontSize: 12, color: 'var(--text3)', padding: '4px 8px' }}>No history yet</div>}
                {history.map((h, i) => (
                  <div
                    key={i}
                    onClick={() => onSend(h.text)}
                    style={{
                      padding: '6px 10px', background: 'var(--surface2)', borderRadius: 'var(--radius)',
                      fontSize: 11, color: 'var(--text2)', cursor: 'pointer',
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    }}
                  >
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{h.text}</span>
                    <span style={{ color: 'var(--text3)', fontSize: 10, flexShrink: 0, marginLeft: 8 }}>{h.time}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Input */}
      <div style={{ padding: 12, borderTop: '1px solid var(--border)', background: 'var(--surface)', flexShrink: 0 }}>
        <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKey}
            disabled={isLoading}
            placeholder={'e.g. "fly forward 1 meter, then hover"'}
            rows={2}
            style={{
              flex: 1, padding: '8px 12px', border: '1px solid var(--border)',
              borderRadius: 'var(--radius)', fontFamily: 'inherit', fontSize: 13,
              background: 'var(--bg)', color: 'var(--text)', outline: 'none',
              resize: 'none', transition: 'border-color 0.15s',
            }}
            onFocus={e  => e.target.style.borderColor = 'var(--accent)'}
            onBlur={e   => e.target.style.borderColor = 'var(--border)'}
          />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {/* Voice placeholder */}
            <button title="Voice input (not yet implemented)" style={{ width: 36, height: 36, border: '1px solid var(--border)', borderRadius: 'var(--radius)', background: 'var(--surface)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Mic size={14} color="var(--text3)" />
            </button>
            <button
              onClick={handleSend}
              disabled={isLoading || !input.trim()}
              style={{
                padding: '0 14px', height: 36, background: 'var(--accent)', color: '#fff',
                border: 'none', borderRadius: 'var(--radius)', fontFamily: 'inherit',
                fontSize: 13, fontWeight: 500, cursor: 'pointer', display: 'flex',
                alignItems: 'center', gap: 6, opacity: (isLoading || !input.trim()) ? 0.5 : 1,
              }}
            >
              {isLoading
                ? <span style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite', display: 'inline-block' }} />
                : <Send size={13} />
              }
            </button>
          </div>
        </div>

        {/* View toggle */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 11, color: 'var(--text3)' }}>JSON view</span>
          <label style={{ position: 'relative', display: 'inline-block', width: 30, height: 16, cursor: 'pointer' }}>
            <input type="checkbox" checked={showJSON} onChange={e => setShowJSON(e.target.checked)} style={{ opacity: 0, width: 0, height: 0 }} />
            <span style={{
              position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
              background: showJSON ? 'var(--accent)' : 'var(--border2)', borderRadius: 99, transition: 'background 0.2s',
            }}>
              <span style={{
                position: 'absolute', height: 12, width: 12, left: showJSON ? 16 : 2, bottom: 2,
                background: 'white', borderRadius: '50%', transition: 'left 0.2s',
              }} />
            </span>
          </label>
        </div>
      </div>
    </div>
  )
}