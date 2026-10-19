/** 生成短 id */
export function uid(prefix = ''): string {
  const rand = Math.random().toString(36).slice(2, 8)
  return `${prefix}${Date.now().toString(36)}${rand}`
}

/** 本地时区下的 'YYYY-MM-DD' */
export function todayKey(d: Date = new Date()): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

/** 'YYYY-MM-DD' 解析为本地 Date（避免 new Date(str) 被当成 UTC） */
export function parseDateKey(key: string): Date {
  const [y, m, d] = key.split('-').map(Number)
  return new Date(y, m - 1, d)
}

/** 在某天基础上加减天数 */
export function shiftDateKey(key: string, days: number): string {
  const d = parseDateKey(key)
  d.setDate(d.getDate() + days)
  return todayKey(d)
}

/** 某月第一天 */
export function monthStart(year: number, month: number): Date {
  return new Date(year, month, 1)
}

/** 某月天数 */
export function daysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate()
}

const WEEKDAYS = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']

/** 显示用：10月20日 周一 */
export function formatDateCN(key: string, withYear = false): string {
  const d = parseDateKey(key)
  const base = `${d.getMonth() + 1}月${d.getDate()}日 ${WEEKDAYS[d.getDay()]}`
  return withYear ? `${d.getFullYear()}年${base}` : base
}

/** 紧凑显示：10/20 */
export function formatDateShort(key: string): string {
  const d = parseDateKey(key)
  return `${d.getMonth() + 1}/${d.getDate()}`
}

/** 相对日期描述 */
export function relativeDay(key: string): string {
  const today = todayKey()
  if (key === today) return '今天'
  if (key === shiftDateKey(today, -1)) return '昨天'
  if (key === shiftDateKey(today, 1)) return '明天'
  return formatDateCN(key)
}

/** 保留一位小数，去掉多余的 .0 */
export function fmtNumber(n: number): string {
  const rounded = Math.round(n * 10) / 10
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1)
}

/** 大数字缩写：12800 -> 12.8k */
export function fmtCompact(n: number): string {
  if (Math.abs(n) >= 10000) return `${fmtNumber(n / 1000)}k`
  return fmtNumber(n)
}

/** 一组容量 = 重量 × 次数（自重按 0 处理） */
export function setVolume(weight: number, reps: number): number {
  return weight * reps
}

/** 秒 -> '1:05' */
export function formatClock(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds))
  const m = Math.floor(s / 60)
  const sec = s % 60
  return `${m}:${String(sec).padStart(2, '0')}`
}

/** 时间戳 -> '20:15' */
export function formatTime(ts: number): string {
  const d = new Date(ts)
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

/** 防抖 */
export function debounce<T extends (...args: never[]) => void>(fn: T, wait = 200): T {
  let timer: ReturnType<typeof setTimeout> | undefined
  return ((...args: Parameters<T>) => {
    if (timer) clearTimeout(timer)
    timer = setTimeout(() => fn(...args), wait)
  }) as T
}

/** 数字输入解析：空字符串返回 null */
export function parseNum(raw: string): number | null {
  if (raw.trim() === '') return null
  const n = Number(raw)
  return Number.isFinite(n) ? n : null
}
