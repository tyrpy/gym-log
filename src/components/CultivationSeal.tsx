export const SERIF_FONT =
  '"WenKai", "KaiTi", "STKaiti", "Kaiti SC", "Songti SC", "SimSun", serif'

/**
 * 境界印记：朱砂印章的样子。
 * 方形、细边、微微倾斜，字用境界色，底为纸色。
 */
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
  const ink = dim ? '#a89e8b' : color
  return (
    <div
      aria-hidden="true"
      style={{
        width: size,
        height: size,
        borderRadius: Math.max(3, Math.round(size * 0.1)),
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flex: 'none',
        background: dim ? '#f4efe3' : '#fbf6ea',
        border: `1.5px solid ${ink}`,
        boxShadow: dim ? 'none' : `inset 0 0 0 1px rgba(251,246,234,.9), 0 2px 0 ${ink}18`,
        transform: dim ? 'none' : 'rotate(-2.5deg)',
        opacity: dim ? 0.7 : 1,
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: Math.max(2, Math.round(size * 0.11)),
          borderRadius: Math.max(2, Math.round(size * 0.06)),
          border: `1px solid ${ink}4d`,
        }}
      />
      <span
        style={{
          fontFamily: SERIF_FONT,
          fontSize: Math.round(size * 0.46),
          fontWeight: 700,
          lineHeight: 1,
          color: ink,
          transform: 'translateY(1px)',
          letterSpacing: 0,
        }}
      >
        {char}
      </span>
    </div>
  )
}
