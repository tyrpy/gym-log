import type { ReactNode } from 'react'

/** 动作示意图用的极简人体骨架：所有坐标都在 160 × 190 的单幅面板内 */
export type Pt = [number, number]

export interface Limb {
  /** 肩/髋 */
  a: Pt
  /** 肘/膝 */
  b: Pt
  /** 手/脚 */
  c: Pt
}

export interface Pose {
  pelvis: Pt
  chest: Pt
  head: Pt
  /** [远侧, 近侧] */
  arms: [Limb, Limb]
  /** [远侧, 近侧] */
  legs: [Limb, Limb]
}

export const ART = {
  body: '#2b2a24',
  far: '#b3a996',
  bar: '#4a4740',
  plate: '#a63a2b',
  plateDark: '#3a362d',
  bench: '#c2b7a1',
  benchPad: '#b98a6e',
  cable: '#a89c87',
  machine: '#cbbfa9',
  floor: '#e6dbc7',
  panel: '#fbf7ee',
  panelBorder: '#e3d8c4',
  accent: '#a63a2b',
  muted: '#857b69',
} as const

export const p = (x: number, y: number): Pt => [x, y]
export const limb = (a: Pt, b: Pt, c: Pt): Limb => ({ a, b, c })

/** 站立侧面基础姿势（朝右） */
export function standing(): Pose {
  return {
    pelvis: p(80, 108),
    chest: p(80, 68),
    head: p(80, 53),
    legs: [limb(p(76, 108), p(74, 140), p(74, 168)), limb(p(82, 108), p(84, 140), p(84, 168))],
    arms: [limb(p(76, 70), p(74, 92), p(72, 112)), limb(p(84, 70), p(86, 92), p(88, 112))],
  }
}

function LimbLine({ l, color, width }: { l: Limb; color: string; width: number }) {
  return (
    <g stroke={color} strokeWidth={width} strokeLinecap="round" fill="none">
      <path d={`M${l.a[0]} ${l.a[1]} L${l.b[0]} ${l.b[1]} L${l.c[0]} ${l.c[1]}`} />
      <circle cx={l.c[0]} cy={l.c[1]} r={width * 0.52} fill={color} stroke="none" />
    </g>
  )
}

/** 侧面人体：先画远侧肢体，再画躯干，最后画近侧肢体 */
export function Figure({ pose }: { pose: Pose }) {
  return (
    <g>
      <LimbLine l={pose.legs[0]} color={ART.far} width={7} />
      <LimbLine l={pose.arms[0]} color={ART.far} width={6} />
      <line
        x1={pose.chest[0]}
        y1={pose.chest[1]}
        x2={pose.pelvis[0]}
        y2={pose.pelvis[1]}
        stroke={ART.body}
        strokeWidth={16}
        strokeLinecap="round"
      />
      <line
        x1={pose.chest[0]}
        y1={pose.chest[1]}
        x2={pose.head[0]}
        y2={pose.head[1]}
        stroke={ART.body}
        strokeWidth={7}
        strokeLinecap="round"
      />
      <circle cx={pose.head[0]} cy={pose.head[1]} r={8.4} fill={ART.body} />
      <LimbLine l={pose.legs[1]} color={ART.body} width={7.5} />
      <LimbLine l={pose.arms[1]} color={ART.body} width={6.5} />
    </g>
  )
}

/** 正面人体：左右对称，用于侧平举、反向飞鸟这类动作 */
export function FigureFront({
  pose,
  waist = 16,
}: {
  pose: Pose
  waist?: number
}) {
  return (
    <g>
      <LimbLine l={pose.legs[0]} color={ART.far} width={7} />
      <LimbLine l={pose.legs[1]} color={ART.body} width={7.5} />
      <line
        x1={pose.chest[0]}
        y1={pose.chest[1]}
        x2={pose.pelvis[0]}
        y2={pose.pelvis[1]}
        stroke={ART.body}
        strokeWidth={waist}
        strokeLinecap="round"
      />
      <line
        x1={pose.chest[0]}
        y1={pose.chest[1]}
        x2={pose.head[0]}
        y2={pose.head[1]}
        stroke={ART.body}
        strokeWidth={7}
        strokeLinecap="round"
      />
      <circle cx={pose.head[0]} cy={pose.head[1]} r={8.4} fill={ART.body} />
      <LimbLine l={pose.arms[0]} color={ART.body} width={6.5} />
      <LimbLine l={pose.arms[1]} color={ART.body} width={6.5} />
    </g>
  )
}

