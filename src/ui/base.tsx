import type { CSSProperties, ReactNode } from 'react'
import { C, R, SHADOW } from './tokens'
import { Icon } from './Icon'

interface ButtonProps {
  children: ReactNode
  onClick?: () => void
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'soft'
  size?: 'sm' | 'md' | 'lg'
  full?: boolean
  disabled?: boolean
  style?: CSSProperties
  title?: string
  ariaLabel?: string
  type?: 'button' | 'submit'
}

export function Button({
  children,
  onClick,
  variant = 'secondary',
  size = 'md',
  full,
  disabled,
  style,
  title,
  ariaLabel,
  type = 'button',
}: ButtonProps) {
  const sizes = {
    sm: { padding: '6px 12px', fontSize: 13, borderRadius: 10, height: 34 },
    md: { padding: '10px 16px', fontSize: 14, borderRadius: 12, height: 42 },
    lg: { padding: '14px 20px', fontSize: 15.5, borderRadius: 16, height: 52 },
  }[size]

  const variants: Record<string, CSSProperties> = {
    primary: { background: C.accent, color: '#fff', boxShadow: '0 2px 6px rgba(166,58,43,.18)' },
    secondary: { background: C.surface, color: C.text, border: `1px solid ${C.border}` },
    ghost: { background: 'transparent', color: C.textSecondary },
    danger: { background: C.surface, color: C.danger, border: `1px solid ${C.border}` },
    soft: { background: C.accentSoft, color: C.accent, border: `1px solid ${C.accentBorder}` },
  }

  return (
    <button
      type={type}
      title={title}
      aria-label={ariaLabel}
      disabled={disabled}
      onClick={onClick}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        fontWeight: 600,
        lineHeight: 1,
        letterSpacing: 0,
        width: full ? '100%' : undefined,
        opacity: disabled ? 0.45 : 1,
        transition: 'transform .08s ease, background .15s ease, opacity .15s ease',
        userSelect: 'none',
        ...sizes,
        ...variants[variant],
        ...style,
      }}
      onPointerDown={(e) => {
        if (!disabled) (e.currentTarget as HTMLButtonElement).style.transform = 'scale(.97)'
      }}
      onPointerUp={(e) => {
        ;(e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)'
      }}
      onPointerLeave={(e) => {
        ;(e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)'
      }}
    >
      {children}
    </button>
  )
}

export function IconButton({
  name,
  onClick,
  label,
  size = 36,
  color = C.textSecondary,
  bg = 'transparent',
  border,
}: {
  name: string
  onClick?: () => void
  label: string
  size?: number
  color?: string
  bg?: string
  border?: string
}) {
  return (
    <button
      aria-label={label}
      title={label}
      onClick={onClick}
      style={{
        width: size,
        height: size,
        borderRadius: 10,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        color,
        background: bg,
        border: border ? `1px solid ${border}` : undefined,
        flex: 'none',
      }}
    >
      <Icon name={name} size={Math.round(size * 0.5)} />
    </button>
  )
}

export function Card({
  children,
  style,
  onClick,
}: {
  children: ReactNode
  style?: CSSProperties
  onClick?: () => void
}) {
  return (
    <div
      onClick={onClick}
      style={{
        background: C.surface,
        border: `1px solid ${C.border}`,
        borderRadius: R.lg,
        boxShadow: SHADOW.card,
        ...style,
      }}
    >
      {children}
    </div>
  )
}

export function Chip({
  children,
  active,
  color,
  onClick,
  style,
  disabled,
}: {
  children: ReactNode
  active?: boolean
  color?: string
  onClick?: () => void
  style?: CSSProperties
  disabled?: boolean
}) {
  const accent = color ?? C.accent
  return (
    <button
      disabled={disabled}
      onClick={onClick}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        padding: '7px 13px',
        borderRadius: R.pill,
        fontSize: 13.5,
        fontWeight: active ? 600 : 500,
        color: active ? '#fff' : color ? accent : C.textSecondary,
        background: active ? accent : color ? `${accent}12` : C.surface,
        border: `1px solid ${active ? accent : color ? `${accent}30` : C.border}`,
        opacity: disabled ? 0.4 : 1,
        whiteSpace: 'nowrap',
        transition: 'all .15s ease',
        flex: 'none',
        ...style,
      }}
    >
      {children}
    </button>
  )
}

export function Segmented<T extends string>({
  value,
  options,
  onChange,
  style,
}: {
  value: T
  options: Array<{ value: T; label: string }>
  onChange: (v: T) => void
  style?: CSSProperties
}) {
  return (
    <div
      style={{
        display: 'inline-flex',
        padding: 3,
        gap: 2,
        background: C.surfaceAlt,
        border: `1px solid ${C.border}`,
        borderRadius: 12,
        ...style,
      }}
    >
      {options.map((o) => (
        <button
          key={o.value}
          onClick={() => onChange(o.value)}
          style={{
            padding: '6px 13px',
            borderRadius: 9,
            fontSize: 12.5,
            fontWeight: value === o.value ? 600 : 500,
            color: value === o.value ? C.text : C.muted,
            background: value === o.value ? C.surface : 'transparent',
            boxShadow: value === o.value ? '0 1px 2px rgba(64,51,32,.10)' : 'none',
          }}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

export function Switch({
  checked,
  onChange,
  label,
}: {
  checked: boolean
  onChange: (v: boolean) => void
  label: string
}) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      style={{
        width: 48,
        height: 28,
        borderRadius: 999,
        background: checked ? C.accent : '#d8d1c1',
        position: 'relative',
        transition: 'background .18s ease',
        flex: 'none',
      }}
    >
      <span
        style={{
          position: 'absolute',
          top: 4,
          left: checked ? 25 : 4,
          width: 20,
          height: 20,
          borderRadius: '50%',
          background: '#fff',
          boxShadow: '0 1px 2px rgba(0,0,0,.25)',
          transition: 'left .18s cubic-bezier(.3,1.4,.6,1)',
        }}
      />
    </button>
  )
}

export function Field({
  label,
  hint,
  children,
}: {
  label: string
  hint?: string
  children: ReactNode
}) {
  return (
    <label style={{ display: 'grid', gap: 6 }}>
      <span style={{ fontSize: 13, fontWeight: 600, color: C.textSecondary }}>{label}</span>
      {children}
      {hint ? <span style={{ fontSize: 12, color: C.muted }}>{hint}</span> : null}
    </label>
  )
}

export const inputStyle: CSSProperties = {
  width: '100%',
  height: 44,
  padding: '0 13px',
  borderRadius: 12,
  border: `1px solid ${C.border}`,
  background: C.surface,
  fontSize: 14.5,
  outline: 'none',
}

export function EmptyState({
  icon = 'sparkles',
  title,
  desc,
  action,
}: {
  icon?: string
  title: string
  desc?: string
  action?: ReactNode
}) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
        padding: '40px 20px',
        gap: 6,
      }}
    >
      <div
        style={{
          width: 54,
          height: 54,
          borderRadius: 18,
          background: C.surface,
          border: `1px solid ${C.border}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: C.muted,
          marginBottom: 6,
        }}
      >
        <Icon name={icon} size={26} />
      </div>
      <div style={{ fontWeight: 600, fontSize: 16 }}>{title}</div>
      {desc ? <div style={{ color: C.muted, fontSize: 13.5, maxWidth: 300, lineHeight: 1.6 }}>{desc}</div> : null}
      {action ? <div style={{ marginTop: 12 }}>{action}</div> : null}
    </div>
  )
}
