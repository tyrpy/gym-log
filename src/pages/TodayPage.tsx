import { useMemo, useState } from 'react'
import { BODY_PARTS, BODY_PART_MAP } from '../data/exercises'
import { PART_COLORS } from '../data/details'
import { C, R } from '../ui/tokens'
import { Icon } from '../ui/Icon'
import { Page, PageHeader, SectionTitle, Stat } from '../ui/layout'
import { Button, Card } from '../ui/base'
import { Sheet } from '../ui/Sheet'
import { toast } from '../ui/toast'
import { PartBlock } from '../components/PartBlock'
import { DateJumpSheet } from '../components/Calendar'
import {
  addBodyPart,
  applyTemplateToDay,
  dayBodyParts,
  dayDoneSetCount,
  daySetCount,
  dayVolume,
  getDay,
  loggedDates,
  removeTemplate,
  saveTemplateFromDay,
  setDayNote,
  shiftLastSessionToDate,
} from '../lib/store'
import {
  fmtNumber,
  formatDateCN,
  formatDateShort,
  relativeDay,
  shiftDateKey,
  todayKey,
} from '../lib/utils'
import { useGym } from '../state/gym'

export function TodayPage() {
  const { data, date, setDate, update } = useGym()
  const [jumpOpen, setJumpOpen] = useState(false)
  const [addPartOpen, setAddPartOpen] = useState(false)
  const [quickOpen, setQuickOpen] = useState(false)
  const [saveTplOpen, setSaveTplOpen] = useState(false)
  const [tplName, setTplName] = useState('')

  const day = getDay(data, date)
  const isToday = date === todayKey()
  const parts = dayBodyParts(day)
  const volume = dayVolume(day)
  const setCount = daySetCount(day)
  const doneCount = dayDoneSetCount(day)

  const lastSessionDate = useMemo(() => {
    const dates = loggedDates(data).filter((d) => d < date)
    return dates.length ? dates[dates.length - 1] : null
  }, [data, date])

  return (
    <Page>
      <PageHeader
        title={
          <button
            onClick={() => setJumpOpen(true)}
            style={{ display: 'flex', alignItems: 'center', gap: 6, textAlign: 'left' }}
          >
            <span>{relativeDay(date)}</span>
            <Icon name="down" size={16} style={{ color: C.muted, marginTop: 3 }} />
          </button>
        }
        subtitle={
          <span>
            {formatDateCN(date, true)}
            {!isToday ? (
              <button onClick={() => setDate(todayKey())} style={{ marginLeft: 8, color: C.accent, fontWeight: 600 }}>
                回到今天
              </button>
            ) : null}
          </span>
        }
        right={
          <div style={{ display: 'flex', gap: 6 }}>
            <DayArrow dir="prev" date={date} onGo={setDate} />
            <DayArrow dir="next" date={date} onGo={setDate} />
          </div>
        }
      />

      {/* 今日概览 */}
      <Card style={{ marginTop: 14, padding: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: C.textSecondary }}>
            {parts.length > 0 ? '本次训练' : '还没开始'}
          </div>
          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
            {parts.map((p) => (
              <span
                key={p}
                style={{
                  fontSize: 11.5,
                  fontWeight: 600,
                  color: PART_COLORS[p],
                  background: `${PART_COLORS[p]}14`,
                  padding: '2px 8px',
                  borderRadius: 999,
                }}
              >
                {BODY_PART_MAP[p].name}
              </span>
            ))}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <Stat label="动作" value={partCount(day)} unit="个" />
          <Stat label="组数" value={setCount} unit="组" />
          <Stat label="完成" value={doneCount} unit="组" tone={C.success} />
          <Stat label="容量" value={fmtNumber(volume)} unit="kg" />
        </div>
      </Card>

      {/* 操作区 */}
      <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
        <Button variant="primary" full onClick={() => setAddPartOpen(true)} size="lg">
          <Icon name="plus" size={18} />
          记录部位
        </Button>
        <Button
          size="lg"
          onClick={() => setQuickOpen(true)}
          title="模板 / 复制上次训练"
          style={{ flex: 'none', whiteSpace: 'nowrap', padding: '0 16px' }}
        >
          <Icon name="list" size={18} />
          模板
        </Button>
      </div>

      {/* 明细 */}
      {parts.length > 0 ? (
        <>
          <SectionTitle
            right={
              <button onClick={() => setSaveTplOpen(true)} style={{ fontSize: 12.5, color: C.info, fontWeight: 600 }}>
                存为模板
              </button>
            }
          >
            训练明细
          </SectionTitle>
          <div style={{ display: 'grid', gap: 10 }}>
            {day.entries.map((entry) => (
              <PartBlock key={entry.id} date={date} entryId={entry.id} />
            ))}
            <DayNote date={date} />
          </div>
        </>
      ) : (
        <div
          style={{
            marginTop: 18,
            background: C.surface,
            border: `1px dashed ${C.borderStrong}`,
            borderRadius: R.lg,
            padding: '26px 20px',
            textAlign: 'center',
          }}
        >
          <div style={{ fontSize: 15, fontWeight: 650 }}>今天练点什么？</div>
          <p style={{ color: C.muted, fontSize: 13, lineHeight: 1.65, maxWidth: 300, margin: '6px auto 14px' }}>
            点「记录部位」开始。先选今天练的部位，再挑动作，一组一组填重量和次数；打勾即完成并自动开始休息计时。
          </p>
          {lastSessionDate ? (
            <Button
              variant="soft"
              onClick={() => {
                update((d) => shiftLastSessionToDate(d, date))
                toast('已复制上次训练，可直接改重量', 'success')
              }}
            >
              <Icon name="copy" size={15} />
              复制上次（{formatDateShort(lastSessionDate)}）
            </Button>
          ) : null}
        </div>
      )}

      {/* 选部位 */}
      <Sheet open={addPartOpen} onClose={() => setAddPartOpen(false)} title="今天练哪些部位？" subtitle="可多选，分别记录">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
          {BODY_PARTS.map((p) => {
            const has = parts.includes(p.id)
            return (
              <button
                key={p.id}
                disabled={has}
                onClick={() => {
                  setAddPartOpen(false)
                  window.setTimeout(() => {
                    update((d) => addBodyPart(d, date, p.id))
                    toast(`已添加「${p.name}」，接着选动作`, 'success')
                  }, 160)
                }}
                style={{
                  padding: '18px 10px 14px',
                  borderRadius: R.lg,
                  border: `1px solid ${has ? C.border : `${PART_COLORS[p.id]}30`}`,
                  background: has ? C.surfaceAlt : `${PART_COLORS[p.id]}0d`,
                  color: has ? C.muted : PART_COLORS[p.id],
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 6,
                  fontWeight: 700,
                  fontSize: 15,
                }}
              >
                <span style={{ fontSize: 22, lineHeight: 1 }}>{p.icon}</span>
                <span>{p.name}</span>
                {has ? <span style={{ fontSize: 10.5, fontWeight: 500 }}>已添加</span> : null}
              </button>
            )
          })}
        </div>
      </Sheet>

      {/* 模板 / 复制 */}
      <Sheet open={quickOpen} onClose={() => setQuickOpen(false)} title="模板与复制" subtitle="用一套固定流程快速开始">
        <div style={{ display: 'grid', gap: 16 }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: C.textSecondary, marginBottom: 8 }}>我的模板</div>
            {data.templates.length === 0 ? (
              <div style={{ fontSize: 13, color: C.muted, lineHeight: 1.6 }}>
                还没有模板。记录完一次训练后，在「训练明细」右上角点「存为模板」，下次就能一键套用。
              </div>
            ) : (
              <div style={{ display: 'grid', gap: 8 }}>
                {data.templates.map((t) => (
                  <div
                    key={t.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      background: C.surface,
                      border: `1px solid ${C.border}`,
                      borderRadius: R.md,
                      padding: '10px 12px',
                    }}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 14, fontWeight: 650 }}>{t.name}</div>
                      <div style={{ fontSize: 11.5, color: C.muted }}>{t.items.length} 个动作</div>
                    </div>
                    <Button
                      size="sm"
                      variant="soft"
                      onClick={() => {
                        update((d) => applyTemplateToDay(d, date, t))
                        setQuickOpen(false)
                        toast(`已套用「${t.name}」`, 'success')
                      }}
                    >
                      套用
                    </Button>
                    <button
                      aria-label="删除模板"
                      onClick={() => {
                        update((d) => removeTemplate(d, t.id))
                        toast('模板已删除')
                      }}
                      style={{ color: C.muted, display: 'flex', padding: 4 }}
                    >
                      <Icon name="trash" size={15} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 14 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: C.textSecondary, marginBottom: 8 }}>复制历史训练</div>
            <div style={{ display: 'grid', gap: 8 }}>
              {loggedDates(data)
                .filter((d) => d !== date)
                .slice(-5)
                .reverse()
                .map((d) => {
                  const dl = data.days[d]
                  const names = dayBodyParts(dl).map((p) => BODY_PART_MAP[p].name).join(' / ')
                  return (
                    <div
                      key={d}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                        background: C.surface,
                        border: `1px solid ${C.border}`,
                        borderRadius: R.md,
                        padding: '10px 12px',
                      }}
                    >
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13.5, fontWeight: 600 }}>{formatDateCN(d)}</div>
                        <div style={{ fontSize: 11.5, color: C.muted }}>
                          {names} · {daySetCount(dl)} 组
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="soft"
                        onClick={() => {
                          update((x) => shiftLastSessionToDate(x, date, d))
                          setQuickOpen(false)
                          toast('已复制到当前日期', 'success')
                        }}
                      >
                        复制
                      </Button>
                    </div>
                  )
                })}
              {loggedDates(data).filter((d) => d !== date).length === 0 ? (
                <div style={{ fontSize: 13, color: C.muted }}>还没有其他日期的训练记录。</div>
              ) : null}
            </div>
          </div>
        </div>
      </Sheet>

      {/* 存为模板 */}
      <Sheet
        open={saveTplOpen}
        onClose={() => setSaveTplOpen(false)}
        title="存为训练模板"
        subtitle="下次可以一键套用这套部位和动作"
        footer={
          <div style={{ display: 'flex', gap: 10 }}>
            <Button full onClick={() => setSaveTplOpen(false)}>
              取消
            </Button>
            <Button
              full
              variant="primary"
              onClick={() => {
                update((d) => saveTemplateFromDay(d, date, tplName.trim() || '我的训练'))
                setSaveTplOpen(false)
                setTplName('')
                toast('已存为模板', 'success')
              }}
            >
              保存
            </Button>
          </div>
        }
      >
        <div style={{ display: 'grid', gap: 6 }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: C.textSecondary }}>模板名称</div>
          <input
            autoFocus
            value={tplName}
            onChange={(e) => setTplName(e.target.value)}
            placeholder="例如：推日（胸 + 三头）"
            style={{
              width: '100%',
              height: 44,
              padding: '0 12px',
              borderRadius: 10,
              border: `1px solid ${C.border}`,
              fontSize: 15,
              outline: 'none',
            }}
          />
          <div style={{ fontSize: 12, color: C.muted, lineHeight: 1.6 }}>
            会存下 {day.entries.reduce((s, e) => s + e.exercises.length, 0)} 个动作的
            「部位 + 动作」结构，不含具体重量。
          </div>
        </div>
      </Sheet>
      <DateJumpSheet open={jumpOpen} onClose={() => setJumpOpen(false)} data={data} value={date} onPick={setDate} />
    </Page>
  )
}

