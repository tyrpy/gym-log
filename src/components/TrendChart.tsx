import { useMemo } from 'react'
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { C } from '../ui/tokens'
import { formatDateShort } from '../lib/utils'

export interface TrendPoint {
  date: string
  bestWeight: number
  volume: number
  sets: number
}

/** 单指标折线图 */
export function TrendChart({ points, metric }: { points: TrendPoint[]; metric: 'weight' | 'volume' }) {
  const data = useMemo(
    () =>
      points.map((p) => ({
        ...p,
        label: formatDateShort(p.date),
        value: metric === 'weight' ? p.bestWeight : Math.round(p.volume),
      })),
    [points, metric],
  )

  const unit = metric === 'weight' ? 'kg' : 'kg'
  const values = data.map((d) => d.value)
  const max = Math.max(...values)
  const min = Math.min(...values)
  const rawPad = Math.max(2, (max - min) * 0.25)
  // 重量取 5 的整数倍，读数更干净
  const step = metric === 'weight' ? 5 : Math.max(100, Math.round((max - min) / 4 / 100) * 100)
  const pad = Math.max(rawPad, step * 0.6)
  const domainMin = Math.max(0, Math.floor((min - pad) / step) * step)
  const domainMax = Math.ceil((max + pad) / step) * step

  return (
    <div style={{ width: '100%', height: 210 }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 14, bottom: 4, left: 4 }}>
          <CartesianGrid stroke={C.border} strokeDasharray="3 3" vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 10.5, fill: C.muted }}
            tickLine={false}
            axisLine={{ stroke: C.border }}
            interval="preserveStartEnd"
            minTickGap={16}
          />
          <YAxis
            domain={[domainMin, domainMax]}
            tick={{ fontSize: 10.5, fill: C.muted }}
            tickLine={false}
            axisLine={false}
            width={40}
            tickCount={5}
            allowDecimals={false}
            tickFormatter={(v: number) => `${v}`}
          />
          <Tooltip
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null
              const p = payload[0].payload as TrendPoint & { label: string; value: number }
              return (
                <div
                  style={{
                    background: C.text,
                    color: '#fff',
                    borderRadius: 12,
                    padding: '8px 12px',
                    fontSize: 12,
                    lineHeight: 1.6,
                    boxShadow: '0 6px 20px rgba(45,38,26,.18)',
                  }}
                >
                  <div style={{ fontWeight: 700, marginBottom: 2 }}>{p.date}</div>
                  <div>
                    最重 {p.bestWeight} kg · 总容量 {Math.round(p.volume)} kg
                  </div>
                  <div style={{ color: 'rgba(255,255,255,.6)' }}>{p.sets} 组</div>
                </div>
              )
            }}
          />
          <Line
            type="monotone"
            dataKey="value"
            stroke={C.accent}
            strokeWidth={2.4}
            dot={{ r: 3.2, fill: '#fff', stroke: C.accent, strokeWidth: 2 }}
            activeDot={{ r: 5 }}
            animationDuration={0}
            isAnimationActive={false}
            name={metric === 'weight' ? '最重' : '容量'}
            unit={unit}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
