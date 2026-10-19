// 截取「推荐模板」加载后的模板与套用界面
import { spawn } from 'node:child_process'
import { mkdirSync, writeFileSync } from 'node:fs'

const url = process.argv[2] ?? 'http://127.0.0.1:5173/'
const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
const port = 9350 + Math.floor(Math.random() * 120)
const outDir = '.shots/tpl'
mkdirSync(outDir, { recursive: true })
const chrome = spawn(CHROME, ['--headless=new', '--disable-gpu', '--hide-scrollbars', `--remote-debugging-port=${port}`,
  `--user-data-dir=${process.env.TEMP}\\gymlog-tpl-${Date.now()}`, 'about:blank'], { stdio: 'ignore' })
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
let ws
try {
  for (let i = 0; i < 60; i++) { try { await (await fetch(`http://127.0.0.1:${port}/json/version`)).json(); break } catch { await sleep(200) } }
  const t = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json()
  ws = new WebSocket(t.find((x) => x.type === 'page').webSocketDebuggerUrl)
  await new Promise((r, j) => { ws.onopen = r; ws.onerror = j })
  let id = 0
  const pending = new Map()
  ws.onmessage = (ev) => { const m = JSON.parse(ev.data); if (m.id && pending.has(m.id)) { const p = pending.get(m.id); pending.delete(m.id); m.error ? p.reject(new Error(JSON.stringify(m.error))) : p.resolve(m.result) } }
  const send = (method, params = {}) => new Promise((res, rej) => { const mid = ++id; pending.set(mid, { resolve: res, reject: rej }); ws.send(JSON.stringify({ id: mid, method, params })) })
  const evaluate = async (expression) => {
    const r = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true })
    if (r.exceptionDetails) throw new Error((r.exceptionDetails.exception?.description ?? r.exceptionDetails.text).slice(0, 300))
    return r.result.value
  }
  const shot = async (n) => {
    const r = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true })
    writeFileSync(`${outDir}/${n}.png`, Buffer.from(r.data, 'base64'))
  }
  const clickText = async (text, exact = false) => {
    await evaluate(`(() => { const b=[...document.querySelectorAll('button')].find(x => ${exact ? `x.textContent.trim()===${JSON.stringify(text)}` : `x.textContent.includes(${JSON.stringify(text)})`}); b&&b.click(); return !!b })()`)
    await sleep(650)
  }

  await send('Page.enable'); await send('Runtime.enable')
  await send('Emulation.setDeviceMetricsOverride', { width: 400, height: 860, deviceScaleFactor: 2, mobile: true })
  await send('Page.navigate', { url })
  await sleep(1400)
  await evaluate(`localStorage.clear(); true`)
  await send('Page.reload'); await sleep(1500)

  // 我的 → 载入推荐模板
  await evaluate(`document.querySelectorAll('nav button')[3].click()`); await sleep(800)
  await clickText('载入推荐模板')
  await shot('01-profile-templates')

  // 今天 → 模板 → 套用推日
  await evaluate(`document.querySelectorAll('nav button')[0].click()`); await sleep(700)
  await clickText('模板', true)
  await shot('02-templates-sheet')
  await clickText('套用', true)
  await sleep(800)
  await shot('03-template-applied')
  console.log('ok')
} catch (e) {
  console.log('ERROR', e.message)
} finally {
  try { ws?.close() } catch {}
  chrome.kill()
}
