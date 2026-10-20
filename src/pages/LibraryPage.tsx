import { useMemo, useState } from 'react'
import type { BodyPartId, Equipment, Exercise } from '../types'
import { BODY_PARTS, BODY_PART_MAP, EQUIPMENT_LABEL, PRESET_EXERCISES } from '../data/exercises'
import { PART_COLORS } from '../data/details'
import { EXERCISE_GUIDES } from '../data/exerciseGuides'
import { C, R } from '../ui/tokens'
import { Icon } from '../ui/Icon'
import { Page, PageHeader, SectionTitle } from '../ui/layout'
import { Button, Chip, inputStyle } from '../ui/base'
import { Sheet } from '../ui/Sheet'
import { toast } from '../ui/toast'
import { ExerciseFigure } from '../components/ExerciseFigure'
import { addBodyPart, addExerciseToPart, getDay } from '../lib/store'
import { useGym } from '../state/gym'
import { todayKey } from '../lib/utils'

const EQUIPMENTS: Array<Equipment | 'all'> = [
  'all',
  'barbell',
  'dumbbell',
  'machine',
  'cable',
  'bodyweight',
  'kettlebell',
]

export function LibraryPage() {
  const { data, update, setDate, go } = useGym()
  const [q, setQ] = useState('')
  const [part, setPart] = useState<BodyPartId | 'all'>('all')
  const [equip, setEquip] = useState<Equipment | 'all'>('all')
  const [openId, setOpenId] = useState<string | null>(null)

  const library = useMemo(() => [...PRESET_EXERCISES, ...data.customExercises], [data.customExercises])

  const todayIds = useMemo(() => {
    const day = getDay(data, todayKey())
    return new Set(day.entries.flatMap((e) => e.exercises.map((x) => x.exerciseId)))
  }, [data])

  const list = useMemo(() => {
    const kw = q.trim().toLowerCase()
    return library
      .filter((e) => (part === 'all' ? true : e.bodyPart === part))
      .filter((e) => (equip === 'all' ? true : e.equipment === equip))
      .filter((e) => {
        if (!kw) return true
        const guide = EXERCISE_GUIDES[e.id]
        return [e.name, BODY_PART_MAP[e.bodyPart].name, EQUIPMENT_LABEL[e.equipment], ...(guide?.primary ?? [])]
          .join(' ')
          .toLowerCase()
          .includes(kw)
      })
  }, [library, part, equip, q])

  const open = openId ? library.find((e) => e.id === openId) ?? null : null

  const addToToday = (ex: Exercise) => {
    const today = todayKey()
    update((d) => {
      let next = d
      if (!getDay(next, today).entries.some((e) => e.bodyPart === ex.bodyPart)) {
        next = addBodyPart(next, today, ex.bodyPart)
      }
      const entry = getDay(next, today).entries.find((e) => e.bodyPart === ex.bodyPart)
      if (!entry) return next
      return addExerciseToPart(next, today, entry.id, ex)
    })
    toast(`已把「${ex.name}」加入今天`, 'success')
    setOpenId(null)
    setDate(today)
    go('today')
  }

  return (
    <Page>
      <PageHeader
        tone={C.warning}
        title="动作库"
        subtitle={`${library.length} 个动作 · 图示与分步做法`}
      />

      <div
        style={{
          marginTop: 14,
          background: C.surface,
          border: `1px solid ${C.border}`,
          borderRadius: R.lg,
          padding: '10px 12px 8px',
          overflow: 'hidden',
        }}
      >
        <div style={{ position: 'relative' }}>
          <Icon
            name="search"
            size={17}
            style={{ position: 'absolute', left: 13, top: 12, color: C.muted }}
          />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="搜索动作，如：卧推 / 划船 / 深蹲"
            aria-label="搜索动作"
            style={{
              ...inputStyle,
              paddingLeft: 38,
              height: 42,
              borderRadius: 10,
              background: C.surfaceAlt,
              border: 'none',
            }}
          />
          {q ? (
            <button
              aria-label="清空搜索"
              onClick={() => setQ('')}
              style={{
                position: 'absolute',
                right: 9,
                top: 9,
                width: 24,
                height: 24,
                borderRadius: 999,
                background: C.surface,
                color: C.muted,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Icon name="x" size={13} />
            </button>
          ) : null}
        </div>

        <div
          style={{
            display: 'flex',
            gap: 6,
            overflowX: 'auto',
            margin: '10px -12px 0',
            padding: '0 12px 2px',
            scrollbarWidth: 'none',
          }}
        >
          <Chip active={part === 'all'} onClick={() => setPart('all')} style={{ padding: '6px 12px', fontSize: 13 }}>
            全部部位
          </Chip>
          {BODY_PARTS.map((p) => (
            <Chip
              key={p.id}
              active={part === p.id}
              color={p.color}
              onClick={() => setPart(p.id)}
              style={{ padding: '6px 12px', fontSize: 13 }}
            >
              {p.name}
            </Chip>
          ))}
        </div>

        <div
          style={{
            display: 'flex',
            gap: 6,
            overflowX: 'auto',
            margin: '8px -12px 0',
            padding: '0 12px 2px',
            scrollbarWidth: 'none',
          }}
        >
          {EQUIPMENTS.map((eq) => (
            <Chip
              key={eq}
              active={equip === eq}
              onClick={() => setEquip(eq)}
              style={{
                padding: '4px 10px',
                fontSize: 12,
                background: equip === eq ? C.text : C.surfaceAlt,
                color: equip === eq ? '#fff' : C.textSecondary,
                border: `1px solid ${equip === eq ? C.text : C.border}`,
              }}
            >
              {eq === 'all' ? '全部器械' : EQUIPMENT_LABEL[eq]}
            </Chip>
          ))}
        </div>
      </div>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 10,
          margin: '12px 2px 0',
          fontSize: 12,
          color: C.muted,
        }}
      >
        <span>找到 {list.length} 个动作</span>
        <span>点卡片看做法</span>
      </div>

      {list.length === 0 ? (
        <div
          style={{
            marginTop: 24,
            padding: '34px 20px',
            textAlign: 'center',
            background: C.surface,
            border: `1px dashed ${C.borderStrong}`,
            borderRadius: R.lg,
          }}
        >
          <div style={{ fontSize: 15, fontWeight: 650 }}>没找到这个动作</div>
          <div style={{ fontSize: 13, color: C.muted, marginTop: 4, lineHeight: 1.6 }}>
            换个关键词，或者到「我的 → 新建自定义动作」里添加。
          </div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 12, marginTop: 10 }}>
          {list.map((ex) => {
            const guide = EXERCISE_GUIDES[ex.id]
            const inToday = todayIds.has(ex.id)
            return (
              <button
                key={ex.id}
                onClick={() => setOpenId(ex.id)}
                style={{
                  textAlign: 'left',
                  background: C.surface,
                  border: `1px solid ${C.border}`,
                  borderRadius: R.lg,
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column',
                  minWidth: 0,
                }}
              >
                <div style={{ padding: 5, paddingBottom: 0, position: 'relative' }}>
                  <ExerciseFigure
                    id={ex.id}
                    label={ex.name}
                    variant="card"
                    bodyPart={ex.bodyPart}
                    showLabels={false}
                    style={{ borderRadius: 10 }}
                  />
                  {inToday ? (
                    <span
                      style={{
                        position: 'absolute',
                        top: 9,
                        right: 9,
                        fontSize: 9.5,
                        fontWeight: 700,
                        color: C.success,
                        background: C.successSoft,
                        border: `1px solid ${C.success}33`,
                        padding: '1px 6px',
                        borderRadius: 999,
                      }}
                    >
                      今日已练
                    </span>
                  ) : null}
                </div>
                <div style={{ padding: '7px 10px 10px', minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: 13.5,
                      fontWeight: 650,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {ex.name}
                  </div>
                  <div style={{ fontSize: 10.5, color: C.muted, marginTop: 2, display: 'flex', gap: 4 }}>
                    <span style={{ color: PART_COLORS[ex.bodyPart], fontWeight: 600 }}>
                      {BODY_PART_MAP[ex.bodyPart].name}
                    </span>
                    <span>·</span>
                    <span>{EQUIPMENT_LABEL[ex.equipment]}</span>
                  </div>
                  <div
                    style={{
                      fontSize: 10.5,
                      color: C.textSecondary,
                      marginTop: 3,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {guide ? guide.primary[0] : '自定义动作'}
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      )}

      <div style={{ fontSize: 11.5, color: C.muted, lineHeight: 1.7, margin: '18px 2px 0' }}>
        示意图为动作要点示意，实际训练请以自身活动度和教练指导为准。图示随 App 离线加载。
      </div>

      <Sheet
        open={!!open}
        onClose={() => setOpenId(null)}
        title={open?.name}
        subtitle={open ? `${BODY_PART_MAP[open.bodyPart].name} · ${EQUIPMENT_LABEL[open.equipment]}` : undefined}
        maxHeight="92vh"
        footer={
          open ? (
            <div style={{ display: 'flex', gap: 10 }}>
              <Button full onClick={() => setOpenId(null)}>
                关闭
              </Button>
              {todayIds.has(open.id) ? (
                <Button
                  full
                  variant="primary"
                  onClick={() => {
                    setOpenId(null)
                    go('today')
                  }}
                >
                  去记录
                </Button>
              ) : (
                <Button full variant="primary" onClick={() => addToToday(open)}>
                  <Icon name="plus" size={16} />
                  加入今天训练
                </Button>
              )}
            </div>
          ) : null
        }
      >
        {open ? <ExerciseDetail ex={open} /> : null}
      </Sheet>
    </Page>
  )
}

function ExerciseDetail({ ex }: { ex: Exercise }) {
  const guide = EXERCISE_GUIDES[ex.id]

  return (
    <div style={{ display: 'grid', gap: 14 }}>
      <div style={{ borderRadius: R.lg, overflow: 'hidden', border: `1px solid ${C.border}`, background: C.surface }}>
        <ExerciseFigure id={ex.id} label={ex.name} variant="detail" bodyPart={ex.bodyPart} />
      </div>

      {guide ? (
        <div style={{ fontSize: 11, color: C.muted, lineHeight: 1.6, padding: '0 2px', marginTop: -8 }}>
          淡色高亮为主要发力区域；双帧图中的虚线箭头表示动作方向。
        </div>
      ) : null}

      {guide ? (
        <>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {guide.primary.map((m) => (
              <span
                key={m}
                style={{
                  fontSize: 12,
                  fontWeight: 650,
                  color: PART_COLORS[ex.bodyPart],
                  background: `${PART_COLORS[ex.bodyPart]}12`,
                  border: `1px solid ${PART_COLORS[ex.bodyPart]}2a`,
                  padding: '4px 10px',
                  borderRadius: 999,
                }}
              >
                主要 · {m}
              </span>
            ))}
            {guide.secondary?.map((m) => (
              <span
                key={m}
                style={{
                  fontSize: 12,
                  color: C.textSecondary,
                  background: C.surfaceAlt,
                  border: `1px solid ${C.border}`,
                  padding: '4px 10px',
                  borderRadius: 999,
                }}
              >
                {m}
              </span>
            ))}
          </div>

          <div>
            <SectionTitle style={{ margin: '0 2px 8px' }}>怎么做</SectionTitle>
            <div style={{ display: 'grid', gap: 9 }}>
              {guide.steps.map((s, i) => (
                <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                  <span
                    className="num"
                    style={{
                      width: 21,
                      height: 21,
                      borderRadius: 999,
                      background: C.accentSoft,
                      color: C.accent,
                      fontSize: 11.5,
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flex: 'none',
                      marginTop: 1,
                    }}
                  >
                    {i + 1}
                  </span>
                  <div style={{ fontSize: 13.5, lineHeight: 1.65, color: C.textSecondary }}>{s}</div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <SectionTitle style={{ margin: '0 2px 8px' }}>关键点</SectionTitle>
            <div style={{ display: 'grid', gap: 7 }}>
              {guide.cues.map((t) => (
                <div
                  key={t}
                  style={{
                    display: 'flex',
                    gap: 8,
                    alignItems: 'flex-start',
                    background: C.successSoft,
                    borderRadius: 10,
                    padding: '8px 10px',
                  }}
                >
                  <Icon name="check" size={14} style={{ color: C.success, flex: 'none', marginTop: 3 }} />
                  <div style={{ fontSize: 13, lineHeight: 1.6, color: C.success }}>{t}</div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <SectionTitle style={{ margin: '0 2px 8px' }}>常见错误</SectionTitle>
            <div style={{ display: 'grid', gap: 7 }}>
              {guide.mistakes.map((t) => (
                <div
                  key={t}
                  style={{
                    display: 'flex',
                    gap: 8,
                    alignItems: 'flex-start',
                    background: C.warningSoft,
                    borderRadius: 10,
                    padding: '8px 10px',
                  }}
                >
                  <Icon name="x" size={13} style={{ color: C.warning, flex: 'none', marginTop: 3 }} />
                  <div style={{ fontSize: 13, lineHeight: 1.6, color: C.warning }}>{t}</div>
                </div>
              ))}
            </div>
          </div>

          {ex.restSeconds ? (
            <div style={{ fontSize: 12, color: C.muted, display: 'flex', alignItems: 'center', gap: 6 }}>
              <Icon name="timer" size={14} />
              记录时默认组间休息 {ex.restSeconds} 秒
            </div>
          ) : null}
        </>
      ) : (
        <div
          style={{
            fontSize: 13,
            color: C.textSecondary,
            lineHeight: 1.7,
            background: C.surface,
            border: `1px dashed ${C.borderStrong}`,
            borderRadius: R.md,
            padding: 14,
          }}
        >
          这是你的自定义动作，暂时没有内置图示和说明。可以按照自己的训练习惯记录；需要的话我可以再补充。
        </div>
      )}
    </div>
  )
}
