import { useMemo, useState, type ReactNode } from 'react'
import { C, R } from '../ui/tokens'
import { Icon } from '../ui/Icon'
import { Page, PageHeader, SectionTitle } from '../ui/layout'
import { Button, Card } from '../ui/base'
import { Sheet } from '../ui/Sheet'
import { CultivationSeal, SERIF_FONT } from '../components/CultivationSeal'
import { useGym } from '../state/gym'
import {
  getCultivation,
  LEVELS,
  MAX_LEVEL,
  REALMS,
  STREAK_MILESTONES,
  type CultivationStats,
} from '../lib/cultivation'
import { fmtNumber } from '../lib/utils'

const GOLD = '#e8c37a'

export function CultivationPage() {
  const { data, go } = useGym()
  const stats = useMemo(() => getCultivation(data), [data])
  const [tableOpen, setTableOpen] = useState(false)

  return (
    <Page>
      <PageHeader
        left={
          <button
            aria-label="返回"
            onClick={() => go('me')}
            style={{
              width: 34,
              height: 34,
              borderRadius: 10,
              border: `1px solid ${C.border}`,
              background: C.surface,
              color: C.textSecondary,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flex: 'none',
            }}
          >
            <Icon name="left" size={16} />
          </button>
        }
        title="修为"
        subtitle={`${stats.level.name} · 第 ${stats.level.level} 级 / 共 ${MAX_LEVEL} 级`}
      />

      <Hero stats={stats} />
      <RealmPath stats={stats} />
      <StreakCard stats={stats} />
      <Breakdown stats={stats} />

      <div style={{ marginTop: 14 }}>
        <Button variant="soft" full onClick={() => setTableOpen(true)}>
          <Icon name="list" size={16} />
          查看完整 {MAX_LEVEL} 级境界表
        </Button>
      </div>

      <div style={{ fontSize: 11.5, color: C.muted, lineHeight: 1.7, margin: '14px 2px 0' }}>
        修为由历史训练自动推算，不会修改你的原始记录。连续天数按自然日计算，断一天会重置连击；
        已获得的称号会永久保留。
      </div>

      <Sheet
        open={tableOpen}
        onClose={() => setTableOpen(false)}
        title="境界总览"
        subtitle={`${REALMS.length} 大境界 · ${MAX_LEVEL} 级 · 每级修为需求逐级递增`}
        maxHeight="92vh"
      >
        <LevelTable stats={stats} />
      </Sheet>
    </Page>
  )
}

