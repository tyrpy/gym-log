import type {
  AppData,
  BodyPartId,
  DayLog,
  Exercise,
  ExerciseLog,
  WorkoutSet,
  WorkoutTemplate,
} from '../types'
import { PRESET_EXERCISES } from '../data/exercises'
import { setVolume, shiftDateKey, todayKey, uid } from './utils'

const STORAGE_KEY = 'gym-log:data'

export function emptyData(): AppData {
  return {
    version: 2,
    days: {},
    customExercises: [],
    templates: [],
    settings: {
      unit: 'kg',
      defaultRestSeconds: 90,
      autoStartRest: true,
      restSound: true,
    },
  }
}

export function loadData(): AppData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return emptyData()
    const parsed = JSON.parse(raw) as Partial<AppData> & { version?: number }
    if (!parsed || typeof parsed.days !== 'object' || parsed.days === null) return emptyData()
    const base = emptyData()
    return {
      ...base,
      ...parsed,
      version: 2,
      days: parsed.days ?? {},
      customExercises: parsed.customExercises ?? [],
      templates: parsed.templates ?? [],
      settings: { ...base.settings, ...(parsed.settings ?? {}) },
    }
  } catch {
    return emptyData()
  }
}

export function saveData(data: AppData): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
}

/* ---------------- 动作库查询 ---------------- */

export function allExercises(data: AppData): Exercise[] {
  return [...PRESET_EXERCISES, ...data.customExercises]
}

export function findExercise(data: AppData, id: string): Exercise | undefined {
  return allExercises(data).find((e) => e.id === id)
}

/* ---------------- 只读派生 ---------------- */

export function getDay(data: AppData, date: string): DayLog {
  return data.days[date] ?? { date, entries: [], updatedAt: 0 }
}

export function hasAnyLog(day: DayLog | undefined): boolean {
  if (!day) return false
  return day.entries.some((e) => e.exercises.some((x) => x.sets.length > 0))
}

/** 一天总容量 = 所有组 重量×次数 之和 */
export function dayVolume(day: DayLog | undefined): number {
  if (!day) return 0
  return day.entries.reduce(
    (sum, entry) =>
      sum +
      entry.exercises.reduce(
        (s, ex) => s + ex.sets.reduce((v, set) => v + setVolume(set.weight, set.reps), 0),
        0,
      ),
    0,
  )
}

/** 一天总组数 */
export function daySetCount(day: DayLog | undefined): number {
  if (!day) return 0
  return day.entries.reduce(
    (sum, entry) => sum + entry.exercises.reduce((s, ex) => s + ex.sets.length, 0),
    0,
  )
}

/** 一天完成组数（打勾的） */
export function dayDoneSetCount(day: DayLog | undefined): number {
  if (!day) return 0
  return day.entries.reduce(
    (sum, entry) => sum + entry.exercises.reduce((s, ex) => s + ex.sets.filter((x) => x.done).length, 0),
    0,
  )
}

/** 一天练到的部位（去重） */
export function dayBodyParts(day: DayLog | undefined): BodyPartId[] {
  if (!day) return []
  return [...new Set(day.entries.map((e) => e.bodyPart))]
}

/** 某个动作在历史中的最好成绩（最重一组） */
export function exerciseBestWeight(data: AppData, exerciseId: string): number {
  let best = 0
  for (const day of Object.values(data.days)) {
    for (const entry of day.entries) {
      for (const ex of entry.exercises) {
        if (ex.exerciseId !== exerciseId) continue
        for (const set of ex.sets) best = Math.max(best, set.weight)
      }
    }
  }
  return best
}

/** 某个动作最近一次记录（用于"上次练了多重"提示） */
export function lastExerciseLog(
  data: AppData,
  exerciseId: string,
  excludeDate?: string,
): { date: string; log: ExerciseLog } | null {
  const dates = Object.keys(data.days)
    .filter((d) => d !== excludeDate)
    .sort()
    .reverse()
  for (const date of dates) {
    for (const entry of data.days[date].entries) {
      const log = entry.exercises.find((ex) => ex.exerciseId === exerciseId && ex.sets.length > 0)
      if (log) return { date, log }
    }
  }
  return null
}

