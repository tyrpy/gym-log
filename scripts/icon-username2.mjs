// T1 精修：字标放大 + 补勾
import { spawn } from 'node:child_process'
import { mkdirSync, writeFileSync } from 'node:fs'

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
const port = 8950 + Math.floor(Math.random() * 140)
const outDir = '.shots/icons6'
mkdirSync(outDir, { recursive: true })

const FONT = `'Arial Rounded MT Bold','Segoe UI','Verdana',sans-serif`

const bar = (color, tilt = 0, cx = 256, cy = 230) => `
  <g fill="${color}" transform="rotate(${tilt} ${cx} ${cy})">
    <rect x="150" y="244" width="212" height="34" rx="10"/>
    <rect x="98" y="196" width="62" height="130" rx="18"/>
    <rect x="56" y="220" width="34" height="82" rx="13"/>
    <rect x="352" y="196" width="62" height="130" rx="18"/>
    <rect x="422" y="220" width="34" height="82" rx="13"/>
  </g>`

const tick = (x, y, s, w) => `
  <path d="M ${x} ${y + s * 0.55} L ${x + s * 0.33} ${y + s * 0.88} L ${x + s} ${y + s * 0.08}"
        fill="none" stroke="#ffffff" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/>`

const grad = (id) => `
  <defs><linearGradient id="${id}" x1="0.15" y1="0" x2="0.85" y2="1">
    <stop offset="0%" stop-color="#ff8f6b"/><stop offset="55%" stop-color="#ee5a34"/><stop offset="100%" stop-color="#cf3a17"/>
  </linearGradient></defs>`

const variants = [
  {
    id: 'f1',
    label: 'F1 弧形字标 + 勾',
    note: 'tyrpy 沿弧线，右侧一枚勾收尾',
    svg: `
      ${grad('g1')}
      <rect width="512" height="512" fill="url(#g1)"/>
      <g transform="translate(0,-58) scale(0.92) translate(22,24)">
        ${bar('#ffffff', -7)}
      </g>
      <path id="arc1" d="M 74 372 Q 250 442 400 366" fill="none"/>
      <text font-family="${FONT}" font-size="88" font-weight="700" letter-spacing="1"
            fill="#ffffff">
        <textPath href="#arc1" startOffset="50%" text-anchor="middle">tyrpy</textPath>
      </text>
      ${tick(408, 330, 52, 14)}
    `,
  },
  {
    id: 'f2',
    label: 'F2 斜排字标 + 勾',
    note: '整体微微倾斜，更随意；勾跟在字尾',
    svg: `
      ${grad('g2')}
      <rect width="512" height="512" fill="url(#g2)"/>
      <g transform="translate(0,-54) scale(0.92) translate(24,22)">
        ${bar('#ffffff', -6)}
      </g>
      <g transform="rotate(-4 256 386)">
        <text x="188" y="414" font-family="${FONT}" font-size="92" font-weight="700"
              letter-spacing="1" fill="#ffffff" text-anchor="middle">tyrpy</text>
        ${tick(372, 348, 54, 15)}
      </g>
    `,
  },
  {
    id: 'f3',
    label: 'F3 弧形字标（无勾）',
    note: '更简洁，只有器械 + 字标',
    svg: `
      ${grad('g3')}
      <rect width="512" height="512" fill="url(#g3)"/>
      <g transform="translate(0,-52) scale(0.96) translate(10,20)">
        ${bar('#ffffff', -7)}
      </g>
      <path id="arc3" d="M 78 384 Q 252 452 396 378" fill="none"/>
      <text font-family="${FONT}" font-size="92" font-weight="700" letter-spacing="2" fill="#ffffff">
        <textPath href="#arc3" startOffset="50%" text-anchor="middle">tyrpy</textPath>
      </text>
    `,
  },
]

const icon = (v, size, radiusRatio = 0.225) => `
  <div style="width:${size}px;height:${size}px;border-radius:${size * radiusRatio}px;overflow:hidden;flex:none">
    <svg viewBox="0 0 512 512" width="${size}" height="${size}">${v.svg}</svg>
  </div>`

const chrome = spawn(CHROME, ['--headless=new', '--disable-gpu', '--hide-scrollbars', `--remote-debugging-port=${port}`,
  `--user-data-dir=${process.env.TEMP}\\gymlog-i6-${Date.now()}`, 'about:blank'], { stdio: 'ignore' })

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
      <div style="width:512px;height:512px;overflow:hidden"><svg viewBox="0 0 512 512" width="512" height="512">${v.svg}</svg></div></body></html>`
    await evaluate(`document.open(); document.write(${JSON.stringify(html)}); document.close(); true`)
    await sleep(220)
    await send('Emulation.setDeviceMetricsOverride', { width: 512, height: 512, deviceScaleFactor: 1, mobile: false })
    await sleep(120)
    const shot = await send('Page.captureScreenshot', { format: 'png', clip: { x: 0, y: 0, width: 512, height: 512, scale: 1 } })
    writeFileSync(`${outDir}/${v.id}.png`, Buffer.from(shot.data, 'base64'))
    console.log('wrote', `${v.id}.png`)
  }

  const cards = variants.map((v) => `
    <div style="display:flex;gap:14px;background:#fff;border-radius:18px;padding:18px;width:330px;align-items:flex-start">
      ${icon(v, 150)}
      <div style="display:flex;flex-direction:column;gap:14px">
        <div>${icon(v, 64)}<div style="font-size:10.5px;color:#aab2bd;margin-top:4px;text-align:center">64</div></div>
        <div>${icon(v, 40)}<div style="font-size:10.5px;color:#aab2bd;margin-top:4px;text-align:center">40</div></div>
      </div>
      <div style="flex:1;min-width:0">
        <div style="font-size:15px;font-weight:700">${v.label}</div>
        <div style="font-size:11.5px;color:#8b94a3;margin-top:5px;line-height:1.55">${v.note}</div>
      </div>
    </div>`).join('')

  await evaluate(`document.open(); document.write(${JSON.stringify(
    `<!doctype html><html><head><style>html,body{margin:0}body{background:#eef0f4;font-family:'Microsoft YaHei',sans-serif;padding:24px 20px}</style></head><body>
      <div style="font-size:18px;font-weight:700;margin-bottom:16px">T1 精修对比</div>
      <div style="display:flex;gap:16px;flex-wrap:wrap">${cards}</div></body></html>`,
  )}); document.close(); true`)
  await sleep(400)
  await send('Emulation.setDeviceMetricsOverride', { width: 1100, height: 470, deviceScaleFactor: 2, mobile: false })
  await sleep(180)
  const sheet = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true })
  writeFileSync(`${outDir}/compare.png`, Buffer.from(sheet.data, 'base64'))
  console.log('wrote compare.png')
} finally {
  try { ws?.close() } catch {}
  chrome.kill()
}