function partCount(day: ReturnType<typeof getDay>): number {
  return day.entries.reduce((s, e) => s + e.exercises.length, 0)
}

function DayArrow({ dir, date, onGo }: { dir: 'prev' | 'next'; date: string; onGo: (d: string) => void }) {
  const nextDate = shiftDateKey(date, dir === 'prev' ? -1 : 1)
  const disabled = dir === 'next' && nextDate > todayKey()
  return (
    <button
      aria-label={dir === 'prev' ? '前一天' : '后一天'}
      disabled={disabled}
      onClick={() => onGo(nextDate)}
      style={{
        width: 34,
        height: 34,
        borderRadius: 10,
        border: `1px solid ${C.border}`,
        background: C.surface,
        color: disabled ? C.border : C.textSecondary,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Icon name={dir === 'prev' ? 'left' : 'right'} size={16} />
    </button>
  )
}

/** 当天备注 */
function DayNote({ date }: { date: string }) {
  const { data, update } = useGym()
  const day = getDay(data, date)
  const [editing, setEditing] = useState(false)
  const [text, setText] = useState(day.note ?? '')

  if (!editing) {
    return (
      <button
        onClick={() => {
          setText(day.note ?? '')
          setEditing(true)
        }}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '11px 14px',
          borderRadius: R.md,
          border: `1px dashed ${C.borderStrong}`,
          background: 'transparent',
          color: C.muted,
          fontSize: 13,
          textAlign: 'left',
        }}
      >
        <Icon name="edit" size={15} />
        {day.note ? <span style={{ color: C.textSecondary }}>{day.note}</span> : '加一句今天的状态（可选）'}
      </button>
    )
  }

  return (
    <div
      style={{
        padding: 12,
        borderRadius: R.md,
        border: `1px solid ${C.border}`,
        background: C.surface,
        display: 'grid',
        gap: 8,
      }}
    >
      <textarea
        autoFocus
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="今天状态怎么样？睡眠、饮食、哪里不舒服…"
        rows={3}
        style={{
          width: '100%',
          resize: 'vertical',
          borderRadius: 8,
          border: `1px solid ${C.border}`,
          padding: 10,
          fontSize: 14,
          outline: 'none',
          fontFamily: 'inherit',
        }}
      />
      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
        <Button size="sm" onClick={() => setEditing(false)}>
          取消
        </Button>
        <Button
          size="sm"
          variant="primary"
          onClick={() => {
            update((d) => setDayNote(d, date, text.trim()))
            setEditing(false)
          }}
        >
          保存
        </Button>
      </div>
    </div>
  )
}