/** 某个动作按时间排序的历史数据点（趋势图用） */
export function exerciseHistory(
  data: AppData,
  exerciseId: string,
): Array<{ date: string; bestWeight: number; volume: number; sets: number }> {
  const points: Array<{ date: string; bestWeight: number; volume: number; sets: number }> = []
  for (const date of Object.keys(data.days).sort()) {
    for (const entry of data.days[date].entries) {
      const log = entry.exercises.find((ex) => ex.exerciseId === exerciseId && ex.sets.length > 0)
      if (!log) continue
      points.push({
        date,
        bestWeight: Math.max(...log.sets.map((s) => s.weight)),
        volume: log.sets.reduce((v, s) => v + setVolume(s.weight, s.reps), 0),
        sets: log.sets.length,
      })
      break
    }
  }
  return points
}

/** 有记录的所有日期（升序） */
export function loggedDates(data: AppData): string[] {
  return Object.keys(data.days)
    .filter((d) => hasAnyLog(data.days[d]))
    .sort()
}

/** 连续训练天数（从今天或昨天往前算） */
export function trainingStreak(data: AppData): number {
  const dates = new Set(loggedDates(data))
  const today = todayKey()
  let cursor = dates.has(today) ? today : shiftDateKey(today, -1)
  let n = 0
  while (dates.has(cursor)) {
    n++
    cursor = shiftDateKey(cursor, -1)
  }
  return n
}

/* ---------------- 变更操作（纯函数，返回新 AppData） ---------------- */

function touch(data: AppData, date: string, day: DayLog): AppData {
  return {
    ...data,
    days: { ...data.days, [date]: { ...day, updatedAt: Date.now() } },
  }
}

export function addBodyPart(data: AppData, date: string, bodyPart: BodyPartId): AppData {
  const day = getDay(data, date)
  if (day.entries.some((e) => e.bodyPart === bodyPart)) return data
  return touch(data, date, {
    ...day,
    entries: [...day.entries, { id: uid('bp-'), bodyPart, exercises: [] }],
  })
}

export function removeBodyPart(data: AppData, date: string, entryId: string): AppData {
  const day = getDay(data, date)
  return touch(data, date, { ...day, entries: day.entries.filter((e) => e.id !== entryId) })
}

export function setDayNote(data: AppData, date: string, note: string): AppData {
  const day = getDay(data, date)
  return touch(data, date, { ...day, note })
}

export function addExerciseToPart(
  data: AppData,
  date: string,
  entryId: string,
  exercise: Exercise,
): AppData {
  const day = getDay(data, date)
  const entry = day.entries.find((e) => e.id === entryId)
  if (!entry) return data
  if (entry.exercises.some((ex) => ex.exerciseId === exercise.id)) return data
  const log: ExerciseLog = {
    id: uid('ex-'),
    exerciseId: exercise.id,
    name: exercise.name,
    sets: [],
  }
  return touch(data, date, {
    ...day,
    entries: day.entries.map((e) =>
      e.id === entryId ? { ...e, exercises: [...e.exercises, log] } : e,
    ),
  })
}

export function removeExercise(
  data: AppData,
  date: string,
  entryId: string,
  logId: string,
): AppData {
  const day = getDay(data, date)
  return touch(data, date, {
    ...day,
    entries: day.entries.map((e) =>
      e.id === entryId ? { ...e, exercises: e.exercises.filter((x) => x.id !== logId) } : e,
    ),
  })
}

export function addSet(
  data: AppData,
  date: string,
  entryId: string,
  logId: string,
  preset?: Partial<Omit<WorkoutSet, 'id'>>,
): AppData {
  const day = getDay(data, date)
  return touch(data, date, {
    ...day,
    entries: day.entries.map((e) => {
      if (e.id !== entryId) return e
      return {
        ...e,
        exercises: e.exercises.map((x) => {
          if (x.id !== logId) return x
          const last = x.sets[x.sets.length - 1]
          const set: WorkoutSet = {
            id: uid('set-'),
            weight: preset?.weight ?? last?.weight ?? 0,
            reps: preset?.reps ?? last?.reps ?? 10,
            note: preset?.note,
            done: false,
          }
          return { ...x, sets: [...x.sets, set] }
        }),
      }
    }),
  })
}

/** 复制上一组 */
export function duplicateLastSet(
  data: AppData,
  date: string,
  entryId: string,
  logId: string,
): AppData {
  const day = getDay(data, date)
  let preset: Partial<WorkoutSet> | undefined
  for (const e of day.entries) {
    for (const x of e.exercises) {
      if (x.id === logId) preset = x.sets[x.sets.length - 1]
    }
  }
  return addSet(data, date, entryId, logId, preset)
}