function Hero({ stats }: { stats: CultivationStats }) {
  const { level, next, xpIntoLevel, xpForNext, progress, totalXp, currentStreak, activeTitle } = stats
  const realm = level.realm
  const ringR = 38
  const ringLen = 2 * Math.PI * ringR

  return (
    <div
      style={{
        marginTop: 14,
        position: 'relative',
        overflow: 'hidden',
        borderRadius: R.xl,
        padding: '20px 18px 16px',
        background: `radial-gradient(circle at 86% -6%, ${realm.color}66 0%, transparent 52%), linear-gradient(135deg, #151822 0%, #232032 58%, #302741 100%)`,
        border: '1px solid rgba(232,195,122,.26)',
        boxShadow: '0 14px 34px rgba(23,26,36,.22)',
        color: '#f6efe2',
      }}
    >
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          right: -18,
          top: -30,
          fontFamily: SERIF_FONT,
          fontSize: 170,
          lineHeight: 1,
          color: 'rgba(255,255,255,.045)',
          pointerEvents: 'none',
          userSelect: 'none',
        }}
      >
        {realm.char}
      </div>
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          height: 1,
          background: `linear-gradient(90deg, transparent, ${GOLD}66, transparent)`,
        }}
      />

      <div style={{ display: 'flex', alignItems: 'center', gap: 16, position: 'relative' }}>
        <div style={{ position: 'relative', width: 96, height: 96, flex: 'none' }}>
          <svg width={96} height={96} viewBox="0 0 96 96" aria-hidden="true">
            <defs>
              <linearGradient id="cult-ring" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#f7e2b0" />
                <stop offset="55%" stopColor={GOLD} />
                <stop offset="100%" stopColor="#b97c2c" />
              </linearGradient>
            </defs>
            <circle cx={48} cy={48} r={ringR} fill="none" stroke="rgba(255,255,255,.10)" strokeWidth={6} />
            <circle
              cx={48}
              cy={48}
              r={ringR}
              fill="none"
              stroke="url(#cult-ring)"
              strokeWidth={6}
              strokeLinecap="round"
              strokeDasharray={ringLen}
              strokeDashoffset={ringLen * (1 - progress)}
              transform="rotate(-90 48 48)"
              style={{ filter: 'drop-shadow(0 0 6px rgba(232,195,122,.45))' }}
            />
          </svg>
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <CultivationSeal char={realm.char} color={realm.color} size={62} />
          </div>
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 10, letterSpacing: 2.4, color: 'rgba(232,195,122,.8)', fontWeight: 700 }}>
            当前境界
          </div>
          <div
            style={{
              fontFamily: SERIF_FONT,
              fontSize: 28,
              fontWeight: 700,
              letterSpacing: 2,
              lineHeight: 1.3,
              color: '#fff8e9',
            }}
          >
            {level.name}
          </div>
          <div style={{ fontSize: 11.5, color: 'rgba(246,239,226,.56)' }}>
            {realm.name}境 · 第 {level.level} 级
          </div>
        </div>
      </div>

      <div style={{ marginTop: 16, position: 'relative' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'baseline',
            justifyContent: 'space-between',
            gap: 10,
            fontSize: 11.5,
            color: 'rgba(246,239,226,.62)',
          }}
        >
          <span className="num">
            本级修为 <b style={{ color: GOLD, fontSize: 14 }}>{xpIntoLevel.toLocaleString('zh-CN')}</b>
            {next ? ` / ${xpForNext.toLocaleString('zh-CN')}` : ''}
          </span>
          <span>{next ? `距 ${next.name} 还需 ${(xpForNext - xpIntoLevel).toLocaleString('zh-CN')}` : '已至飞升'}</span>
        </div>
        <div
          style={{
            height: 9,
            borderRadius: 999,
            background: 'rgba(255,255,255,.12)',
            overflow: 'hidden',
            marginTop: 7,
            boxShadow: 'inset 0 1px 2px rgba(0,0,0,.25)',
          }}
        >
          <div
            style={{
              width: `${progress * 100}%`,
              height: '100%',
              borderRadius: 999,
              background: 'linear-gradient(90deg, #b97c2c, #e8c37a 55%, #fbe8bd)',
              boxShadow: '0 0 14px rgba(232,195,122,.55)',
              transition: 'width .3s ease',
            }}
          />
        </div>
      </div>

      <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap', marginTop: 13, position: 'relative' }}>
        <Pill>
          <Icon name="flame" size={13} style={{ color: GOLD }} />
          连续 {currentStreak} 天
        </Pill>
        <Pill>
          <Icon name="star" size={12} style={{ color: GOLD }} />
          {activeTitle ? `称号 · ${activeTitle}` : '尚无称号'}
        </Pill>
        <Pill>总修为 {totalXp.toLocaleString('zh-CN')}</Pill>
      </div>
    </div>
  )
}

function Pill({ children }: { children: ReactNode }) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        padding: '4px 9px',
        borderRadius: 999,
        background: 'rgba(255,255,255,.07)',
        border: '1px solid rgba(255,255,255,.12)',
        color: 'rgba(246,239,226,.82)',
        fontSize: 10.5,
        fontWeight: 600,
        whiteSpace: 'nowrap',
      }}
    >
      {children}
    </span>
  )
}

