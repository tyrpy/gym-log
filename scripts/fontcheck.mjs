// 检查字体是否真正加载，并截一张当前页面
import { spawn } from 'node:child_process'
import { writeFileSync, mkdirSync } from 'node:fs'

const url = process.argv[2] ?? 'http://127.0.0.1:5173/'
const out = process.argv[3] ?? '.shots/fontcheck.png'
const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
const port = 8900 + Math.floor(Math.random() * 90)
mkdirSync('.shots', { recursive: true })

const chrome = spawn(CHROME, ['--headless=new', '--disable-gpu', '--hide-scrollbars',
  `--remote-debugging-port=${port}`, `--user-data-dir=${process.env.TEMP}\\gymlog-fc-${Date.now()}`, 'about:blank'],
  { stdio: 'ignore' })
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
  const evaluate = async (expression) => {
    const r = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true })
    if (r.exceptionDetails) throw new Error((r.exceptionDetails.exception?.description ?? r.exceptionDetails.text).slice(0, 300))
    return r.result.value
  }

  await send('Page.enable')
  await send('Runtime.enable')
  await send('Emulation.setDeviceMetricsOverride', { width: 414, height: 896, deviceScaleFactor: 2, mobile: true })
  await send('Page.navigate', { url })
  await sleep(2600)

  const info = await evaluate(`(async () => {
    await document.fonts.ready;
    const faces = [...document.fonts].map(f => f.family + ' ' + f.weight + ' ' + f.status);
    const bodyFont = getComputedStyle(document.body).fontFamily;
    const ok400 = document.fonts.check('16px WenKai');
    const ok700 = document.fonts.check('700 16px WenKai');
    // 测量：同一段文字用 WenKai 与 serif 的宽度是否不同，判断是否真的用了内置字
    const c = document.createElement('canvas').getContext('2d');
    c.font = '40px WenKai'; const w1 = c.measureText('杠铃卧推训练明细').width;
    c.font = '40px serif'; const w2 = c.measureText('杠铃卧推训练明细').width;
    return { faces, bodyFont, ok400, ok700, w1, w2, status: document.fonts.status };
  })()`)
  console.log(JSON.stringify(info, null, 2))

  const shot = await send('Page.captureScreenshot', { format: 'png' })
  writeFileSync(out, Buffer.from(shot.data, 'base64'))
  console.log('shot ->', out)
} finally {
  try { ws?.close() } catch {}
  chrome.kill()
}
