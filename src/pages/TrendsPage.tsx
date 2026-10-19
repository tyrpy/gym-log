import { useMemo, useState } from 'react'
import { C } from '../ui/tokens'
import { Icon } from '../ui/Icon'
import { Page, PageHeader, SectionTitle, Stat } from '../ui/layout'
import { Button, Card, Chip, Segmented } from '../ui/base'
import { ExercisePicker } from '../components/ExercisePicker'
import { TrendChart } from '../components/TrendChart'
import { useGym } from '../state/gym'
import { exerciseHistory, findExercise } from '../lib/store'
import { fmtNumber, formatDateShort } from '../lib/utils'
import { BODY_PART_MAP } from '../data/exercises'
import { PART_COLORS } from '../data/details'

type Metric = 'weight' | 'volume'

export function TrendsPage() {
  const { data } = useGym()
  const [metric, setMetric] = useState<Metric>('weight')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [pickerOpen, setPickerOpen] = useState(false)

  // 练过的动作（按最近出现排序）
  const trainedIds = useMemo(() => {
    const ids = new Set<string>()
    for (const day of Object.values(data.days)) {
      for (const entry of day.entries) {
        for (const ex of entry.exercises) {
          if (ex.sets.length > 0) ids.add(ex.exerciseId)
        }
      }
    }
    return [...ids]
  }, [data.days])

  const activeId = selectedId && trainedIds.includes(selectedId) ? selectedId : trainedIds[0] ?? null
  const activeEx = activeId ? findExercise(data, activeId) : undefined
  const history = activeId ? exerciseHistory(data, activeId) : []

  const latest = history[history.length - 1]
  const prev = history[history.length - 2]
  const best = history.length ? Math.max(...history.map((h) => h.bestWeight)) : 0
  const totalVolume = history.reduce((s, h) => s + h.volume, 0)
  const delta = latest && prev ? latest.bestWeight - prev.bestWeight : 0

  return (
    <Page>
      <PageHeader
        title="进步趋势"
        subtitle={history.length > 0 ? `${history.length} 次记录` : '记录几次后就能看到趋势'}
        right={
          <Button size="sm" variant="soft" onClick={() => setPickerOpen(true)}>
            <Icon name="search" size={14} />
            选动作
          </Button>
        }
      />

      {activeId ? (
        <>
          {/* 当前动作 */}
          <Card style={{ marginTop: 14, padding: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 12,
                  background: `${PART_COLORS[activeEx?.bodyPart ?? 'chest']}14`,
                  color: PART_COLORS[activeEx?.bodyPart ?? 'chest'],
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flex: 'none',
                  fontWeight: 700,
                  fontSize: 15,
                }}
              >
                {activeEx ? BODY_PART_MAP[activeEx.bodyPart].icon : '?'}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 16, fontWeight: 700 }}>{activeEx?.name ?? activeId}</div>
                <div style={{ fontSize: 12, color: C.muted }}>
                  {activeEx ? BODY_PART_MAP[activeEx.bodyPart].name : '自定义动作'}
                </div>
              </div>
              <Segmented
                value={metric}
                onChange={setMetric}
                options={[
                  { value: 'weight', label: '重量' },
                  { value: 'volume', label: '容量' },
                ]}
              />
            </div>

            <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
              <Stat label="最新" value={fmtNumber(latest?.bestWeight ?? 0)} unit="kg" />
              <Stat label="最好" value={fmtNumber(best)} unit="kg" tone={C.accent} />
              <Stat label="次数" value={history.length} unit="次" />
            </div>
            {delta !== 0 ? (
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                  marginTop: 10,
                  fontSize: 12.5,
                  fontWeight: 600,
                  color: delta > 0 ? C.success : C.muted,
                  background: delta > 0 ? C.successSoft : C.surfaceAlt,
                  padding: '4px 10px',
                  borderRadius: 999,
                }}
              >
                <Icon name={delta > 0 ? 'up' : 'down'} size={13} />
                比上次{delta > 0 ? '重' : '轻'} {fmtNumber(Math.abs(delta))} kg
                {latest ? <span style={{ fontWeight: 500, color: C.muted }}>（{formatDateShort(latest.date)}）</span> : null}
              </div>
            ) : null}
          </Card>

          {/* 图表 */}
          <SectionTitle
            right={
              <span style={{ fontSize: 11.5, color: C.muted }}>
                {metric === 'weight' ? '每次的最重一组' : '每次总容量'}
              </span>
            }
          >
            {metric === 'weight' ? '重量变化' : '容量变化'}
          </SectionTitle>
          <Card style={{ padding: '16px 8px 8px' }}>
            {history.length >= 2 ? (
              <TrendChart points={history} metric={metric} />
            ) : (
              <div style={{ padding: '36px 20px', textAlign: 'center', color: C.muted, fontSize: 13, lineHeight: 1.7 }}>
                只有 1 次记录，至少练 2 次才能画出趋势。
                <br />
                继续记录，图表会自动长出来。
              </div>
            )}
          </Card>

          {/* 最近练过的动作 */}
          <SectionTitle>最近练过的动作</SectionTitle>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {trainedIds.slice(0, 10).map((id) => {
              const ex = findExercise(data, id)
              return (
                <Chip key={id} active={id === activeId} onClick={() => setSelectedId(id)}>
                  {ex?.name ?? id}
                </Chip>
              )
            })}
          </div>

          <div style={{ fontSize: 12, color: C.muted, marginTop: 16, lineHeight: 1.6 }}>
            累计容量 {fmtNumber(totalVolume)} kg · 数据只存在这台设备的浏览器里
          </div>
        </>
      ) : (
        <Card style={{ marginTop: 20, padding: '30px 20px', textAlign: 'center' }}>
          <div style={{ fontSize: 15, fontWeight: 650 }}>还没有可分析的动作</div>
          <p style={{ color: C.muted, fontSize: 13, lineHeight: 1.65, margin: '6px auto 14px' }}>
            在「今天」记录至少一次训练，这里会显示每个动作的重量和容量变化。
          </p>
          <Button variant="primary" onClick={() => setPickerOpen(true)}>
            先选一个动作看看
          </Button>
        </Card>
      )}

      <ExercisePicker
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        existIds={[]}
        title="选择要分析的动作"
        onPick={(ex) => setSelectedId(ex.id)}
      />


    </Page>
  )
}