function RealmPath({ stats }: { stats: CultivationStats }) {
  return (
    <>
      <SectionTitle right={<span style={{ fontSize: 11.5, color: C.muted }}>共 10 境</span>}>
        境界之路
      </SectionTitle>
      <div
        style={{
          display: 'flex',
          gap: 8,
          overflowX: 'auto',
          margin: '0 -16px',
          padding: '0 16px 4px',
          scrollSnapType: 'x mandatory',
        }}
      >
        {REALMS.map((r) => {
          const current = stats.level.level >= r.startLevel && stats.level.level <= r.endLevel
          const passed = stats.level.level > r.endLevel
          const locked = stats.level.level < r.startLevel
          const realmProgress = current
            ? (stats.level.level - r.startLevel + stats.progress) / r.levels
            : passed
              ? 1
              : 0
          return (
            <div
              key={r.id}
              style={{
                width: 112,
                flex: 'none',
                scrollSnapAlign: 'start',
                padding: '10px 9px',
                borderRadius: R.md,
                background: C.surface,
                border: current ? `1.5px solid ${r.color}` : `1px solid ${C.border}`,
                boxShadow: current ? `0 4px 14px ${r.color}22` : 'none',
                opacity: locked ? 0.58 : 1,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                <CultivationSeal char={r.char} color={r.color} size={32} dim={locked} />
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 13.5, fontWeight: 700, color: current ? r.color : C.text }}>{r.name}</div>
                  <div style={{ fontSize: 9.5, color: C.muted }}>
                    {r.startLevel === r.endLevel ? `第 ${r.startLevel} 级` : `第 ${r.startLevel}–${r.endLevel} 级`}
                  </div>
                </div>
              </div>
              <div
                style={{
                  height: 3,
                  borderRadius: 999,
                  background: C.surfaceAlt,
                  overflow: 'hidden',
                  marginTop: 8,
                }}
              >
                <div
                  style={{
                    width: `${Math.max(0, Math.min(1, realmProgress)) * 100}%`,
                    height: '100%',
                    background: r.color,
                    borderRadius: 999,
                  }}
                />
              </div>
              <div style={{ marginTop: 5, fontSize: 9.5, color: current ? r.color : C.muted, fontWeight: current ? 700 : 500 }}>
                {current ? '修炼中' : passed ? '已过' : '未至'}
              </div>
            </div>
          )
        })}
      </div>
    </>
  )
}

function StreakCard({ stats }: { stats: CultivationStats }) {
  const { currentStreak, maxStreak, nextMilestone, prevMilestone, activeTitle } = stats
  const prevDays = prevMilestone?.days ?? 0
  const nextDays = nextMilestone?.days ?? prevDays
  const span = Math.max(1, nextDays - prevDays)
  const progress = nextMilestone ? Math.max(0, Math.min(1, (currentStreak - prevDays) / span)) : 1

  return (
    <>
      <SectionTitle right={<span style={{ fontSize: 11.5, color: C.muted }}>自然日连续</span>}>
        连续修炼
      </SectionTitle>
      <Card style={{ padding: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div
            style={{
              width: 46,
              height: 46,
              borderRadius: 14,
              background: '#fff4e2',
              color: '#c57a17',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flex: 'none',
            }}
          >
            <Icon name="flame" size={24} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
              <span className="num" style={{ fontSize: 24, fontWeight: 750, lineHeight: 1.1 }}>
                {currentStreak}
              </span>
              <span style={{ fontSize: 12.5, color: C.textSecondary }}>天连续修炼</span>
            </div>
            <div style={{ fontSize: 11.5, color: C.muted, marginTop: 2 }}>
              最长 {maxStreak} 天{activeTitle ? ` · 称号「${activeTitle}」` : ''}
            </div>
          </div>
          <div style={{ textAlign: 'right', fontSize: 11, color: C.muted, flex: 'none' }}>
            {nextMilestone ? (
              <>
                下个奖励
                <div style={{ fontSize: 13, fontWeight: 700, color: '#b8751b' }}>
                  {nextMilestone.days} 天 +{nextMilestone.xp}
                </div>
              </>
            ) : (
              <span style={{ color: C.success, fontWeight: 600 }}>全部达成</span>
            )}
          </div>
        </div>

        <div style={{ marginTop: 12 }}>
          <div style={{ height: 6, borderRadius: 999, background: C.surfaceAlt, overflow: 'hidden' }}>
            <div
              style={{
                width: `${progress * 100}%`,
                height: '100%',
                borderRadius: 999,
                background: 'linear-gradient(90deg, #e0a23f, #f0c878)',
              }}
            />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10.5, color: C.muted, marginTop: 5 }}>
            <span>{prevMilestone ? `${prevMilestone.days} 天` : '起点'}</span>
            <span>
              {nextMilestone
                ? `还差 ${nextMilestone.days - currentStreak} 天，可得 +${nextMilestone.xp} 修为`
                : '已解锁全部连击奖励'}
            </span>
            <span>{nextMilestone ? `${nextMilestone.days} 天` : '圆满'}</span>
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            gap: 7,
            overflowX: 'auto',
            margin: '12px -14px 0',
            padding: '0 14px 2px',
          }}
        >
          {STREAK_MILESTONES.map((m) => {
            const thisRun = currentStreak >= m.days
            const ever = maxStreak >= m.days
            const isNext = nextMilestone?.days === m.days
            return (
              <div
                key={m.days}
                style={{
                  width: 82,
                  flex: 'none',
                  padding: '8px 8px 7px',
                  borderRadius: 11,
                  background: thisRun ? '#fff8ea' : C.surfaceAlt,
                  border: `1px solid ${thisRun ? '#edd5a4' : C.border}`,
                  opacity: !thisRun && !isNext ? 0.62 : 1,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 12.5, fontWeight: 700 }}>
                  <Icon
                    name={thisRun ? 'check' : isNext ? 'flame' : 'lock'}
                    size={11}
                    style={{ color: thisRun ? '#b8751b' : isNext ? C.accent : C.muted }}
                  />
                  {m.days} 天
                </div>
                <div style={{ fontSize: 10.5, color: thisRun ? '#a96712' : C.muted, marginTop: 2 }}>
                  +{m.xp} 修为
                </div>
                <div style={{ fontSize: 10, color: C.textSecondary, marginTop: 3, whiteSpace: 'nowrap' }}>
                  {m.title}
                </div>
                <div style={{ fontSize: 9, color: C.muted, marginTop: 2 }}>
                  {thisRun ? '本次达成' : ever ? '曾达成' : isNext ? '进行中' : '未解锁'}
                </div>
              </div>
            )
          })}
        </div>
      </Card>
    </>
  )
}

