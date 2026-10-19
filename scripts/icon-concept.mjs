// 生成「健身 + 记录」概念图标：512 成品 + 多尺寸可辨识度预览
import { spawn } from 'node:child_process'
import { mkdirSync, writeFileSync } from 'node:fs'

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
const port = 9550 + Math.floor(Math.random() * 150)
const outDir = '.shots/icons2'
mkdirSync(outDir, { recursive: true })

const bar = (color) => `
  <g fill="${color}">
    <rect x="150" y="244" width="212" height="34" rx="10"/>
    <rect x="98" y="196" width="62" height="130" rx="18"/>
    <rect x="56" y="220" width="34" height="82" rx="13"/>
    <rect x="352" y="196" width="62" height="130" rx="18"/>
    <rect x="422" y="220" width="34" height="82" rx="13"/>
  </g>`

const checkPath = (x, y, s, color, w) => `
  <path d="M ${x} ${y + s * 0.52} L ${x + s * 0.34} ${y + s * 0.86} L ${x + s} ${y + s * 0.1}"
        fill="none" stroke="${color}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/>`

const variants = [
  {
    id: 'v1',
    label: 'V1 记录勾 · 橙底徽章',
    note: '橙渐变底 + 白哑铃 + 深色圆徽章里的白勾',
    svg: `
      <defs><linearGradient id="g1" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#ff8a63"/><stop offset="100%" stop-color="#d63f1c"/>
      </linearGradient></defs>
      <rect width="512" height="512" fill="url(#g1)"/>
      <g transform="translate(0,-18) scale(0.86) translate(42,26)">${bar('#ffffff')}</g>
      <circle cx="392" cy="392" r="86" fill="#1a1e24"/>
      ${checkPath(348, 352, 88, '#ffffff', 22)}
    `,
  },
  {
    id: 'v2',
    label: 'V2 记录勾 · 深底',
    note: '深底 + 橙哑铃 + 右下角橙色勾',
    svg: `
      <rect width="512" height="512" fill="#171b21"/>
      <g transform="translate(0,-16) scale(0.84) translate(46,30)">${bar('#ff7a54')}</g>
      ${checkPath(330, 330, 132, '#ff7a54', 30)}
    `,
  },
  {
    id: 'v3',
    label: 'V3 日志条 · 橙底',
    note: '橙底 + 白哑铃 + 下方两条记录线',
    svg: `
      <defs><linearGradient id="g3" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#ff8a63"/><stop offset="100%" stop-color="#d63f1c"/>
      </linearGradient></defs>
      <rect width="512" height="512" fill="url(#g3)"/>
      <g transform="translate(0,-52)">${bar('#ffffff')}</g>
      <rect x="120" y="356" width="272" height="26" rx="13" fill="#ffffff" opacity="0.95"/>
      <rect x="120" y="404" width="176" height="26" rx="13" fill="#ffffff" opacity="0.6"/>
    `,
  },
]

const icon = (v, size, radiusRatio = 0.225) => `
  <div style="width:${size}px;height:${size}px;border-radius:${size * radiusRatio}px;overflow:hidden;flex:none">
    <svg viewBox="0 0 512 512" width="${size}" height="${size}">${v.svg}</svg>
  </div>`

const chrome = spawn(CHROME, ['--headless=new', '--disable-gpu', '--hide-scrollbars', `--remote-debugging-port=${port}`,
  `--user-data-dir=${process.env.TEMP}\\gymlog-i2-${Date.now()}`, 'about:blank'], { stdio: 'ignore' })

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

  // 512 成品（满版、直角，交给系统自己切圆角）
  for (const v of variants) {
    await evaluate(`document.open(); document.write(${JSON.stringify(
      `<!doctype html><html><head><style>html,body{margin:0;padding:0}</style></head><body>
       <div style="width:512px;height:512px;overflow:hidden"><svg viewBox="0 0 512 512" width="512" height="512">${v.svg}</svg></div>
       </body></html>`,
    )}); document.close(); true`)
    await sleep(200)
    await send('Emulation.setDeviceMetricsOverride', { width: 512, height: 512, deviceScaleFactor: 1, mobile: false })
    await sleep(120)
    const shot = await send('Page.captureScreenshot', { format: 'png', clip: { x: 0, y: 0, width: 512, height: 512, scale: 1 } })
    writeFileSync(`${outDir}/${v.id}.png`, Buffer.from(shot.data, 'base64'))
    console.log('wrote', `${v.id}.png`)
  }

  // 对比图：大图 + 96 + 56 + 40 小尺寸
  const cards = variants.map((v) => `
    <div style="display:flex;flex-direction:column;gap:14px;background:#fff;border-radius:18px;padding:20px;width:300px">
      ${icon(v, 190)}
      <div>
        <div style="font-size:16px;font-weight:700;color:#1a1e24">${v.label}</div>
        <div style="font-size:12.5px;color:#8b94a3;margin-top:4px;line-height:1.5">${v.note}</div>
      </div>
      <div style="display:flex;align-items:flex-end;gap:14px;padding-top:6px;border-top:1px solid #eef0f3">
        ${icon(v, 72)}${icon(v, 48)}${icon(v, 32)}
        <span style="font-size:11px;color:#aab2bd;margin-left:2px">实际大小</span>
      </div>
    </div>`).join('')

  await evaluate(`document.open(); document.write(${JSON.stringify(
    `<!doctype html><html><head><style>html,body{margin:0}body{background:#eef0f4;font-family:'Microsoft YaHei',sans-serif;padding:26px 22px}</style></head><body>
      <div style="font-size:19px;font-weight:700;margin-bottom:18px;color:#1a1e24">「健身 + 记录」概念方案</div>
      <div style="display:flex;gap:18px;flex-wrap:wrap">${cards}</div>
     </body></html>`,
  )}); document.close(); true`)
  await sleep(400)
  await send('Emulation.setDeviceMetricsOverride', { width: 1040, height: 470, deviceScaleFactor: 2, mobile: false })
  await sleep(200)
  const sheet = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true })
  writeFileSync(`${outDir}/compare.png`, Buffer.from(sheet.data, 'base64'))
  console.log('wrote compare.png')
} finally {
  try { ws?.close() } catch {}
  chrome.kill()
}
