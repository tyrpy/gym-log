// 生成 Android 各密度图标：普通 / 圆形 / 自适应前景层
import { spawn } from 'node:child_process'
import { writeFileSync, mkdirSync } from 'node:fs'

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
const port = 8550 + Math.floor(Math.random() * 140)
const RES = 'android/app/src/main/res'

const FONT = `'Arial Rounded MT Bold','Segoe UI','Verdana',sans-serif`

const content = (scale, fg) => `
  <g transform="translate(256,256) scale(${scale}) translate(-256,-256)">
    <g transform="translate(0,-54) scale(0.92) translate(24,22)">
      <g fill="${fg}" transform="rotate(-6 256 230)">
        <rect x="150" y="244" width="212" height="34" rx="10"/>
        <rect x="98" y="196" width="62" height="130" rx="18"/>
        <rect x="56" y="220" width="34" height="82" rx="13"/>
        <rect x="352" y="196" width="62" height="130" rx="18"/>
        <rect x="422" y="220" width="34" height="82" rx="13"/>
      </g>
    </g>
    <g transform="rotate(-4 256 386)">
      <text x="186" y="414" font-family="${FONT}" font-size="92" font-weight="700"
            letter-spacing="1" fill="${fg}" text-anchor="middle">tyrpy</text>
      <path d="M 322 402 L 339 419 L 370 382"
            fill="none" stroke="${fg}" stroke-width="14" stroke-linecap="round" stroke-linejoin="round"/>
    </g>
  </g>`

const grad = `<defs><linearGradient id="bg" x1="0.1" y1="0" x2="0.9" y2="1">
  <stop offset="0%" stop-color="#1b1f25"/><stop offset="100%" stop-color="#000000"/>
</linearGradient></defs>`

const fullSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">${grad}
  <rect width="512" height="512" fill="url(#bg)"/>${content(1, '#ffffff')}</svg>`

const roundSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">${grad}
  <clipPath id="c"><circle cx="256" cy="256" r="256"/></clipPath>
  <g clip-path="url(#c)"><rect width="512" height="512" fill="url(#bg)"/>${content(0.92, '#ffffff')}</g></svg>`

const fgSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">${content(0.62, '#ffffff')}</svg>`

const densities = [
  { dir: 'mipmap-mdpi', legacy: 48, fg: 108 },
  { dir: 'mipmap-hdpi', legacy: 72, fg: 162 },
  { dir: 'mipmap-xhdpi', legacy: 96, fg: 216 },
  { dir: 'mipmap-xxhdpi', legacy: 144, fg: 324 },
  { dir: 'mipmap-xxxhdpi', legacy: 192, fg: 432 },
]

const chrome = spawn(CHROME, ['--headless=new', '--disable-gpu', '--hide-scrollbars', `--remote-debugging-port=${port}`,
  `--user-data-dir=${process.env.TEMP}\\gymlog-and-${Date.now()}`, 'about:blank'], { stdio: 'ignore' })

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
  // 透明背景，保证前景层没有白底
  await send('Emulation.setDefaultBackgroundColorOverride', { color: { r: 0, g: 0, b: 0, a: 0 } })

  const render = async (svg, size, file) => {
    const html = `<!doctype html><html><head><style>html,body{margin:0;background:transparent}</style></head>
      <body><div style="width:${size}px;height:${size}px">${svg.replace(/<svg([^>]*)>/, `<svg$1 width="${size}" height="${size}">`)}</div></body></html>`
    await evaluate(`document.open(); document.write(${JSON.stringify(html)}); document.close(); true`)
    await sleep(160)
    await send('Emulation.setDeviceMetricsOverride', { width: size, height: size, deviceScaleFactor: 1, mobile: false })
    await sleep(100)
    const shot = await send('Page.captureScreenshot', { format: 'png', clip: { x: 0, y: 0, width: size, height: size, scale: 1 } })
    mkdirSync(file.replace(/[\\/][^\\/]+$/, ''), { recursive: true })
    writeFileSync(file, Buffer.from(shot.data, 'base64'))
  }

  for (const d of densities) {
    await render(fullSvg, d.legacy, `${RES}/${d.dir}/ic_launcher.png`)
    await render(roundSvg, d.legacy, `${RES}/${d.dir}/ic_launcher_round.png`)
    await render(fgSvg, d.fg, `${RES}/${d.dir}/ic_launcher_foreground.png`)
    console.log('done', d.dir)
  }
} finally {
  try { ws?.close() } catch {}
  chrome.kill()
}
