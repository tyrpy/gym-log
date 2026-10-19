import type { AppData, DayLog, WorkoutSet } from '../types'
import { shiftDateKey, todayKey } from './utils'

/** 境界（大境界），每个境界再分 4 个小阶段 */
interface RealmBase {
  id: string
  name: string
  char: string
  color: string
  levels: number
}

export interface RealmDef extends RealmBase {
  startLevel: number
  endLevel: number
}

export interface LevelDef {
  level: number
  name: string
  realm: RealmDef
  stage: string
  /** 升到下一级需要的修为；满级为 0 */
  xpToNext: number
  /** 到达本级所需的累计修为 */
  xpTotal: number
}

export interface StreakMilestone {
  days: number
  xp: number
  title: string
}

export const STREAK_MILESTONES: StreakMilestone[] = [
  { days: 3, xp: 50, title: '初窥门径' },
  { days: 7, xp: 150, title: '小有所成' },
  { days: 14, xp: 300, title: '道心稳固' },
  { days: 30, xp: 600, title: '百日筑基' },
  { days: 60, xp: 1200, title: '苦修不辍' },
  { days: 100, xp: 2000, title: '百炼成钢' },
  { days: 365, xp: 5000, title: '道法自然' },
]

const REALM_BASE: RealmBase[] = [
  { id: 'qi', name: '练气', char: '气', color: '#3f9d6b', levels: 4 },
  { id: 'foundation', name: '筑基', char: '筑', color: '#2f7fd4', levels: 4 },
  { id: 'gold', name: '金丹', char: '金', color: '#c9922e', levels: 4 },
  { id: 'nascent', name: '元婴', char: '婴', color: '#8e5bd9', levels: 4 },
  { id: 'spirit', name: '化神', char: '神', color: '#d24b4b', levels: 4 },
  { id: 'void', name: '炼虚', char: '虚', color: '#2f9aa8', levels: 4 },
  { id: 'unity', name: '合体', char: '合', color: '#b34b8f', levels: 4 },
  { id: 'mahayana', name: '大乘', char: '乘', color: '#5b5bd6', levels: 4 },
  { id: 'tribulation', name: '渡劫', char: '劫', color: '#b23a3a', levels: 4 },
  { id: 'ascension', name: '飞升', char: '仙', color: '#c99a1e', levels: 1 },
]

const STAGES = ['初期', '中期', '后期', '圆满']

let cursor = 1
export const REALMS: RealmDef[] = REALM_BASE.map((r) => {
  const startLevel = cursor
  const endLevel = cursor + r.levels - 1
  cursor = endLevel + 1
  return { ...r, startLevel, endLevel }
})

export const MAX_LEVEL = REALMS[REALMS.length - 1].endLevel

/** 升到下一级所需修为：越往后越长，但保持可完成的长期曲线 */
function xpRequirement(level: number): number {
  if (level >= MAX_LEVEL) return 0
  return Math.round((100 + 20 * Math.pow(level - 1, 1.55)) / 10) * 10
}

let runningXp = 0
export const LEVELS: LevelDef[] = REALMS.flatMap((realm) =>
  Array.from({ length: realm.levels }, (_, i) => {
    const level = realm.startLevel + i
    const stage = realm.levels === 1 ? '' : STAGES[i]
    const def: LevelDef = {
      level,
      name: stage ? `${realm.name}${stage}` : realm.name,
      realm,
      stage,
      xpToNext: xpRequirement(level),
      xpTotal: runningXp,
    }
    runningXp += def.xpToNext
    return def
  }),
)

export interface CultivationBreakdown {
  daily: number
  sets: number
  volume: number
  pr: number
  streak: number
}

export interface CultivationStats {
  totalXp: number
  level: LevelDef
  next: LevelDef | null
  xpIntoLevel: number
  xpForNext: number
  progress: number
  currentStreak: number
  maxStreak: number
  titles: string[]
  activeTitle: string | null
  breakdown: CultivationBreakdown
  trainingDays: number
  totalSets: number
  totalVolume: number
  prCount: number
  nextMilestone: StreakMilestone | null
  prevMilestone: StreakMilestone | null
}

