import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { SHADOW } from './tokens'
import { Icon } from './Icon'
import { useGym } from '../state/gym'

/**
 * 撤销提示条：数据改动后短暂出现，可撤销上一步。
 * 数据本来就存在本机，这里只是给误删/误改一个后悔的机会。
 */
export function UndoHost() {
  const { canUndo, undo } = useGym()
  const [visible, setVisible] = useState(false)
  const timer = useRef<number | null>(null)

  // 由 provider 在数据变更后广播，避免在 reducer 里做副作用
  useEffect(() => {
    const onEdit = () => {
      setVisible(true)
      if (timer.current) window.clearTimeout(timer.current)
      timer.current = window.setTimeout(() => setVisible(false), 6000)
    }
    window.addEventListener('gym:edited', onEdit)
    return () => {
      window.removeEventListener('gym:edited', onEdit)
      if (timer.current) window.clearTimeout(timer.current)
    }
  }, [])

  if (!visible || !canUndo) return null

  return createPortal(
    <div
      style={{
        position: 'fixed',
        left: 0,
        right: 0,
        bottom: 'calc(140px + env(safe-area-inset-bottom))',
        zIndex: 85,
        display: 'flex',
        justifyContent: 'center',
        padding: '0 16px',
        pointerEvents: 'none',
      }}
    >
      <div
        style={{
          pointerEvents: 'auto',
          display: 'flex',
          alignItems: 'center',
          gap: 14,
          background: '#1a1e24',
          color: '#fff',
          borderRadius: 999,
          padding: '7px 8px 7px 16px',
          boxShadow: SHADOW.raised,
          fontSize: 12.5,
          animation: 'pop-in .18s ease',
        }}
      >
        <span style={{ opacity: 0.75 }}>已保存修改</span>
        <button
          onClick={() => {
            undo()
            setVisible(false)
          }}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
            color: '#ffb59f',
            fontWeight: 700,
            padding: '4px 10px',
            borderRadius: 999,
            background: 'rgba(255,255,255,.10)',
          }}
        >
          <Icon name="refresh" size={13} />
          撤销
        </button>
      </div>
    </div>,
    document.body,
  )
}

/** 在数据更新后广播一次编辑事件（由 provider 调用） */
export function broadcastEdit() {
  window.dispatchEvent(new Event('gym:edited'))
}
