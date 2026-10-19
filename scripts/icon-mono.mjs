// 黑白配色的 tyrpy 图标：黑底白字 / 白底黑字
import { spawn } from 'node:child_process'
import { mkdirSync, writeFileSync } from 'node:fs'

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
const port = 8750 + Math.floor(Math.random() * 140)
const outDir = '.shots/icons7'
mkdirSync(outDir, { recursive: true })

const FONT = `'Arial Rounded MT Bold','Segoe UI','Verdana',sans-serif`

const bar = (color, tilt = -6) => `
  <g fill="${color}" transform="rotate(${tilt} 256 230)">
    <rect x="150" y="244" width="212" height="34" rx="10"/>
    <rect x="98" y="196" width="62" height="130" rx="18"/>
    <rect x="56" y="220" width="34" height="82" rx="13"/>
    <rect x="352" y="196" width="62" height="130" rx="18"/>
    <rect x="422" y="220" width="34" height="82" rx="13"/>
  </g>`

const content = (fg) => `
  <g transform="translate(0,-54) scale(0.92) translate(24,22)">
    ${bar(fg)}
  </g>
  <g transform="rotate(-4 256 386)">
    <text x="186" y="414" font-family="${FONT}" font-size="92" font-weight="700"
          letter-spacing="1" fill="${fg}" text-anchor="middle">tyrpy</text>
    <path d="M 322 402 L 339 419 L 370 382"
          fill="none" stroke="${fg}" stroke-width="14" stroke-linecap="round" stroke-linejoin="round"/>
  </g>`

const variants = [
  {
    id: 'm1',
    label: 'M1 黑底白字',
    note: '深色渐变底，器械与字标全白；桌面上最显眼',
    defs: `<defs><linearGradient id="bg1" x1="0.1" y1="0" x2="0.9" y2="1">
      <stop offset="0%" stop-color="#23272e"/><stop offset="60%" stop-color="#12151a"/><stop offset="100%" stop-color="#05070a"/>
    </linearGradient></defs>`,
    bgRect: `<rect width="512" height="512" fill="url(#bg1)"/>`,
    fg: '#ffffff',
  },
  {
    id: 'm2',
    label: 'M2 白底黑字',
    note: '极简白底，器械与字标纯黑；干净但浅色桌面上容易融进背景',
    defs: `<defs><linearGradient id="bg2" x1="0.1" y1="0" x2="0.9" y2="1">
      <stop offset="0%" stop-color="#ffffff"/><stop offset="60%" stop-color="#f4f5f7"/><stop offset="100%" stop-color="#e6e8ec"/>
    </linearGradient></defs>`,
    bgRect: `<rect width="512" height="512" fill="url(#bg2)"/>`,
    fg: '#0b0d10',
  },
  {
    id: 'm3',
    label: 'M3 黑底 + 细描边',
    note: '纯黑底，器械与字标白色，加一层极淡的内描边增加厚度',
    defs: `<defs><linearGradient id="bg3" x1="0.1" y1="0" x2="0.9" y2="1">
      <stop offset="0%" stop-color="#1b1f25"/><stop offset="100%" stop-color="#000000"/>
    </linearGradient></defs>`,
    bgRect: `<rect width="512" height="512" fill="url(#bg3)"/>
      <rect x="6" y="6" width="500" height="500" rx="120" fill="none" stroke="#ffffff" stroke-opacity="0.10" stroke-width="6"/>`,
    fg: '#ffffff',
  },
]

const svgFor = (v) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  ${v.defs}${v.bgRect}${content(v.fg)}
</svg>`

const icon = (v, size, radiusRatio = 0.225) => `
  <div style="width:${size}px;height:${size}px;border-radius:${size * radiusRatio}px;overflow:hidden;flex:none">
    <svg viewBox="0 0 512 512" width="${size}" height="${size}">${v.defs}${v.bgRect}${content(v.fg)}</svg>
  </div>`

const chrome = spawn(CHROME, ['--headless=new', '--disable-gpu', '--hide-scrollbars', `--remote-debugging-port=${port}`,
  `--user-data-dir=${process.env.TEMP}\\gymlog-i7-${Date.now()}`, 'about:blank'], { stdio: 'ignore' })

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

  for (const v of variants) {
    const html = `<!doctype html><html><head><style>html,body{margin:0}</style></head><body>
      <div style="width:512px;height:512px;overflow:hidden">${svgFor(v).replace(/<svg[^>]*>/, '<svg viewBox="0 0 512 512" width="512" height="512">')}</div></body></html>`
    await evaluate(`document.open(); document.write(${JSON.stringify(html)}); document.close(); true`)
    await sleep(220)
    await send('Emulation.setDeviceMetricsOverride', { width: 512, height: 512, deviceScaleFactor: 1, mobile: false })
    await sleep(120)
    const shot = await send('Page.captureScreenshot', { format: 'png', clip: { x: 0, y: 0, width: 512, height: 512, scale: 1 } })
    writeFileSync(`${outDir}/${v.id}.png`, Buffer.from(shot.data, 'base64'))
    console.log('wrote', `${v.id}.png`)
  }

  // 展示板：每个方案放在深色/浅色底上
  const cards = variants.map((v) => `
    <div style="background:#fff;border-radius:20px;padding:18px;width:340px">
      <div style="display:flex;gap:12px;align-items:flex-start">
        ${icon(v, 150)}
        <div style="display:flex;flex-direction:column;gap:12px">
          ${icon(v, 64)}${icon(v, 44)}
        </div>
      </div>
      <div style="font-size:15px;font-weight:700;margin-top:14px">${v.label}</div>
      <div style="font-size:11.5px;color:#8b94a3;margin-top:4px;line-height:1.55">${v.note}</div>
      <div style="display:flex;gap:10px;margin-top:14px">
        <div style="flex:1;background:#101216;border-radius:14px;padding:14px;display:flex;justify-content:center">
          ${icon(v, 74)}
          <div style="font-size:10px;color:#5a6270;align-self:flex-end;margin-left:10px">深色桌面</div>
        </div>
        <div style="flex:1;background:#f2f3f6;border-radius:14px;padding:14px;display:flex;justify-content:center">
          ${icon(v, 74)}
          <div style="font-size:10px;color:#aab2bd;align-self:flex-end;margin-left:10px">浅色桌面</div>
        </div>
      </div>
    </div>`).join('')

  await evaluate(`document.open(); document.write(${JSON.stringify(
    `<!doctype html><html><head><style>html,body{margin:0}body{background:#eef0f4;font-family:'Microsoft YaHei',sans-serif;padding:24px 20px}</style></head><body>
      <div style="font-size:18px;font-weight:700;margin-bottom:16px">黑白配色方案</div>
      <div style="display:flex;gap:16px;flex-wrap:wrap">${cards}</div></body></html>`,
  )}); document.close(); true`)
  await sleep(450)
  await send('Emulation.setDeviceMetricsOverride', { width: 1110, height: 520, deviceScaleFactor: 2, mobile: false })
  await sleep(200)
  const sheet = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true })
  writeFileSync(`${outDir}/compare.png`, Buffer.from(sheet.data, 'base64'))
  console.log('wrote compare.png')
} finally {
  try { ws?.close() } catch {}
  chrome.kill()
}
