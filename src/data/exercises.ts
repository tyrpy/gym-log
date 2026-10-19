import type { BodyPart, BodyPartId, Equipment, Exercise } from '../types'

export const BODY_PARTS: BodyPart[] = [
  { id: 'chest', name: '胸', color: '#e5484d', icon: '胸' },
  { id: 'back', name: '背', color: '#0d74ce', icon: '背' },
  { id: 'legs', name: '腿', color: '#30a46c', icon: '腿' },
  { id: 'shoulders', name: '肩', color: '#f76b15', icon: '肩' },
  { id: 'arms', name: '手臂', color: '#8e5bd9', icon: '臂' },
  { id: 'core', name: '核心', color: '#d6409f', icon: '核' },
  { id: 'cardio', name: '有氧', color: '#e2a336', icon: '氧' },
]

export const BODY_PART_MAP: Record<BodyPartId, BodyPart> = Object.fromEntries(
  BODY_PARTS.map((p) => [p.id, p]),
) as Record<BodyPartId, BodyPart>

export const EQUIPMENT_LABEL: Record<Equipment, string> = {
  barbell: '杠铃',
  dumbbell: '哑铃',
  machine: '固定器械',
  cable: '绳索',
  bodyweight: '自重',
  kettlebell: '壶铃',
  other: '其他',
}

/** 预置动作库：id 固定，方便跨版本升级时仍然能对上 */
export const PRESET_EXERCISES: Exercise[] = [
  // 胸
  { id: 'bench-press', name: '杠铃卧推', bodyPart: 'chest', equipment: 'barbell', isCustom: false, restSeconds: 150 },
  { id: 'incline-bench', name: '上斜卧推', bodyPart: 'chest', equipment: 'barbell', isCustom: false, restSeconds: 150 },
  { id: 'db-bench', name: '哑铃卧推', bodyPart: 'chest', equipment: 'dumbbell', isCustom: false, restSeconds: 120 },
  { id: 'db-fly', name: '哑铃飞鸟', bodyPart: 'chest', equipment: 'dumbbell', isCustom: false, restSeconds: 90 },
  { id: 'cable-crossover', name: '绳索夹胸', bodyPart: 'chest', equipment: 'cable', isCustom: false, restSeconds: 90 },
  { id: 'push-up', name: '俯卧撑', bodyPart: 'chest', equipment: 'bodyweight', isCustom: false, restSeconds: 90 },
  { id: 'chest-press-machine', name: '坐姿推胸', bodyPart: 'chest', equipment: 'machine', isCustom: false, restSeconds: 120 },

  // 背
  { id: 'deadlift', name: '硬拉', bodyPart: 'back', equipment: 'barbell', isCustom: false, restSeconds: 180 },
  { id: 'pull-up', name: '引体向上', bodyPart: 'back', equipment: 'bodyweight', isCustom: false, restSeconds: 150 },
  { id: 'lat-pulldown', name: '高位下拉', bodyPart: 'back', equipment: 'cable', isCustom: false, restSeconds: 120 },
  { id: 'barbell-row', name: '杠铃划船', bodyPart: 'back', equipment: 'barbell', isCustom: false, restSeconds: 150 },
  { id: 'db-row', name: '单臂哑铃划船', bodyPart: 'back', equipment: 'dumbbell', isCustom: false, restSeconds: 120 },
  { id: 'seated-row', name: '坐姿划船', bodyPart: 'back', equipment: 'cable', isCustom: false, restSeconds: 120 },

  // 腿
  { id: 'squat', name: '深蹲', bodyPart: 'legs', equipment: 'barbell', isCustom: false, restSeconds: 180 },
  { id: 'front-squat', name: '前蹲', bodyPart: 'legs', equipment: 'barbell', isCustom: false, restSeconds: 180 },
  { id: 'leg-press', name: '腿举', bodyPart: 'legs', equipment: 'machine', isCustom: false, restSeconds: 150 },
  { id: 'rdl', name: '罗马尼亚硬拉', bodyPart: 'legs', equipment: 'barbell', isCustom: false, restSeconds: 150 },
  { id: 'leg-curl', name: '腿弯举', bodyPart: 'legs', equipment: 'machine', isCustom: false, restSeconds: 90 },
  { id: 'leg-extension', name: '腿屈伸', bodyPart: 'legs', equipment: 'machine', isCustom: false, restSeconds: 90 },
  { id: 'lunge', name: '箭步蹲', bodyPart: 'legs', equipment: 'dumbbell', isCustom: false, restSeconds: 120 },
  { id: 'calf-raise', name: '提踵', bodyPart: 'legs', equipment: 'machine', isCustom: false, restSeconds: 90 },

  // 肩
  { id: 'ohp', name: '杠铃推举', bodyPart: 'shoulders', equipment: 'barbell', isCustom: false, restSeconds: 150 },
  { id: 'db-shoulder-press', name: '哑铃推举', bodyPart: 'shoulders', equipment: 'dumbbell', isCustom: false, restSeconds: 120 },
  { id: 'lateral-raise', name: '侧平举', bodyPart: 'shoulders', equipment: 'dumbbell', isCustom: false, restSeconds: 60 },
  { id: 'rear-delt-fly', name: '反向飞鸟', bodyPart: 'shoulders', equipment: 'dumbbell', isCustom: false, restSeconds: 60 },
  { id: 'face-pull', name: '面拉', bodyPart: 'shoulders', equipment: 'cable', isCustom: false, restSeconds: 60 },

  // 手臂
  { id: 'barbell-curl', name: '杠铃弯举', bodyPart: 'arms', equipment: 'barbell', isCustom: false, restSeconds: 90 },
  { id: 'db-curl', name: '哑铃弯举', bodyPart: 'arms', equipment: 'dumbbell', isCustom: false, restSeconds: 90 },
  { id: 'hammer-curl', name: '锤式弯举', bodyPart: 'arms', equipment: 'dumbbell', isCustom: false, restSeconds: 90 },
  { id: 'tricep-pushdown', name: '绳索下压', bodyPart: 'arms', equipment: 'cable', isCustom: false, restSeconds: 90 },
  { id: 'skull-crusher', name: '仰卧臂屈伸', bodyPart: 'arms', equipment: 'barbell', isCustom: false, restSeconds: 90 },
  { id: 'dip', name: '双杠臂屈伸', bodyPart: 'arms', equipment: 'bodyweight', isCustom: false, restSeconds: 120 },

  // 核心
  { id: 'plank', name: '平板支撑', bodyPart: 'core', equipment: 'bodyweight', isCustom: false, restSeconds: 60 },
  { id: 'crunch', name: '卷腹', bodyPart: 'core', equipment: 'bodyweight', isCustom: false, restSeconds: 60 },
  { id: 'hanging-leg-raise', name: '悬垂举腿', bodyPart: 'core', equipment: 'bodyweight', isCustom: false, restSeconds: 60 },

  // 有氧
  { id: 'treadmill', name: '跑步机', bodyPart: 'cardio', equipment: 'machine', isCustom: false, restSeconds: 0 },
  { id: 'rowing', name: '划船机', bodyPart: 'cardio', equipment: 'machine', isCustom: false, restSeconds: 0 },
  { id: 'bike', name: '动感单车', bodyPart: 'cardio', equipment: 'machine', isCustom: false, restSeconds: 0 },
]
