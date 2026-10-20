import { useMemo, type CSSProperties } from 'react'
import { C, R } from '../ui/tokens'
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
        padding: '11px 12px',
        borderRadius: R.md,
        background: C.surface,
        border: `1px solid ${C.border}`,
        boxShadow: '0 1px 0 rgba(90,78,58,.05)',
        color: C.text,
        ...style,
      }}
    >
      <CultivationSeal char={realm.char} color={realm.color} size={40} />

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 7 }}>
          <span
            style={{
              fontFamily: SERIF_FONT,
              fontSize: 15.5,
              fontWeight: 700,
              letterSpacing: 1.5,
              color: C.text,
            }}
          >
            {stats.level.name}
          </span>
          <span style={{ fontSize: 10.5, color: C.muted, letterSpacing: 1 }}>
            第 {stats.level.level} 级
          </span>
        </div>

        {/* 修为进度：一条细墨线，朱砂为进 */}
        <div
          style={{
            height: 3,
            borderRadius: 0,
            background: '#e2d8c3',
            overflow: 'hidden',
            margin: '6px 0 5px',
          }}
        >
          <div
            style={{
              width: `${pct}%`,
              height: '100%',
              background: realm.color,
              opacity: 0.85,
            }}
          />
        </div>

        <div style={{ fontSize: 10.5, color: C.muted, letterSpacing: 0.5 }}>
          {stats.totalXp.toLocaleString('zh-CN')} 修为
          {stats.next
            ? ` · 距 ${stats.next.name} 还差 ${(stats.xpForNext - stats.xpIntoLevel).toLocaleString('zh-CN')}`
            : ' · 已至飞升'}
        </div>
      </div>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 3,
          color: stats.currentStreak > 0 ? C.accent : C.muted,
          fontSize: 11,
          fontWeight: 600,
          flex: 'none',
          letterSpacing: 0.5,
        }}
      >
        <Icon name="flame" size={13} />
        {stats.currentStreak} 天
      </div>
      <Icon name="right" size={13} style={{ color: C.muted, flex: 'none' }} />
    </button>
  )
}
