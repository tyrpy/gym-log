import { C, MAXW } from '../ui/tokens'
import { Icon } from '../ui/Icon'
import { useGym, type Page } from '../state/gym'

const tabs: Array<{ id: Page; label: string; icon: string }> = [
  { id: 'today', label: '今日', icon: 'home' },
  { id: 'history', label: '历史', icon: 'calendar' },
  { id: 'trends', label: '趋势', icon: 'chart' },
  { id: 'library', label: '动作', icon: 'dumbbell' },
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
        background: 'rgba(255,253,248,.92)',
        backdropFilter: 'blur(18px) saturate(1.2)',
        WebkitBackdropFilter: 'blur(18px) saturate(1.2)',
        borderTop: `1px solid ${C.border}`,
        boxShadow: '0 -12px 30px -24px rgba(64,51,32,.35)',
      }}
    >
      <div style={{ display: 'flex', width: '100%', maxWidth: MAXW, padding: '8px 6px 7px' }}>
        {tabs.map((t) => {
          const active = page === t.id || (page === 'cultivation' && t.id === 'me')
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
                padding: '0 0 1px',
                color: active ? C.accent : C.muted,
                transition: 'color .15s ease',
              }}
            >
              <span
                aria-hidden="true"
                style={{
                  position: 'relative',
                  width: 48,
                  height: 30,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <span
                  style={{
                    position: 'absolute',
                    inset: 0,
                    borderRadius: 999,
                    background: active ? C.accentSoft : 'transparent',
                    transition: 'background .18s ease',
                  }}
                />
                <Icon
                  name={t.icon}
                  size={21}
                  strokeWidth={active ? 2 : 1.7}
                  style={{ position: 'relative' }}
                />
              </span>
              <span style={{ fontSize: 10.5, fontWeight: active ? 700 : 500, letterSpacing: 0 }}>
                {t.label}
              </span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}
