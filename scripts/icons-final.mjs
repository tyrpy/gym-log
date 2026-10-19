// 正式图标资源（M3：黑底 + 细描边 + 白色 tyrpy 字标）
import { spawn } from 'node:child_process'
import { writeFileSync } from 'node:fs'

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
const port = 8650 + Math.floor(Math.random() * 140)

const FONT = `'Arial Rounded MT Bold','Segoe UI','Verdana',sans-serif`
const FG = '#ffffff'

const bar = (color, tilt = -6) => `
  <g fill="${color}" transform="rotate(${tilt} 256 230)">
    <rect x="150" y="244" width="212" height="34" rx="10"/>
    <rect x="98" y="196" width="62" height="130" rx="18"/>
    <rect x="56" y="220" width="34" height="82" rx="13"/>
    <rect x="352" y="196" width="62" height="130" rx="18"/>
    <rect x="422" y="220" width="34" height="82" rx="13"/>
  </g>`

/** 图标主体（不含背景与描边），便于 maskable 缩放 */
const content = `
  <g transform="translate(0,-54) scale(0.92) translate(24,22)">
    ${bar(FG)}
  </g>
  <g transform="rotate(-4 256 386)">
    <text x="186" y="414" font-family="${FONT}" font-size="92" font-weight="700"
          letter-spacing="1" fill="${FG}" text-anchor="middle">tyrpy</text>
    <path d="M 322 402 L 339 419 L 370 382"
          fill="none" stroke="${FG}" stroke-width="14" stroke-linecap="round" stroke-linejoin="round"/>
  </g>`

const defs = `
  <defs>
    <linearGradient id="bg" x1="0.1" y1="0" x2="0.9" y2="1">
      <stop offset="0%" stop-color="#1b1f25"/>
      <stop offset="100%" stop-color="#000000"/>
    </linearGradient>
  </defs>`

const frame = `<rect x="6" y="6" width="500" height="500" rx="120" fill="none"
  stroke="#ffffff" stroke-opacity="0.10" stroke-width="6"/>`

const iconSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  ${defs}
  <rect width="512" height="512" fill="url(#bg)"/>
  ${content}
  ${frame}
</svg>
`

/** maskable：系统自己裁形状，去掉描边，内容缩进安全区 */
const maskableSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  ${defs}
  <rect width="512" height="512" fill="url(#bg)"/>
  <g transform="translate(256,256) scale(0.72) translate(-256,-256)">
    ${content}
  </g>
</svg>
`

writeFileSync('public/icon.svg', iconSvg)
console.log('wrote public/icon.svg')

const jobs = [
  { svg: iconSvg, size: 512, file: 'public/icon-512.png' },
  { svg: iconSvg, size: 192, file: 'public/icon-192.png' },
  { svg: iconSvg, size: 180, file: 'public/apple-touch-icon.png' },
  { svg: iconSvg, size: 64, file: 'public/favicon.png' },
  { svg: maskableSvg, size: 512, file: 'public/icon-maskable-512.png' },
]

const chrome = spawn(CHROME, ['--headless=new', '--disable-gpu', '--hide-scrollbars', `--remote-debugging-port=${port}`,
  `--user-data-dir=${process.env.TEMP}\\gymlog-m3-${Date.now()}`, 'about:blank'], { stdio: 'ignore' })

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

  await send('Page.enable'); await send('Runtime.enable')

  for (const job of jobs) {
    const inner = job.svg.replace(/<svg[^>]*>/, `<svg viewBox="0 0 512 512" width="${job.size}" height="${job.size}">`)
    const html = `<!doctype html><html><head><style>html,body{margin:0}</style></head>
      <body><div style="width:${job.size}px;height:${job.size}px;overflow:hidden">${inner}</div></body></html>`
    await evaluate(`document.open(); document.write(${JSON.stringify(html)}); document.close(); true`)
    await sleep(200)
    await send('Emulation.setDeviceMetricsOverride', { width: job.size, height: job.size, deviceScaleFactor: 1, mobile: false })
    await sleep(120)
    const shot = await send('Page.captureScreenshot', {
      format: 'png',
      clip: { x: 0, y: 0, width: job.size, height: job.size, scale: 1 },
    })
    writeFileSync(job.file, Buffer.from(shot.data, 'base64'))
    console.log('wrote', job.file, `${job.size}x${job.size}`)
  }
} finally {
  try { ws?.close() } catch {}
  chrome.kill()
}
