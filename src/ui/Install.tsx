import { useEffect, useState } from 'react'
import { C } from '../ui/tokens'
import { Icon } from '../ui/Icon'
import { Sheet } from '../ui/Sheet'
import { Button } from '../ui/base'

interface BIPEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

const isStandalone = () =>
  window.matchMedia('(display-mode: standalone)').matches ||
  (window.navigator as unknown as { standalone?: boolean }).standalone === true

const isIOS = () =>
  /iphone|ipad|ipod/i.test(navigator.userAgent) ||
  (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)

/**
 * 「安装到手机」：Android/桌面走浏览器安装提示，iOS 给出 Safari 的加主屏步骤。
 * 已经是独立窗口打开时显示"已安装"。
 */
export function useInstallState() {
  const [bip, setBip] = useState<BIPEvent | null>(null)
  const [installed, setInstalled] = useState(isStandalone)

  useEffect(() => {
    const onBip = (e: Event) => {
      e.preventDefault()
      setBip(e as BIPEvent)
    }
    const onInstalled = () => setInstalled(true)
    window.addEventListener('beforeinstallprompt', onBip)
    window.addEventListener('appinstalled', onInstalled)
    const mq = window.matchMedia('(display-mode: standalone)')
    const onChange = () => setInstalled(isStandalone())
    mq.addEventListener?.('change', onChange)
    return () => {
      window.removeEventListener('beforeinstallprompt', onBip)
      window.removeEventListener('appinstalled', onInstalled)
      mq.removeEventListener?.('change', onChange)
    }
  }, [])

  const promptInstall = async (): Promise<'accepted' | 'dismissed' | 'unavailable'> => {
    if (!bip) return 'unavailable'
    await bip.prompt()
    const choice = await bip.userChoice
    setBip(null)
    return choice.outcome
  }

  return { canPrompt: !!bip, installed, ios: isIOS(), promptInstall }
}

/** 安装说明面板（iOS 手动步骤 / Android 引导） */
export function InstallSheet({
  open,
  onClose,
  ios,
  canPrompt,
  onPrompt,
}: {
  open: boolean
  onClose: () => void
  ios: boolean
  canPrompt: boolean
  onPrompt: () => void
}) {
  return (
    <Sheet open={open} onClose={onClose} title="安装到手机主屏幕" subtitle="装好后像普通 App 一样打开，断网也能用">
      {canPrompt ? (
        <div style={{ display: 'grid', gap: 14 }}>
          <div style={{ fontSize: 14, color: C.textSecondary, lineHeight: 1.7 }}>
            浏览器支持一键安装。安装后，桌面会多出一个「健身日志」图标。
          </div>
          <Button variant="primary" size="lg" full onClick={onPrompt}>
            <Icon name="download" size={18} />
            立即安装
          </Button>
        </div>
      ) : ios ? (
        <div style={{ display: 'grid', gap: 12 }}>
          <Step n={1} text="用 Safari 打开这个页面（微信里打开不行，要先在右上角选「在浏览器中打开」）" />
          <Step n={2} text="点底部中间的「分享」按钮（方框向上箭头）" />
          <Step n={3} text="向下滑，选「添加到主屏幕」" />
          <Step n={4} text="点右上角「添加」，回到桌面就能看到图标" />
          <div
            style={{
              display: 'flex',
              gap: 8,
              background: C.warningSoft,
              border: `1px solid ${C.warning}33`,
              borderRadius: 10,
              padding: '10px 12px',
              fontSize: 12.5,
              color: C.warning,
              lineHeight: 1.6,
            }}
          >
            <Icon name="sparkles" size={16} style={{ flex: 'none', marginTop: 1 }} />
            iOS 只在「从主屏幕启动」时才会保留到独立 App 的体验；在 Safari 里用也可以，只是少一个图标。
          </div>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: 12 }}>
          <Step n={1} text="用 Chrome / Edge 打开这个页面" />
          <Step n={2} text="点右上角「⋮」菜单" />
          <Step n={3} text="选「安装应用」或「添加到主屏幕」" />
          <Step n={4} text="确认安装，桌面会出现「健身日志」图标" />
          <div style={{ fontSize: 12.5, color: C.muted, lineHeight: 1.6 }}>
            部分安卓浏览器（如微信内置浏览器）不支持安装，请改用 Chrome 或系统自带浏览器打开。
          </div>
        </div>
      )}
    </Sheet>
  )
}

function Step({ n, text }: { n: number; text: string }) {
  return (
    <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
      <div
        style={{
          width: 22,
          height: 22,
          borderRadius: 99,
          background: C.accentSoft,
          color: C.accent,
          fontSize: 12,
          fontWeight: 700,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flex: 'none',
          marginTop: 1,
        }}
      >
        {n}
      </div>
      <div style={{ fontSize: 14, lineHeight: 1.65, color: C.text }}>{text}</div>
    </div>
  )
}
