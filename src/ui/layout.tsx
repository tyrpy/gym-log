import type { CSSProperties, ReactNode } from 'react'
import { C, MAXW, R } from './tokens'
import { Icon } from './Icon'

/** 页面外层：统一宽度与留白；桌面端居中成"手机面板" */
export function Page({
  children,
  bottomPad = 118,
}: {
  children: ReactNode
  bottomPad?: number
}) {
  return (
    <div
      style={{
        maxWidth: MAXW,
        margin: '0 auto',
        padding: `0 16px ${bottomPad}px`,
        minHeight: '100dvh',
      }}
    >
      {children}
    </div>
  )
}

/** 吸顶页头 */
export function PageHeader({
  title,
  subtitle,
  right,
  left,
  sticky = true,
}: {
  title: ReactNode
  subtitle?: ReactNode
  right?: ReactNode
  left?: ReactNode
  sticky?: boolean
}) {
  return (
    <div
      style={{
        position: sticky ? 'sticky' : 'relative',
        top: 0,
        zIndex: 20,
        margin: '0 -16px',
        padding: 'calc(14px + env(safe-area-inset-top)) 16px 10px',
        background: 'rgba(239,241,245,.86)',
        backdropFilter: 'saturate(1.4) blur(12px)',
        WebkitBackdropFilter: 'saturate(1.4) blur(12px)',
        borderBottom: `1px solid ${C.border}`,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        {left}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 21, fontWeight: 750, letterSpacing: -0.3, lineHeight: 1.25 }}>{title}</div>
          {subtitle ? (
            <div style={{ fontSize: 12.5, color: C.muted, marginTop: 2 }}>{subtitle}</div>
          ) : null}
        </div>
        {right}
      </div>
    </div>
  )
}

export function SectionTitle({
  children,
  right,
  style,
}: {
  children: ReactNode
  right?: ReactNode
  style?: CSSProperties
}) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 10,
        margin: '18px 2px 8px',
        ...style,
      }}
    >
      <div style={{ fontSize: 13, fontWeight: 700, color: C.textSecondary, letterSpacing: 0.2 }}>
        {children}
      </div>
      {right}
    </div>
  )
}

/** 数据小卡片 */
export function Stat({
  label,
  value,
  unit,
  tone,
}: {
  label: string
  value: ReactNode
  unit?: string
  tone?: string
}) {
  return (
    <div
      style={{
        flex: 1,
        minWidth: 0,
        background: C.surface,
        border: `1px solid ${C.border}`,
        borderRadius: R.md,
        padding: '10px 12px',
      }}
    >
      <div style={{ fontSize: 11.5, color: C.muted, fontWeight: 500, whiteSpace: 'nowrap' }}>{label}</div>
      <div
        className="num"
        style={{ fontSize: 19, fontWeight: 700, color: tone ?? C.text, lineHeight: 1.4, whiteSpace: 'nowrap' }}
      >
        {value}
        {unit ? <span style={{ fontSize: 12, fontWeight: 500, color: C.muted, marginLeft: 2 }}>{unit}</span> : null}
      </div>
    </div>
  )
}

/** 行内链接按钮 */
export function LinkBtn({
  children,
  onClick,
  tone = C.info,
}: {
  children: ReactNode
  onClick?: () => void
  tone?: string
}) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 3,
        fontSize: 13,
        fontWeight: 600,
        color: tone,
        padding: '2px 0',
      }}
    >
      {children}
      <Icon name="right" size={13} />
    </button>
  )
}

/** 一行设置项 */
export function SettingRow({
  label,
  desc,
  control,
  onClick,
}: {
  label: ReactNode
  desc?: ReactNode
  control?: ReactNode
  onClick?: () => void
}) {
  return (
    <div
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '13px 14px',
        borderTop: `1px solid ${C.border}`,
        cursor: onClick ? 'pointer' : undefined,
      }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14.5, fontWeight: 550 }}>{label}</div>
        {desc ? <div style={{ fontSize: 12.5, color: C.muted, marginTop: 2, lineHeight: 1.5 }}>{desc}</div> : null}
      </div>
      {control}
    </div>
  )
}
