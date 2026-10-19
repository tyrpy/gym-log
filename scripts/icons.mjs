// 用 Chrome 把 icon.svg 渲染成 PNG（192/512/maskable）与 favicon
import { spawn } from 'node:child_process'
import { readFileSync, writeFileSync } from 'node:fs'

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
const port = 9700 + Math.floor(Math.random() * 100)
const svg = readFileSync('public/icon.svg', 'utf8')

const chrome = spawn(CHROME, ['--headless=new', '--disable-gpu', `--remote-debugging-port=${port}`,
  `--user-data-dir=${process.env.TEMP}\\gymlog-icon-${Date.now()}`, 'about:blank'], { stdio: 'ignore' })

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
let ws
try {
  for (let i = 0; i < 60; i++) {
    try { await (await fetch(`http://127.0.0.1:${port}/json/version`)).json(); break } catch { await sleep(200) }
  }
  const targets = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json()
  const page = targets.find((t) => t.type === 'page')
  ws = new WebSocket(page.webSocketDebuggerUrl)
  await new Promise((r, j) => { ws.onopen = r; ws.onerror = j })
  let id = 0
  const pending = new Map()
  ws.onmessage = (ev) => {
    const m = JSON.parse(ev.data)
    if (m.id && pending.has(m.id)) { const p = pending.get(m.id); pending.delete(m.id); m.error ? p.reject(new Error(JSON.stringify(m.error))) : p.resolve(m.result) }
  }
  const send = (method, params = {}) => new Promise((res, rej) => { const mid = ++id; pending.set(mid, { resolve: res, reject: rej }); ws.send(JSON.stringify({ id: mid, method, params })) })
  const evaluate = async (expression) => {
    const r = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true })
    if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description ?? r.exceptionDetails.text)
    return r.result.value
  }

  await send('Page.enable')
  await send('Runtime.enable')

  const variants = [
    { file: 'icon-192.png', size: 192, pad: 0 },
    { file: 'icon-512.png', size: 512, pad: 0 },
    { file: 'icon-maskable-512.png', size: 512, pad: 0.16 },
  ]

  for (const v of variants) {
    const inner = v.pad
      ? `<div style="width:100%;height:100%;background:#e6512e;display:flex;align-items:center;justify-content:center"><div style="width:${(1 - v.pad * 2) * 100}%;height:${(1 - v.pad * 2) * 100}%;">${svg.replace(/^<svg[^>]*>/, '<svg style="width:100%;height:100%" viewBox="0 0 512 512">').replace(/<\/svg>$/, '</svg>')}</div></div>`
      : svg
    await evaluate(`document.open(); document.write(${JSON.stringify(
      `<!doctype html><html><head><style>html,body{margin:0;padding:0;background:#e6512e}svg{display:block}</style></head><body>${inner}</body></html>`,
    )}); document.close(); true`)
    await sleep(300)
    await send('Emulation.setDeviceMetricsOverride', { width: v.size, height: v.size, deviceScaleFactor: 1, mobile: false })
    await sleep(200)
    const shot = await send('Page.captureScreenshot', { format: 'png', clip: { x: 0, y: 0, width: v.size, height: v.size, scale: 1 } })
    writeFileSync(`public/${v.file}`, Buffer.from(shot.data, 'base64'))
    console.log('wrote public/' + v.file)
  }

  // iOS 主屏图标（180×180，不能有圆角/透明）
  await send('Emulation.setDeviceMetricsOverride', { width: 180, height: 180, deviceScaleFactor: 1, mobile: false })
  await evaluate(`document.open(); document.write(${JSON.stringify(
    `<!doctype html><html><head><style>html,body{margin:0}svg{display:block}</style></head><body>${svg}</body></html>`,
  )}); document.close(); true`)
  await sleep(250)
  const apple = await send('Page.captureScreenshot', { format: 'png', clip: { x: 0, y: 0, width: 180, height: 180, scale: 1 } })
  writeFileSync('public/apple-touch-icon.png', Buffer.from(apple.data, 'base64'))
  console.log('wrote public/apple-touch-icon.png')

  // favicon.ico 用 64px PNG 代替（浏览器接受 PNG 作为 favicon）
  await send('Emulation.setDeviceMetricsOverride', { width: 64, height: 64, deviceScaleFactor: 1, mobile: false })
  await evaluate(`document.open(); document.write(${JSON.stringify(
    `<!doctype html><html><head><style>html,body{margin:0}svg{display:block}</style></head><body>${svg}</body></html>`,
  )}); document.close(); true`)
  await sleep(250)
  const fav = await send('Page.captureScreenshot', { format: 'png', clip: { x: 0, y: 0, width: 64, height: 64, scale: 1 } })
  writeFileSync('public/favicon.png', Buffer.from(fav.data, 'base64'))
  console.log('wrote public/favicon.png')
} finally {
  try { ws?.close() } catch {}
  chrome.kill()
}