export function updateSet(
  data: AppData,
  date: string,
  entryId: string,
  logId: string,
  setId: string,
  patch: Partial<Omit<WorkoutSet, 'id'>>,
): AppData {
  const day = getDay(data, date)
  return touch(data, date, {
    ...day,
    entries: day.entries.map((e) =>
      e.id !== entryId
        ? e
        : {
            ...e,
            exercises: e.exercises.map((x) =>
              x.id !== logId
                ? x
                : { ...x, sets: x.sets.map((s) => (s.id === setId ? { ...s, ...patch } : s)) },
            ),
          },
    ),
  })
}

export function removeSet(
  data: AppData,
  date: string,
  entryId: string,
  logId: string,
  setId: string,
): AppData {
  const day = getDay(data, date)
  return touch(data, date, {
    ...day,
    entries: day.entries.map((e) =>
      e.id !== entryId
        ? e
        : {
            ...e,
            exercises: e.exercises.map((x) =>
              x.id !== logId ? x : { ...x, sets: x.sets.filter((s) => s.id !== setId) },
            ),
          },
    ),
  })
}

export function addCustomExercise(data: AppData, exercise: Omit<Exercise, 'isCustom'>): AppData {
  return {
    ...data,
    customExercises: [...data.customExercises, { ...exercise, isCustom: true }],
  }
}

export function removeCustomExercise(data: AppData, exerciseId: string): AppData {
  return {
    ...data,
    customExercises: data.customExercises.filter((e) => e.id !== exerciseId),
    templates: data.templates.map((t) => ({
      ...t,
      items: t.items.filter((i) => i.exerciseId !== exerciseId),
    })),
  }
}

export function updateSettings(data: AppData, patch: Partial<AppData['settings']>): AppData {
  return { ...data, settings: { ...data.settings, ...patch } }
}

/* ---------------- 模板 ---------------- */

export function saveTemplateFromDay(data: AppData, date: string, name: string): AppData {
  const day = getDay(data, date)
  const items = day.entries.flatMap((entry) =>
    entry.exercises.map((ex) => ({ exerciseId: ex.exerciseId, bodyPart: entry.bodyPart })),
  )
  if (items.length === 0) return data
  const template: WorkoutTemplate = { id: uid('tpl-'), name, items, createdAt: Date.now() }
  return { ...data, templates: [...data.templates, template] }
}

export function removeTemplate(data: AppData, templateId: string): AppData {
  return { ...data, templates: data.templates.filter((t) => t.id !== templateId) }
}

/** 把模板应用到某一天：清空当天已有记录后按模板重建（保留动作名快照） */
export function applyTemplateToDay(data: AppData, date: string, template: WorkoutTemplate): AppData {
  const entries: BodyPartLogT[] = []
  for (const item of template.items) {
    const ex = findExercise(data, item.exerciseId)
    if (!ex) continue
    let entry = entries.find((e) => e.bodyPart === item.bodyPart)
    if (!entry) {
      entry = { id: uid('bp-'), bodyPart: item.bodyPart, exercises: [] }
      entries.push(entry)
    }
    if (entry.exercises.some((x) => x.exerciseId === ex.id)) continue
    entry.exercises.push({
      id: uid('ex-'),
      exerciseId: ex.id,
      name: ex.name,
      sets: [],
    })
  }
  if (entries.length === 0) return data
  return touch(data, date, { date, entries, updatedAt: Date.now() })
}

type BodyPartLogT = DayLog['entries'][number]

/** 把某天记录完整复制到另一天（覆盖目标日） */
export function copyDay(data: AppData, from: string, to: string): AppData {
  const source = data.days[from]
  if (!source || from === to) return data
  const clone: DayLog = {
    ...source,
    date: to,
    updatedAt: Date.now(),
    entries: source.entries.map((entry) => ({
      ...entry,
      id: uid('bp-'),
      exercises: entry.exercises.map((ex) => ({
        ...ex,
        id: uid('ex-'),
        sets: ex.sets.map((s) => ({ ...s, id: uid('set-'), done: false })),
      })),
    })),
  }
  return { ...data, days: { ...data.days, [to]: clone } }
}

/** 把最近一次（或指定日期的）训练结构复制到目标日 */
export function shiftLastSessionToDate(data: AppData, to: string, from?: string): AppData {
  if (from) return copyDay(data, from, to)
  const dates = loggedDates(data).filter((d) => d < to)
  if (dates.length === 0) return data
  return copyDay(data, dates[dates.length - 1], to)
}
/* ---------------- 内置模板 ---------------- */

interface PresetTemplate {
  name: string
  /** [actionId, 部位] */
  items: Array<[string, BodyPartId]>
}

/**
 * 推/拉/腿 三分化起点。
 * 动作都在预置动作库里；用户可以在模板面板里自行改名、删动作。
 */
