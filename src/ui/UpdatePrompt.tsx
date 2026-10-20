import { useEffect, useState } from 'react'
import { C, SHADOW } from './tokens'
import { Icon } from './Icon'
import { createPortal } from 'react-dom'
import { registerSW } from 'virtual:pwa-register'

/**
 * PWA 更新提示。
 *
 * 策略：新版本下载完成后先不刷新页面（避免正在记录时被打断），
 * 底部弹一条「新版本可用 → 更新」，用户点了才 reload。
 */
export function UpdatePrompt() {
  const [needRefresh, setNeedRefresh] = useState(false)
  const [offlineReady, setOfflineReady] = useState(false)
  const [updateSW, setUpdateSW] = useState<((reload?: boolean) => Promise<void>) | null>(null)

  useEffect(() => {
    // 打包成安卓 APK 时，页面文件就在安装包里，不需要也不应该注册 Service Worker
    const cap = (window as unknown as { Capacitor?: { isNativePlatform?: () => boolean } }).Capacitor
    if (cap?.isNativePlatform?.()) return

    const fn = registerSW({
      immediate: true,
      onNeedRefresh() {
        setNeedRefresh(true)
      },
      onOfflineReady() {
        setOfflineReady(true)
        window.setTimeout(() => setOfflineReady(false), 4000)
      },
      onRegisteredSW(_url, registration) {
        // 每小时检查一次更新，回到前台时也查一次
        if (!registration) return
        const check = () => {
          registration.update().catch(() => {})
        }
        const timer = window.setInterval(check, 60 * 60 * 1000)
        document.addEventListener('visibilitychange', () => {
          if (document.visibilityState === 'visible') check()
        })
        return () => window.clearInterval(timer)
      },
    })
    setUpdateSW(() => fn)
  }, [])

  if (!needRefresh && !offlineReady) return null

  return createPortal(
    <div
      style={{
        position: 'fixed',
        left: 0,
        right: 0,
        bottom: 'calc(78px + env(safe-area-inset-bottom))',
        zIndex: 95,
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
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          background: '#211e18',
          color: '#fff',
          borderRadius: 14,
          padding: '10px 12px 10px 14px',
          boxShadow: SHADOW.raised,
          fontSize: 13,
          animation: 'pop-in .2s ease',
        }}
      >
        <div
          style={{
            width: 30,
            height: 30,
            borderRadius: 9,
            background: 'rgba(255,255,255,.10)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#ffb59f',
            flex: 'none',
          }}
        >
          <Icon name={needRefresh ? 'download' : 'check'} size={16} />
        </div>
        <div style={{ flex: 1, minWidth: 0, lineHeight: 1.45 }}>
          {needRefresh ? (
            <>
              <div style={{ fontWeight: 600 }}>有新版本</div>
              <div style={{ fontSize: 11.5, opacity: 0.65 }}>更新不会影响已记录的训练</div>
            </>
          ) : (
            <div style={{ fontWeight: 600 }}>已可离线使用</div>
          )}
        </div>
        {needRefresh ? (
          <>
            <button
              onClick={() => setNeedRefresh(false)}
              style={{ color: 'rgba(255,255,255,.6)', fontSize: 12.5, padding: '6px 8px', flex: 'none' }}
            >
              稍后
            </button>
            <button
              onClick={() => {
                void updateSW?.(true)
              }}
              style={{
                background: C.accent,
                color: '#fff',
                fontSize: 12.5,
                fontWeight: 700,
                padding: '7px 14px',
                borderRadius: 9,
                flex: 'none',
              }}
            >
              更新
            </button>
          </>
        ) : null}
      </div>
    </div>,
    document.body,
  )
}