function Breakdown({ stats }: { stats: CultivationStats }) {
  const { breakdown, totalXp, trainingDays, totalSets, totalVolume, prCount } = stats
  const rows = [
    { label: '每日修炼', value: breakdown.daily, note: `80 × ${trainingDays} 天`, color: '#3f9d6b' },
    { label: '记录组数', value: breakdown.sets, note: `每组 +6，单日上限 36`, color: '#2f7fd4' },
    { label: '训练容量', value: breakdown.volume, note: `每 200kg +1，单日上限 40`, color: '#c9922e' },
    { label: '突破纪录', value: breakdown.pr, note: `每个动作破重量纪录 +40，单日上限 120`, color: '#d24b4b' },
    { label: '连续奖励', value: breakdown.streak, note: '连击里程碑一次性奖励', color: '#8e5bd9' },
  ]

  return (
    <>
      <SectionTitle right={<span style={{ fontSize: 11.5, color: C.muted }}>自动计算</span>}>
        修为明细
      </SectionTitle>
      <Card style={{ padding: 14 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 12.5, color: C.textSecondary }}>累计修为</span>
          <span className="num" style={{ fontSize: 24, fontWeight: 750 }}>
            {totalXp.toLocaleString('zh-CN')}
          </span>
        </div>

        <div
          style={{
            display: 'flex',
            height: 8,
            borderRadius: 999,
            overflow: 'hidden',
            background: C.surfaceAlt,
            margin: '10px 0 12px',
          }}
        >
          {rows.map((r) => (
            <div
              key={r.label}
              title={`${r.label} ${r.value}`}
              style={{ width: `${totalXp ? (r.value / totalXp) * 100 : 0}%`, background: r.color, height: '100%' }}
            />
          ))}
        </div>

        <div style={{ display: 'grid', gap: 9 }}>
          {rows.map((r) => (
            <div key={r.label} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ width: 7, height: 7, borderRadius: 99, background: r.color, flex: 'none' }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12.5, fontWeight: 600 }}>{r.label}</div>
                <div style={{ fontSize: 10.5, color: C.muted }}>{r.note}</div>
              </div>
              <div className="num" style={{ fontSize: 13, fontWeight: 650, color: r.value ? C.text : C.muted }}>
                +{r.value.toLocaleString('zh-CN')}
              </div>
            </div>
          ))}
        </div>

        <div
          style={{
            marginTop: 12,
            paddingTop: 10,
            borderTop: `1px solid ${C.border}`,
            fontSize: 11,
            color: C.muted,
            lineHeight: 1.6,
          }}
        >
          训练 {trainingDays} 天 · {totalSets} 组 · {fmtNumber(totalVolume)} kg · {prCount} 次破纪录
        </div>
      </Card>
    </>
  )
}