export const DEFAULT_TEMPLATES: PresetTemplate[] = [
  {
    name: '推日 · 胸肩三头',
    items: [
      ['bench-press', 'chest'],
      ['incline-bench', 'chest'],
      ['db-shoulder-press', 'shoulders'],
      ['lateral-raise', 'shoulders'],
      ['tricep-pushdown', 'arms'],
      ['skull-crusher', 'arms'],
    ],
  },
  {
    name: '拉日 · 背二头',
    items: [
      ['deadlift', 'back'],
      ['lat-pulldown', 'back'],
      ['barbell-row', 'back'],
      ['face-pull', 'shoulders'],
      ['barbell-curl', 'arms'],
      ['hammer-curl', 'arms'],
    ],
  },
  {
    name: '腿日 · 下肢',
    items: [
      ['squat', 'legs'],
      ['rdl', 'legs'],
      ['leg-press', 'legs'],
      ['leg-curl', 'legs'],
      ['calf-raise', 'legs'],
    ],
  },
  {
    name: '全身 · 新手适应',
    items: [
      ['squat', 'legs'],
      ['bench-press', 'chest'],
      ['barbell-row', 'back'],
      ['db-shoulder-press', 'shoulders'],
      ['plank', 'core'],
    ],
  },
]

/** 追加一套内置模板（同名已存在则跳过） */
export function addDefaultTemplates(data: AppData, onlyNames?: string[]): AppData {
  const existing = new Set(data.templates.map((t) => t.name))
  const wanted = onlyNames ? DEFAULT_TEMPLATES.filter((t) => onlyNames.includes(t.name)) : DEFAULT_TEMPLATES
  const newOnes: WorkoutTemplate[] = []
  for (const t of wanted) {
    if (existing.has(t.name)) continue
    newOnes.push({
      id: uid('tpl-'),
      name: t.name,
      items: t.items.map(([exerciseId, bodyPart]) => ({ exerciseId, bodyPart })),
      createdAt: Date.now(),
    })
  }
  if (newOnes.length === 0) return data
  return { ...data, templates: [...data.templates, ...newOnes] }
}
/* ---------------- 导入导出 ---------------- */

export function exportJson(data: AppData): string {
  return JSON.stringify({ app: 'gym-log', exportedAt: new Date().toISOString(), data }, null, 2)
}

export function importJson(raw: string): AppData | null {
  try {
    const parsed = JSON.parse(raw) as { app?: string; data?: AppData } | AppData
    const candidate = 'data' in parsed && parsed.data ? parsed.data : (parsed as AppData)
    if (!candidate || typeof candidate.days !== 'object') return null
    const base = emptyData()
    return {
      ...base,
      ...candidate,
      version: 2,
      days: candidate.days ?? {},
      customExercises: candidate.customExercises ?? [],
      templates: candidate.templates ?? [],
      settings: { ...base.settings, ...(candidate.settings ?? {}) },
    }
  } catch {
    return null
  }
}

/* ---------------- 示例数据 ---------------- */

/** 生成示例数据（仅用于预览/演示） */
export function sampleData(): AppData {
  const data = emptyData()
  const today = todayKey()

  const mk = (
    date: string,
    bodyPart: BodyPartId,
    exs: Array<[string, string, Array<[number, number]>]>,
  ): DayLog => ({
    date,
    updatedAt: Date.now(),
    entries: [
      {
        id: uid('bp-'),
        bodyPart,
        exercises: exs.map(([exerciseId, name, sets]) => ({
          id: uid('ex-'),
          exerciseId,
          name,
          sets: sets.map(([weight, reps]) => ({ id: uid('set-'), weight, reps, done: true })),
        })),
      },
    ],
  })

  data.days[today] = mk(today, 'chest', [
    ['bench-press', '杠铃卧推', [[60, 10], [65, 8], [65, 8]]],
    ['db-fly', '哑铃飞鸟', [[12, 12], [12, 12]]],
  ])
  const d2 = shiftDateKey(today, -2)
  data.days[d2] = mk(d2, 'legs', [
    ['squat', '深蹲', [[80, 8], [85, 6], [85, 6]]],
    ['leg-press', '腿举', [[120, 12], [120, 12]]],
  ])
  const d3 = shiftDateKey(today, -5)
  data.days[d3] = mk(d3, 'back', [
    ['deadlift', '硬拉', [[100, 5], [110, 5], [110, 3]]],
    ['lat-pulldown', '高位下拉', [[45, 12], [45, 12]]],
  ])
  return data
}
