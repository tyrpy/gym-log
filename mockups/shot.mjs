// 用 CDP 精确渲染 414×896 @3x 的效果图
import { spawn } from 'node:child_process'
import { mkdirSync, writeFileSync } from 'node:fs'

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
const port = 8400 + Math.floor(Math.random() * 150)
const outDir = 'mockups/shots'
mkdirSync(outDir, { recursive: true })

const targets = [
  { name: 'theme-a', url: 'file:///E:/gym-log/mockups/theme.html?theme=a' },
  { name: 'theme-b', url: 'file:///E:/gym-log/mockups/theme.html?theme=b' },
  { name: 'theme-c', url: 'file:///E:/gym-log/mockups/theme.html?theme=c' },
]

const chrome = spawn(CHROME, ['--headless=new', '--disable-gpu', '--hide-scrollbars',
  '--allow-file-access-from-files', `--remote-debugging-port=${port}`,
  `--user-data-dir=${process.env.TEMP}\\gymlog-mock-${Date.now()}`, 'about:blank'], { stdio: 'ignore' })

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
let ws
try {
  for (let i = 0; i < 60; i++) {
    try { await (await fetch(`http://127.0.0.1:${port}/json/version`)).json(); break } catch { await sleep(200) }
  }
  const list = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json()
  ws = new WebSocket(list.find((t) => t.type === 'page').webSocketDebuggerUrl)
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

  await send('Page.enable')
  await send('Emulation.setDeviceMetricsOverride', { width: 414, height: 896, deviceScaleFactor: 3, mobile: true })
  await send('Emulation.setDefaultBackgroundColorOverride', { color: { r: 217, g: 213, b: 204, a: 1 } })

  for (const t of targets) {
    await send('Page.navigate', { url: t.url })
    await sleep(1200)
    const shot = await send('Page.captureScreenshot', {
      format: 'png',
      clip: { x: 0, y: 0, width: 414, height: 896, scale: 1 },
    })
    writeFileSync(`${outDir}/${t.name}.png`, Buffer.from(shot.data, 'base64'))
    console.log('wrote', t.name)
  }
} finally {
  try { ws?.close() } catch {}
  chrome.kill()
}
