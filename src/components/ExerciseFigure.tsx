import type { CSSProperties } from 'react'
import type { BodyPartId } from '../types'
import {
  ART,
  Figure,
  FigureFront,
  Hands,
  Label,
  MotionArrow,
  MuscleGlow,
  PanelBg,
  pointOf,
  type MuscleRegion,
  type Pose,
} from './FigureKit'
import { EXERCISE_ART, type Art } from '../data/exerciseArt'
import { EXERCISE_GUIDES } from '../data/exerciseGuides'
import { Icon } from '../ui/Icon'

const VB_W = 330
const VB_H = 190

/** 卡片模式：把 160×190 的单幅面板裁成 190×150，小卡片里人物更大 */
const CARD_W = 190
const CARD_H = 150
const CARD_X = 15
const CARD_Y = -20

/** 把动作指南里的肌群名映射成示意图上的高亮区域 */
function regionsFor(id: string, bodyPart: BodyPartId): MuscleRegion[] {
  const out = new Set<MuscleRegion>()
  const guide: { primary?: string[] } | undefined = EXERCISE_GUIDES[id]
  for (const name of guide?.primary ?? []) {
    if (name.includes('胸')) out.add('chest')
    else if (
      name.includes('背阔') ||
      name.includes('斜方') ||
      name.includes('菱形') ||
      name.includes('竖脊')
    )
      out.add('back')
    else if (name.includes('三角肌')) out.add('shoulder')
    else if (name.includes('肱三头')) out.add('triceps')
    else if (name.includes('肱二头') || name.includes('肱肌')) out.add('biceps')
    else if (name.includes('腹') || name.includes('髂腰')) out.add('core')
    else if (name.includes('臀')) out.add('glutes')
    else if (name.includes('股四头')) out.add('quads')
    else if (name.includes('腘绳')) out.add('hamstrings')
    else if (name.includes('腓肠') || name.includes('比目鱼')) out.add('calves')
  }

  if (out.size === 0) {
    const fallback: Partial<Record<BodyPartId, MuscleRegion[]>> = {
      chest: ['chest'],
      back: ['back'],
      legs: ['quads'],
      shoulders: ['shoulder'],
      arms: ['biceps'],
      core: ['core'],
    }
    return fallback[bodyPart] ?? []
  }
  return [...out]
}

function Frame({
  x,
  art,
  frame,
  showLabels,
  regions,
  arrowFrom,
}: {
  x: number
  art: Art
  frame: 'start' | 'end'
  showLabels: boolean
  regions: MuscleRegion[]
  /** 给出该姿势时，画一个从它指向当前帧的箭头 */
  arrowFrom?: Pose
}) {
  const data = art[frame]
  const focus = art.focus ?? 'hand1'

  return (
    <g transform={`translate(${x} 0)`}>
      {art.back?.(frame, data)}
      {art.front ? <FigureFront pose={data} /> : <Figure pose={data} />}
      <MuscleGlow pose={data} regions={regions} front={art.front} />
      {art.fore?.(frame, data)}
      <Hands pose={data} front={art.front} />
      {arrowFrom ? (
        <MotionArrow from={pointOf(arrowFrom, focus)} to={pointOf(data, focus)} color={ART.accent} />
      ) : null}
      {showLabels && art.viewNote ? (
        <text x={148} y={18} fontSize={9} fontWeight={600} fill={ART.muted} textAnchor="end" letterSpacing={0.5}>
          {art.viewNote}
        </text>
      ) : null}
      {showLabels ? <Label x={11}>{frame === 'start' ? '起始' : '完成'}</Label> : null}
    </g>
  )
}

/**
 * 通用动作示意图。
 *
 * - card：单帧、裁成 190×150，用在动作库网格里，人物更大更容易辨认
 * - detail：起始 / 完成双帧，加发力肌群高亮和动作方向箭头
 * - 纯 SVG、无网络依赖，离线可用
 */
