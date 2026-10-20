import { useState } from 'react'
import type { AppData, ExerciseLog, WorkoutSet } from '../types'
import { BODY_PART_MAP, EQUIPMENT_LABEL } from '../data/exercises'
import { PART_COLORS } from '../data/details'
import { C, R } from '../ui/tokens'
import { Icon } from '../ui/Icon'
import { toast } from '../ui/toast'
import { NumberInput } from '../ui/NumberInput'
import { Button } from '../ui/base'
import { ExercisePicker } from './ExercisePicker'
import { useRestTimer } from './RestTimer'
import {
  addExerciseToPart,
  addSet,
  duplicateLastSet,
  findExercise,
  lastExerciseLog,
  removeBodyPart,
  removeExercise,
  removeSet,
  updateSet,
} from '../lib/store'
import { fmtNumber, formatDateShort } from '../lib/utils'
import { useGym } from '../state/gym'

/** 某个部位下的动作列表 */
export function PartBlock({ date, entryId }: { date: string; entryId: string }) {
  const { data, update } = useGym()
  const day = data.days[date]
  const entry = day?.entries.find((e) => e.id === entryId)
  const [pickerOpen, setPickerOpen] = useState(false)
  const [confirmRemove, setConfirmRemove] = useState(false)

  if (!entry) return null
  const color = PART_COLORS[entry.bodyPart]
  const part = BODY_PART_MAP[entry.bodyPart]

  const totalSets = entry.exercises.reduce((s, x) => s + x.sets.length, 0)
  const totalVolume = entry.exercises.reduce(
    (s, x) => s + x.sets.reduce((v, st) => v + st.weight * st.reps, 0),
    0,
  )

  return (
    <div
      style={{
        background: C.surface,
        border: `1px solid ${C.border}`,
        borderRadius: R.lg,
        overflow: 'hidden',
      }}
    >
      {/* 部位头 */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: '11px 14px',
          background: `${color}0a`,
          borderBottom: `1px solid ${C.border}`,
        }}
      >
        <div
          style={{
            width: 30,
            height: 30,
            borderRadius: 9,
            background: `${color}18`,
            color,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 12,
            fontWeight: 700,
            flex: 'none',
          }}
        >
          {entry.exercises.length}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color }}>
            {part.name}
            <span style={{ color: C.muted, fontWeight: 500, fontSize: 12, marginLeft: 8 }}>
              {entry.exercises.length} 个动作 · {totalSets} 组
              {totalVolume > 0 ? ` · ${fmtNumber(totalVolume)}kg` : ''}
            </span>
          </div>
        </div>
        <button
          aria-label="删除部位"
          onClick={() => setConfirmRemove(true)}
          style={{ color: C.muted, display: 'flex', padding: 4 }}
        >
          <Icon name="trash" size={15} />
        </button>
      </div>

      {/* 动作 */}
      <div style={{ padding: entry.exercises.length ? '4px 0 6px' : 0 }}>
        {entry.exercises.map((ex, i) => (
          <ExerciseBlock key={ex.id} date={date} entryId={entryId} log={ex} last={i === entry.exercises.length - 1} />
        ))}
      </div>

      <div style={{ padding: '0 12px 12px' }}>
        <button
          onClick={() => setPickerOpen(true)}
          style={{
            width: '100%',
            padding: '9px 12px',
            borderRadius: R.md,
            border: `1px dashed ${C.borderStrong}`,
            color: C.textSecondary,
            fontSize: 13.5,
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
          }}
        >
          <Icon name="plus" size={15} />
          添加动作
        </button>
      </div>

      <ExercisePicker
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        bodyPart={entry.bodyPart}
        existIds={entry.exercises.map((x) => x.exerciseId)}
        onPick={(ex) => {
          update((d) => addExerciseToPart(d, date, entryId, ex))
          toast(`已添加「${ex.name}」`, 'success')
        }}
      />

      {confirmRemove ? (
        <div
          style={{
            display: 'flex',
            gap: 8,
            padding: '0 12px 12px',
            alignItems: 'center',
          }}
        >
          <span style={{ fontSize: 12.5, color: C.muted, flex: 1 }}>删除整个「{part.name}」记录？</span>
          <Button size="sm" onClick={() => setConfirmRemove(false)}>
            取消
          </Button>
          <Button
            size="sm"
            variant="danger"
            onClick={() => {
              update((d) => removeBodyPart(d, date, entryId))
              toast('已删除')
            }}
          >
            删除
          </Button>
        </div>
      ) : null}
    </div>
  )
}

