import { useMemo, useState } from 'react'
import type { BodyPartId, WorkoutTemplate } from '../types'
import { BODY_PARTS, BODY_PART_MAP } from '../data/exercises'
import { PART_COLORS } from '../data/details'
import { C, R } from '../ui/tokens'
import { Icon } from '../ui/Icon'
import { Sheet } from '../ui/Sheet'
import { Button, Chip, inputStyle } from '../ui/base'
import { toast } from '../ui/toast'
import { ExercisePicker } from './ExercisePicker'
import { createTemplate, findExercise, updateTemplate } from '../lib/store'
import { useGym } from '../state/gym'

type Item = WorkoutTemplate['items'][number]

/**
 * 模板编辑器：从零搭一套「部位 + 动作」，也可以改已有模板。
 * 只存结构，不存重量；套用时再填。
 */
export function TemplateEditor({
  open,
  onClose,
  editing,
}: {
  open: boolean
  onClose: () => void
  /** 传入则是编辑，不传则是新建 */
  editing?: WorkoutTemplate | null
}) {
  const { data, update } = useGym()

  const initialItems = useMemo<Item[]>(() => editing?.items ?? [], [editing])
  const initialName = editing?.name ?? ''

  const [name, setName] = useState(initialName)
  const [items, setItems] = useState<Item[]>(initialItems)
  const [pickerFor, setPickerFor] = useState<BodyPartId | null>(null)

  // 已出现的部位（按 items 顺序），空部位也存在 parts 里以便先加部位再加动作
  const parts = useMemo(() => {
    const seen: BodyPartId[] = []
    for (const it of items) if (!seen.includes(it.bodyPart)) seen.push(it.bodyPart)
    return seen
  }, [items])

  const [extraParts, setExtraParts] = useState<BodyPartId[]>([])
  const allParts = useMemo(() => {
    const merged = [...parts]
    for (const p of extraParts) if (!merged.includes(p)) merged.push(p)
    return merged
  }, [parts, extraParts])

  const addPart = (p: BodyPartId) => {
    if (!allParts.includes(p)) setExtraParts((prev) => [...prev, p])
  }

  const removePart = (p: BodyPartId) => {
    setItems((prev) => prev.filter((i) => i.bodyPart !== p))
    setExtraParts((prev) => prev.filter((x) => x !== p))
  }

  const removeItem = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index))
  }

  const reset = () => {
    setName(editing?.name ?? '')
    setItems(editing?.items ?? [])
    setExtraParts([])
  }

  const save = () => {
    const name0 = name.trim() || '新模板'
    if (items.length === 0) {
      toast('先加一个动作')
      return
    }
    if (editing) {
      update((d) => updateTemplate(d, editing.id, { name: name0, items }))
      toast('模板已更新', 'success')
    } else {
      update((d) => createTemplate(d, name0, items))
      toast('模板已创建', 'success')
    }
    onClose()
  }

  return (
    <>
      <Sheet
        open={open}
        onClose={onClose}
        title={editing ? '编辑模板' : '新建模板'}
        subtitle="选部位、加动作，存成一套固定流程"
        maxHeight="90vh"
        footer={
          <div style={{ display: 'flex', gap: 10 }}>
            <Button full onClick={() => { reset(); onClose() }}>
              取消
            </Button>
            <Button full variant="primary" onClick={save}>
              {editing ? '保存修改' : '保存模板'}
            </Button>
          </div>
        }
      >
        <div style={{ display: 'grid', gap: 14 }}>
          {/* 名称 */}
          <div style={{ display: 'grid', gap: 6 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: C.textSecondary }}>模板名称</div>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="例如：推日（胸 + 三头）"
              style={{ ...inputStyle, background: C.surface }}
            />
          </div>

          {/* 选部位 */}
          <div style={{ display: 'grid', gap: 7 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: C.textSecondary }}>练哪些部位</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {BODY_PARTS.map((p) => {
                const on = allParts.includes(p.id)
                return (
                  <Chip
                    key={p.id}
                    active={on}
                    color={p.color}
                    onClick={() => (on ? removePart(p.id) : addPart(p.id))}
                  >
                    {p.name}
                  </Chip>
                )
              })}
            </div>
            <div style={{ fontSize: 11.5, color: C.muted }}>
              点一下加入，再点一下移除。加完部位后，在下面给每个部位添动作。
            </div>
          </div>

          {/* 各部位的动作 */}
          {allParts.length === 0 ? (
            <div
              style={{
                padding: '18px 14px',
                borderRadius: R.md,
                border: `1px dashed ${C.border}`,
                textAlign: 'center',
                fontSize: 12.5,
                color: C.muted,
                lineHeight: 1.7,
              }}
            >
              先在上面选一个部位，再给它添加动作
            </div>
          ) : (
            <div style={{ display: 'grid', gap: 10 }}>
              {allParts.map((part) => {
                const rows = items
                  .map((it, index) => ({ it, index }))
                  .filter(({ it }) => it.bodyPart === part)
                const color = PART_COLORS[part]
                return (
                  <div
                    key={part}
                    style={{
                      borderRadius: R.md,
                      border: `1px solid ${C.border}`,
                      background: C.surface,
                      overflow: 'hidden',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        padding: '9px 12px',
                        background: `${color}0d`,
                        borderBottom: rows.length ? `1px solid ${C.border}` : 'none',
                      }}
                    >
                      <span style={{ width: 6, height: 6, borderRadius: 99, background: color }} />
                      <span style={{ fontSize: 13.5, fontWeight: 650, color }}>
                        {BODY_PART_MAP[part].name}
                      </span>
                      <span style={{ fontSize: 11, color: C.muted }}>{rows.length} 个动作</span>
                      <button
                        aria-label={`移除${BODY_PART_MAP[part].name}`}
                        onClick={() => removePart(part)}
                        style={{ marginLeft: 'auto', color: C.muted, display: 'flex', padding: 2 }}
                      >
                        <Icon name="x" size={14} />
                      </button>
                    </div>

                    {rows.map(({ it, index }) => {
                      const ex = findExercise(data, it.exerciseId)
                      return (
                        <div
                          key={`${it.exerciseId}-${index}`}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 8,
                            padding: '8px 12px',
                            borderTop: `1px solid ${C.border}`,
                          }}
                        >
                          <span style={{ flex: 1, minWidth: 0, fontSize: 13 }}>
                            {ex?.name ?? '已删除的动作'}
                          </span>
                          <button
                            aria-label="移除动作"
                            onClick={() => removeItem(index)}
                            style={{ color: C.muted, display: 'flex', padding: 2 }}
                          >
                            <Icon name="x" size={14} />
                          </button>
                        </div>
                      )
                    })}

                    <button
                      onClick={() => setPickerFor(part)}
                      style={{
                        width: '100%',
                        padding: '9px 12px',
                        borderTop: `1px solid ${C.border}`,
                        color: C.textSecondary,
                        fontSize: 12.5,
                        fontWeight: 600,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 5,
                      }}
                    >
                      <Icon name="plus" size={14} />
                      添加动作
                    </button>
                  </div>
                )
              })}
            </div>
          )}

          <div style={{ fontSize: 11.5, color: C.muted, lineHeight: 1.7 }}>
            模板只记录「哪些部位、做哪些动作」，不含重量和组数；套用到某天后照常填即可。
          </div>
        </div>
      </Sheet>

      <ExercisePicker
        open={pickerFor !== null}
        onClose={() => setPickerFor(null)}
        bodyPart={pickerFor ?? undefined}
        existIds={items
          .filter((i) => i.bodyPart === pickerFor)
          .map((i) => i.exerciseId)}
        title={pickerFor ? `给「${BODY_PART_MAP[pickerFor].name}」添加动作` : '选择动作'}
        onPick={(ex) => {
          if (!pickerFor) return
          setItems((prev) => [...prev, { exerciseId: ex.id, bodyPart: pickerFor }])
          setPickerFor(null)
        }}
      />
    </>
  )
}
