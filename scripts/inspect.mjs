// 用 Chrome DevTools Protocol 做「检查 + 截图」，验证真实布局尺寸
// 用法: node scripts/inspect.mjs <url> <out.png> [width]
import { spawn } from 'node:child_process'
import { writeFileSync, mkdirSync } from 'node:fs'
import { dirname } from 'node:path'

const url = process.argv[2] ?? 'http://127.0.0.1:5173/'
const outPath = process.argv[3] ?? '.shots/out.png'
const width = Number(process.argv[4] ?? 430)

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
const port = 9333 + Math.floor(Math.random() * 200)

const chrome = spawn(
  CHROME,
  [
    '--headless=new',
    '--disable-gpu',
    '--hide-scrollbars',
    '--no-first-run',
    '--no-default-browser-check',
    `--remote-debugging-port=${port}`,
    `--user-data-dir=${process.env.TEMP}\\gymlog-cdp-${Date.now()}`,
    'about:blank',
  ],
  { stdio: 'ignore' },
)

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

async function getJson(path) {
  const res = await fetch(`http://127.0.0.1:${port}${path}`)
  return res.json()
}

let ws
try {
  // 等待调试端口就绪
  for (let i = 0; i < 60; i++) {
    try {
      await getJson('/json/version')
      break
    } catch {
      await sleep(200)
    }
  }

  const targets = await getJson('/json/list')
  const page = targets.find((t) => t.type === 'page')
  ws = new WebSocket(page.webSocketDebuggerUrl)
  await new Promise((resolve, reject) => {
    ws.onopen = resolve
    ws.onerror = reject
  })

  let msgId = 0
  const pending = new Map()
  ws.onmessage = (ev) => {
    const msg = JSON.parse(ev.data)
    if (msg.id && pending.has(msg.id)) {
      const { resolve, reject } = pending.get(msg.id)
      pending.delete(msg.id)
      if (msg.error) reject(new Error(JSON.stringify(msg.error)))
      else resolve(msg.result)
    }
  }
  const send = (method, params = {}) =>
    new Promise((resolve, reject) => {
      const id = ++msgId
      pending.set(id, { resolve, reject })
      ws.send(JSON.stringify({ id, method, params }))
    })

  await send('Page.enable')
  await send('Runtime.enable')
  await send('Emulation.setDeviceMetricsOverride', {
    width,
    height: 900,
    deviceScaleFactor: 2,
    mobile: true,
  })
  await send('Page.navigate', { url })
  await sleep(2500)

  const evaluate = async (expression) => {
    const r = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true })
    if (r.exceptionDetails) throw new Error(r.exceptionDetails.text + ' ' + (r.exceptionDetails.exception?.description ?? ''))
    return r.result.value
  }

  const metrics = await evaluate(`(() => {
    const doc = document.documentElement;
    const overflows = [...document.querySelectorAll('*')]
      .filter(el => el.scrollWidth > el.clientWidth + 2 && !el.closest('pre'))
      .slice(0, 12)
      .map(el => ({ tag: el.tagName, cls: el.className?.toString().slice(0, 40), sw: el.scrollWidth, cw: el.clientWidth }))
    return {
      viewport: window.innerWidth,
      docScrollWidth: doc.scrollWidth,
      docClientWidth: doc.clientWidth,
      bodyScrollHeight: document.body.scrollHeight,
      overflows,
      title: document.title,
      text: document.querySelector('h1')?.textContent,
    }
  })()`)
  console.log(JSON.stringify(metrics, null, 2))

  const shot = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true })
  mkdirSync(dirname(outPath), { recursive: true })
  writeFileSync(outPath, Buffer.from(shot.data, 'base64'))
  console.log('screenshot ->', outPath)
} finally {
  try {
    ws?.close()
  } catch {}
  chrome.kill()
}
