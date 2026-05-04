import React from 'react'

/**
 * Syntax-highlighted JSON display.
 * Colors: purple=key, green=string, amber=number, red=bool/null
 */
export default function JSONView({ data }) {
  if (!data) return null

  const raw = JSON.stringify(data, null, 2)
  const highlighted = raw
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"([^"]+)":/g,        '<span style="color:#7c3aed">"$1"</span>:')
    .replace(/: "([^"]*?)"/g,      ': <span style="color:#059669">"$1"</span>')
    .replace(/: (-?\d+\.?\d*)/g,   ': <span style="color:#d97706">$1</span>')
    .replace(/: (true|false|null)/g,': <span style="color:#dc2626">$1</span>')

  return (
    <pre
      dangerouslySetInnerHTML={{ __html: highlighted }}
      style={{
        background: 'var(--surface)', border: '1px solid var(--border)',
        borderRadius: 'var(--radius)', padding: '10px 12px',
        fontFamily: "'DM Mono', monospace", fontSize: 11.5, lineHeight: 1.65,
        overflowX: 'auto', maxHeight: 180, color: 'var(--text2)',
        whiteSpace: 'pre',
      }}
    />
  )
}
