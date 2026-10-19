import { useMemo, type CSSProperties } from 'react'
import { R } from '../ui/tokens'
import { Icon } from '../ui/Icon'
import { CultivationSeal, SERIF_FONT } from './CultivationSeal'
import { getCultivation } from '../lib/cultivation'
import { useGym } from '../state/gym'

/** 今天 / 我的页面上的紧凑修为条，点击进入境界详情 */
export function CultivationStrip({ style }: { style?: CSSProperties }) {
  const { data, go } = useGym()
  const stats = useMemo(() => getCultivation(data), [data])
  const realm = stats.level.realm
  const cap = stats.next ? stats.level.xpToNext : 0
  const pct = cap > 0 ? Math.min(100, (stats.xpIntoLevel / cap) * 100) : 100

  return (
    <button
      onClick={() => go('cultivation')}
      aria-label="查看修为境界"
      style={{
        width: '100%',
        textAlign: 'left',
        display: 'flex',
        alignItems: 'center',
        gap: 11,
        padding: '10px 12px',
        borderRadius: R.lg,
        background: `radial-gradient(circle at 88% -10%, ${realm.color}55 0%, transparent 58%), linear-gradient(135deg, #171a24 0%, #242033 62%, #2f2740 100%)`,
        border: '1px solid rgba(232,195,122,.24)',
        boxShadow: '0 6px 18px rgba(23,26,36,.16)',
        color: '#f6efe2',
        ...style,
      }}
    >
      <CultivationSeal char={realm.char} color={realm.color} size={40} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 7 }}>
          <span style={{ fontFamily: SERIF_FONT, fontSize: 15, fontWeight: 700, letterSpacing: 0.5 }}>
            {stats.level.name}
          </span>
          <span style={{ fontSize: 10, color: 'rgba(232,195,122,.85)', fontWeight: 600 }}>
            第 {stats.level.level} 级
          </span>
        </div>
        <div
          style={{
            height: 4,
            borderRadius: 999,
            background: 'rgba(255,255,255,.13)',
            overflow: 'hidden',
            margin: '5px 0 4px',
          }}
        >
          <div
            style={{
              width: `${pct}%`,
              height: '100%',
              borderRadius: 999,
              background: 'linear-gradient(90deg, #c9963f, #f3d79a)',
              boxShadow: '0 0 8px rgba(232,195,122,.6)',
            }}
          />
        </div>
        <div style={{ fontSize: 10.5, color: 'rgba(246,239,226,.62)' }}>
          {stats.totalXp.toLocaleString('zh-CN')} 修为
          {stats.next ? ` · 距 ${stats.next.name} 还差 ${(stats.xpForNext - stats.xpIntoLevel).toLocaleString('zh-CN')}` : ' · 已至飞升'}
        </div>
      </div>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 3,
          color: stats.currentStreak > 0 ? '#f3d79a' : 'rgba(246,239,226,.45)',
          fontSize: 11,
          fontWeight: 600,
          flex: 'none',
        }}
      >
        <Icon name="flame" size={14} />
        {stats.currentStreak} 天
      </div>
      <Icon name="right" size={14} style={{ color: 'rgba(246,239,226,.4)', flex: 'none' }} />
    </button>
  )
}
