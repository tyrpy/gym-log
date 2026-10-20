/**
 * 设计令牌：宣纸水墨
 *
 * 配色取自「生宣 + 松烟墨 + 朱砂印」：
 * 纸色偏暖、墨色偏冷，点缀色只用朱砂，避免出现第二种高饱和色。
 */
export const C = {
  /** 页面底色：生宣 */
  bg: '#f2ead9',
  /** 卡片：裱过的宣纸，比底色亮一点 */
  surface: '#faf5e9',
  /** 次级底色：淡墨渲染 */
  surfaceAlt: '#f3ecdc',
  border: '#d9cfb8',
  borderStrong: '#c4b699',

  /** 松烟墨 */
  text: '#232019',
  textSecondary: '#4a4438',
  muted: '#7d7463',

  /** 朱砂 */
  accent: '#a63a2b',
  accentSoft: '#f2e3d8',
  accentBorder: '#dcc0ae',

  /** 石绿（完成） */
  success: '#3f5f4a',
  successSoft: '#e3ebe1',

  /** 石青（信息） */
  info: '#3f5f6e',
  infoSoft: '#e2ebee',

  /** 赭石（提醒） */
  warning: '#8a6a2f',
  warningSoft: '#f4ecdb',

  danger: '#8f2c22',
  white: '#ffffff',
} as const

export const SHADOW = {
  card: '0 1px 0 rgba(90, 78, 58, 0.05), 0 10px 24px -18px rgba(60, 50, 35, 0.45)',
  raised: '0 14px 36px -20px rgba(45, 38, 26, 0.55)',
  sheet: '0 -10px 40px rgba(45, 38, 26, 0.22)',
  nav: '0 -1px 0 #d9cfb8',
} as const

export const R = {
  sm: 5,
  md: 7,
  lg: 10,
  xl: 14,
  pill: 999,
} as const

export const MAXW = 720

/** 字体栈：优先内置霞鹜文楷，回退系统楷体 */
export const FONT = {
  kai: '"WenKai", "KaiTi", "STKaiti", "Kaiti SC", serif',
  num: '"Baskerville", "Times New Roman", "Songti SC", serif',
} as const
