/**
 * 数据模型
 *
 * 设计原则：
 * 1. 记录发生在「某一天」→ 一天里可以练多个部位 → 每个部位下多个动作 → 每个动作多组。
 * 2. 动作名称在记录里"快照"一份（name），这样即使以后改名/删除动作库条目，历史记录也不会坏掉。
 * 3. 所有 id 由 uid() 生成；日期统一用本地时区的 'YYYY-MM-DD'，不用时间戳，避免跨时区错位。
 */

/** 身体部位（练哪里） */
export type BodyPartId =
  | 'chest'
  | 'back'
  | 'legs'
  | 'shoulders'
  | 'arms'
  | 'core'
  | 'cardio'

export interface BodyPart {
  id: BodyPartId
  name: string
  /** 主题色（浅色界面下的强调色） */
  color: string
  /** 简短图标字符 */
  icon: string
}

/** 器械类型，只用于动作库分类与筛选 */
export type Equipment =
  | 'barbell'
  | 'dumbbell'
  | 'machine'
  | 'cable'
  | 'bodyweight'
  | 'kettlebell'
  | 'other'

/** 动作库中的一个动作 */
export interface Exercise {
  id: string
  name: string
  bodyPart: BodyPartId
  equipment: Equipment
  /** 是否为用户自定义动作 */
  isCustom: boolean
  /** 建议组间休息秒数 */
  restSeconds?: number
}

/** 一组 */
export interface WorkoutSet {
  id: string
  /** 重量 kg；自重动作可为 0 */
  weight: number
  /** 次数 */
  reps: number
  /** 可选备注，如 "力竭" / "半程" */
  note?: string
  /** 是否已完成勾选 */
  done: boolean
}

/** 某一天里练的某一个动作 */
export interface ExerciseLog {
  id: string
  /** 关联动作库 id */
  exerciseId: string
  /** 动作名快照 */
  name: string
  sets: WorkoutSet[]
  /** 本动作整体备注 */
  note?: string
}

/** 某一天里练的某一个部位 */
export interface BodyPartLog {
  id: string
  bodyPart: BodyPartId
  exercises: ExerciseLog[]
}

/** 一整天的训练记录 */
export interface DayLog {
  /** 'YYYY-MM-DD' */
  date: string
  entries: BodyPartLog[]
  /** 当天整体感受/备注 */
  note?: string
  /** 每次修改写入时间戳 */
  updatedAt: number
}

/** 修为分类明细（旧规则结算与之后的新规则共用同一结构） */
export interface CultivationBreakdown {
  daily: number
  sets: number
  volume: number
  pr: number
  streak: number
}

/** 旧规则结算时的累计统计，用于和之后的新规则相加 */
export interface CultivationSnapshot {
  days: number
  sets: number
  volume: number
  prCount: number
}

/**
 * 修为结算状态。
 *
 * 修为由历史记录推导，但规则会演进。为了让旧记录不被新规则重新解释，
 * 迁移时把 cutoff 之前的历史按旧规则一次性算成「已结算修为」冻结下来；
 * cutoff 当天及以后按当前规则实时计算。
 */
export interface CultivationData {
  version: 2
  /** 从此日期起按新规则计算（本地 'YYYY-MM-DD'）；之前的日期已冻结 */
  cutoff: string
  /** 冻结期总修为 */
  settledXp: number
  /** 冻结期分类明细 */
  settledBreakdown: CultivationBreakdown
  /** 冻结期的累计统计 */
  settledStats: CultivationSnapshot
}

/** 训练模板：把一套「部位+动作」存下来复用 */
export interface WorkoutTemplate {
  id: string
  name: string
  /** 模板里的动作（按部位分组与展示顺序） */
  items: Array<{ exerciseId: string; bodyPart: BodyPartId }>
  createdAt: number
}

/** 应用全部持久化数据 */
export interface AppData {
  version: 2
  /** 以 date 为键，保证一天只有一条记录 */
  days: Record<string, DayLog>
  /** 自定义动作 */
  customExercises: Exercise[]
  /** 训练模板 */
  templates: WorkoutTemplate[]
  /** 修为结算状态（旧记录冻结 + 新规则起点） */
  cultivation: CultivationData
  /** 用户偏好 */
  settings: {
    unit: 'kg'
    defaultRestSeconds: number
    /** 是否每次完成一组后自动启动休息计时 */
    autoStartRest: boolean
    /** 是否播放计时结束提示音 */
    restSound: boolean
    /** 最近一次打开的部位 */
    lastBodyPart?: BodyPartId
  }
}
