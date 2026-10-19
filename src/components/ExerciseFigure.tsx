import type { CSSProperties } from 'react'
import { ART, Figure, FigureFront, Label, PanelBg } from './FigureKit'
import { EXERCISE_ART } from '../data/exerciseArt'
import { Icon } from '../ui/Icon'

const VB_W = 330
const VB_H = 190

function Frame({
  x,
  art,
  frame,
  single,
  showLabels,
}: {
  x: number
  art: (typeof EXERCISE_ART)[string] | undefined
  frame: 'start' | 'end'
  single: boolean
  showLabels: boolean
}) {
  if (!art) return null
  const data = art[frame]
  return (
    <g transform={`translate(${x} 0)`}>
      {art.back?.(frame, data)}
      {art.front ? <FigureFront pose={data} /> : <Figure pose={data} />}
      {art.fore?.(frame, data)}
      {showLabels && art.viewNote ? (
        <text x={148} y={18} fontSize={9} fontWeight={600} fill={ART.muted} textAnchor="end" letterSpacing={0.5}>
          {art.viewNote}
        </text>
      ) : null}
      {!single && showLabels ? <Label x={11}>{frame === 'start' ? '起始' : '完成'}</Label> : null}
    </g>
  )
}

/**
 * 通用动作示意图：两帧（起始 / 完成）；single 动作显示一整幅。
 * 纯 SVG，无网络依赖，离线可用。
 */
export function ExerciseFigure({
  id,
  label,
  style,
  showLabels = true,
}: {
  id: string
  label?: string
  style?: CSSProperties
  showLabels?: boolean
}) {
  const art = EXERCISE_ART[id]

  if (!art) {
    return (
      <div
        style={{
          aspectRatio: '330 / 190',
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

  if (art.single) {
    const pose = art.start
    const scale = art.singleScale ?? 1.18
    const offset = art.singleOffset ?? 85
    return (
      <svg
        viewBox={`0 0 ${VB_W} ${VB_H}`}
        style={{ width: '100%', display: 'block', ...style }}
        role="img"
        aria-label={label ? `${label}动作示意图` : '动作示意图'}
      >
        <PanelBg single />
        <g transform={`translate(${offset} 0) translate(80 168) scale(${scale}) translate(-80 -168)`}>
          {art.back?.('start', pose)}
          {art.front ? <FigureFront pose={pose} /> : <Figure pose={pose} />}
          {art.fore?.('start', pose)}
        </g>
        {showLabels ? (
          <>
            <Label x={14}>{art.singleLabel ?? '保持'}</Label>
            {art.tag ? (
              <g transform="translate(276 172)">
                <rect x={0} y={-10} width={40} height={17} rx={8.5} fill="#ffffff" stroke={ART.panelBorder} />
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
      aria-label={label ? `${label}动作示意图` : '动作示意图'}
    >
      <g transform="translate(0 0)">
        <PanelBg />
      </g>
      <g transform="translate(170 0)">
        <PanelBg />
      </g>
      <Frame x={0} art={art} frame="start" single={false} showLabels={showLabels} />
      <Frame x={170} art={art} frame="end" single={false} showLabels={showLabels} />
      <g transform="translate(165 95)">
        <circle cx={0} cy={0} r={7} fill="#ffffff" stroke={ART.panelBorder} />
        <path d="M-2.2 -3.4 L1.8 0 L-2.2 3.4" fill="none" stroke={ART.muted} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
      </g>
    </svg>
  )
}