/** 重画手部端点：器械画在人物之后时，让手压在杠铃/哑铃上，避免看起来悬空 */
export function Hands({ pose, front = false }: { pose: Pose; front?: boolean }) {
  return (
    <g>
      <circle cx={pose.arms[0].c[0]} cy={pose.arms[0].c[1]} r={3.1} fill={front ? ART.body : ART.far} />
      <circle cx={pose.arms[1].c[0]} cy={pose.arms[1].c[1]} r={3.4} fill={ART.body} />
    </g>
  )
}

/** 动作方向箭头追踪的身体部位 */
export type FocusPoint = 'hand0' | 'hand1' | 'foot0' | 'foot1' | 'pelvis' | 'chest' | 'head'

/** 教学高亮用的肌群区域 */
export type MuscleRegion =
  | 'chest'
  | 'back'
  | 'shoulder'
  | 'biceps'
  | 'triceps'
  | 'core'
  | 'glutes'
  | 'quads'
  | 'hamstrings'
  | 'calves'

export function pointOf(pose: Pose, focus: FocusPoint): Pt {
  switch (focus) {
    case 'hand0':
      return pose.arms[0].c
    case 'hand1':
      return pose.arms[1].c
    case 'foot0':
      return pose.legs[0].c
    case 'foot1':
      return pose.legs[1].c
    case 'pelvis':
      return pose.pelvis
    case 'chest':
      return pose.chest
    case 'head':
      return pose.head
  }
}

/** 肌群高亮用的浅色调：比部位主色更亮，叠在深色人体上才看得清 */
const MUSCLE_TINT: Record<MuscleRegion, string> = {
  chest: '#d4695a',
  back: '#6f9db0',
  shoulder: '#d6a24a',
  biceps: '#a98bc9',
  triceps: '#a98bc9',
  core: '#c97794',
  glutes: '#c08a67',
  quads: '#7fb28d',
  hamstrings: '#7fb28d',
  calves: '#b0b06a',
}

/**
 * 发力肌群高亮：叠在人体之上，用浅色把目标区域「染」出来。
 * 侧视图中二头/三头、股四/腘绳难以区分，所以同一段肢体只画一层。
 */
export function MuscleGlow({
  pose,
  regions,
  front = false,
}: {
  pose: Pose
  regions: MuscleRegion[]
  front?: boolean
}) {
  if (regions.length === 0) return null

  const armActive = regions.includes('biceps') || regions.includes('triceps')
  const thighActive = regions.includes('quads') || regions.includes('hamstrings')
  const chestX = pose.chest[0] + (pose.pelvis[0] - pose.chest[0]) * 0.22
  const chestY = pose.chest[1] + (pose.pelvis[1] - pose.chest[1]) * 0.22
  const backX = pose.chest[0] + (pose.pelvis[0] - pose.chest[0]) * 0.38
  const backY = pose.chest[1] + (pose.pelvis[1] - pose.chest[1]) * 0.38
  const coreX = (pose.chest[0] + pose.pelvis[0]) / 2
  const coreY = (pose.chest[1] + pose.pelvis[1]) / 2

  return (
    <g pointerEvents="none">
      {regions.includes('chest') ? (
        <ellipse cx={chestX} cy={chestY} rx={front ? 11 : 7} ry={9} fill={MUSCLE_TINT.chest} opacity={0.62} />
      ) : null}
      {regions.includes('back') ? (
        <ellipse cx={backX} cy={backY} rx={front ? 10 : 7} ry={10} fill={MUSCLE_TINT.back} opacity={0.62} />
      ) : null}
      {regions.includes('core') ? (
        <ellipse cx={coreX} cy={coreY} rx={6} ry={9} fill={MUSCLE_TINT.core} opacity={0.6} />
      ) : null}
      {regions.includes('glutes') ? (
        <ellipse cx={pose.pelvis[0]} cy={pose.pelvis[1]} rx={7} ry={6} fill={MUSCLE_TINT.glutes} opacity={0.66} />
      ) : null}
      {regions.includes('shoulder')
        ? pose.arms.map((a, i) => (
            <circle key={`sh${i}`} cx={a.a[0]} cy={a.a[1]} r={4.5} fill={MUSCLE_TINT.shoulder} opacity={0.7} />
          ))
        : null}
      {armActive
        ? pose.arms.map((a, i) => (
            <line
              key={`arm${i}`}
              x1={a.a[0]}
              y1={a.a[1]}
              x2={a.b[0]}
              y2={a.b[1]}
              stroke={MUSCLE_TINT.biceps}
              strokeWidth={4}
              strokeLinecap="round"
              opacity={0.72}
            />
          ))
        : null}
      {thighActive
        ? pose.legs.map((l, i) => (
            <line
              key={`thigh${i}`}
              x1={l.a[0]}
              y1={l.a[1]}
              x2={l.b[0]}
              y2={l.b[1]}
              stroke={MUSCLE_TINT.quads}
              strokeWidth={4.5}
              strokeLinecap="round"
              opacity={0.72}
            />
          ))
        : null}
      {regions.includes('calves')
        ? pose.legs.map((l, i) => (
            <line
              key={`calf${i}`}
              x1={l.b[0]}
              y1={l.b[1]}
              x2={l.c[0]}
              y2={l.c[1]}
              stroke={MUSCLE_TINT.calves}
              strokeWidth={3.5}
              strokeLinecap="round"
              opacity={0.72}
            />
          ))
        : null}
    </g>
  )
}

