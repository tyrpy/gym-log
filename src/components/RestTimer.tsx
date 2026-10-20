import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { SHADOW } from '../ui/tokens'
import { Icon } from '../ui/Icon'
import { beep, haptic } from '../lib/audio'
import { formatClock } from '../lib/utils'
import { useGym } from '../state/gym'

interface RestCtx {
  start: (seconds: number) => void
  stop: () => void
  running: boolean
}

const Ctx = createContext<RestCtx | null>(null)

/**
 * 组间休息计时器：全局单例，切页面不中断。
 * 到达 0 时播放提示音 + 震动。
 */
export function RestTimerProvider({ children }: { children: ReactNode }) {
  const { data } = useGym()
  const soundOn = data.settings.restSound
  const [total, setTotal] = useState(0)
  const [remaining, setRemaining] = useState(0)
  const [running, setRunning] = useState(false)
  const [visible, setVisible] = useState(false)
  const endAt = useRef(0)
  const finishedRef = useRef(false)

  const start = useCallback((seconds: number) => {
    if (seconds <= 0) return
    setTotal(seconds)
    setRemaining(seconds)
    endAt.current = Date.now() + seconds * 1000
    finishedRef.current = false
    setRunning(true)
    setVisible(true)
  }, [])

  const stop = useCallback(() => {
    setRunning(false)
    setVisible(false)
  }, [])

  // 每 250ms 校准一次（用绝对结束时间，后台标签页恢复后不会漂移）
  useEffect(() => {
    if (!running) return
    const tick = () => {
      const left = Math.max(0, (endAt.current - Date.now()) / 1000)
      setRemaining(left)
      if (left <= 0 && !finishedRef.current) {
        finishedRef.current = true
        setRunning(false)
        if (soundOn) beep(2)
        haptic(60)
      }
    }
    tick()
    const id = window.setInterval(tick, 250)
    return () => window.clearInterval(id)
  }, [running, soundOn])

  // 结束时自动隐藏
  useEffect(() => {
    if (!visible || running) return
    if (remaining > 0) return
    const t = window.setTimeout(() => setVisible(false), 4000)
    return () => window.clearTimeout(t)
  }, [visible, running, remaining])

  const value = useMemo<RestCtx>(() => ({ start, stop, running }), [start, stop, running])

  const progress = total > 0 ? Math.max(0, Math.min(1, remaining / total)) : 0
  const finished = visible && !running && remaining <= 0

  return (
    <Ctx.Provider value={value}>
      {children}
      {visible ? (
        <div
          style={{
            position: 'fixed',
            left: 0,
            right: 0,
            bottom: 'calc(84px + env(safe-area-inset-bottom))',
            zIndex: 90,
            display: 'flex',
            justifyContent: 'center',
            padding: '0 16px',
            pointerEvents: 'none',
          }}
        >
          <div
            style={{
              pointerEvents: 'auto',
              width: '100%',
              maxWidth: 420,
              background: '#211e18',
              color: '#fff',
              borderRadius: 16,
              boxShadow: SHADOW.raised,
              padding: '10px 12px 10px 16px',
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              animation: 'pop-in .2s ease',
            }}
          >
            <div
              style={{
                width: 34,
                height: 34,
                borderRadius: 10,
                background: finished ? 'rgba(31,157,99,.18)' : 'rgba(255,255,255,.10)',
                color: finished ? '#5fd39b' : '#ffb59f',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flex: 'none',
              }}
            >
              <Icon name={finished ? 'check' : 'timer'} size={18} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 11.5, color: 'rgba(255,255,255,.6)', lineHeight: 1.2 }}>
                {finished ? '休息结束，开始下一组' : running ? '组间休息' : '已暂停'}
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                <span className="num" style={{ fontSize: 24, fontWeight: 700, letterSpacing: 0.5, lineHeight: 1.3 }}>
                  {formatClock(remaining)}
                </span>
                <span style={{ fontSize: 11.5, color: 'rgba(255,255,255,.45)' }}>/ {formatClock(total)}</span>
              </div>
              <div style={{ height: 3, borderRadius: 2, background: 'rgba(255,255,255,.14)', marginTop: 4, overflow: 'hidden' }}>
                <div
                  style={{
                    height: '100%',
                    width: `${progress * 100}%`,
                    background: finished ? '#5fd39b' : '#ff8a6b',
                    transition: 'width .25s linear',
                  }}
                />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 4, flex: 'none' }}>
              <RoundBtn label="-15" onClick={() => {
                endAt.current -= 15000
                setRemaining(Math.max(0, (endAt.current - Date.now()) / 1000))
                finishedRef.current = false
              }} />
              <RoundBtn
                label={running ? '暂停' : '继续'}
                onClick={() => {
                  if (running) {
                    const left = Math.max(0, (endAt.current - Date.now()) / 1000)
                    setRemaining(left)
                    setRunning(false)
                  } else {
                    endAt.current = Date.now() + Math.max(1, remaining) * 1000
                    finishedRef.current = false
                    setRunning(true)
                  }
                }}
              />
              <RoundBtn label="+15" onClick={() => {
                endAt.current += 15000
                if (!running) setRemaining(remaining + 15)
                else setRemaining(Math.max(0, (endAt.current - Date.now()) / 1000))
                finishedRef.current = false
              }} />
              <RoundBtn label="关闭" onClick={stop} />
            </div>
          </div>
        </div>
      ) : null}
    </Ctx.Provider>
  )
}

function RoundBtn({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        minWidth: 40,
        height: 34,
        padding: '0 8px',
        borderRadius: 9,
        background: 'rgba(255,255,255,.10)',
        color: '#fff',
        fontSize: 12.5,
        fontWeight: 600,
      }}
    >
      {label}
    </button>
  )
}

export function useRestTimer(): RestCtx {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useRestTimer 必须在 RestTimerProvider 内使用')
  return ctx
}