/** 单个动作：上次成绩 + 每组输入 */
function ExerciseBlock({
  date,
  entryId,
  log,
  last,
}: {
  date: string
  entryId: string
  log: ExerciseLog
  last: boolean
}) {
  const { data, update } = useGym()
  const rest = useRestTimer()
  const [menuOpen, setMenuOpen] = useState(false)

  const ex = findExercise(data, log.exerciseId)
  const previous = lastExerciseLog(data, log.exerciseId, date)
  const restSeconds = ex?.restSeconds ?? data.settings.defaultRestSeconds

  const volume = log.sets.reduce((s, st) => s + st.weight * st.reps, 0)
  const best = log.sets.length ? Math.max(...log.sets.map((s) => s.weight)) : 0

  return (
    <div style={{ padding: '6px 12px 10px', borderTop: last ? 'none' : `1px solid ${C.border}` }}>
      {/* 动作名 + 上次成绩 */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, paddingTop: 6 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 14.5, fontWeight: 650 }}>{log.name}</span>
            {ex ? (
              <span style={{ fontSize: 10.5, color: C.muted, border: `1px solid ${C.border}`, padding: '0 5px', borderRadius: 4 }}>
                {EQUIPMENT_LABEL[ex.equipment]}
              </span>
            ) : null}
          </div>
          <div style={{ fontSize: 11.5, color: C.muted, marginTop: 1 }}>
            {previous ? (
              <>
                上次 {formatDateShort(previous.date)}：
                {previous.log.sets.map((s) => `${fmtNumber(s.weight)}×${s.reps}`).join(' / ')}
              </>
            ) : (
              '第一次练这个动作'
            )}
          </div>
        </div>
        <button
          aria-label="动作选项"
          onClick={() => setMenuOpen((v) => !v)}
          style={{ color: C.muted, display: 'flex', padding: 4 }}
        >
          <Icon name="more" size={17} />
        </button>
      </div>

      {menuOpen ? (
        <div style={{ display: 'flex', gap: 6, margin: '6px 0 2px', flexWrap: 'wrap' }}>
          <Button
            size="sm"
            onClick={() => {
              update((d) => addSetFromPrev(d, date, entryId, log.id, previous))
              setMenuOpen(false)
            }}
          >
            <Icon name="copy" size={13} />
            按上次填一组
          </Button>
          <Button
            size="sm"
            onClick={() => {
              update((d) => removeExercise(d, date, entryId, log.id))
              toast('已移除动作')
            }}
          >
            <Icon name="trash" size={13} />
            移除动作
          </Button>
        </div>
      ) : null}

      {/* 组表头 */}
      {log.sets.length > 0 ? (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '26px 1fr 18px 1fr 44px 34px',
            gap: 6,
            alignItems: 'center',
            padding: '8px 0 4px',
            fontSize: 10.5,
            color: C.muted,
            fontWeight: 600,
          }}
        >
          <span style={{ textAlign: 'center' }}>组</span>
          <span style={{ textAlign: 'center' }}>重量</span>
          <span />
          <span style={{ textAlign: 'center' }}>次数</span>
          <span style={{ textAlign: 'center' }}>完成</span>
          <span />
        </div>
      ) : null}

      {log.sets.map((set, i) => (
        <SetRow
          key={set.id}
          date={date}
          entryId={entryId}
          logId={log.id}
          set={set}
          index={i}
          onDone={() => {
            if (data.settings.autoStartRest && restSeconds > 0) rest.start(restSeconds)
          }}
        />
      ))}

      {/* 底部操作 */}
      <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
        <Button
          size="sm"
          variant="soft"
          onClick={() => update((d) => addSet(d, date, entryId, log.id))}
          style={{ flex: 1 }}
        >
          <Icon name="plus" size={14} />
          加一组
        </Button>
        {log.sets.length > 0 ? (
          <Button
            size="sm"
            onClick={() => update((d) => duplicateLastSet(d, date, entryId, log.id))}
            style={{ flex: 1 }}
          >
            <Icon name="copy" size={14} />
            复制上一组
          </Button>
        ) : null}
        <button
          onClick={() => {
            rest.start(restSeconds)
          }}
          title="开始休息计时"
          style={{
            width: 34,
            height: 32,
            borderRadius: 10,
            border: `1px solid ${C.border}`,
            color: C.textSecondary,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flex: 'none',
          }}
        >
          <Icon name="timer" size={15} />
        </button>
      </div>

      {log.sets.length === 0 ? (
        <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
          {[8, 10, 12].map((reps) => (
            <button
              key={reps}
              onClick={() => update((d) => addSet(d, date, entryId, log.id, { reps }))}
              style={{
                fontSize: 12,
                color: C.textSecondary,
                border: `1px solid ${C.border}`,
                borderRadius: 8,
                padding: '5px 10px',
                background: C.surfaceAlt,
              }}
            >
              快速加 {reps} 次
            </button>
          ))}
        </div>
      ) : null}

      <div style={{ fontSize: 11, color: C.muted, marginTop: 6, display: 'flex', gap: 12 }}>
        <span>容量 {fmtNumber(volume)} kg</span>
        {best > 0 ? <span>最重 {fmtNumber(best)} kg</span> : null}
        <span style={{ marginLeft: 'auto' }}>休息 {restSeconds}s</span>
      </div>
    </div>
  )
}

