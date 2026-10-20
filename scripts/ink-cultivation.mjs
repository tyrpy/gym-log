// 把修为页的大黑卡改成水墨纸卡
import { readFileSync, writeFileSync } from 'node:fs'

const p = 'src/pages/CultivationPage.tsx'
let c = readFileSync(p, 'utf8')

const pairs = [
  [`const GOLD = '#e8c37a'`, `const GOLD = '#a63a2b'`],
  [
    'background: `radial-gradient(circle at 86% -6%, ${realm.color}66 0%, transparent 52%), linear-gradient(135deg, #151822 0%, #232032 58%, #302741 100%)`,',
    'background: `radial-gradient(circle at 88% -10%, ${realm.color}22 0%, transparent 56%), linear-gradient(160deg, #fcf7ec 0%, #f5edda 100%)`,',
  ],
  [`border: '1px solid rgba(232,195,122,.26)',`, 'border: `1px solid ${C.border}`,'],
  [`boxShadow: '0 14px 34px rgba(23,26,36,.22)',`, `boxShadow: '0 1px 0 rgba(90,78,58,.05)',`],
  [`color: '#f6efe2',`, 'color: C.text,'],
  [`color: 'rgba(255,255,255,.045)',`, `color: 'rgba(35,32,25,.055)',`],
  [
    'background: `linear-gradient(90deg, transparent, ${GOLD}66, transparent)`,',
    'background: `linear-gradient(90deg, transparent, ${C.border}, transparent)`,',
  ],
  [`stroke="rgba(255,255,255,.10)"`, `stroke="rgba(35,32,25,.10)"`],
  [`style={{ filter: 'drop-shadow(0 0 6px rgba(232,195,122,.45))' }}`, `style={{ filter: 'none' }}`],
  [`<stop offset="0%" stopColor="#f7e2b0" />`, `<stop offset="0%" stopColor={realm.color} />`],
  [`<stop offset="55%" stopColor={GOLD} />`, `<stop offset="55%" stopColor={realm.color} />`],
  [`<stop offset="100%" stopColor="#b97c2c" />`, `<stop offset="100%" stopColor={realm.color} />`],
  [`color: 'rgba(232,195,122,.8)', fontWeight: 700`, `color: C.accent, fontWeight: 700`],
  [`color: '#fff8e9',`, 'color: C.text,'],
  [`color: 'rgba(246,239,226,.56)'`, 'color: C.muted'],
  [`color: 'rgba(246,239,226,.62)',`, 'color: C.muted,'],
  [`background: 'rgba(255,255,255,.12)',`, `background: '#e4d9c2',`],
  [`boxShadow: 'inset 0 1px 2px rgba(0,0,0,.25)',`, `boxShadow: 'none',`],
  [
    `background: 'linear-gradient(90deg, #b97c2c, #e8c37a 55%, #fbe8bd)',`,
    'background: `linear-gradient(90deg, ${realm.color}, ${realm.color}cc)`,',
  ],
  [`boxShadow: '0 0 14px rgba(232,195,122,.55)',`, `boxShadow: 'none',`],
  [`background: 'rgba(255,255,255,.07)',`, `background: 'rgba(35,32,25,.05)',`],
  [`border: '1px solid rgba(255,255,255,.12)',`, 'border: `1px solid ${C.border}`'],
  [`color: 'rgba(246,239,226,.82)',`, 'color: C.textSecondary,'],
  [`background: 'linear-gradient(90deg, #e0a23f, #f0c878)',`, 'background: C.accent,'],
]

let miss = 0
for (const [from, to] of pairs) {
  if (c.includes(from)) c = c.split(from).join(to)
  else {
    miss++
    console.log('未匹配:', from.slice(0, 70))
  }
}

writeFileSync(p, c, 'utf8')
console.log('完成，未匹配', miss, '处')