function daySets(day: DayLog): WorkoutSet[] {
  return day.entries.flatMap((entry) => entry.exercises.flatMap((ex) => ex.sets))
}

/**
 * 修为规则（全部由历史记录推导，不改动原始数据）：
 * - 每个训练日：80 基础修为
 * - 每完成 1 组：+6（每日最多 36）
 * - 每 200kg 容量：+1（每日最多 40）
 * - 每个动作当日破重量纪录：+40（每日最多 120）
 * - 连续训练达到 3/7/14/30/60/100/365 天：额外奖励
 */
export function getCultivation(data: AppData): CultivationStats {
  const dates = Object.keys(data.days)
    .filter((d) => daySets(data.days[d]).length > 0)
    .sort()

  const breakdown: CultivationBreakdown = { daily: 0, sets: 0, volume: 0, pr: 0, streak: 0 }
  let totalSets = 0
  let totalVolume = 0
  let prCount = 0
  let maxStreak = 0
  let streak = 0
  let prevDate: string | null = null
  const bestWeight = new Map<string, number>()

  for (const date of dates) {
    const day = data.days[date]
    const sets = daySets(day)
    const volume = sets.reduce((s, x) => s + x.weight * x.reps, 0)
    totalSets += sets.length
    totalVolume += volume

    breakdown.daily += 80
    breakdown.sets += Math.min(36, sets.length * 6)
    breakdown.volume += Math.min(40, Math.floor(volume / 200))

    let dayPrs = 0
    for (const entry of day.entries) {
      for (const ex of entry.exercises) {
        if (ex.sets.length === 0) continue
        const best = Math.max(...ex.sets.map((s) => s.weight))
        const prevBest = bestWeight.get(ex.exerciseId) ?? 0
        if (prevBest > 0 && best > prevBest) {
          dayPrs++
        }
        if (best > prevBest) bestWeight.set(ex.exerciseId, best)
      }
    }
    prCount += dayPrs
    breakdown.pr += Math.min(120, dayPrs * 40)

    streak = prevDate && shiftDateKey(prevDate, 1) === date ? streak + 1 : 1
    prevDate = date
    maxStreak = Math.max(maxStreak, streak)
    const milestone = STREAK_MILESTONES.find((m) => m.days === streak)
    if (milestone) breakdown.streak += milestone.xp
  }

  const totalXp =
    breakdown.daily + breakdown.sets + breakdown.volume + breakdown.pr + breakdown.streak

  let levelIndex = 0
  for (let i = 0; i < LEVELS.length; i++) {
    if (totalXp >= LEVELS[i].xpTotal) levelIndex = i
  }
  const level = LEVELS[levelIndex]
  const next = LEVELS[levelIndex + 1] ?? null
  const xpIntoLevel = totalXp - level.xpTotal
  const xpForNext = next ? level.xpToNext : 0
  const progress = next ? Math.max(0, Math.min(1, xpIntoLevel / xpForNext)) : 1

  const logged = new Set(dates)
  const today = todayKey()
  let cursorDate = logged.has(today) ? today : shiftDateKey(today, -1)
  let currentStreak = 0
  while (logged.has(cursorDate)) {
    currentStreak++
    cursorDate = shiftDateKey(cursorDate, -1)
  }

  const titles = STREAK_MILESTONES.filter((m) => maxStreak >= m.days).map((m) => m.title)
  const activeTitle = titles.length ? titles[titles.length - 1] : null
  const nextMilestone = STREAK_MILESTONES.find((m) => m.days > currentStreak) ?? null
  const prevMilestone = [...STREAK_MILESTONES].reverse().find((m) => m.days <= currentStreak) ?? null

  return {
    totalXp,
    level,
    next,
    xpIntoLevel,
    xpForNext,
    progress,
    currentStreak,
    maxStreak,
    titles,
    activeTitle,
    breakdown,
    trainingDays: dates.length,
    totalSets,
    totalVolume,
    prCount,
    nextMilestone,
    prevMilestone,
  }
}

export function realmOfLevel(level: number): RealmDef {
  return REALMS.find((r) => level >= r.startLevel && level <= r.endLevel) ?? REALMS[0]
}