function LevelTable({ stats }: { stats: CultivationStats }) {
  const maxReq = Math.max(...LEVELS.map((l) => l.xpToNext))
  const maxXp = LEVELS[LEVELS.length - 1].xpTotal
  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <div style={{ fontSize: 12, color: C.muted, lineHeight: 1.7 }}>
        每一级都有独立的修为上限，等级越高需要的进度越长。当前所在：<b style={{ color: stats.level.realm.color }}>{stats.level.name}</b>
      </div>

      {REALMS.map((r) => {
        const currentRealm = stats.level.realm.id === r.id
        const locked = stats.level.level < r.startLevel
        return (
          <div key={r.id}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 7 }}>
              <CultivationSeal char={r.char} color={r.color} size={30} dim={locked} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: locked ? C.textSecondary : r.color }}>
                  {r.name}境
                </div>
                <div style={{ fontSize: 10.5, color: C.muted }}>
                  {r.startLevel === r.endLevel ? `第 ${r.startLevel} 级` : `第 ${r.startLevel}–${r.endLevel} 级`}
                </div>
              </div>
              {currentRealm ? (
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    color: r.color,
                    background: `${r.color}12`,
                    border: `1px solid ${r.color}30`,
                    padding: '2px 7px',
                    borderRadius: 999,
                  }}
                >
                  当前
                </span>
              ) : null}
            </div>
            <div style={{ borderRadius: R.md, overflow: 'hidden', border: `1px solid ${C.border}`, background: C.surface }}>
              {LEVELS.filter((l) => l.realm.id === r.id).map((l) => {
                const current = l.level === stats.level.level
                const passed = l.level < stats.level.level
                return (
                  <div
                    key={l.level}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '36px 1fr 88px',
                      gap: 8,
                      alignItems: 'center',
                      padding: '8px 10px',
                      borderTop: l.level === r.startLevel ? 'none' : `1px solid ${C.border}`,
                      background: current ? `${r.color}0e` : 'transparent',
                    }}
                  >
                    <div
                      className="num"
                      style={{ fontSize: 11.5, fontWeight: 700, color: current ? r.color : passed ? C.textSecondary : C.muted }}
                    >
                      Lv.{l.level}
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                        <span style={{ fontSize: 12.5, fontWeight: current ? 700 : 550, color: current ? r.color : C.text }}>
                          {l.name}
                        </span>
                        {current ? (
                          <span style={{ fontSize: 9, fontWeight: 700, color: '#fff', background: r.color, padding: '1px 5px', borderRadius: 999 }}>
                            当前
                          </span>
                        ) : null}
                      </div>
                      <div style={{ height: 3, borderRadius: 999, background: C.surfaceAlt, overflow: 'hidden', marginTop: 4 }}>
                        <div
                          style={{
                            width: `${l.xpToNext ? Math.max(3, (l.xpToNext / maxReq) * 100) : 100}%`,
                            height: '100%',
                            background: current ? r.color : passed ? `${r.color}88` : C.borderStrong,
                            borderRadius: 999,
                          }}
                        />
                      </div>
                    </div>
                    <div style={{ textAlign: 'right', fontSize: 10, color: C.muted, lineHeight: 1.5 }}>
                      <div style={{ color: current ? r.color : C.textSecondary, fontWeight: 600 }}>
                        {l.xpToNext ? `+${l.xpToNext.toLocaleString('zh-CN')}` : '已达巅峰'}
                      </div>
                      <div>累计 {l.xpTotal.toLocaleString('zh-CN')}</div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )
      })}

      <div style={{ fontSize: 11, color: C.muted, lineHeight: 1.7 }}>
        满级共需 {maxXp.toLocaleString('zh-CN')} 修为。按每天一次训练、约 150–200 修为估算，是一条以年为单位的长期修行线。
      </div>
    </div>
  )
}