export function ExerciseFigure({
  id,
  label,
  style,
  showLabels = true,
  variant = 'detail',
  bodyPart = 'chest',
}: {
  id: string
  label?: string
  style?: CSSProperties
  showLabels?: boolean
  variant?: 'card' | 'detail'
  bodyPart?: BodyPartId
}) {
  const art: Art | undefined = EXERCISE_ART[id]
  const regions = regionsFor(id, bodyPart)
  const aria = label ? `${label}动作示意图` : '动作示意图'

  if (!art) {
    return (
      <div
        style={{
          aspectRatio: variant === 'card' ? `${CARD_W} / ${CARD_H}` : `${VB_W} / ${VB_H}`,
          borderRadius: 12,
          background: ART.panel,
          border: `1px solid ${ART.panelBorder}`,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 6,
          color: ART.muted,
          ...style,
        }}
      >
        <Icon name="dumbbell" size={30} strokeWidth={1.4} />
        <span style={{ fontSize: 11.5 }}>暂无示意图</span>
      </div>
    )
  }

  if (variant === 'card') {
    const frame = art.single ? 'start' : (art.cardFrame ?? 'end')
    const pose = art[frame]
    return (
      <svg
        viewBox={`0 0 ${CARD_W} ${CARD_H}`}
        style={{ width: '100%', display: 'block', ...style }}
        role="img"
        aria-label={aria}
      >
        <rect
          x={0.5}
          y={0.5}
          width={CARD_W - 1}
          height={CARD_H - 1}
          rx={11}
          fill={ART.panel}
          stroke={ART.panelBorder}
        />
        <g transform={`translate(${CARD_X} ${CARD_Y})`}>
          {art.back?.(frame, pose)}
          {art.front ? <FigureFront pose={pose} /> : <Figure pose={pose} />}
          <MuscleGlow pose={pose} regions={regions} front={art.front} />
          {art.fore?.(frame, pose)}
          <Hands pose={pose} front={art.front} />
        </g>
      </svg>
    )
  }

  if (art.single) {
    const pose = art.start
    const scale = art.singleScale ?? 1.18
    const offset = art.singleOffset ?? 85
    return (
      <svg
        viewBox={`0 0 ${VB_W} ${VB_H}`}
        style={{ width: '100%', display: 'block', ...style }}
        role="img"
        aria-label={aria}
      >
        <PanelBg single />
        <g transform={`translate(${offset} 0) translate(80 168) scale(${scale}) translate(-80 -168)`}>
          {art.back?.('start', pose)}
          {art.front ? <FigureFront pose={pose} /> : <Figure pose={pose} />}
          <MuscleGlow pose={pose} regions={regions} front={art.front} />
          {art.fore?.('start', pose)}
          <Hands pose={pose} front={art.front} />
        </g>
        {showLabels ? (
          <>
            <Label x={14}>{art.singleLabel ?? '保持'}</Label>
            {art.tag ? (
              <g transform="translate(276 172)">
                <rect x={0} y={-10} width={40} height={17} rx={8.5} fill="#fdf9ef" stroke={ART.panelBorder} />
                <text x={20} y={2} fontSize={9} fontWeight={600} fill={ART.accent} textAnchor="middle">
                  {art.tag}
                </text>
              </g>
            ) : null}
          </>
        ) : null}
      </svg>
    )
  }

  return (
    <svg
      viewBox={`0 0 ${VB_W} ${VB_H}`}
      style={{ width: '100%', display: 'block', ...style }}
      role="img"
      aria-label={aria}
    >
      <g transform="translate(0 0)">
        <PanelBg />
      </g>
      <g transform="translate(170 0)">
        <PanelBg />
      </g>
      <Frame
        x={0}
        art={art}
        frame="start"
        showLabels={showLabels}
        regions={regions}
      />
      <Frame
        x={170}
        art={art}
        frame="end"
        showLabels={showLabels}
        regions={regions}
        arrowFrom={art.start}
      />
      <g transform="translate(165 95)">
        <circle cx={0} cy={0} r={7} fill="#fdf9ef" stroke={ART.panelBorder} />
        <path d="M-2.2 -3.4 L1.8 0 L-2.2 3.4" fill="none" stroke={ART.muted} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
      </g>
    </svg>
  )
}
