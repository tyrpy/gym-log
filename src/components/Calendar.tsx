import { useMemo, useState } from 'react'
import type { AppData } from '../types'
import { BODY_PART_MAP } from '../data/exercises'
import { PART_COLORS } from '../data/details'
import { C, R } from '../ui/tokens'
import { Icon } from '../ui/Icon'
import { dayBodyParts, hasAnyLog } from '../lib/store'
import { Sheet } from '../ui/Sheet'
import { Button } from '../ui/base'
import { daysInMonth, formatDateCN, monthStart, shiftDateKey, todayKey } from '../lib/utils'

const WD = ['一', '二', '三', '四', '五', '六', '日']

/**
 * 月历：训练日显示彩点的颜色 = 当天练的部位。
 * 周一为一周开始。
 */
export function MonthCalendar({
  data,
  year,
  month,
  selected,
  onSelect,
  onMonthChange,
}: {
  data: AppData
  year: number
  month: number
  selected: string
  onSelect: (date: string) => void
  onMonthChange: (year: number, month: number) => void
}) {
  const today = todayKey()

  const cells = useMemo(() => {
    const first = monthStart(year, month)
    // getDay: 0=周日 → 转成周一为 0
    const lead = (first.getDay() + 6) % 7
    const total = daysInMonth(year, month)
    const out: Array<{ date: string | null; day: number }> = []
    for (let i = 0; i < lead; i++) out.push({ date: null, day: 0 })
    for (let d = 1; d <= total; d++) {
      const key = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
      out.push({ date: key, day: d })
    }
    while (out.length % 7 !== 0) out.push({ date: null, day: 0 })
    return out
  }, [year, month])

  const trainingDays = useMemo(() => {
    const map = new Map<string, string[]>()
    for (const [date, day] of Object.entries(data.days)) {
      if (!hasAnyLog(day)) continue
      map.set(date, dayBodyParts(day).map((p) => PART_COLORS[p] ?? C.accent))
    }
    return map
  }, [data.days])

  const prev = () => {
    if (month === 0) onMonthChange(year - 1, 11)
    else onMonthChange(year, month - 1)
  }
  const next = () => {
    if (month === 11) onMonthChange(year + 1, 0)
    else onMonthChange(year, month + 1)
  }

  const canGoNext = new Date(year, month + 1, 1) <= new Date()

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <div style={{ fontSize: 16, fontWeight: 700 }}>
          {year} 年 {month + 1} 月
        </div>
        <div style={{ display: 'flex', gap: 4 }}>
          <NavBtn name="left" onClick={prev} label="上个月" />
          <NavBtn name="right" onClick={next} label="下个月" disabled={!canGoNext} />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2, marginBottom: 4 }}>
        {WD.map((w) => (
          <div key={w} style={{ textAlign: 'center', fontSize: 11.5, color: C.muted, fontWeight: 600, padding: '2px 0' }}>
            {w}
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2 }}>
        {cells.map((c, i) => {
          if (!c.date) return <div key={`e${i}`} />
          const isToday = c.date === today
          const isSel = c.date === selected
          const dots = trainingDays.get(c.date) ?? []
          return (
            <button
              key={c.date}
              onClick={() => onSelect(c.date!)}
              style={{
                position: 'relative',
                aspectRatio: '1 / 1',
                borderRadius: 10,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 2,
                background: isSel ? C.accent : isToday ? C.accentSoft : 'transparent',
                color: isSel ? '#fff' : isToday ? C.accent : C.text,
                border: isToday && !isSel ? `1px solid ${C.accentBorder}` : '1px solid transparent',
                fontSize: 14.5,
                fontWeight: isSel || isToday ? 700 : 500,
              }}
            >
              <span className="num" style={{ lineHeight: 1.1 }}>{c.day}</span>
              <span style={{ display: 'flex', gap: 2, height: 4, marginTop: 1 }}>
                {dots.slice(0, 3).map((color, di) => (
                  <span
                    key={di}
                    style={{
                      width: 4,
                      height: 4,
                      borderRadius: 99,
                      background: isSel ? 'rgba(255,255,255,.9)' : color,
                    }}
                  />
                ))}
              </span>
            </button>
          )
        })}
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 10, paddingTop: 10, borderTop: `1px solid ${C.border}` }}>
        {(Object.keys(PART_COLORS) as Array<keyof typeof PART_COLORS>).map((p) => (
          <span key={p} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11.5, color: C.muted }}>
            <span style={{ width: 6, height: 6, borderRadius: 99, background: PART_COLORS[p] }} />
            {BODY_PART_MAP[p as keyof typeof BODY_PART_MAP].name}
          </span>
        ))}
      </div>
    </div>
  )
}

