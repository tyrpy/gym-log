// 布局微调：解决重心偏低
import { spawn } from 'node:child_process'
import { mkdirSync, writeFileSync } from 'node:fs'

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
const port = 9150 + Math.floor(Math.random() * 140)
const outDir = '.shots/icons4'
mkdirSync(outDir, { recursive: true })

const bar = (color) => `
  <g fill="${color}">
    <rect x="150" y="244" width="212" height="34" rx="10"/>
    <rect x="98" y="196" width="62" height="130" rx="18"/>
    <rect x="56" y="220" width="34" height="82" rx="13"/>
    <rect x="352" y="196" width="62" height="130" rx="18"/>
    <rect x="422" y="220" width="34" height="82" rx="13"/>
  </g>`

const check = (x, y, s, w) => `
  <path d="M ${x} ${y + s * 0.52} L ${x + s * 0.34} ${y + s * 0.86} L ${x + s} ${y + s * 0.1}"
        fill="none" stroke="#ffffff" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/>`

const grad = `
  <defs><linearGradient id="bg" x1="0.15" y1="0" x2="0.85" y2="1">
    <stop offset="0%" stop-color="#ff8f6b"/><stop offset="55%" stop-color="#ee5a34"/><stop offset="100%" stop-color="#cf3a17"/>
  </linearGradient></defs>`

const variants = [
  {
    id: 'p1',
    label: 'P1 上移居中',
    note: '哑铃放大，重心上移，徽章 74',
    svg: `${grad}<rect width="512" height="512" fill="url(#bg)"/>
      <g transform="translate(256,206) scale(1.16) translate(-256,-244)">
        ${bar('#ffffff')}
      </g>
      <circle cx="392" cy="374" r="74" fill="#171b21" opacity="0.14" transform="translate(3,6)"/>
      <circle cx="392" cy="374" r="74" fill="#171b21"/>
      ${check(353, 375.5, 74, 18)}`,
  },
  {
    id: 'p2',
    label: 'P2 大器械小徽章',
    note: '哑铃更大，徽章收到 64，右上留白均匀',
    svg: `${grad}<rect width="512" height="512" fill="url(#bg)"/>
      <g transform="translate(256,200) scale(1.24) translate(-256,-252)">
        ${bar('#ffffff')}
      </g>
      <circle cx="398" cy="380" r="66" fill="#171b21" opacity="0.14" transform="translate(3,5)"/>
      <circle cx="398" cy="380" r="66" fill="#171b21"/>
      ${check(363, 381, 66, 16)}`,
  },
]

const icon = (v, size, radiusRatio = 0.225) => `
  <div style="width:${size}px;height:${size}px;border-radius:${size * radiusRatio}px;overflow:hidden;flex:none">
    <svg viewBox="0 0 512 512" width="${size}" height="${size}">${v.svg}</svg>
  </div>`

const chrome = spawn(CHROME, ['--headless=new', '--disable-gpu', '--hide-scrollbars', `--remote-debugging-port=${port}`,
  `--user-data-dir=${process.env.TEMP}\\gymlog-i4-${Date.now()}`, 'about:blank'], { stdio: 'ignore' })

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
    await evaluate(`document.open(); document.write(${JSON.stringify(
      `<!doctype html><html><head><style>html,body{margin:0}</style></head><body>
       <div style="width:512px;height:512px;overflow:hidden"><svg viewBox="0 0 512 512" width="512" height="512">${v.svg}</svg></div></body></html>`,
    )}); document.close(); true`)
    await sleep(180)
    await send('Emulation.setDeviceMetricsOverride', { width: 512, height: 512, deviceScaleFactor: 1, mobile: false })
    await sleep(120)
    const shot = await send('Page.captureScreenshot', { format: 'png', clip: { x: 0, y: 0, width: 512, height: 512, scale: 1 } })
    writeFileSync(`${outDir}/${v.id}.png`, Buffer.from(shot.data, 'base64'))
  }

  const cards = variants.map((v) => `
    <div style="display:flex;flex-direction:column;gap:12px;background:#fff;border-radius:18px;padding:18px;width:300px">
      <div style="display:flex;gap:12px;align-items:flex-start">
        ${icon(v, 180)}
        <div style="display:flex;flex-direction:column;gap:8px">
          ${icon(v, 64)}${icon(v, 40)}${icon(v, 28)}
        </div>
      </div>
      <div style="font-size:15px;font-weight:700">${v.label}</div>
      <div style="font-size:12px;color:#8b94a3;line-height:1.5">${v.note}</div>
    </div>`).join('')

  await evaluate(`document.open(); document.write(${JSON.stringify(
    `<!doctype html><html><head><style>html,body{margin:0}body{background:#eef0f4;font-family:'Microsoft YaHei',sans-serif;padding:24px 20px}</style></head><body>
      <div style="font-size:18px;font-weight:700;margin-bottom:16px">重心微调对比</div>
      <div style="display:flex;gap:16px">${cards}</div></body></html>`,
  )}); document.close(); true`)
  await sleep(350)
  await send('Emulation.setDeviceMetricsOverride', { width: 700, height: 380, deviceScaleFactor: 2, mobile: false })
  await sleep(180)
  const sheet = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true })
  writeFileSync(`${outDir}/compare.png`, Buffer.from(sheet.data, 'base64'))
  console.log('done')
} finally {
  try { ws?.close() } catch {}
  chrome.kill()
}
