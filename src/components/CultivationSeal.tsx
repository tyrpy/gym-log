export const SERIF_FONT = '"Songti SC", "Noto Serif SC", "Source Han Serif SC", "SimSun", serif'

/** 境界印记：双层圆环 + 境界单字，带一点金石光泽 */
export function CultivationSeal({
  char,
  color,
  size = 44,
  dim = false,
}: {
  char: string
  color: string
  size?: number
  dim?: boolean
}) {
  const inner = Math.max(3, Math.round(size * 0.09))
  return (
    <div
      aria-hidden="true"
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flex: 'none',
        background: dim
          ? 'radial-gradient(circle at 35% 30%, rgba(255,255,255,.9), rgba(240,242,246,.7))'
          : `radial-gradient(circle at 35% 30%, ${color}55, rgba(12,14,20,.35))`,
        border: `1px solid ${dim ? '#dfe4ea' : `${color}99`}`,
        boxShadow: dim
          ? 'none'
          : `inset 0 0 0 ${Math.max(2, Math.round(size * 0.05))}px rgba(0,0,0,.16), 0 0 0 3px ${color}1f, 0 4px 12px ${color}33`,
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: inner,
          borderRadius: '50%',
          border: `1px solid ${dim ? '#e8ecf1' : `${color}66`}`,
        }}
      />
      <span
        style={{
          fontFamily: SERIF_FONT,
          fontSize: Math.round(size * 0.4),
          fontWeight: 700,
          lineHeight: 1,
          color: dim ? '#9aa4b2' : '#f7e7c6',
          textShadow: dim ? 'none' : `0 0 10px ${color}88`,
          transform: 'translateY(1px)',
        }}
      >
        {char}
      </span>
    </div>
  )
}