/** 单组行：重量 / 次数 / 打勾 / 删除 */
function SetRow({
  date,
  entryId,
  logId,
  set,
  index,
  onDone,
}: {
  date: string
  entryId: string
  logId: string
  set: WorkoutSet
  index: number
  onDone: () => void
}) {
  const { update } = useGym()

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '26px 1fr 18px 1fr 44px 34px',
        gap: 6,
        alignItems: 'center',
        padding: '3px 0',
      }}
    >
      <div className="num" style={{ textAlign: 'center', fontSize: 12.5, color: C.muted, fontWeight: 600 }}>
        {index + 1}
      </div>
      <NumberInput
        value={set.weight}
        onChange={(n) => update((d) => updateSet(d, date, entryId, logId, set.id, { weight: n }))}
        placeholder="kg"
        ariaLabel="重量"
        width={undefined}
        style={{ width: '100%' }}
      />
      <span style={{ textAlign: 'center', color: C.muted, fontSize: 12 }}>×</span>
      <NumberInput
        value={set.reps}
        onChange={(n) => update((d) => updateSet(d, date, entryId, logId, set.id, { reps: Math.round(n) }))}
        placeholder="次"
        ariaLabel="次数"
        style={{ width: '100%' }}
      />
      <button
        aria-label={set.done ? '标记为未完成' : '标记为完成并开始休息'}
        onClick={() => {
          const next = !set.done
          update((d) => updateSet(d, date, entryId, logId, set.id, { done: next }))
          if (next) onDone()
        }}
        style={{
          width: 34,
          height: 34,
          borderRadius: 9,
          border: `1px solid ${set.done ? C.success : C.border}`,
          background: set.done ? C.success : C.surface,
          color: set.done ? '#fff' : C.muted,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Icon name="check" size={17} strokeWidth={2.4} />
      </button>
      <button
        aria-label="删除这一组"
        onClick={() => update((d) => removeSet(d, date, entryId, logId, set.id))}
        style={{ color: C.muted, display: 'flex', justifyContent: 'center', padding: 4 }}
      >
        <Icon name="x" size={15} />
      </button>
    </div>
  )
}

/** 用「上次的成绩」直接生成一组 */
function addSetFromPrev(
  d: AppData,
  date: string,
  entryId: string,
  logId: string,
  previous: { date: string; log: ExerciseLog } | null,
) {
  if (!previous || previous.log.sets.length === 0) return addSet(d, date, entryId, logId)
  const best = previous.log.sets.reduce((a, b) => (a.weight >= b.weight ? a : b))
  return addSet(d, date, entryId, logId, { weight: best.weight, reps: best.reps })
}