/** 从 from 指向 to 的虚线小箭头，用来提示动作路径 */
export function MotionArrow({ from, to, color }: { from: Pt; to: Pt; color: string }) {
  const dx = to[0] - from[0]
  const dy = to[1] - from[1]
  const len = Math.hypot(dx, dy)
  if (len < 7) return null

  const ux = dx / len
  const uy = dy / len
  // 垂直于动作方向的偏移，避免箭头压在手/杠铃上
  const nx = -uy * 9
  const ny = ux * 9
  const tailX = from[0] + ux * 9 + nx
  const tailY = from[1] + uy * 9 + ny
  const reach = Math.min(27, Math.max(14, len * 0.55))
  const tipX = from[0] + ux * (9 + reach) + nx
  const tipY = from[1] + uy * (9 + reach) + ny
  const midX = (tailX + tipX) / 2 + ux * 4
  const midY = (tailY + tipY) / 2 + uy * 4
  const head = 4.6
  const ax1X = tipX - ux * head * 1.7 + (-uy) * head
  const ax1Y = tipY - uy * head * 1.7 + ux * head
  const ax2X = tipX - ux * head * 1.7 - (-uy) * head
  const ax2Y = tipY - uy * head * 1.7 - ux * head

  return (
    <g opacity={0.72} pointerEvents="none">
      <path
        d={`M${tailX.toFixed(1)} ${tailY.toFixed(1)} Q${midX.toFixed(1)} ${midY.toFixed(1)} ${tipX.toFixed(1)} ${tipY.toFixed(1)}`}
        fill="none"
        stroke={color}
        strokeWidth={1.6}
        strokeLinecap="round"
        strokeDasharray="3 3"
      />
      <path
        d={`M${tipX.toFixed(1)} ${tipY.toFixed(1)} L${ax1X.toFixed(1)} ${ax1Y.toFixed(1)} M${tipX.toFixed(1)} ${tipY.toFixed(1)} L${ax2X.toFixed(1)} ${ax2Y.toFixed(1)}`}
        fill="none"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
      />
    </g>
  )
}

/** 地面线 */
export function Floor({ y = 168, x1 = 18, x2 = 142 }: { y?: number; x1?: number; x2?: number }) {
  return <line x1={x1} y1={y} x2={x2} y2={y} stroke={ART.floor} strokeWidth={3} strokeLinecap="round" />
}

/** 垫子 */
export function Mat({ y = 166, x1 = 14, x2 = 146 }: { y?: number; x1?: number; x2?: number }) {
  return (
    <g>
      <rect x={x1} y={y} width={x2 - x1} height={7} rx={3.5} fill="#ded2bb" />
      <line x1={x1 + 2} y1={y + 1.5} x2={x2 - 2} y2={y + 1.5} stroke="#f6efdf" strokeWidth={1.5} />
    </g>
  )
}

/**
 * 杠铃（侧视）：杆轴朝向屏幕内，看到的是杠铃片正面。
 * x 是杠铃片中心；缺省时取 x1/x2 的中点，兼容旧调用。
 */
