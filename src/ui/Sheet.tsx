import { useEffect, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { C, MAXW, R, SHADOW } from './tokens'
import { Icon } from './Icon'

function useLockBody(open: boolean) {
  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [open])
}

function useEsc(open: boolean, onClose: () => void) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])
}

/** 底部弹出面板（移动端习惯） */
export function Sheet({
  open,
  onClose,
  title,
  subtitle,
  children,
  footer,
  maxHeight = '88vh',
}: {
  open: boolean
  onClose: () => void
  title?: string
  subtitle?: string
  children: ReactNode
  footer?: ReactNode
  maxHeight?: string
}) {
  useLockBody(open)
  useEsc(open, onClose)
  if (!open) return null

  return createPortal(
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 100,
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'center',
        animation: 'fade-in .18s ease',
      }}
    >
      <div
        onClick={onClose}
        style={{ position: 'absolute', inset: 0, background: 'rgba(16,24,40,.42)', backdropFilter: 'blur(2px)' }}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title ?? '面板'}
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: MAXW,
          maxHeight,
          background: C.bg,
          borderRadius: `${R.xl}px ${R.xl}px 0 0`,
          boxShadow: SHADOW.sheet,
          display: 'flex',
          flexDirection: 'column',
          animation: 'sheet-up .24s cubic-bezier(.22,1,.36,1)',
          overflow: 'hidden',
          paddingBottom: 'env(safe-area-inset-bottom)',
        }}
      >
        <div style={{ padding: '10px 0 0', display: 'flex', justifyContent: 'center' }}>
          <div style={{ width: 42, height: 5, borderRadius: 999, background: '#d3d8e0' }} />
        </div>
        {title ? (
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: 10,
              padding: '10px 18px 12px',
              borderBottom: `1px solid ${C.border}`,
            }}
          >
            <div style={{ flex: 1, minWidth: 0, paddingTop: 2 }}>
              <div style={{ fontSize: 17, fontWeight: 700 }}>{title}</div>
              {subtitle ? <div style={{ fontSize: 13, color: C.muted, marginTop: 2 }}>{subtitle}</div> : null}
            </div>
            <button
              aria-label="关闭"
              onClick={onClose}
              style={{
                width: 32,
                height: 32,
                borderRadius: 999,
                background: C.surface,
                border: `1px solid ${C.border}`,
                color: C.textSecondary,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flex: 'none',
              }}
            >
              <Icon name="x" size={16} />
            </button>
          </div>
        ) : null}
        <div style={{ flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch', padding: '14px 18px' }}>
          {children}
        </div>
        {footer ? (
          <div
            style={{
              padding: '12px 18px calc(12px + env(safe-area-inset-bottom))',
              borderTop: `1px solid ${C.border}`,
              background: C.surface,
            }}
          >
            {footer}
          </div>
        ) : null}
      </div>
    </div>,
    document.body,
  )
}

/** 居中小弹窗（确认框） */
export function Modal({
  open,
  onClose,
  title,
  children,
  footer,
}: {
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
  footer?: ReactNode
}) {
  useLockBody(open)
  useEsc(open, onClose)
  if (!open) return null

  return createPortal(
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 110,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
        animation: 'fade-in .15s ease',
      }}
    >
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(16,24,40,.46)' }} />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: 380,
          background: C.surface,
          borderRadius: R.lg,
          boxShadow: SHADOW.raised,
          padding: 20,
          animation: 'pop-in .18s cubic-bezier(.22,1,.36,1)',
        }}
      >
        <div style={{ fontSize: 17, fontWeight: 700, marginBottom: 8 }}>{title}</div>
        <div style={{ fontSize: 14, color: C.textSecondary, lineHeight: 1.65 }}>{children}</div>
        {footer ? <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 18 }}>{footer}</div> : null}
      </div>
    </div>,
    document.body,
  )
}
