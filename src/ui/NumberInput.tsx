import type { CSSProperties } from 'react'
import { C } from './tokens'

/**
 * 数字输入：选中即全选，方便直接覆盖旧值；
 * 支持负号/小数点，空值时显示占位。
 */
export function NumberInput({
  value,
  onChange,
  width = 64,
  suffix,
  placeholder,
  align = 'center',
  min = 0,
  style,
  ariaLabel,
}: {
  value: number
  onChange: (n: number) => void
  width?: number
  suffix?: string
  placeholder?: string
  align?: 'center' | 'right' | 'left'
  min?: number
  style?: CSSProperties
  ariaLabel?: string
}) {
  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: align === 'center' ? 'center' : 'flex-end',
        gap: 2,
        width,
        height: 36,
        borderRadius: 9,
        border: `1px solid ${C.border}`,
        background: C.surface,
        paddingRight: suffix ? 6 : 0,
        ...style,
      }}
    >
      <input
        aria-label={ariaLabel}
        inputMode="decimal"
        value={value === 0 ? '' : String(value)}
        placeholder={placeholder ?? '0'}
        onFocus={(e) => e.currentTarget.select()}
        onChange={(e) => {
          const raw = e.target.value.replace(/[^\d.]/g, '')
          const n = parseFloat(raw)
          onChange(Number.isFinite(n) ? Math.max(min, n) : 0)
        }}
        style={{
          width: '100%',
          height: '100%',
          border: 'none',
          outline: 'none',
          background: 'transparent',
          textAlign: align,
          fontSize: 15,
          fontWeight: 600,
          fontVariantNumeric: 'tabular-nums',
          padding: '0 2px 0 6px',
        }}
      />
      {suffix ? <span style={{ fontSize: 11, color: C.muted, flex: 'none' }}>{suffix}</span> : null}
    </div>
  )
}

/** 步进按钮（- / +），用于快速调重量 */
export function Stepper({
  onStep,
  label,
}: {
  onStep: (dir: 1 | -1) => void
  label: string
}) {
  return (
    <div style={{ display: 'flex', gap: 4 }}>
      <button
        aria-label={`${label} 减少`}
        onClick={() => onStep(-1)}
        style={stepStyle}
      >
        −
      </button>
      <button aria-label={`${label} 增加`} onClick={() => onStep(1)} style={stepStyle}>
        +
      </button>
    </div>
  )
}

const stepStyle: CSSProperties = {
  width: 30,
  height: 30,
  borderRadius: 8,
  border: `1px solid ${C.border}`,
  background: C.surface,
  color: C.textSecondary,
  fontSize: 16,
  lineHeight: 1,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
}
