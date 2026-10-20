import { C, MAXW } from '../ui/tokens'
import { Icon } from '../ui/Icon'
import { useGym, type Page } from '../state/gym'

const tabs: Array<{ id: Page; label: string; icon: string }> = [
  { id: 'today', label: '今 日', icon: 'home' },
  { id: 'history', label: '历 史', icon: 'calendar' },
  { id: 'trends', label: '趋 势', icon: 'chart' },
  { id: 'library', label: '动 作', icon: 'dumbbell' },
  { id: 'me', label: '我 的', icon: 'user' },
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
        background: 'rgba(250,245,233,.94)',
        backdropFilter: 'blur(14px) saturate(1.2)',
        WebkitBackdropFilter: 'blur(14px) saturate(1.2)',
        borderTop: `1px solid ${C.border}`,
      }}
    >
      <div style={{ display: 'flex', width: '100%', maxWidth: MAXW, padding: '7px 4px 5px' }}>
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
                gap: 4,
                padding: '3px 0 2px',
                color: active ? C.accent : C.muted,
                transition: 'color .15s ease',
                position: 'relative',
              }}
            >
              <Icon name={t.icon} size={20} strokeWidth={active ? 1.9 : 1.6} />
              <span
                style={{
                  fontSize: 10,
                  fontWeight: active ? 700 : 400,
                  letterSpacing: 1,
                  // 选中时下方一点朱砂
                }}
              >
                {t.label}
              </span>
              <span
                aria-hidden="true"
                style={{
                  position: 'absolute',
                  bottom: 0,
                  width: active ? 14 : 0,
                  height: 2,
                  background: C.accent,
                  transition: 'width .2s ease',
                }}
              />
            </button>
          )
        })}
      </div>
    </nav>
  )
}
