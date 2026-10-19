import type { AppData } from '../types'
import { BODY_PART_MAP } from '../data/exercises'
import { PART_COLORS } from '../data/details'
import { C } from '../ui/tokens'
import { dayDoneSetCount, daySetCount, dayVolume, hasAnyLog } from '../lib/store'
import { fmtNumber, formatDateCN } from '../lib/utils'

/** 某一天记录的只读摘要（历史详情、分享预览共用） */
export function DaySummaryCard({
  data,
  date,
  showDate = true,
}: {
  data: AppData
  date: string
  showDate?: boolean
}) {
  const day = data.days[date]
  if (!hasAnyLog(day)) {
    return <div style={{ color: C.muted, fontSize: 13.5 }}>这天没有训练记录。</div>
  }
  return (
    <div style={{ display: 'grid', gap: 10 }}>
      <div style={{ fontSize: 12.5, color: C.muted }}>
        {showDate ? `${formatDateCN(date, true)} · ` : ''}
        {daySetCount(day)} 组 · 完成 {dayDoneSetCount(day)} 组 · {fmtNumber(dayVolume(day))} kg
      </div>
      {day.entries.map((entry) => (
        <div key={entry.id}>
          <div style={{ fontSize: 13, fontWeight: 700, color: PART_COLORS[entry.bodyPart], marginBottom: 4 }}>
            {BODY_PART_MAP[entry.bodyPart].name}
          </div>
          {entry.exercises.map((ex) => (
            <div key={ex.id} style={{ paddingLeft: 10, borderLeft: `2px solid ${C.border}`, marginBottom: 6 }}>
              <div style={{ fontSize: 13.5, fontWeight: 600 }}>{ex.name}</div>
              <div style={{ fontSize: 12, color: C.textSecondary, lineHeight: 1.7 }}>
                {ex.sets.length
                  ? ex.sets
                      .map((s, i) => `${i + 1}. ${fmtNumber(s.weight)}kg×${s.reps}${s.done ? ' ✓' : ''}`)
                      .join('  ')
                  : '（未添加组）'}
              </div>
            </div>
          ))}
        </div>
      ))}
      {day.note ? (
        <div
          style={{
            fontSize: 12.5,
            color: C.textSecondary,
            background: C.surfaceAlt,
            borderRadius: 8,
            padding: '8px 10px',
          }}
        >
          {day.note}
        </div>
      ) : null}
    </div>
  )
}
