import type { CSSProperties, ReactNode } from 'react'
import { C, MAXW, R } from './tokens'
import { Icon } from './Icon'
import { InkScenery } from '../components/InkScenery'

/** 页面外层：统一宽度与留白；桌面端居中成"手机面板" */
export function Page({
  children,
  bottomPad = 118,
  scenery = false,
}: {
  children: ReactNode
  bottomPad?: number
  /** 是否在底部画一层远山（水墨氛围） */
  scenery?: boolean
}) {
  return (
    <>
      {scenery ? <InkScenery /> : null}
      <div
        style={{
          position: 'relative',
          zIndex: 1,
          maxWidth: MAXW,
          margin: '0 auto',
          padding: `0 16px ${bottomPad}px`,
          minHeight: '100dvh',
        }}
      >
        {children}
      </div>
    </>
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
        background: 'rgba(242,234,217,.88)',
        backdropFilter: 'saturate(1.4) blur(12px)',
        WebkitBackdropFilter: 'saturate(1.4) blur(12px)',
        borderBottom: `1px solid ${C.border}`,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        {left}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 22, fontWeight: 700, letterSpacing: 2, lineHeight: 1.3 }}>{title}</div>
          {subtitle ? (
            <div style={{ fontSize: 12, color: C.muted, marginTop: 2, letterSpacing: 0.8 }}>{subtitle}</div>
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
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 7,
          fontSize: 13.5,
          fontWeight: 700,
          color: C.text,
          letterSpacing: 3,
        }}
      >
        <span
          aria-hidden="true"
          style={{ width: 3, height: 13, background: C.accent, borderRadius: 0, display: 'inline-block' }}
        />
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
  plain = false,
}: {
  label: string
  value: ReactNode
  unit?: string
  tone?: string
  /** 无边框样式：放在卡片里靠竖线分隔 */
  plain?: boolean
}) {
  return (
    <div
      style={{
        flex: 1,
        minWidth: 0,
        background: plain ? 'transparent' : C.surface,
        border: plain ? 'none' : `1px solid ${C.border}`,
        borderRadius: plain ? 0 : R.md,
        padding: plain ? '2px 6px 2px 10px' : '10px 12px',
        position: 'relative',
      }}
    >
      {plain ? (
        <span
          aria-hidden="true"
          style={{
            position: 'absolute',
            left: 0,
            top: '14%',
            height: '72%',
            borderLeft: `1px solid ${C.border}`,
          }}
        />
      ) : null}
      <div style={{ fontSize: 11, color: C.muted, fontWeight: 500, whiteSpace: 'nowrap', letterSpacing: 1.5 }}>
        {label}
      </div>
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
