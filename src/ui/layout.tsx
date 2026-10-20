import type { CSSProperties, ReactNode } from 'react'
import { C, FONT, MAXW, R } from './tokens'
import { Icon } from './Icon'
import { InkScenery } from '../components/InkScenery'

/** 页面外层：统一宽度与留白；桌面端居中成"手机面板" */
export function Page({
  children,
  bottomPad = 112,
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
          padding: `0 18px ${bottomPad}px`,
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
  tone,
  sticky = true,
}: {
  title: ReactNode
  subtitle?: ReactNode
  right?: ReactNode
  left?: ReactNode
  /** 模块主题色：标题前的小圆点 */
  tone?: string
  sticky?: boolean
}) {
  return (
    <div
      style={{
        position: sticky ? 'sticky' : 'relative',
        top: 0,
        zIndex: 20,
        margin: '0 -18px',
        padding: 'calc(16px + env(safe-area-inset-top)) 18px 12px',
        background: tone
          ? `linear-gradient(180deg, ${tone}10 0%, rgba(244,239,228,.9) 72%)`
          : 'rgba(244,239,228,.88)',
        backdropFilter: 'saturate(1.3) blur(16px)',
        WebkitBackdropFilter: 'saturate(1.3) blur(16px)',
        borderBottom: `1px solid ${C.border}`,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        {left}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {tone ? (
              <span
                aria-hidden="true"
                style={{ width: 6, height: 6, borderRadius: 99, background: tone, flex: 'none' }}
              />
            ) : null}
            <div
              style={{
                fontFamily: FONT.kai,
                fontSize: 24,
                fontWeight: 700,
                letterSpacing: 0.5,
                lineHeight: 1.25,
              }}
            >
              {title}
            </div>
          </div>
          {subtitle ? (
            <div style={{ fontSize: 12.5, color: C.muted, marginTop: 3, letterSpacing: 0 }}>{subtitle}</div>
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
        margin: '20px 2px 9px',
        ...style,
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          fontFamily: FONT.kai,
          fontSize: 14,
          fontWeight: 700,
          color: C.text,
          letterSpacing: 1.2,
        }}
      >
        <span
          aria-hidden="true"
          style={{ width: 3, height: 12, background: C.accent, borderRadius: 2, display: 'inline-block' }}
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
  first = false,
}: {
  label: string
  value: ReactNode
  unit?: string
  tone?: string
  /** 无边框样式：放在卡片里靠竖线分隔 */
  plain?: boolean
  /** plain 模式下第一项不画左侧分隔线 */
  first?: boolean
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
      {plain && !first ? (
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
      <div style={{ fontSize: 11, color: C.muted, fontWeight: 500, whiteSpace: 'nowrap', letterSpacing: 0.5 }}>
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
      className="setting-row"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '14px 16px',
        borderTop: `1px solid ${C.border}`,
        cursor: onClick ? 'pointer' : undefined,
      }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 550 }}>{label}</div>
        {desc ? <div style={{ fontSize: 12, color: C.muted, marginTop: 2, lineHeight: 1.5 }}>{desc}</div> : null}
      </div>
      {control}
    </div>
  )
}
