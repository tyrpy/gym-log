import type { ReactNode } from 'react'
import {
  Barbell,
  Bench,
  CableColumn,
  Dumbbell,
  Floor,
  Mat,
  ART,
  limb,
  p,
  standing,
  type Pose,
} from '../components/FigureKit'

/**
 * 动作示意图数据。
 * - start: 起始位置；end: 完成位置
 * - back/fore: 画在人物背后/前面的器械
 * - front: 正面视角
 * - single: 只有一个姿势（如平板支撑），右侧不再显示第二帧
 */
export interface Art {
  start: Pose
  end: Pose
  back?: (frame: 'start' | 'end', pose: Pose) => ReactNode
  fore?: (frame: 'start' | 'end', pose: Pose) => ReactNode
  front?: boolean
  single?: boolean
  /** 单帧动作的描述，默认「保持」 */
  singleLabel?: string
  /** 单帧右上角的小标签 */
  tag?: string
  /** 单帧内容的水平偏移与放大（用于把 160 宽的姿势放进 330 宽的面板） */
  singleOffset?: number
  singleScale?: number
  /** 视角说明，只在详情大图中显示 */
  viewNote?: string
}

const benchPose = (arm: 'top' | 'bottom'): Pose => {
  const shoulder: [number, number] = [94, 112]
  return {
    pelvis: p(52, 114),
    chest: p(94, 114),
    head: p(111, 109),
    legs: [limb(p(48, 114), p(34, 138), p(32, 167)), limb(p(54, 114), p(40, 138), p(38, 167))],
    arms:
      arm === 'top'
        ? [
            limb(shoulder, p(99, 94), p(97, 76)),
            limb(p(90, 112), p(95, 95), p(93, 77)),
          ]
        : [
            limb(shoulder, p(77, 104), p(96, 102)),
            limb(p(90, 112), p(73, 106), p(92, 104)),
          ],
  }
}

const barAtHands = (pose: Pose, x1 = 40, x2 = 148, plate = 1) => (
  <Barbell y={pose.arms[1].c[1]} x1={x1} x2={x2} plate={plate} />
)

const dbsAtHands = (pose: Pose, size = 1.1) => (
  <>
    <Dumbbell x={pose.arms[0].c[0]} y={pose.arms[0].c[1]} size={size} />
    <Dumbbell x={pose.arms[1].c[0]} y={pose.arms[1].c[1]} size={size} />
  </>
)

