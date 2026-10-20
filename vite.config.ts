import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

/**
 * 部署路径：
 * - 本地开发 / 根域名：默认 '/'
 * - GitHub Pages 项目页：构建时加 `--base=/仓库名/`（见 package.json 的 deploy 脚本）
 */
export default defineConfig({
  base: '/',
  plugins: [
    react(),
    VitePWA({
      // 有新版本时先提示，用户点「更新」再刷新，避免练到一半被打断
      registerType: 'prompt',
      injectRegister: false,
      includeAssets: ['favicon-v2.png', 'icon.svg', 'apple-touch-icon-v2.png'],
      manifest: {
        name: '健身日志',
        short_name: '健身日志',
        description: '记录每天练了哪些部位、做了哪些动作、每组多重多少次。',
        lang: 'zh-CN',
        start_url: './',
        scope: './',
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#f2ead9',
        theme_color: '#f2ead9',
        categories: ['health', 'fitness', 'sports'],
        icons: [
          { src: 'icon-192-v2.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: 'icon-512-v2.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: 'icon-maskable-512-v2.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,png,svg,webmanifest,ico}'],
        // 页面导航一律回退到 index.html，保证深链接可用
        navigateFallback: 'index.html',
        cleanupOutdatedCaches: true,
        // 首次安装后立刻接管页面，保证第一次加载完就能离线；
        // 但新版本不自动 skipWaiting，等用户点「更新」，避免打断正在进行的记录
        clientsClaim: true,
        skipWaiting: false,
      },
      devOptions: {
        enabled: false,
      },
    }),
  ],
  server: {
    host: true,
    port: 5173,
  },
  preview: {
    host: true,
    port: 4173,
  },
})
