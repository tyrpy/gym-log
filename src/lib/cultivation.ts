import type {
  AppData,
  CultivationBreakdown,
  CultivationData,
  CultivationSnapshot,
  DayLog,
  WorkoutSet,
} from '../types'
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

/** 境界色取自传统矿物颜料：苍绿、黛蓝、赭金、紫墨、赭红、石青…… */
const REALM_BASE: RealmBase[] = [
  { id: 'qi', name: '练气', char: '气', color: '#4a6b4f', levels: 4 },
  { id: 'foundation', name: '筑基', char: '筑', color: '#3f5b6b', levels: 4 },
  { id: 'gold', name: '金丹', char: '金', color: '#8a6a2f', levels: 4 },
  { id: 'nascent', name: '元婴', char: '婴', color: '#6b5578', levels: 4 },
  { id: 'spirit', name: '化神', char: '神', color: '#8f3b32', levels: 4 },
  { id: 'void', name: '炼虚', char: '虚', color: '#3f6470', levels: 4 },
  { id: 'unity', name: '合体', char: '合', color: '#7a4a63', levels: 4 },
  { id: 'mahayana', name: '大乘', char: '乘', color: '#4a4f6b', levels: 4 },
  { id: 'tribulation', name: '渡劫', char: '劫', color: '#7a2f2a', levels: 4 },
  { id: 'ascension', name: '飞升', char: '仙', color: '#8a6a1f', levels: 1 },
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

/**
 * 等级曲线：100 + 16 × k^1.6 + k^3 / 95（k = 等级 - 1），取整到 5。
 *
 * 设计目标：
 * - 前 3 级几堂课就能过，先给到反馈；
 * - 中期每级约 2–4 周，后期每级约两个月（按每周 4 练估算）；
 * - 三次项只在后期明显，让飞升前多走一段，避免后期升级过快；
 * - 满级总修为约 7.4 万，与旧曲线基本持平，迁移时不会掉级。
 *
 * 曲线在 Lv.20 之前比旧版便宜，Lv.20 之后逐级加码，满级总需求略低于旧版。
 */
const LEVEL_BASE = 100
const LEVEL_GROWTH = 16
const LEVEL_EXP = 1.6
const LEVEL_LATE = 95

function xpRequirement(level: number): number {
  if (level >= MAX_LEVEL) return 0
  const k = level - 1
  const raw = LEVEL_BASE + LEVEL_GROWTH * Math.pow(k, LEVEL_EXP) + Math.pow(k, 3) / LEVEL_LATE
  return Math.round(raw / 5) * 5
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

/**
 * 当前修为规则。
 *
 * 与旧版的区别：只统计「打勾完成」的组。复制模板、按上次预填但没做的组，
 * 都不再产生修为，避免一键复制就白拿一天修为。
 */
export const CULTIVATION_RULES = {
  version: 2 as const,
  /** 每个训练日的基础修为（当天至少完成 1 组） */
  dailyBase: 40,
  /** 每完成一组 */
  perSet: 12,
  /** 组数部分单日上限 */
  maxSetXp: 60,
  /** 每多少 kg 训练容量 +1 修为 */
  volumeStep: 250,
  /** 容量部分单日上限 */
  maxVolumeXp: 40,
  /** 每个动作刷新重量纪录 */
  perPr: 60,
  /** 破纪录部分单日上限 */
  maxPrXp: 120,
} as const

export interface CultivationStats {
  totalXp: number
  /** 冻结期（旧规则结算）的修为 */
  settledXp: number
  /** 新规则从哪一天开始（该日及以后） */
  cutoff: string
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

function emptyBreakdown(): CultivationBreakdown {
  return { daily: 0, sets: 0, volume: 0, pr: 0, streak: 0 }
}

function emptySnapshot(): CultivationSnapshot {
  return { days: 0, sets: 0, volume: 0, prCount: 0 }
}

function sumBreakdown(b: CultivationBreakdown): number {
  return b.daily + b.sets + b.volume + b.pr + b.streak
}

function daySets(day: DayLog): WorkoutSet[] {
  return day.entries.flatMap((entry) => entry.exercises.flatMap((ex) => ex.sets))
}

/** 计入修为的「有效组」：勾选完成且次数大于 0（自重动作的重量可以为 0） */
function isCompletedSet(set: WorkoutSet): boolean {
  return set.done && set.reps > 0
}

function sumVolume(sets: WorkoutSet[]): number {
  return sets.reduce((s, x) => s + x.weight * x.reps, 0)
}

/** 表示「没有冻结期」的哨兵日期：所有记录都按当前规则计算 */
const NO_SETTLEMENT = '0000-01-01'

/** 一个新的、没有历史结算的修为状态 */
export function emptyCultivation(cutoff = NO_SETTLEMENT): CultivationData {
  return {
    version: 2,
    cutoff,
    settledXp: 0,
    settledBreakdown: emptyBreakdown(),
    settledStats: emptySnapshot(),
  }
}

/**
 * 迁移：把 cutoff 之前的记录按旧规则（v1）一次性结算并冻结。
 *
 * 旧规则（v1）：
 * - 每个有记录的日子 +80（不要求完成）
 * - 每组 +6，单日上限 36
 * - 每 200kg +1，单日上限 40
 * - 每个动作破重量纪录 +40，单日上限 120
 * - 连续里程碑一次性奖励
 *
 * 这里刻意保留旧口径，是为了让历史等级不被新规则追溯改写。
 */
export function seedCultivation(data: AppData, cutoff = todayKey()): CultivationData {
  const breakdown = emptyBreakdown()
  const stats = emptySnapshot()
  const bestWeight = new Map<string, number>()
  let streak = 0
  let prevDate: string | null = null

  for (const date of Object.keys(data.days).sort()) {
    if (date >= cutoff) break

    const day = data.days[date]
    const sets = daySets(day)
    if (sets.length === 0) continue

    const volume = sumVolume(sets)
    stats.days += 1
    stats.sets += sets.length
    stats.volume += volume

    breakdown.daily += 80
    breakdown.sets += Math.min(36, sets.length * 6)
    breakdown.volume += Math.min(40, Math.floor(volume / 200))

    let dayPrs = 0
    for (const entry of day.entries) {
      for (const ex of entry.exercises) {
        if (ex.sets.length === 0) continue
        const bestToday = Math.max(...ex.sets.map((s) => s.weight))
        const prevBest = bestWeight.get(ex.exerciseId) ?? 0
        if (prevBest > 0 && bestToday > prevBest) dayPrs += 1
        if (bestToday > prevBest) bestWeight.set(ex.exerciseId, bestToday)
      }
    }
    stats.prCount += dayPrs
    breakdown.pr += Math.min(120, dayPrs * 40)

    streak = prevDate && shiftDateKey(prevDate, 1) === date ? streak + 1 : 1
    prevDate = date
    const milestone = STREAK_MILESTONES.find((m) => m.days === streak)
    if (milestone) breakdown.streak += milestone.xp
  }

  return {
    version: 2,
    cutoff,
    settledXp: sumBreakdown(breakdown),
    settledBreakdown: breakdown,
    settledStats: stats,
  }
}

/**
 * 计算当前修为。
 *
 * - cutoff 之前：使用冻结的结算值，不再逐日重算；
 * - cutoff 当天及以后：按当前规则逐日计算，且只有打勾完成的组有效；
 * - 连续天数也按同一口径：旧记录有记录即算，新记录至少完成一组才算。
 */
export function getCultivation(data: AppData): CultivationStats {
  // 兼容直接传入的旧数据（没有 cultivation 字段）：当作全部按当前规则计算
  const cultivation = (data as Partial<AppData>).cultivation ?? emptyCultivation()
  const cutoff = cultivation.cutoff
  const settledBreakdown = { ...emptyBreakdown(), ...cultivation.settledBreakdown }
  const settledStats = { ...emptySnapshot(), ...cultivation.settledStats }
  const settledXp = cultivation.settledXp || sumBreakdown(settledBreakdown)

  const dates = Object.keys(data.days)
    .filter((d) => daySets(data.days[d]).length > 0)
    .sort()

  // 哪些日子算「练了」：旧记录有组即算（沿用旧口径），新记录至少完成一组
  const counted = new Set<string>()
  for (const date of dates) {
    const sets = daySets(data.days[date])
    const ok = date < cutoff ? sets.length > 0 : sets.some(isCompletedSet)
    if (ok) counted.add(date)
  }

  let maxStreak = 0
  let run = 0
  let prev: string | null = null
  for (const date of [...counted].sort()) {
    run = prev && shiftDateKey(prev, 1) === date ? run + 1 : 1
    maxStreak = Math.max(maxStreak, run)
    prev = date
  }

  const live = emptyBreakdown()
  let liveDays = 0
  let liveSets = 0
  let liveVolume = 0
  let livePrs = 0
  const bestWeight = new Map<string, number>()

  let streakRun = 0
  let prevCounted: string | null = null

  for (const date of dates) {
    const day = data.days[date]
    const allSets = daySets(day)
    const isSettled = date < cutoff
    const countsToday = counted.has(date)

    // 连续天数：结算期与实时期共用一条链，但口径按各自时代判断
    streakRun = countsToday
      ? prevCounted && shiftDateKey(prevCounted, 1) === date
        ? streakRun + 1
        : 1
      : 0
    prevCounted = countsToday ? date : null

    // 新规则只认完成组；旧记录的结算已经包含未完成组，这里不再重算
    const effectiveSets = isSettled ? allSets : allSets.filter(isCompletedSet)

    if (!isSettled && countsToday) {
      const volume = sumVolume(effectiveSets)
      liveDays += 1
      liveSets += effectiveSets.length
      liveVolume += volume

      live.daily += CULTIVATION_RULES.dailyBase
      live.sets += Math.min(
        CULTIVATION_RULES.maxSetXp,
        effectiveSets.length * CULTIVATION_RULES.perSet,
      )
      live.volume += Math.min(
        CULTIVATION_RULES.maxVolumeXp,
        Math.floor(volume / CULTIVATION_RULES.volumeStep),
      )

      let dayPrs = 0
      for (const entry of day.entries) {
        for (const ex of entry.exercises) {
          const exSets = ex.sets.filter(isCompletedSet)
          if (exSets.length === 0) continue
          const bestToday = Math.max(...exSets.map((s) => s.weight))
          const prevBest = bestWeight.get(ex.exerciseId) ?? 0
          if (prevBest > 0 && bestToday > prevBest) dayPrs += 1
        }
      }
      livePrs += dayPrs
      live.pr += Math.min(CULTIVATION_RULES.maxPrXp, dayPrs * CULTIVATION_RULES.perPr)

      const milestone = STREAK_MILESTONES.find((m) => m.days === streakRun)
      if (milestone) live.streak += milestone.xp
    }

    // 更新历史最好成绩：结算期沿用旧口径（全部组），实时期只看完成组
    for (const entry of day.entries) {
      for (const ex of entry.exercises) {
        const exSets = isSettled ? ex.sets : ex.sets.filter(isCompletedSet)
        if (exSets.length === 0) continue
        const bestToday = Math.max(...exSets.map((s) => s.weight))
        if (bestToday > (bestWeight.get(ex.exerciseId) ?? 0)) {
          bestWeight.set(ex.exerciseId, bestToday)
        }
      }
    }
  }

  const breakdown: CultivationBreakdown = {
    daily: settledBreakdown.daily + live.daily,
    sets: settledBreakdown.sets + live.sets,
    volume: settledBreakdown.volume + live.volume,
    pr: settledBreakdown.pr + live.pr,
    streak: settledBreakdown.streak + live.streak,
  }
  const totalXp = settledXp + sumBreakdown(live)

  let levelIndex = 0
  for (let i = 0; i < LEVELS.length; i++) {
    if (totalXp >= LEVELS[i].xpTotal) levelIndex = i
  }
  const level = LEVELS[levelIndex]
  const next = LEVELS[levelIndex + 1] ?? null
  const xpIntoLevel = totalXp - level.xpTotal
  const xpForNext = next ? level.xpToNext : 0
  const progress = next ? Math.max(0, Math.min(1, xpIntoLevel / xpForNext)) : 1

  const today = todayKey()
  let cursorDate = counted.has(today) ? today : shiftDateKey(today, -1)
  let currentStreak = 0
  while (counted.has(cursorDate)) {
    currentStreak += 1
    cursorDate = shiftDateKey(cursorDate, -1)
  }

  const titles = STREAK_MILESTONES.filter((m) => maxStreak >= m.days).map((m) => m.title)
  const activeTitle = titles.length ? titles[titles.length - 1] : null
  const nextMilestone = STREAK_MILESTONES.find((m) => m.days > currentStreak) ?? null
  const prevMilestone = [...STREAK_MILESTONES].reverse().find((m) => m.days <= currentStreak) ?? null

  return {
    totalXp,
    settledXp,
    cutoff,
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
    trainingDays: settledStats.days + liveDays,
    totalSets: settledStats.sets + liveSets,
    totalVolume: settledStats.volume + liveVolume,
    prCount: settledStats.prCount + livePrs,
    nextMilestone,
    prevMilestone,
  }
}

export function realmOfLevel(level: number): RealmDef {
  return REALMS.find((r) => level >= r.startLevel && level <= r.endLevel) ?? REALMS[0]
}
