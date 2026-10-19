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
  body: '#3d4756',
  far: '#a6afbc',
  bar: '#59636f',
  plate: '#e6512e',
  plateDark: '#39424f',
  bench: '#aeb7c2',
  benchPad: '#e6a08b',
  cable: '#98a2b0',
  machine: '#c3cad3',
  floor: '#d9dee5',
  panel: '#f7f8fa',
  panelBorder: '#ebeff4',
  accent: '#e6512e',
  muted: '#8b94a3',
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

/** 地面线 */
export function Floor({ y = 168, x1 = 18, x2 = 142 }: { y?: number; x1?: number; x2?: number }) {
  return <line x1={x1} y1={y} x2={x2} y2={y} stroke={ART.floor} strokeWidth={3} strokeLinecap="round" />
}

/** 垫子 */
export function Mat({ y = 166, x1 = 14, x2 = 146 }: { y?: number; x1?: number; x2?: number }) {
  return (
    <g>
      <rect x={x1} y={y} width={x2 - x1} height={7} rx={3.5} fill="#dfe5ec" />
      <line x1={x1 + 2} y1={y + 1.5} x2={x2 - 2} y2={y + 1.5} stroke="#eef1f5" strokeWidth={1.5} />
    </g>
  )
}

/** 杠铃（横置）：两端各两片杠铃片 */
export function Barbell({
  y,
  x1 = 38,
  x2 = 142,
  plate = 1,
}: {
  y: number
  x1?: number
  x2?: number
  plate?: number
}) {
  const ph = 26 * plate
  const pw = 5
  return (
    <g>
      <line x1={x1} y1={y} x2={x2} y2={y} stroke={ART.bar} strokeWidth={4} strokeLinecap="round" />
      {[x1 + 3, x2 - 3].map((x, i) => (
        <g key={i}>
          <rect x={x - pw / 2} y={y - ph / 2} width={pw} height={ph} rx={2.5} fill={ART.plate} />
          <rect
            x={x + (i === 0 ? pw : -pw * 2)}
            y={y - ph * 0.38}
            width={pw}
            height={ph * 0.76}
            rx={2}
            fill={ART.plateDark}
          />
        </g>
      ))}
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
