// 带用户名「tyrpy」的图标方案：活泼、圆润、不呆板
import { spawn } from 'node:child_process'
import { mkdirSync, writeFileSync } from 'node:fs'

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
const port = 9050 + Math.floor(Math.random() * 140)
const outDir = '.shots/icons5'
mkdirSync(outDir, { recursive: true })

const FONT = `'Arial Rounded MT Bold','Segoe UI','Verdana',sans-serif`

const bar = (color, tilt = 0) => `
  <g fill="${color}" transform="rotate(${tilt} 256 230)">
    <rect x="150" y="244" width="212" height="34" rx="10"/>
    <rect x="98" y="196" width="62" height="130" rx="18"/>
    <rect x="56" y="220" width="34" height="82" rx="13"/>
    <rect x="352" y="196" width="62" height="130" rx="18"/>
    <rect x="422" y="220" width="34" height="82" rx="13"/>
  </g>`

const check = (x, y, s, w, color = '#ffffff') => `
  <path d="M ${x} ${y + s * 0.52} L ${x + s * 0.34} ${y + s * 0.86} L ${x + s} ${y + s * 0.1}"
        fill="none" stroke="${color}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/>`

const grad = (id, a = '#ff8f6b', b = '#ee5a34', c = '#cf3a17') => `
  <defs><linearGradient id="${id}" x1="0.15" y1="0" x2="0.85" y2="1">
    <stop offset="0%" stop-color="${a}"/><stop offset="55%" stop-color="${b}"/><stop offset="100%" stop-color="${c}"/>
  </linearGradient></defs>`

const variants = [
  {
    id: 't1',
    label: 'T1 器械 + 弧形字',
    note: '哑铃略倾斜，tyrpy 沿弧线排在下方，像贴纸',
    svg: `
      ${grad('g1')}
      <rect width="512" height="512" fill="url(#g1)"/>
      <g transform="translate(0,-46) scale(0.94) translate(16,26)">
        ${bar('#ffffff', -7)}
      </g>
      <path id="arc1" d="M 96 392 Q 256 456 416 392" fill="none"/>
      <text font-family="${FONT}" font-size="76" font-weight="700" letter-spacing="3"
            fill="#ffffff" opacity="0.97">
        <textPath href="#arc1" startOffset="50%" text-anchor="middle">tyrpy</textPath>
      </text>
    `,
  },
  {
    id: 't2',
    label: 'T2 大字标 + 徽章',
    note: 'tyrpy 是主角，右下角小徽章里放哑铃勾',
    svg: `
      ${grad('g2')}
      <rect width="512" height="512" fill="url(#g2)"/>
      <text x="248" y="300" font-family="${FONT}" font-size="132" font-weight="700"
            letter-spacing="-2" fill="#ffffff" text-anchor="middle">tyrpy</text>
      <circle cx="404" cy="404" r="68" fill="#171b21" opacity="0.14" transform="translate(3,5)"/>
      <circle cx="404" cy="404" r="68" fill="#171b21"/>
      <g transform="translate(404,404) scale(0.16) translate(-256,-256)">
        ${bar('#ffffff')}
      </g>
      <g transform="translate(404,404) scale(0.1) translate(-256,-256) translate(0,26)">
        ${check(340, 350, 200, 40, '#7bf0b6')}
      </g>
    `,
  },
  {
    id: 't3',
    label: 'T3 器械横穿字标',
    note: '哑铃当横线穿过 tyrpy，最有记忆点',
    svg: `
      ${grad('g3')}
      <rect width="512" height="512" fill="url(#g3)"/>
      <text x="256" y="300" font-family="${FONT}" font-size="118" font-weight="700"
            letter-spacing="-1" fill="#ffffff" text-anchor="middle">tyrpy</text>
      <g transform="translate(0,4)">
        ${bar('#ffffff', -4)}
      </g>
      <g transform="translate(0,4)">
        ${bar('#ee5a34', -4)}
      </g>
    `,
  },
]

const icon = (v, size, radiusRatio = 0.225) => `
  <div style="width:${size}px;height:${size}px;border-radius:${size * radiusRatio}px;overflow:hidden;flex:none">
    <svg viewBox="0 0 512 512" width="${size}" height="${size}">${v.svg}</svg>
  </div>`

const chrome = spawn(CHROME, ['--headless=new', '--disable-gpu', '--hide-scrollbars', `--remote-debugging-port=${port}`,
  `--user-data-dir=${process.env.TEMP}\\gymlog-i5-${Date.now()}`, 'about:blank'], { stdio: 'ignore' })

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
      <div style="display:flex;flex-direction:column;gap:16px">
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
      <div style="font-size:18px;font-weight:700;margin-bottom:16px">带用户名「tyrpy」的方案</div>
      <div style="display:flex;gap:16px;flex-wrap:wrap">${cards}</div></body></html>`,
  )}); document.close(); true`)
  await sleep(400)
  await send('Emulation.setDeviceMetricsOverride', { width: 1100, height: 260, deviceScaleFactor: 2, mobile: false })
  await sleep(180)
  const sheet = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true })
  writeFileSync(`${outDir}/compare.png`, Buffer.from(sheet.data, 'base64'))
  console.log('wrote compare.png')
} finally {
  try { ws?.close() } catch {}
  chrome.kill()
}
