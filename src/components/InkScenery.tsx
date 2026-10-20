/**
 * 远山：页面底部的淡墨风景。
 * 固定定位、不接收点击，只做氛围。
 */
export function InkScenery({ opacity = 1 }: { opacity?: number }) {
  return (
    <div
      aria-hidden="true"
      style={{
        position: 'fixed',
        left: 0,
        right: 0,
        bottom: 0,
        height: '38vh',
        pointerEvents: 'none',
        zIndex: 0,
        opacity,
        // 顶部渐隐，避免出现生硬的边界
        maskImage: "linear-gradient(to top, #000 62%, transparent 100%)",
        WebkitMaskImage: "linear-gradient(to top, #000 62%, transparent 100%)",
      }}
    >
      <svg width="100%" height="100%" viewBox="0 0 414 380" preserveAspectRatio="none">
        <defs>
          <filter id="ink-blur" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3.2" />
          </filter>
          <filter id="ink-blur-soft" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="9" />
          </filter>
          <linearGradient id="wash-far" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#8d8471" stopOpacity="0.20" />
            <stop offset="100%" stopColor="#8d8471" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="wash-mid" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#6f6757" stopOpacity="0.16" />
            <stop offset="100%" stopColor="#6f6757" stopOpacity="0.02" />
          </linearGradient>
          <linearGradient id="wash-near" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#4d4638" stopOpacity="0.16" />
            <stop offset="100%" stopColor="#4d4638" stopOpacity="0.04" />
          </linearGradient>
        </defs>

        {/* 淡月 */}
        <circle cx="330" cy="78" r="34" fill="#b9aa8c" opacity="0.18" filter="url(#ink-blur-soft)" />

        {/* 远山 */}
        <path
          d="M0 196 C58 158 96 176 140 148 C186 118 214 152 258 170 C302 188 344 164 414 192 L414 380 L0 380 Z"
          fill="url(#wash-far)"
          filter="url(#ink-blur-soft)"
        />
        {/* 中山 */}
        <path
          d="M0 244 C54 212 92 232 138 206 C186 178 214 210 260 228 C306 246 352 224 414 250 L414 380 L0 380 Z"
          fill="url(#wash-mid)"
          filter="url(#ink-blur)"
        />
        {/* 近山 */}
        <path
          d="M0 300 C66 274 106 292 154 270 C204 248 238 276 286 292 C334 308 372 294 414 310 L414 380 L0 380 Z"
          fill="url(#wash-near)"
          filter="url(#ink-blur)"
        />


      </svg>
    </div>
  )
}
