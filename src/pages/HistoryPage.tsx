import { useMemo, useState } from 'react'
import { BODY_PART_MAP } from '../data/exercises'
import { PART_COLORS } from '../data/details'
import { C, R } from '../ui/tokens'
import { Icon } from '../ui/Icon'
import { Page, PageHeader, SectionTitle, Stat } from '../ui/layout'
import { Card } from '../ui/base'
import { MonthCalendar } from '../components/Calendar'
import { DayDetailSheet } from '../components/DayDetailSheet'
import { useGym } from '../state/gym'
import {
  dayBodyParts,
  daySetCount,
  dayVolume,
  loggedDates,
  trainingStreak,
} from '../lib/store'
import { fmtNumber, todayKey } from '../lib/utils'

export function HistoryPage() {
  const { data, date, setDate } = useGym()
  const [year, setYear] = useState(() => Number(date.slice(0, 4)))
  const [month, setMonth] = useState(() => Number(date.slice(5, 7)) - 1)
  const [detailDate, setDetailDate] = useState<string | null>(null)

  const dates = useMemo(() => loggedDates(data), [data])
  const monthPrefix = `${year}-${String(month + 1).padStart(2, '0')}`
  const monthDates = dates.filter((d) => d.startsWith(monthPrefix))

  const monthVolume = monthDates.reduce((s, d) => s + dayVolume(data.days[d]), 0)
  const monthSets = monthDates.reduce((s, d) => s + daySetCount(data.days[d]), 0)
  const streak = trainingStreak(data)

  const recent = [...dates].reverse().slice(0, 12)

  return (
    <Page>
      <PageHeader title="训练历史" subtitle={`累计 ${dates.length} 个训练日 · 连续 ${streak} 天`} />

      <Card style={{ marginTop: 14, padding: 14 }}>
        <MonthCalendar
          data={data}
          year={year}
          month={month}
          selected={date}
          onSelect={(d) => {
            setDate(d)
            setDetailDate(d)
          }}
          onMonthChange={(y, m) => {
            setYear(y)
            setMonth(m)
          }}
        />
      </Card>

      <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
        <Stat label={`${month + 1}月训练`} value={monthDates.length} unit="天" />
        <Stat label="本月组数" value={monthSets} unit="组" />
        <Stat label="本月容量" value={fmtNumber(monthVolume)} unit="kg" />
      </div>

      <SectionTitle
        right={
          year !== Number(todayKey().slice(0, 4)) || month !== Number(todayKey().slice(5, 7)) - 1 ? (
            <button
              onClick={() => {
                setYear(Number(todayKey().slice(0, 4)))
                setMonth(Number(todayKey().slice(5, 7)) - 1)
              }}
              style={{ fontSize: 12.5, color: C.info, fontWeight: 600 }}
            >
              回到本月
            </button>
          ) : null
        }
      >
        最近训练
      </SectionTitle>

      {recent.length === 0 ? (
        <Card style={{ padding: 24, textAlign: 'center', color: C.muted, fontSize: 13.5, lineHeight: 1.7 }}>
          还没有训练记录。
          <br />
          去「今天」记一次，这里就会自动出现。
        </Card>
      ) : (
        <div style={{ display: 'grid', gap: 8 }}>
          {recent.map((d) => {
            const day = data.days[d]
            const parts = dayBodyParts(day)
            return (
              <button
                key={d}
                onClick={() => setDetailDate(d)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  background: C.surface,
                  border: `1px solid ${C.border}`,
                  borderRadius: R.md,
                  padding: '11px 14px',
                  textAlign: 'left',
                }}
              >
                <div style={{ width: 44, flex: 'none', textAlign: 'center' }}>
                  <div className="num" style={{ fontSize: 17, fontWeight: 700, lineHeight: 1.2 }}>
                    {Number(d.slice(8, 10))}
                  </div>
                  <div style={{ fontSize: 10.5, color: C.muted }}>{d.slice(5, 7)}月</div>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 2 }}>
                    {parts.map((p) => (
                      <span
                        key={p}
                        style={{
                          fontSize: 11,
                          fontWeight: 600,
                          color: PART_COLORS[p],
                          background: `${PART_COLORS[p]}14`,
                          padding: '1px 7px',
                          borderRadius: 999,
                        }}
                      >
                        {BODY_PART_MAP[p].name}
                      </span>
                    ))}
                  </div>
                  <div style={{ fontSize: 11.5, color: C.muted }}>
                    {daySetCount(day)} 组 · {fmtNumber(dayVolume(day))} kg ·{' '}
                    {day.entries.flatMap((e) => e.exercises).length} 个动作
                  </div>
                </div>
                <Icon name="right" size={16} style={{ color: C.muted, flex: 'none' }} />
              </button>
            )
          })}
        </div>
      )}

      {detailDate ? (
        <DayDetailSheet
          date={detailDate}
          onClose={() => setDetailDate(null)}
        />
      ) : null}
    </Page>
  )
}

