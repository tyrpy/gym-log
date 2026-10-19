import { C, MAXW } from '../ui/tokens'
import { Icon } from '../ui/Icon'
import { useGym, type Page } from '../state/gym'

const tabs: Array<{ id: Page; label: string; icon: string }> = [
  { id: 'today', label: '今天', icon: 'home' },
  { id: 'history', label: '历史', icon: 'calendar' },
  { id: 'trends', label: '趋势', icon: 'chart' },
  { id: 'me', label: '我的', icon: 'user' },
]

export function BottomNav() {
  const { page, go } = useGym()

  return (
    <nav
      style={{
        position: 'fixed',
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 50,
        display: 'flex',
        justifyContent: 'center',
        paddingBottom: 'env(safe-area-inset-bottom)',
        background: 'rgba(255,255,255,.92)',
        backdropFilter: 'blur(16px) saturate(1.6)',
        WebkitBackdropFilter: 'blur(16px) saturate(1.6)',
        borderTop: `1px solid ${C.border}`,
      }}
    >
      <div style={{ display: 'flex', width: '100%', maxWidth: MAXW, padding: '6px 6px 4px' }}>
        {tabs.map((t) => {
          const active = page === t.id
          return (
            <button
              key={t.id}
              onClick={() => go(t.id)}
              aria-current={active ? 'page' : undefined}
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 3,
                padding: '4px 0 3px',
                color: active ? C.accent : C.muted,
                transition: 'color .15s ease',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 44,
                  height: 26,
                  borderRadius: 999,
                  background: active ? C.accentSoft : 'transparent',
                  transition: 'background .15s ease',
                }}
              >
                <Icon name={t.icon} size={21} strokeWidth={active ? 2.2 : 1.8} />
              </div>
              <span style={{ fontSize: 10.5, fontWeight: active ? 700 : 500, letterSpacing: 0.2 }}>
                {t.label}
              </span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}