export const EXERCISE_ART: Record<string, Art> = {
  'bench-press': {
    start: benchPose('top'),
    end: benchPose('bottom'),
    back: () => <Bench x1={26} y1={120} x2={126} y2={120} />,
    fore: (_f, pose) => barAtHands(pose),
  },

  'db-bench': {
    start: benchPose('top'),
    end: benchPose('bottom'),
    back: () => <Bench x1={26} y1={120} x2={126} y2={120} />,
    fore: (_f, pose) => dbsAtHands(pose),
  },

  squat: {
    start: {
      pelvis: p(78, 108),
      chest: p(78, 68),
      head: p(78, 53),
      legs: [limb(p(74, 108), p(72, 139), p(72, 167)), limb(p(82, 108), p(84, 139), p(84, 167))],
      arms: [
        limb(p(76, 70), p(62, 92), p(74, 80)),
        limb(p(84, 70), p(98, 92), p(86, 80)),
      ],
    },
    end: {
      pelvis: p(64, 122),
      chest: p(80, 88),
      head: p(84, 72),
      legs: [limb(p(60, 122), p(78, 142), p(72, 167)), limb(p(68, 122), p(86, 141), p(80, 167))],
      arms: [
        limb(p(76, 92), p(62, 110), p(74, 100)),
        limb(p(86, 92), p(100, 110), p(88, 100)),
      ],
    },
    back: (frame) => (
      <>
        <Floor y={167} />
        <Barbell y={frame === 'start' ? 80 : 100} x1={36} x2={124} plate={0.9} />
      </>
    ),
  },

  deadlift: {
    start: {
      pelvis: p(72, 106),
      chest: p(88, 82),
      head: p(94, 68),
      legs: [limb(p(68, 106), p(78, 136), p(78, 167)), limb(p(76, 106), p(86, 136), p(86, 167))],
      arms: [
        limb(p(85, 84), p(88, 120), p(90, 154)),
        limb(p(91, 84), p(94, 120), p(96, 154)),
      ],
    },
    end: {
      pelvis: p(80, 108),
      chest: p(80, 68),
      head: p(80, 53),
      legs: [limb(p(76, 108), p(76, 139), p(76, 167)), limb(p(84, 108), p(84, 139), p(84, 167))],
      arms: [
        limb(p(76, 70), p(78, 106), p(80, 142)),
        limb(p(84, 70), p(86, 106), p(88, 142)),
      ],
    },
    back: () => <Floor y={167} />,
    fore: (frame) => (
      <Barbell y={frame === 'start' ? 156 : 144} x1={40} x2={140} plate={1.15} />
    ),
  },

  rdl: {
    start: {
      ...standing(),
      arms: [
        limb(p(76, 70), p(78, 108), p(80, 146)),
        limb(p(84, 70), p(86, 108), p(88, 146)),
      ],
    },
    end: {
      pelvis: p(68, 108),
      chest: p(94, 84),
      head: p(101, 70),
      legs: [limb(p(64, 108), p(74, 138), p(74, 167)), limb(p(72, 108), p(82, 138), p(82, 167))],
      arms: [
        limb(p(91, 86), p(94, 116), p(96, 144)),
        limb(p(97, 86), p(100, 116), p(102, 144)),
      ],
    },
    back: () => <Floor y={167} />,
    fore: (_f, pose) => <Barbell y={pose.arms[1].c[1]} x1={42} x2={142} plate={1} />,
  },

  'pull-up': {
    start: {
      pelvis: p(80, 110),
      chest: p(80, 76),
      head: p(80, 62),
      legs: [
        limb(p(76, 110), p(70, 138), p(66, 164)),
        limb(p(84, 110), p(78, 138), p(74, 164)),
      ],
      arms: [
        limb(p(76, 78), p(70, 62), p(74, 48)),
        limb(p(84, 78), p(90, 62), p(86, 48)),
      ],
    },
    end: {
      pelvis: p(80, 104),
      chest: p(80, 74),
      head: p(80, 60),
      legs: [
        limb(p(76, 104), p(66, 126), p(64, 150)),
        limb(p(84, 104), p(74, 126), p(72, 150)),
      ],
      arms: [
        limb(p(76, 76), p(66, 64), p(74, 48)),
        limb(p(84, 76), p(94, 64), p(86, 48)),
      ],
    },
    back: () => (
      <g>
        <line x1={34} y1={48} x2={126} y2={48} stroke="#59636f" strokeWidth={5} strokeLinecap="round" />
        <line x1={40} y1={48} x2={40} y2={16} stroke="#c3cad3" strokeWidth={4} strokeLinecap="round" />
        <line x1={120} y1={48} x2={120} y2={16} stroke="#c3cad3" strokeWidth={4} strokeLinecap="round" />
      </g>
    ),
  },

  'barbell-row': {
    start: {
      pelvis: p(70, 108),
      chest: p(92, 84),
      head: p(99, 70),
      legs: [limb(p(66, 108), p(70, 138), p(70, 167)), limb(p(74, 108), p(78, 138), p(78, 167))],
      arms: [
        limb(p(89, 86), p(92, 114), p(94, 138)),
        limb(p(95, 86), p(98, 114), p(100, 138)),
      ],
    },
    end: {
      pelvis: p(70, 108),
      chest: p(92, 84),
      head: p(99, 70),
      legs: [limb(p(66, 108), p(70, 138), p(70, 167)), limb(p(74, 108), p(78, 138), p(78, 167))],
      arms: [
        limb(p(89, 86), p(108, 104), p(94, 110)),
        limb(p(95, 86), p(114, 104), p(100, 110)),
      ],
    },
    back: () => <Floor y={167} />,
    fore: (frame) => <Barbell y={frame === 'start' ? 138 : 110} x1={42} x2={142} plate={1} />,
  },

  'barbell-curl': {
    start: {
      ...standing(),
      arms: [
        limb(p(76, 70), p(78, 94), p(80, 112)),
        limb(p(84, 70), p(86, 94), p(88, 112)),
      ],
    },
    end: {
      ...standing(),
      arms: [
        limb(p(76, 70), p(78, 96), p(92, 80)),
        limb(p(84, 70), p(86, 96), p(100, 80)),
      ],
    },
    back: () => <Floor y={167} />,
    fore: (frame) => <Barbell y={frame === 'start' ? 112 : 80} x1={44} x2={136} plate={0.75} />,
  },

  'lateral-raise': {
    front: true,
    start: {
      pelvis: p(80, 106),
      chest: p(80, 66),
      head: p(80, 50),
      legs: [
        limb(p(74, 106), p(72, 138), p(72, 166)),
        limb(p(86, 106), p(88, 138), p(88, 166)),
      ],
      arms: [
        limb(p(70, 68), p(64, 88), p(60, 108)),
        limb(p(90, 68), p(96, 88), p(100, 108)),
      ],
    },
    end: {
      pelvis: p(80, 106),
      chest: p(80, 66),
      head: p(80, 50),
      legs: [
        limb(p(74, 106), p(72, 138), p(72, 166)),
        limb(p(86, 106), p(88, 138), p(88, 166)),
      ],
      arms: [
        limb(p(70, 68), p(50, 70), p(28, 72)),
        limb(p(90, 68), p(110, 70), p(132, 72)),
      ],
    },
    back: () => <Floor y={167} />,
    fore: (_f, pose) => dbsAtHands(pose, 0.9),
  },

  plank: {
    single: true,
    tag: '静止',
    singleOffset: 105,
    singleScale: 1.22,
    start: {
      pelvis: p(56, 138),
      chest: p(100, 132),
      head: p(116, 126),
      legs: [limb(p(52, 138), p(34, 146), p(18, 152)), limb(p(60, 138), p(42, 147), p(26, 153))],
      arms: [limb(p(96, 134), p(102, 148), p(108, 160)), limb(p(104, 132), p(110, 148), p(116, 160))],
    },
    end: {
      pelvis: p(56, 138),
      chest: p(100, 132),
      head: p(116, 126),
      legs: [limb(p(52, 138), p(34, 146), p(18, 152)), limb(p(60, 138), p(42, 147), p(26, 153))],
      arms: [limb(p(96, 134), p(102, 148), p(108, 160)), limb(p(104, 132), p(110, 148), p(116, 160))],
    },
    back: () => <Mat y={161} x1={12} x2={148} />,
  },

  'push-up': {
    start: {
      pelvis: p(60, 124),
      chest: p(100, 118),
      head: p(116, 112),
      legs: [limb(p(56, 124), p(40, 130), p(20, 136)), limb(p(64, 124), p(48, 131), p(28, 137))],
      arms: [limb(p(96, 120), p(100, 140), p(106, 160)), limb(p(104, 118), p(108, 140), p(114, 160))],
    },
    end: {
      pelvis: p(60, 128),
      chest: p(100, 132),
      head: p(116, 126),
      legs: [limb(p(56, 128), p(40, 132), p(20, 136)), limb(p(64, 128), p(48, 133), p(28, 137))],
      arms: [limb(p(96, 134), p(88, 148), p(106, 160)), limb(p(104, 132), p(96, 148), p(114, 160))],
    },
    back: () => <Mat y={164} x1={12} x2={148} />,
  },

  ohp: {
    start: {
      ...standing(),
      arms: [
        limb(p(76, 70), p(82, 90), p(72, 82)),
        limb(p(84, 70), p(90, 90), p(80, 82)),
      ],
    },
    end: {
      ...standing(),
      arms: [
        limb(p(76, 70), p(80, 50), p(78, 34)),
        limb(p(84, 70), p(88, 50), p(86, 34)),
      ],
    },
    back: () => <Floor y={167} />,
    fore: (frame) => <Barbell y={frame === 'start' ? 82 : 34} x1={46} x2={134} plate={0.85} />,
  },

  'tricep-pushdown': {
    start: {
      ...standing(),
      arms: [
        limb(p(76, 70), p(78, 96), p(82, 84)),
        limb(p(84, 70), p(86, 96), p(90, 84)),
      ],
    },
    end: {
      ...standing(),
      arms: [
        limb(p(76, 70), p(78, 100), p(82, 122)),
        limb(p(84, 70), p(86, 100), p(90, 122)),
      ],
    },
    back: (frame) => (
      <>
        <Floor y={167} />
        <CableColumn x={30} top={6} bottom={167} anchorY={30} to={frame === 'start' ? p(86, 84) : p(86, 122)} />
      </>
    ),
  },

  'incline-bench': {
    start: {
      pelvis: p(46, 124),
      chest: p(100, 102),
      head: p(116, 94),
      legs: [limb(p(42, 124), p(32, 146), p(30, 167)), limb(p(50, 124), p(40, 146), p(38, 167))],
      arms: [limb(p(100, 100), p(104, 84), p(102, 66)), limb(p(96, 100), p(100, 85), p(98, 67))],
    },
    end: {
      pelvis: p(46, 124),
      chest: p(100, 102),
      head: p(116, 94),
      legs: [limb(p(42, 124), p(32, 146), p(30, 167)), limb(p(50, 124), p(40, 146), p(38, 167))],
      arms: [limb(p(100, 100), p(82, 96), p(102, 94)), limb(p(96, 100), p(78, 98), p(98, 96))],
    },
    back: () => <Bench x1={30} y1={128} x2={120} y2={98} />,
    fore: (frame) => <Barbell y={frame === 'start' ? 66 : 94} x1={42} x2={148} plate={0.95} />,
  },

  'db-fly': {
    front: true,
    viewNote: '俯视',
    start: {
      pelvis: p(62, 84),
      chest: p(98, 84),
      head: p(114, 84),
      legs: [limb(p(58, 80), p(40, 80), p(24, 80)), limb(p(58, 88), p(40, 88), p(24, 88))],
      arms: [
        limb(p(90, 76), p(106, 64), p(114, 56)),
        limb(p(90, 92), p(106, 104), p(114, 112)),
      ],
    },
    end: {
      pelvis: p(62, 84),
      chest: p(98, 84),
      head: p(114, 84),
      legs: [limb(p(58, 80), p(40, 80), p(24, 80)), limb(p(58, 88), p(40, 88), p(24, 88))],
      arms: [
        limb(p(90, 76), p(94, 52), p(94, 30)),
        limb(p(90, 92), p(94, 116), p(94, 138)),
      ],
    },
    back: () => (
      <g>
        <rect x={16} y={74} width={128} height={20} rx={9} fill={ART.machine} />
      </g>
    ),
    fore: (_f, pose) => dbsAtHands(pose, 0.95),
  },

  'cable-crossover': {
    front: true,
    start: {
      pelvis: p(80, 106),
      chest: p(80, 68),
      head: p(80, 52),
      legs: [limb(p(74, 106), p(72, 138), p(72, 166)), limb(p(86, 106), p(88, 138), p(88, 166))],
      arms: [
        limb(p(70, 70), p(56, 84), p(42, 96)),
        limb(p(90, 70), p(104, 84), p(118, 96)),
      ],
    },
    end: {
      pelvis: p(80, 106),
      chest: p(80, 68),
      head: p(80, 52),
      legs: [limb(p(74, 106), p(72, 138), p(72, 166)), limb(p(86, 106), p(88, 138), p(88, 166))],
      arms: [
        limb(p(70, 70), p(62, 90), p(72, 98)),
        limb(p(90, 70), p(98, 90), p(88, 98)),
      ],
    },
    back: (_f, pose) => (
      <>
        <Floor y={167} />
        <CableColumn x={14} top={8} bottom={167} anchorY={44} to={pose.arms[0].c} />
        <CableColumn x={146} top={8} bottom={167} anchorY={44} to={pose.arms[1].c} />
        <line x1={14} y1={12} x2={146} y2={12} stroke={ART.machine} strokeWidth={4} />
      </>
    ),
  },

  'chest-press-machine': {
    start: {
      pelvis: p(66, 124),
      chest: p(80, 94),
      head: p(83, 80),
      legs: [limb(p(62, 124), p(92, 132), p(94, 166)), limb(p(70, 124), p(100, 133), p(102, 166))],
      arms: [limb(p(80, 96), p(96, 104), p(110, 100)), limb(p(76, 96), p(92, 106), p(106, 102))],
    },
    end: {
      pelvis: p(66, 124),
      chest: p(80, 94),
      head: p(83, 80),
      legs: [limb(p(62, 124), p(92, 132), p(94, 166)), limb(p(70, 124), p(100, 133), p(102, 166))],
      arms: [limb(p(80, 96), p(98, 102), p(126, 104)), limb(p(76, 96), p(94, 104), p(122, 106))],
    },
    back: () => (
      <g>
        <rect x={42} y={126} width={42} height={9} rx={4} fill={ART.benchPad} />
        <rect x={46} y={84} width={9} height={44} rx={4} fill={ART.benchPad} />
        <rect x={38} y={158} width={74} height={8} rx={4} fill={ART.machine} />
        <line x1={112} y1={158} x2={112} y2={92} stroke={ART.machine} strokeWidth={5} strokeLinecap="round" />
        <line x1={104} y1={92} x2={120} y2={92} stroke={ART.machine} strokeWidth={5} strokeLinecap="round" />
      </g>
    ),
    fore: () => (
      <g stroke={ART.bar} strokeWidth={4} strokeLinecap="round">
        <line x1={110} y1={92} x2={110} y2={108} />
        <line x1={126} y1={96} x2={126} y2={112} />
      </g>
    ),
  },

  'lat-pulldown': {
    start: {
      pelvis: p(64, 124),
      chest: p(78, 92),
      head: p(82, 78),
      legs: [limb(p(60, 124), p(98, 128), p(96, 160)), limb(p(68, 124), p(106, 130), p(104, 162))],
      arms: [limb(p(78, 94), p(90, 70), p(80, 50)), limb(p(74, 94), p(86, 72), p(76, 52))],
    },
    end: {
      pelvis: p(64, 124),
      chest: p(78, 92),
      head: p(82, 78),
      legs: [limb(p(60, 124), p(98, 128), p(96, 160)), limb(p(68, 124), p(106, 130), p(104, 162))],
      arms: [limb(p(78, 94), p(98, 84), p(80, 94)), limb(p(74, 94), p(94, 86), p(76, 96))],
    },
    back: (frame) => (
      <g>
        <rect x={40} y={126} width={40} height={9} rx={4} fill={ART.benchPad} />
        <rect x={44} y={86} width={9} height={42} rx={4} fill={ART.benchPad} />
        <rect x={94} y={120} width={22} height={8} rx={4} fill={ART.machine} />
        <rect x={36} y={158} width={80} height={8} rx={4} fill={ART.machine} />
        <rect x={16} y={6} width={8} height={161} rx={4} fill={ART.machine} />
        <rect x={10} y={158} width={20} height={6} rx={3} fill={ART.machine} />
        <line x1={20} y1={22} x2={80} y2={frame === 'start' ? 50 : 94} stroke={ART.cable} strokeWidth={1.8} strokeDasharray="3 2" />
      </g>
    ),
    fore: (frame) => <Barbell y={frame === 'start' ? 50 : 94} x1={48} x2={112} plate={0.55} />,
  },

  'db-row': {
    start: {
      pelvis: p(64, 110),
      chest: p(92, 96),
      head: p(100, 84),
      legs: [limb(p(60, 110), p(56, 138), p(56, 167)), limb(p(68, 110), p(64, 138), p(64, 167))],
      arms: [limb(p(88, 98), p(86, 118), p(84, 124)), limb(p(94, 98), p(98, 124), p(100, 144))],
    },
    end: {
      pelvis: p(64, 110),
      chest: p(92, 96),
      head: p(100, 84),
      legs: [limb(p(60, 110), p(56, 138), p(56, 167)), limb(p(68, 110), p(64, 138), p(64, 167))],
      arms: [limb(p(88, 98), p(86, 118), p(84, 124)), limb(p(94, 98), p(112, 114), p(94, 118))],
    },
    back: () => (
      <g>
        <Bench x1={30} y1={118} x2={94} y2={118} />
        <Floor y={167} />
      </g>
    ),
    fore: (_f, pose) => <Dumbbell x={pose.arms[1].c[0]} y={pose.arms[1].c[1]} size={1} />,
  },

  'seated-row': {
    start: {
      pelvis: p(56, 124),
      chest: p(78, 94),
      head: p(82, 80),
      legs: [limb(p(52, 124), p(94, 130), p(94, 162)), limb(p(60, 124), p(102, 132), p(102, 164))],
      arms: [limb(p(78, 96), p(100, 102), p(118, 106)), limb(p(74, 96), p(96, 104), p(114, 108))],
    },
    end: {
      pelvis: p(56, 124),
      chest: p(78, 94),
      head: p(82, 80),
      legs: [limb(p(52, 124), p(94, 130), p(94, 162)), limb(p(60, 124), p(102, 132), p(102, 164))],
      arms: [limb(p(78, 96), p(102, 96), p(90, 106)), limb(p(74, 96), p(98, 98), p(86, 108))],
    },
    back: (frame) => (
      <g>
        <rect x={34} y={126} width={40} height={9} rx={4} fill={ART.benchPad} />
        <rect x={38} y={86} width={9} height={42} rx={4} fill={ART.benchPad} />
        <rect x={30} y={158} width={82} height={8} rx={4} fill={ART.machine} />
        <rect x={106} y={148} width={8} height={20} rx={3} fill={ART.machine} />
        <rect x={132} y={10} width={8} height={157} rx={4} fill={ART.machine} />
        <circle cx={136} cy={112} r={5} fill={ART.bar} />
        <line x1={136} y1={112} x2={frame === 'start' ? 118 : 90} y2={frame === 'start' ? 106 : 106} stroke={ART.cable} strokeWidth={2} strokeDasharray="3 2" />
      </g>
    ),
  },

  'front-squat': {
    start: {
      pelvis: p(78, 108),
      chest: p(78, 68),
      head: p(78, 53),
      legs: [limb(p(74, 108), p(72, 139), p(72, 167)), limb(p(82, 108), p(84, 139), p(84, 167))],
      arms: [limb(p(74, 70), p(90, 80), p(80, 66)), limb(p(84, 70), p(100, 80), p(90, 66))],
    },
    end: {
      pelvis: p(64, 122),
      chest: p(80, 90),
      head: p(82, 74),
      legs: [limb(p(60, 122), p(80, 142), p(76, 167)), limb(p(68, 122), p(88, 141), p(84, 167))],
      arms: [limb(p(76, 92), p(92, 102), p(82, 88)), limb(p(86, 92), p(102, 102), p(92, 88))],
    },
    back: () => <Floor y={167} />,
    fore: (frame) => <Barbell y={frame === 'start' ? 66 : 88} x1={38} x2={118} plate={0.85} />,
  },

  'leg-press': {
    start: {
      pelvis: p(48, 124),
      chest: p(64, 100),
      head: p(70, 86),
      legs: [limb(p(48, 124), p(78, 120), p(106, 114)), limb(p(52, 124), p(82, 122), p(110, 116))],
      arms: [limb(p(64, 102), p(56, 114), p(50, 118)), limb(p(60, 102), p(52, 114), p(46, 118))],
    },
    end: {
      pelvis: p(48, 124),
      chest: p(64, 100),
      head: p(70, 86),
      legs: [limb(p(48, 124), p(84, 112), p(118, 100)), limb(p(52, 124), p(88, 114), p(122, 102))],
      arms: [limb(p(64, 102), p(56, 114), p(50, 118)), limb(p(60, 102), p(52, 114), p(46, 118))],
    },
    back: () => (
      <g>
        <rect x={26} y={126} width={36} height={9} rx={4} fill={ART.benchPad} transform="rotate(-18 44 130)" />
        <rect x={34} y={82} width={9} height={46} rx={4} fill={ART.benchPad} transform="rotate(-18 38 105)" />
        <rect x={20} y={158} width={100} height={8} rx={4} fill={ART.machine} />
        <line x1={100} y1={122} x2={132} y2={88} stroke={ART.machine} strokeWidth={11} strokeLinecap="round" />
        <line x1={100} y1={120} x2={134} y2={84} stroke={ART.bar} strokeWidth={5} strokeLinecap="round" />
      </g>
    ),
    fore: (_f, pose) => <circle cx={pose.legs[1].c[0]} cy={pose.legs[1].c[1]} r={4} fill={ART.plateDark} />,
  },

  'leg-curl': {
    start: {
      pelvis: p(58, 118),
      chest: p(94, 118),
      head: p(112, 112),
      legs: [limb(p(54, 118), p(34, 140), p(22, 162)), limb(p(62, 118), p(42, 140), p(30, 162))],
      arms: [limb(p(94, 118), p(106, 126), p(110, 132)), limb(p(88, 118), p(100, 128), p(104, 134))],
    },
    end: {
      pelvis: p(58, 118),
      chest: p(94, 118),
      head: p(112, 112),
      legs: [limb(p(54, 118), p(36, 134), p(58, 102)), limb(p(62, 118), p(44, 134), p(66, 104))],
      arms: [limb(p(94, 118), p(106, 126), p(110, 132)), limb(p(88, 118), p(100, 128), p(104, 134))],
    },
    back: () => <Bench x1={24} y1={120} x2={122} y2={120} />,
    fore: (_f, pose) => (
      <g>
        <rect x={pose.legs[1].c[0] - 4} y={pose.legs[1].c[1] - 5} width={8} height={10} rx={3} fill={ART.plateDark} />
      </g>
    ),
  },

  'leg-extension': {
    start: {
      pelvis: p(52, 124),
      chest: p(66, 94),
      head: p(70, 80),
      legs: [limb(p(52, 124), p(84, 128), p(84, 160)), limb(p(56, 124), p(88, 130), p(88, 162))],
      arms: [limb(p(66, 96), p(78, 110), p(84, 116)), limb(p(62, 96), p(74, 110), p(80, 116))],
    },
    end: {
      pelvis: p(52, 124),
      chest: p(66, 94),
      head: p(70, 80),
      legs: [limb(p(52, 124), p(84, 128), p(114, 120)), limb(p(56, 124), p(88, 130), p(118, 122))],
      arms: [limb(p(66, 96), p(78, 110), p(84, 116)), limb(p(62, 96), p(74, 110), p(80, 116))],
    },
    back: () => (
      <g>
        <rect x={30} y={126} width={38} height={9} rx={4} fill={ART.benchPad} />
        <rect x={34} y={86} width={9} height={44} rx={4} fill={ART.benchPad} />
        <rect x={26} y={158} width={64} height={8} rx={4} fill={ART.machine} />
        <circle cx={86} cy={128} r={5} fill={ART.bar} />
      </g>
    ),
    fore: (_f, pose) => (
      <g>
        <line x1={86} y1={128} x2={pose.legs[1].c[0]} y2={pose.legs[1].c[1]} stroke={ART.machine} strokeWidth={5} strokeLinecap="round" />
        <circle cx={pose.legs[1].c[0]} cy={pose.legs[1].c[1]} r={4.5} fill={ART.plateDark} />
      </g>
    ),
  },

  lunge: {
    start: {
      ...standing(),
      arms: [limb(p(76, 70), p(78, 106), p(80, 120)), limb(p(84, 70), p(86, 106), p(88, 120))],
    },
    end: {
      pelvis: p(68, 114),
      chest: p(74, 86),
      head: p(76, 72),
      legs: [limb(p(62, 114), p(44, 138), p(28, 158)), limb(p(72, 114), p(92, 132), p(92, 166))],
      arms: [limb(p(70, 88), p(72, 108), p(74, 124)), limb(p(78, 88), p(80, 108), p(82, 124))],
    },
    back: () => <Floor y={167} />,
    fore: (_f, pose) => (
      <g>
        <Dumbbell x={pose.arms[0].c[0]} y={pose.arms[0].c[1]} size={0.95} />
        <Dumbbell x={pose.arms[1].c[0]} y={pose.arms[1].c[1]} size={0.95} />
      </g>
    ),
  },

  'calf-raise': {
    start: {
      pelvis: p(80, 100),
      chest: p(80, 62),
      head: p(80, 47),
      legs: [limb(p(76, 100), p(74, 126), p(74, 148)), limb(p(83, 100), p(85, 126), p(85, 148))],
      arms: [limb(p(76, 64), p(74, 90), p(72, 110)), limb(p(84, 64), p(86, 90), p(88, 110))],
    },
    end: {
      pelvis: p(80, 93),
      chest: p(80, 55),
      head: p(80, 40),
      legs: [limb(p(76, 93), p(74, 119), p(74, 140)), limb(p(83, 93), p(85, 119), p(85, 140))],
      arms: [limb(p(76, 57), p(74, 83), p(72, 103)), limb(p(84, 57), p(86, 83), p(88, 103))],
    },
    back: () => (
      <g>
        <Floor y={167} />
        <rect x={58} y={148} width={44} height={19} rx={4} fill="#dde2e9" />
        <rect x={58} y={146} width={44} height={5} rx={2.5} fill={ART.machine} />
      </g>
    ),
    fore: (frame) => (
      <g stroke={ART.body} strokeWidth={4} strokeLinecap="round">
        <line x1={74} y1={frame === 'start' ? 148 : 140} x2={86} y2={frame === 'start' ? 150 : 148} />
        <line x1={85} y1={frame === 'start' ? 148 : 140} x2={97} y2={frame === 'start' ? 150 : 148} />
      </g>
    ),
  },

  'db-shoulder-press': {
    start: {
      ...standing(),
      arms: [limb(p(76, 70), p(68, 92), p(66, 80)), limb(p(84, 70), p(92, 92), p(94, 80))],
    },
    end: {
      ...standing(),
      arms: [limb(p(76, 70), p(72, 56), p(68, 40)), limb(p(84, 70), p(88, 56), p(92, 40))],
    },
    back: () => <Floor y={167} />,
    fore: (_f, pose) => dbsAtHands(pose, 0.95),
  },

  'rear-delt-fly': {
    start: {
      pelvis: p(64, 108),
      chest: p(92, 84),
      head: p(99, 70),
      legs: [limb(p(60, 108), p(62, 138), p(62, 167)), limb(p(68, 108), p(70, 138), p(70, 167))],
      arms: [limb(p(89, 86), p(94, 108), p(96, 124)), limb(p(95, 86), p(100, 108), p(102, 124))],
    },
    end: {
      pelvis: p(64, 108),
      chest: p(92, 84),
      head: p(99, 70),
      legs: [limb(p(60, 108), p(62, 138), p(62, 167)), limb(p(68, 108), p(70, 138), p(70, 167))],
      arms: [limb(p(89, 86), p(108, 90), p(124, 86)), limb(p(95, 86), p(114, 92), p(130, 88))],
    },
    back: () => <Floor y={167} />,
    fore: (_f, pose) => dbsAtHands(pose, 0.9),
  },

  'face-pull': {
    start: {
      pelvis: p(94, 106),
      chest: p(94, 68),
      head: p(95, 53),
      legs: [limb(p(90, 106), p(88, 138), p(88, 167)), limb(p(98, 106), p(100, 138), p(100, 167))],
      arms: [limb(p(90, 70), p(110, 78), p(126, 86)), limb(p(98, 70), p(118, 80), p(132, 88))],
    },
    end: {
      pelvis: p(94, 106),
      chest: p(94, 68),
      head: p(95, 53),
      legs: [limb(p(90, 106), p(88, 138), p(88, 167)), limb(p(98, 106), p(100, 138), p(100, 167))],
      arms: [limb(p(90, 70), p(108, 82), p(96, 72)), limb(p(98, 70), p(116, 84), p(102, 74))],
    },
    back: (_f, pose) => (
      <>
        <Floor y={167} />
        <CableColumn x={145} top={6} bottom={167} anchorY={76} to={pose.arms[1].c} />
      </>
    ),
  },

  'db-curl': {
    start: {
      ...standing(),
      arms: [limb(p(76, 70), p(78, 94), p(80, 112)), limb(p(84, 70), p(86, 94), p(88, 112))],
    },
    end: {
      ...standing(),
      arms: [limb(p(76, 70), p(78, 96), p(94, 80)), limb(p(84, 70), p(86, 96), p(102, 80))],
    },
    back: () => <Floor y={167} />,
    fore: (_f, pose) => dbsAtHands(pose, 0.85),
  },

  'hammer-curl': {
    start: {
      ...standing(),
      arms: [limb(p(76, 70), p(78, 94), p(80, 112)), limb(p(84, 70), p(86, 94), p(88, 112))],
    },
    end: {
      ...standing(),
      arms: [limb(p(76, 70), p(78, 96), p(94, 80)), limb(p(84, 70), p(86, 96), p(102, 80))],
    },
    back: () => <Floor y={167} />,
    fore: (_f, pose) => (
      <g>
        <Dumbbell x={pose.arms[0].c[0]} y={pose.arms[0].c[1]} rot={90} size={0.9} />
        <Dumbbell x={pose.arms[1].c[0]} y={pose.arms[1].c[1]} rot={90} size={0.9} />
      </g>
    ),
  },

  'skull-crusher': {
    start: {
      ...benchPose('top'),
      arms: [limb(p(94, 112), p(96, 96), p(96, 80)), limb(p(90, 112), p(92, 97), p(92, 81))],
    },
    end: {
      ...benchPose('bottom'),
      arms: [limb(p(94, 112), p(78, 104), p(96, 94)), limb(p(90, 112), p(74, 106), p(92, 96))],
    },
    back: () => <Bench x1={26} y1={120} x2={126} y2={120} />,
    fore: (frame) => <Barbell y={frame === 'start' ? 80 : 94} x1={68} x2={122} plate={0.55} />,
  },

  dip: {
    start: {
      pelvis: p(80, 116),
      chest: p(80, 88),
      head: p(80, 73),
      legs: [limb(p(76, 116), p(64, 130), p(52, 144)), limb(p(84, 116), p(72, 130), p(60, 144))],
      arms: [limb(p(76, 90), p(77, 100), p(76, 110)), limb(p(84, 90), p(83, 100), p(84, 110))],
    },
    end: {
      pelvis: p(80, 130),
      chest: p(80, 102),
      head: p(80, 87),
      legs: [limb(p(76, 130), p(64, 144), p(52, 156)), limb(p(84, 130), p(72, 144), p(60, 156))],
      arms: [limb(p(76, 104), p(58, 110), p(76, 110)), limb(p(84, 104), p(66, 110), p(84, 110))],
    },
    back: () => (
      <g>
        <line x1={28} y1={110} x2={132} y2={110} stroke={ART.bar} strokeWidth={5} strokeLinecap="round" />
        <line x1={34} y1={118} x2={126} y2={118} stroke={ART.bar} strokeWidth={4} strokeLinecap="round" />
        <line x1={38} y1={110} x2={38} y2={166} stroke={ART.machine} strokeWidth={5} />
        <line x1={122} y1={110} x2={122} y2={166} stroke={ART.machine} strokeWidth={5} />
        <Floor y={167} />
      </g>
    ),
  },

  crunch: {
    start: {
      pelvis: p(78, 150),
      chest: p(110, 146),
      head: p(122, 140),
      legs: [limb(p(74, 150), p(54, 132), p(52, 158)), limb(p(82, 150), p(62, 132), p(60, 158))],
      arms: [limb(p(110, 146), p(102, 136), p(114, 132)), limb(p(106, 146), p(98, 138), p(110, 134))],
    },
    end: {
      pelvis: p(78, 150),
      chest: p(108, 136),
      head: p(120, 128),
      legs: [limb(p(74, 150), p(54, 132), p(52, 158)), limb(p(82, 150), p(62, 132), p(60, 158))],
      arms: [limb(p(108, 136), p(100, 126), p(112, 122)), limb(p(104, 136), p(96, 128), p(108, 124))],
    },
    back: () => <Mat y={158} x1={40} x2={140} />,
  },

  'hanging-leg-raise': {
    start: {
      pelvis: p(80, 112),
      chest: p(80, 80),
      head: p(80, 66),
      legs: [limb(p(76, 112), p(74, 140), p(72, 164)), limb(p(84, 112), p(82, 140), p(80, 164))],
      arms: [limb(p(76, 82), p(74, 60), p(74, 46)), limb(p(84, 82), p(86, 60), p(86, 46))],
    },
    end: {
      pelvis: p(80, 112),
      chest: p(80, 80),
      head: p(80, 66),
      legs: [limb(p(76, 112), p(100, 108), p(124, 102)), limb(p(84, 112), p(106, 106), p(128, 100))],
      arms: [limb(p(76, 82), p(74, 60), p(74, 46)), limb(p(84, 82), p(86, 60), p(86, 46))],
    },
    back: () => (
      <g>
        <line x1={36} y1={44} x2={124} y2={44} stroke={ART.bar} strokeWidth={5} strokeLinecap="round" />
        <line x1={42} y1={44} x2={42} y2={14} stroke={ART.machine} strokeWidth={4} />
        <line x1={118} y1={44} x2={118} y2={14} stroke={ART.machine} strokeWidth={4} />
      </g>
    ),
  },

  treadmill: {
    single: true,
    singleLabel: '持续',
    start: {
      pelvis: p(84, 104),
      chest: p(90, 76),
      head: p(94, 62),
      legs: [limb(p(80, 104), p(68, 120), p(58, 136)), limb(p(88, 104), p(102, 122), p(96, 146))],
      arms: [limb(p(86, 78), p(72, 86), p(66, 96)), limb(p(92, 78), p(108, 84), p(112, 74))],
    },
    end: {
      pelvis: p(84, 104),
      chest: p(90, 76),
      head: p(94, 62),
      legs: [limb(p(80, 104), p(68, 120), p(58, 136)), limb(p(88, 104), p(102, 122), p(96, 146))],
      arms: [limb(p(86, 78), p(72, 86), p(66, 96)), limb(p(92, 78), p(108, 84), p(112, 74))],
    },
    back: () => (
      <g>
        <rect x={34} y={146} width={102} height={9} rx={4.5} fill={ART.machine} />
        <rect x={38} y={154} width={94} height={6} rx={3} fill={ART.bench} />
        <line x1={132} y1={150} x2={132} y2={62} stroke={ART.machine} strokeWidth={7} strokeLinecap="round" />
        <rect x={116} y={50} width={28} height={14} rx={4} fill={ART.bench} />
        <line x1={124} y1={57} x2={136} y2={57} stroke={ART.bar} strokeWidth={2} />
        <line x1={38} y1={160} x2={136} y2={160} stroke={ART.floor} strokeWidth={3} />
      </g>
    ),
  },

  rowing: {
    single: true,
    singleLabel: '持续',
    start: {
      pelvis: p(58, 130),
      chest: p(66, 104),
      head: p(68, 90),
      legs: [limb(p(54, 130), p(88, 120), p(96, 146)), limb(p(62, 130), p(96, 122), p(104, 148))],
      arms: [limb(p(66, 106), p(92, 110), p(116, 112)), limb(p(62, 106), p(88, 112), p(112, 114))],
    },
    end: {
      pelvis: p(58, 130),
      chest: p(66, 104),
      head: p(68, 90),
      legs: [limb(p(54, 130), p(88, 120), p(96, 146)), limb(p(62, 130), p(96, 122), p(104, 148))],
      arms: [limb(p(66, 106), p(84, 104), p(74, 108)), limb(p(62, 106), p(80, 106), p(70, 110))],
    },
    back: () => (
      <g>
        <line x1={26} y1={158} x2={142} y2={158} stroke={ART.machine} strokeWidth={6} strokeLinecap="round" />
        <circle cx={134} cy={146} r={14} fill="none" stroke={ART.bench} strokeWidth={5} />
        <circle cx={134} cy={146} r={2.5} fill={ART.bar} />
        <rect x={48} y={134} width={26} height={7} rx={3.5} fill={ART.benchPad} />
        <line x1={134} y1={146} x2={112} y2={112} stroke={ART.cable} strokeWidth={1.8} strokeDasharray="3 2" />
        <line x1={112} y1={106} x2={112} y2={118} stroke={ART.bar} strokeWidth={3} strokeLinecap="round" />
      </g>
    ),
  },

  bike: {
    single: true,
    singleLabel: '持续',
    start: {
      pelvis: p(64, 122),
      chest: p(84, 98),
      head: p(88, 84),
      legs: [limb(p(60, 122), p(92, 112), p(88, 140)), limb(p(68, 122), p(100, 116), p(96, 144))],
      arms: [limb(p(84, 100), p(100, 98), p(110, 92)), limb(p(80, 100), p(96, 100), p(106, 94))],
    },
    end: {
      pelvis: p(64, 122),
      chest: p(84, 98),
      head: p(88, 84),
      legs: [limb(p(60, 122), p(92, 112), p(88, 140)), limb(p(68, 122), p(100, 116), p(96, 144))],
      arms: [limb(p(84, 100), p(100, 98), p(110, 92)), limb(p(80, 100), p(96, 100), p(106, 94))],
    },
    back: () => (
      <g>
        <circle cx={122} cy={142} r={17} fill="none" stroke={ART.bench} strokeWidth={5} />
        <circle cx={122} cy={142} r={3} fill={ART.bar} />
        <line x1={122} y1={142} x2={92} y2={134} stroke={ART.machine} strokeWidth={5} strokeLinecap="round" />
        <line x1={92} y1={134} x2={64} y2={150} stroke={ART.machine} strokeWidth={5} strokeLinecap="round" />
        <line x1={64} y1={150} x2={122} y2={142} stroke={ART.machine} strokeWidth={5} strokeLinecap="round" />
        <line x1={92} y1={134} x2={86} y2={106} stroke={ART.machine} strokeWidth={5} strokeLinecap="round" />
        <rect x={52} y={124} width={28} height={7} rx={3.5} fill={ART.benchPad} />
        <line x1={86} y1={106} x2={112} y2={92} stroke={ART.machine} strokeWidth={5} strokeLinecap="round" />
        <line x1={104} y1={88} x2={118} y2={96} stroke={ART.bar} strokeWidth={4} strokeLinecap="round" />
        <line x1={30} y1={160} x2={140} y2={160} stroke={ART.floor} strokeWidth={3} />
      </g>
    ),
  },
}
