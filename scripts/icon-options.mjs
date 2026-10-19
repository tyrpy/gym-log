// 生成多套桌面图标方案，输出 512px 单图 + 一张对比图
import { spawn } from 'node:child_process'
import { mkdirSync, writeFileSync } from 'node:fs'

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
const port = 9650 + Math.floor(Math.random() * 150)
const outDir = '.shots/icons'
mkdirSync(outDir, { recursive: true })

const dumbbell = (color) => `
  <g fill="${color}">
    <rect x="150" y="238" width="212" height="36" rx="10"/>
    <rect x="96" y="188" width="64" height="136" rx="18"/>
    <rect x="52" y="212" width="36" height="88" rx="14"/>
    <rect x="352" y="188" width="64" height="136" rx="18"/>
    <rect x="424" y="212" width="36" height="88" rx="14"/>
  </g>`

const variants = [
  {
    id: 'a',
    label: 'A · 橙底白器械（当前）',
    bg: '#e6512e',
    inner: dumbbell('#ffffff'),
    note: '和 App 主题色一致',
  },
  {
    id: 'b',
    label: 'B · 深色底橙器械',
    bg: '#1a1e24',
    inner: dumbbell('#ff7a54'),
    note: '夜间感更强，桌面上一眼能认',
  },
  {
    id: 'c',
    label: 'C · 米白底橙器械',
    bg: '#f3f4f7',
    inner: dumbbell('#e6512e'),
    note: '最干净，和浅色界面统一',
  },
  {
    id: 'd',
    label: 'D · 橙底「健」字',
    bg: '#e6512e',
    inner: `<text x="256" y="352" font-family="'Microsoft YaHei','PingFang SC',sans-serif" font-size="300" font-weight="700" fill="#ffffff" text-anchor="middle">健</text>`,
    note: '中文一眼识别',
  },
  {
    id: 'e',
    label: 'E · 渐变橙底器械',
    bg: 'linear-gradient(145deg,#ff7a54 0%,#d63f1c 100%)',
    inner: dumbbell('#ffffff'),
    note: '多一点层次',
  },
]

function iconHtml(v, size) {
  const isGradient = v.bg.startsWith('linear-gradient')
  const bgStyle = isGradient ? `background:${v.bg}` : `background:${v.bg}`
  return `<div style="width:${size}px;height:${size}px;${bgStyle};display:flex;align-items:center;justify-content:center;border-radius:${size * 0.22}px;overflow:hidden">
    <svg viewBox="0 0 512 512" width="${size}" height="${size}">${v.inner}</svg>
  </div>`
}

const chrome = spawn(CHROME, ['--headless=new', '--disable-gpu', '--hide-scrollbars', `--remote-debugging-port=${port}`,
  `--user-data-dir=${process.env.TEMP}\\gymlog-icons-${Date.now()}`, 'about:blank'], { stdio: 'ignore' })

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
let ws
try {
  for (let i = 0; i < 60; i++) {
    try { await (await fetch(`http://127.0.0.1:${port}/json/version`)).json(); break } catch { await sleep(200) }
  }
  const targets = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json()
  ws = new WebSocket(targets.find((t) => t.type === 'page').webSocketDebuggerUrl)
  await new Promise((r, j) => { ws.onopen = r; ws.onerror = j })
  let id = 0
  const pending = new Map()
  ws.onmessage = (ev) => {
    const m = JSON.parse(ev.data)
    if (m.id && pending.has(m.id)) {
      const p = pending.get(m.id); pending.delete(m.id)
      m.error ? p.reject(new Error(JSON.stringify(m.error))) : p.resolve(m.result)
    }
  }
  const send = (method, params = {}) => new Promise((res, rej) => {
    const mid = ++id; pending.set(mid, { resolve: res, reject: rej }); ws.send(JSON.stringify({ id: mid, method, params }))
  })
  const evaluate = async (expression) => {
    const r = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true })
    if (r.exceptionDetails) throw new Error((r.exceptionDetails.exception?.description ?? r.exceptionDetails.text).slice(0, 300))
    return r.result.value
  }

  await send('Page.enable')
  await send('Runtime.enable')

  // 单张 512 图
  for (const v of variants) {
    await evaluate(`document.open(); document.write(${JSON.stringify(
      `<!doctype html><html><head><style>html,body{margin:0;padding:0}</style></head><body>${iconHtml(v, 512)}</body></html>`,
    )}); document.close(); true`)
    await sleep(220)
    await send('Emulation.setDeviceMetricsOverride', { width: 512, height: 512, deviceScaleFactor: 1, mobile: false })
    await sleep(120)
    const shot = await send('Page.captureScreenshot', {
      format: 'png',
      clip: { x: 0, y: 0, width: 512, height: 512, scale: 1 },
    })
    writeFileSync(`${outDir}/option-${v.id}.png`, Buffer.from(shot.data, 'base64'))
    console.log('wrote', `option-${v.id}.png`)
  }

  // 对比图（含标签与圆角预览）
  const cards = variants.map((v) => `
    <div style="display:flex;flex-direction:column;align-items:center;gap:10px">
      ${iconHtml(v, 150)}
      <div style="font-size:15px;font-weight:700;color:#1a1e24">${v.label}</div>
      <div style="font-size:12px;color:#8b94a3;max-width:160px;text-align:center;line-height:1.5">${v.note}</div>
    </div>`).join('')

  await evaluate(`document.open(); document.write(${JSON.stringify(
    `<!doctype html><html><head><style>html,body{margin:0}body{background:#eef0f4;font-family:'Microsoft YaHei',sans-serif;padding:28px 20px}</style></head><body>
      <div style="font-size:20px;font-weight:700;margin-bottom:22px;color:#1a1e24">桌面图标方案</div>
      <div style="display:flex;flex-wrap:wrap;gap:26px 22px">${cards}</div>
    </body></html>`,
  )}); document.close(); true`)
  await sleep(400)
  await send('Emulation.setDeviceMetricsOverride', { width: 760, height: 620, deviceScaleFactor: 2, mobile: false })
  await sleep(200)
  const sheet = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true })
  writeFileSync(`${outDir}/compare.png`, Buffer.from(sheet.data, 'base64'))
  console.log('wrote compare.png')
} finally {
  try { ws?.close() } catch {}
  chrome.kill()
}
