import { useMemo, useState } from 'react'
import type { BodyPartId, Equipment, Exercise } from '../types'
import { BODY_PART_MAP, PRESET_EXERCISES, EQUIPMENT_LABEL } from '../data/exercises'
import { C, R } from '../ui/tokens'
import { Icon } from '../ui/Icon'
import { Sheet } from '../ui/Sheet'
import { Button, Chip, inputStyle } from '../ui/base'
import { toast } from '../ui/toast'
import { uid } from '../lib/utils'
import { useGym } from '../state/gym'
import { addCustomExercise } from '../lib/store'

const EQUIPMENTS: Equipment[] = ['barbell', 'dumbbell', 'machine', 'cable', 'bodyweight', 'kettlebell', 'other']

/**
 * 从动作库里选动作。
 * - 按部位预筛选，可搜索、可切"全部"
 * - 已添加的动作显示为禁用
 * - 可直接在此新建自定义动作
 */
export function ExercisePicker({
  open,
  onClose,
  bodyPart,
  existIds,
  onPick,
  title = '选择动作',
}: {
  open: boolean
  onClose: () => void
  bodyPart?: BodyPartId
  existIds: string[]
  onPick: (ex: Exercise) => void
  title?: string
}) {
  const { data, update } = useGym()
  const [filter, setFilter] = useState<BodyPartId | 'all'>(bodyPart ?? 'all')
  const [q, setQ] = useState('')
  const [creating, setCreating] = useState(false)

  const [newName, setNewName] = useState('')
  const [newPart, setNewPart] = useState<BodyPartId>(bodyPart ?? 'chest')
  const [newEquip, setNewEquip] = useState<Equipment>('machine')

  const library = useMemo(() => [...PRESET_EXERCISES, ...data.customExercises], [data.customExercises])

  const list = useMemo(() => {
    const kw = q.trim().toLowerCase()
    return library
      .filter((e) => (filter === 'all' ? true : e.bodyPart === filter))
      .filter((e) => (kw ? e.name.toLowerCase().includes(kw) : true))
      .sort((a, b) => {
        // 同部位优先，其次自定义在前
        if (a.bodyPart !== b.bodyPart) return a.bodyPart.localeCompare(b.bodyPart)
        if (a.isCustom !== b.isCustom) return a.isCustom ? -1 : 1
        return 0
      })
  }, [library, filter, q])

  const visibleParts = bodyPart ? [bodyPart] : (Object.keys(BODY_PART_MAP) as BodyPartId[])

  const close = () => {
    setQ('')
    setCreating(false)
    setNewName('')
    onClose()
  }

  const submitNew = () => {
    const name = newName.trim()
    if (!name) {
      toast('给动作起个名字')
      return
    }
    if (library.some((e) => e.name === name)) {
      toast('动作库里已经有同名动作了')
      return
    }
    const ex: Exercise = {
      id: uid('custom-'),
      name,
      bodyPart: newPart,
      equipment: newEquip,
      isCustom: true,
      restSeconds: 90,
    }
    update((d) => addCustomExercise(d, ex))
    onPick(ex)
    close()
    toast(`已添加「${name}」`, 'success')
  }

  return (
    <Sheet open={open} onClose={close} title={title} subtitle="选好后可以直接开始填重量次数" maxHeight="90vh">
      {creating ? (
        <div style={{ display: 'grid', gap: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button onClick={() => setCreating(false)} style={{ color: C.textSecondary, display: 'flex' }}>
              <Icon name="left" size={18} />
            </button>
            <div style={{ fontWeight: 700, fontSize: 16 }}>新建自定义动作</div>
          </div>
          <div style={{ display: 'grid', gap: 6 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: C.textSecondary }}>动作名称</div>
            <input
              autoFocus
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="例如：绳索面拉 / 罗马椅挺身"
              style={inputStyle}
            />
          </div>
          <div style={{ display: 'grid', gap: 6 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: C.textSecondary }}>练的部位</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {visibleParts.map((p) => (
                <Chip
                  key={p}
                  active={newPart === p}
                  color={BODY_PART_MAP[p].color}
                  onClick={() => setNewPart(p)}
                >
                  {BODY_PART_MAP[p].name}
                </Chip>
              ))}
            </div>
          </div>
          <div style={{ display: 'grid', gap: 6 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: C.textSecondary }}>器械</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {EQUIPMENTS.map((eq) => (
                <Chip key={eq} active={newEquip === eq} onClick={() => setNewEquip(eq)}>
                  {EQUIPMENT_LABEL[eq]}
                </Chip>
              ))}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
            <Button onClick={() => setCreating(false)} full>
              取消
            </Button>
            <Button variant="primary" onClick={submitNew} full>
              创建并添加
            </Button>
          </div>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: 12 }}>
          <div style={{ position: 'relative' }}>
            <div style={{ position: 'absolute', left: 12, top: 12, color: C.muted, display: 'flex' }}>
              <Icon name="search" size={18} />
            </div>
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="搜索动作，如 卧推 / 深蹲"
              style={{ ...inputStyle, paddingLeft: 38, background: C.surface }}
            />
          </div>

          <div style={{ display: 'flex', gap: 7, overflowX: 'auto', paddingBottom: 2, margin: '0 -18px', padding: '0 18px 2px' }}>
            {bodyPart ? null : (
              <Chip active={filter === 'all'} onClick={() => setFilter('all')}>
                全部
              </Chip>
            )}
            {visibleParts.map((p) => (
              <Chip
                key={p}
                active={filter === p}
                color={BODY_PART_MAP[p].color}
                onClick={() => setFilter(p)}
              >
                {BODY_PART_MAP[p].name}
              </Chip>
            ))}
          </div>

          <div style={{ display: 'grid', gap: 8 }}>
            {list.length === 0 ? (
              <div style={{ padding: '26px 0', textAlign: 'center', color: C.muted, fontSize: 14 }}>
                没找到「{q}」，可以直接新建
              </div>
            ) : (
              list.map((ex) => {
                const added = existIds.includes(ex.id)
                return (
                  <button
                    key={ex.id}
                    disabled={added}
                    onClick={() => {
                      onPick(ex)
                      close()
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      textAlign: 'left',
                      background: C.surface,
                      border: `1px solid ${C.border}`,
                      borderRadius: R.md,
                      padding: '11px 14px',
                      opacity: added ? 0.5 : 1,
                    }}
                  >
                    <div
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: 99,
                        background: BODY_PART_MAP[ex.bodyPart].color,
                        flex: 'none',
                      }}
                    />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 14.5, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
                        {ex.name}
                        {ex.isCustom ? (
                          <span
                            style={{
                              fontSize: 10.5,
                              fontWeight: 600,
                              color: C.info,
                              background: C.infoSoft,
                              padding: '1px 5px',
                              borderRadius: 4,
                            }}
                          >
                            自定义
                          </span>
                        ) : null}
                      </div>
                      <div style={{ fontSize: 12, color: C.muted, marginTop: 1 }}>
                        {BODY_PART_MAP[ex.bodyPart].name} · {EQUIPMENT_LABEL[ex.equipment]}
                      </div>
                    </div>
                    <div style={{ color: added ? C.muted : C.accent, flex: 'none' }}>
                      <Icon name={added ? 'check' : 'plus'} size={18} />
                    </div>
                  </button>
                )
              })
            )}
          </div>

          <button
            onClick={() => {
              setCreating(true)
              setNewPart(filter === 'all' ? (bodyPart ?? 'chest') : filter)
              setNewName(q.trim())
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '12px 14px',
              borderRadius: R.md,
              border: `1px dashed ${C.borderStrong}`,
              background: 'transparent',
              color: C.textSecondary,
              fontSize: 14,
              fontWeight: 600,
            }}
          >
            <Icon name="plus" size={17} />
            没找到？新建自定义动作
          </button>
        </div>
      )}
    </Sheet>
  )
}
