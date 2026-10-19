import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'io.github.tyrpy.gymlog',
  appName: '健身日志',
  webDir: 'dist',
  android: {
    // 应用内不加载任何外部页面，只跑打包进来的本地文件
    allowMixedContent: false,
  },
  server: {
    androidScheme: 'https',
  },
}

export default config