export function Barbell({
  y,
  x,
  x1 = 38,
  x2 = 142,
  plate = 1,
}: {
  y: number
  x?: number
  x1?: number
  x2?: number
  /** 片的相对大小；小于 0.7 时按普通杆端处理（如下拉杆） */
  plate?: number
}) {
  const cx = x ?? (x1 + x2) / 2
  const r = 12.5 * Math.max(0.6, plate)
  const plated = plate >= 0.7
  return (
    <g>
      <circle cx={cx} cy={y} r={r} fill={plated ? ART.plate : ART.bar} />
      {plated ? (
        <>
          <circle
            cx={cx}
            cy={y}
            r={r * 0.76}
            fill="none"
            stroke={ART.plateDark}
            strokeWidth={1.4}
            opacity={0.55}
          />
          <circle cx={cx} cy={y} r={r * 0.36} fill={ART.plateDark} />
        </>
      ) : null}
      <circle cx={cx} cy={y} r={Math.max(2, r * 0.17)} fill={ART.bar} />
    </g>
  )
}

/** 哑铃 */
export function Dumbbell({
  x,
  y,
  rot = 0,
  size = 1,
}: {
  x: number
  y: number
  rot?: number
  size?: number
}) {
  const len = 9 * size
  const h = 7 * size
  return (
    <g transform={`translate(${x} ${y}) rotate(${rot})`}>
      <line x1={-len} y1={0} x2={len} y2={0} stroke={ART.bar} strokeWidth={2.6 * size} strokeLinecap="round" />
      <rect x={-len - 3} y={-h / 2} width={6 * size} height={h} rx={2} fill={ART.plateDark} />
      <rect x={len - 3} y={-h / 2} width={6 * size} height={h} rx={2} fill={ART.plateDark} />
    </g>
  )
}

/** 平凳（可倾斜：给出两端中心点） */
export function Bench({
  x1,
  y1,
  x2,
  y2,
  legs = true,
}: {
  x1: number
  y1: number
  x2: number
  y2: number
  legs?: boolean
}) {
  const dx = x2 - x1
  const dy = y2 - y1
  const len = Math.hypot(dx, dy)
  const ang = (Math.atan2(dy, dx) * 180) / Math.PI
  return (
    <g>
      <g transform={`translate(${x1} ${y1}) rotate(${ang})`}>
        <rect x={-4} y={-4.5} width={len + 8} height={9} rx={4.5} fill={ART.benchPad} />
      </g>
      {legs ? (
        <g stroke={ART.machine} strokeWidth={4} strokeLinecap="round">
          <line x1={x1 + len * 0.14} y1={y1 + 5} x2={x1 + len * 0.1} y2={168} />
          <line x1={x2 - len * 0.14} y1={y2 + 5} x2={x2 - len * 0.1} y2={168} />
        </g>
      ) : null}
    </g>
  )
}

/** 绳索/滑轮柱：竖柱 + 顶部滑轮 + 可选的绳索 */
export function CableColumn({
  x,
  top = 10,
  bottom = 168,
  to,
  anchorY = 14,
  height = 42,
}: {
  x: number
  top?: number
  bottom?: number
  /** 绳端连接的坐标 */
  to?: Pt
  anchorY?: number
  /** 滑轮离顶部距离 */
  height?: number
}) {
  const anchor: Pt = [x, top + height]
  return (
    <g>
      <rect x={x - 3.5} y={top} width={7} height={bottom - top} rx={3} fill={ART.machine} />
      <rect x={x - 9} y={bottom - 4} width={18} height={5} rx={2.5} fill={ART.machine} />
      <circle cx={anchor[0]} cy={anchorY} r={4.5} fill={ART.bar} />
      {to ? (
        <line
          x1={anchor[0]}
          y1={anchorY}
          x2={to[0]}
          y2={to[1]}
          stroke={ART.cable}
          strokeWidth={1.8}
          strokeDasharray="3 2"
        />
      ) : null}
    </g>
  )
}

/** 平行双杠 */
export function DipBars({ y = 96 }: { y?: number }) {
  return (
    <g stroke={ART.machine} strokeWidth={5} strokeLinecap="round">
      <line x1={30} y1={y} x2={130} y2={y} />
      <line x1={38} y1={y} x2={38} y2={168} />
      <line x1={122} y1={y} x2={122} y2={168} />
    </g>
  )
}

export function PanelBg({ single = false }: { single?: boolean }) {
  return (
    <g>
      <rect x={0.5} y={0.5} width={single ? 329 : 159} height={189} rx={11} fill={ART.panel} stroke={ART.panelBorder} />
    </g>
  )
}

export function Label({ children, x, align = 'start' }: { children: ReactNode; x: number; align?: 'start' | 'end' }) {
  return (
    <text
      x={x}
      y={182}
      fontSize={9.5}
      fontWeight={600}
      fill={ART.muted}
      textAnchor={align}
      letterSpacing={0.5}
    >
      {children}
    </text>
  )
}
