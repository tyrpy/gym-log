/**
 * 设计令牌：现代纸感
 *
 * 保留「宣纸 + 松烟墨 + 朱砂」的底色，但减少纹理和装饰：
 * - 页面底色更浅、卡片更亮，靠留白和细边框分层
 * - 正文改用无衬线，标题保留霞鹜文楷
 * - 圆角更大、阴影更轻，整体更接近现代杂志而不是古籍复刻
 */
export const C = {
  /** 页面底色：浅宣纸 */
  bg: '#f4efe4',
  /** 卡片：更亮的纸面 */
  surface: '#fffdf8',
  /** 次级底色 */
  surfaceAlt: '#f7f2e7',
  border: '#e5dccb',
  borderStrong: '#d2c5ac',

  /** 松烟墨 */
  text: '#211e18',
  textSecondary: '#4b4539',
  muted: '#7e7564',

  /** 朱砂 */
  accent: '#a63a2b',
  accentSoft: '#f7e9e0',
  accentBorder: '#e7cdbd',

  /** 石绿（完成） */
  success: '#3f6b50',
  successSoft: '#e7efe8',

  /** 石青（信息） */
  info: '#3f6170',
  infoSoft: '#e6eef1',

  /** 赭石（提醒） */
  warning: '#8a6a2f',
  warningSoft: '#f5eddd',

  danger: '#8f2c22',
  white: '#ffffff',
} as const

export const SHADOW = {
  card: '0 1px 2px rgba(64, 51, 32, 0.04), 0 18px 36px -28px rgba(64, 51, 32, 0.35)',
  raised: '0 20px 48px -26px rgba(45, 38, 26, 0.35)',
  sheet: '0 -16px 48px rgba(45, 38, 26, 0.18)',
  nav: '0 -1px 0 #e5dccb',
} as const

export const R = {
  sm: 6,
  md: 10,
  lg: 14,
  xl: 18,
  pill: 999,
} as const

export const MAXW = 720

/** 字体分工：界面用无衬线，标题与印章保留文楷 */
export const FONT = {
  ui: '-apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", "Noto Sans SC", sans-serif',
  kai: '"WenKai", "KaiTi", "STKaiti", "Kaiti SC", serif',
  num: '"Baskerville", "Times New Roman", "Songti SC", serif',
} as const