function NavBtn({
  name,
  onClick,
  label,
  disabled,
}: {
  name: string
  onClick: () => void
  label: string
  disabled?: boolean
}) {
  return (
    <button
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      style={{
        width: 30,
        height: 30,
        borderRadius: 9,
        border: `1px solid ${C.border}`,
        background: C.surface,
        color: disabled ? C.border : C.textSecondary,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Icon name={name} size={15} />
    </button>
  )
}

/** 日期跳转面板：月历 + 快捷回到今天 */
export function DateJumpSheet({
  open,
  onClose,
  data,
  value,
  onPick,
}: {
  open: boolean
  onClose: () => void
  data: AppData
  value: string
  onPick: (date: string) => void
}) {
  const [y, m] = value.split('-').map(Number)
  return (
    <DateSheetInner
      open={open}
      onClose={onClose}
      data={data}
      value={value}
      onPick={onPick}
      initialYear={y}
      initialMonth={m - 1}
    />
  )
}

function DateSheetInner({
  open,
  onClose,
  data,
  value,
  onPick,
  initialYear,
  initialMonth,
}: {
  open: boolean
  onClose: () => void
  data: AppData
  value: string
  onPick: (date: string) => void
  initialYear: number
  initialMonth: number
}) {
  const [year, setYear] = useState(initialYear)
  const [month, setMonth] = useState(initialMonth)
  const today = todayKey()

  const pick = (d: string) => {
    onPick(d)
    onClose()
  }

  return (
    <Sheet open={open} onClose={onClose} title="选择日期" maxHeight="86vh">
      <div style={{ display: 'grid', gap: 14 }}>
        <div style={{ display: 'flex', gap: 8 }}>
          {[0, -1, -2, -7].map((offset) => {
            const d = shiftDateKey(today, offset)
            return (
              <button
                key={offset}
                onClick={() => pick(d)}
                style={{
                  flex: 1,
                  padding: '9px 6px',
                  borderRadius: R.md,
                  border: `1px solid ${C.border}`,
                  background: C.surface,
                  fontSize: 12.5,
                  fontWeight: 600,
                  color: C.textSecondary,
                  lineHeight: 1.4,
                }}
              >
                {offset === 0 ? '今天' : offset === -1 ? '昨天' : offset === -2 ? '前天' : '一周前'}
                <div style={{ fontSize: 10.5, color: C.muted, fontWeight: 500 }}>{formatDateCN(d).split(' ')[0]}</div>
              </button>
            )
          })}
        </div>

        <MonthCalendar
          data={data}
          year={year}
          month={month}
          selected={value}
          onSelect={pick}
          onMonthChange={(yy, mm) => {
            setYear(yy)
            setMonth(mm)
          }}
        />

        <div style={{ display: 'flex', gap: 10 }}>
          <Button
            full
            onClick={() => {
              const [yy, mm] = today.split('-').map(Number)
              setYear(yy)
              setMonth(mm - 1)
              pick(today)
            }}
          >
            回到今天
          </Button>
        </div>
      </div>
    </Sheet>
  )
}
