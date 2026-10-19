// 动作库视觉检查：截图列表页 + 打开第一个动作详情
import { spawn } from 'node:child_process'
import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'

const url = process.argv[2] ?? 'http://127.0.0.1:5173/'
const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
const port = 9900 + Math.floor(Math.random() * 80)
const outDir = '.shots/library'
mkdirSync(outDir, { recursive: true })

const chrome = spawn(
  CHROME,
  ['--headless=new', '--disable-gpu', '--no-sandbox', '--hide-scrollbars', `--remote-debugging-port=${port}`,
   `--user-data-dir=${join(tmpdir(), `gymlog-lib-${Date.now()}`)}`, 'about:blank'],
  { stdio: 'ignore' },
)

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

let ws
try {
  for (let i = 0; i < 80; i++) {
    try { await (await fetch(`http://127.0.0.1:${port}/json/version`)).json(); break } catch { await sleep(200) }
  }
  const targets = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json()
  const page = targets.find((t) => t.type === 'page')
  if (!page) throw new Error('no page target')
  ws = new WebSocket(page.webSocketDebuggerUrl)
  await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej })

  let id = 0
  const pending = new Map()
  ws.onclose = () => {
    for (const [, p] of pending) p.reject(new Error('websocket closed'))
    pending.clear()
  }
  const errors = []
  ws.onmessage = (ev) => {
    const m = JSON.parse(ev.data)
    if (m.id && pending.has(m.id)) { const p = pending.get(m.id); pending.delete(m.id); m.error ? p.reject(new Error(JSON.stringify(m.error))) : p.resolve(m.result) }
    else if (m.method === 'Runtime.exceptionThrown') errors.push(m.params.exceptionDetails.exception?.description ?? 'ex')
    else if (m.method === 'Runtime.consoleAPICalled' && m.params.type === 'error') errors.push(m.params.args.map(a => a.value ?? a.description).join(' '))
  }
  const send = (method, params = {}) => new Promise((resolve, reject) => { const mid = ++id; pending.set(mid, { resolve, reject }); ws.send(JSON.stringify({ id: mid, method, params })) })
  const evaluate = async (expression) => {
    const r = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true })
    if (r.exceptionDetails) throw new Error((r.exceptionDetails.exception?.description ?? r.exceptionDetails.text).slice(0, 500))
    return r.result.value
  }
  const shot = async (name, full = false) => {
    const r = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: full })
    writeFileSync(`${outDir}/${name}.png`, Buffer.from(r.data, 'base64'))
  }

  await send('Page.enable')
  await send('Runtime.enable')
  await send('Emulation.setDeviceMetricsOverride', { width: 400, height: 860, deviceScaleFactor: 2, mobile: true })
  await send('Page.navigate', { url: url + '?page=library' })
  await sleep(2200)

  await shot('01-library-top')
  await shot('02-library-full', true)

  for (let i = 1; i <= 5; i++) {
    await evaluate(`window.scrollTo(0, ${i * 820})`)
    await sleep(350)
    await shot(`sec-${i}`)
  }
  await evaluate('window.scrollTo(0, 0)')
  await sleep(300)

  const openCard = async (name, outName) => {
    const ok = await evaluate(`(() => {
      const b = [...document.querySelectorAll('button')].find(x => x.textContent.includes(${JSON.stringify(name)}))
      if (!b) return false
      b.click()
      return true
    })()`)
    await sleep(550)
    if (ok) await shot(outName)
    await evaluate(`(() => { const b=[...document.querySelectorAll('button')].find(x=>x.textContent.trim()==='关闭'); b&&b.click(); return true })()`)
    await sleep(350)
  }

  await openCard('杠铃卧推', '03-detail-bench')
  await openCard('深蹲', '04-detail-squat')
  await openCard('硬拉', '05-detail-deadlift')
  await openCard('引体向上', '06-detail-pullup')
  await openCard('侧平举', '07-detail-lateral')
  await openCard('平板支撑', '08-detail-plank')
  await openCard('哑铃飞鸟', '09-detail-fly')
  await openCard('绳索夹胸', '10-detail-cable')
  await openCard('腿举', '11-detail-legpress')
  await openCard('面拉', '12-detail-facepull')
  await openCard('双杠臂屈伸', '13-detail-dip')
  await openCard('跑步机', '14-detail-treadmill')

  console.log('errors:', errors.length ? errors.slice(0, 4) : 'none')
  console.log('shots ->', outDir)
} catch (e) {
  console.log('ERROR', e.message)
} finally {
  try { ws?.close() } catch {}
  chrome.kill()
}
