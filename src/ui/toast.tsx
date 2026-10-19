import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { SHADOW } from './tokens'
import { Icon } from './Icon'

/* 一个极简 toast 通道：任何地方都能调用 toast('已保存') */

type ToastItem = { id: number; text: string; tone: 'default' | 'success' | 'error' }
type Listener = (items: ToastItem[]) => void

let items: ToastItem[] = []
let seq = 0
const listeners = new Set<Listener>()

function emit() {
  for (const l of listeners) l(items)
}

export function toast(text: string, tone: ToastItem['tone'] = 'default') {
  const id = ++seq
  items = [...items.slice(-2), { id, text, tone }]
  emit()
  window.setTimeout(() => {
    items = items.filter((i) => i.id !== id)
    emit()
  }, 2200)
}

export function ToastHost() {
  const [list, setList] = useState<ToastItem[]>(items)

  useEffect(() => {
    const l: Listener = (next) => setList([...next])
    listeners.add(l)
    return () => {
      listeners.delete(l)
    }
  }, [])

  if (list.length === 0) return null

  return createPortal(
    <div
      style={{
        position: 'fixed',
        left: 0,
        right: 0,
        bottom: 'calc(76px + env(safe-area-inset-bottom))',
        zIndex: 200,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 8,
        pointerEvents: 'none',
      }}
    >
      {list.map((t) => (
        <div
          key={t.id}
          style={{
            background: '#1a1e24',
            color: '#fff',
            padding: '9px 16px',
            borderRadius: 999,
            fontSize: 13.5,
            fontWeight: 500,
            boxShadow: SHADOW.raised,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            animation: 'pop-in .2s ease',
            maxWidth: '86%',
          }}
        >
          {t.tone === 'success' ? <Icon name="check" size={15} /> : null}
          {t.text}
        </div>
      ))}
    </div>,
    document.body,
  )
}
