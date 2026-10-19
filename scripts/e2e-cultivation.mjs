// 修为体系冒烟测试：境界页、连击、完整等级表、今天页入口
import { spawn } from 'node:child_process'
import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'

const url = process.argv[2] ?? 'http://127.0.0.1:5173/'
const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
const port = 9850 + Math.floor(Math.random() * 80)
const outDir = '.shots/e2e-cultivation'
mkdirSync(outDir, { recursive: true })

const chrome = spawn(
  CHROME,
  ['--headless=new', '--disable-gpu', '--no-sandbox', '--hide-scrollbars',
   `--remote-debugging-port=${port}`, `--user-data-dir=${join(tmpdir(), `gymlog-e2e-cult-${Date.now()}`)}`, 'about:blank'],
  { stdio: 'ignore' },
)

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const results = []
function check(name, ok, detail = '') {
  results.push({ name, ok, detail })
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? '  — ' + detail : ''}`)
}

const dayKey = (offset) => {
  const x = new Date()
  x.setDate(x.getDate() + offset)
  return x.getFullYear() + '-' + String(x.getMonth() + 1).padStart(2, '0') + '-' + String(x.getDate()).padStart(2, '0')
}

let seq = 0
const id = (p) => `${p}${++seq}`
const parts = ['chest', 'back', 'legs']
const plan = [
  ['bench-press', '杠铃卧推', 60, 8],
  ['barbell-row', '杠铃划船', 50, 8],
  ['squat', '深蹲', 80, 6],
]
const days = {}
for (let i = 0; i < 9; i++) {
  const date = dayKey(-8 + i)
  const [, name, weight, reps] = plan[i % 3]
  const [exerciseId] = plan[i % 3]
  days[date] = {
    date,
    updatedAt: Date.now(),
    entries: [{
      id: id('bp'),
      bodyPart: parts[i % 3],
      exercises: [{
        id: id('ex'),
        exerciseId,
        name,
        sets: Array.from({ length: 3 }, () => ({ id: id('set'), weight, reps, done: true })),
      }],
    }],
  }
}
const data = {
  version: 2,
  days,
  customExercises: [],
  templates: [],
  settings: { unit: 'kg', defaultRestSeconds: 90, autoStartRest: true, restSound: true },
}

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

  let idn = 0
  const pending = new Map()
  const consoleErrors = []
  ws.onmessage = (ev) => {
    const m = JSON.parse(ev.data)
    if (m.id && pending.has(m.id)) {
      const p = pending.get(m.id); pending.delete(m.id)
      m.error ? p.reject(new Error(JSON.stringify(m.error))) : p.resolve(m.result)
    } else if (m.method === 'Runtime.exceptionThrown') consoleErrors.push(m.params.exceptionDetails.exception?.description ?? 'exception')
    else if (m.method === 'Runtime.consoleAPICalled' && m.params.type === 'error') consoleErrors.push(m.params.args.map(a => a.value ?? a.description).join(' '))
  }
  const send = (method, params = {}) => new Promise((resolve, reject) => {
    const mid = ++idn
    pending.set(mid, { resolve, reject })
    ws.send(JSON.stringify({ id: mid, method, params }))
  })
  const evaluate = async (expression) => {
    const r = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true })
    if (r.exceptionDetails) throw new Error((r.exceptionDetails.exception?.description ?? r.exceptionDetails.text).slice(0, 400))
    return r.result.value
  }
  const bodyHas = async (text) => evaluate(`document.body.innerText.includes(${JSON.stringify(text)})`)
  const clickText = async (text) => {
    const ok = await evaluate(`(() => {
      const b = [...document.querySelectorAll('button')].find(x => x.textContent.includes(${JSON.stringify(text)}))
      if (!b) return false
      b.click(); return true
    })()`)
    await sleep(600)
    return ok
  }
  const shot = async (name) => {
    const r = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true })
    writeFileSync(`${outDir}/${name}.png`, Buffer.from(r.data, 'base64'))
  }

  await send('Page.enable')
  await send('Runtime.enable')
  await send('Emulation.setDeviceMetricsOverride', { width: 400, height: 860, deviceScaleFactor: 2, mobile: true })
  await send('Page.navigate', { url })
  await sleep(1500)
  await evaluate(`localStorage.setItem('gym-log:data', ${JSON.stringify(JSON.stringify(data))}); true`)
  await send('Page.navigate', { url: url + (url.includes('?') ? '&' : '?') + 'page=cultivation&today=' + dayKey(0) })
  await sleep(2200)

  check('修为页加载', (await bodyHas('修为')) && (await bodyHas('当前境界')))
  check('等级名称渲染', await bodyHas('第 ') && (await bodyHas('级')))
  check('境界之路渲染', await bodyHas('境界之路') && await bodyHas('筑基'))
  check('连续 9 天', await bodyHas('连续 9 天'))
  check('连击奖励渲染', await bodyHas('初窥门径') && await bodyHas('小有所成'))
  check('修为明细渲染', await bodyHas('修为明细') && await bodyHas('累计修为'))
  await shot('01-cultivation')

  const opened = await clickText('查看完整')
  check('打开完整等级表', opened && (await bodyHas('境界总览')))
  check('完整等级表包含飞升', await bodyHas('飞升'))
  await shot('02-level-table')

  await evaluate(`document.querySelector('[aria-label="关闭"]')?.click()`)
  await sleep(400)
  await evaluate(`(() => { const b=[...document.querySelectorAll('nav button')].find(x=>x.textContent.includes('今天')); b&&b.click() })()`)
  await sleep(700)
  check('今天页显示修为条', await evaluate(`!!document.querySelector('[aria-label="查看修为境界"]')`))
  await shot('03-today-strip')

  await evaluate(`document.querySelector('[aria-label="查看修为境界"]')?.click()`)
  await sleep(700)
  check('修为条可进入境界页', await bodyHas('当前境界'))
  check('无控制台错误', consoleErrors.length === 0, consoleErrors.slice(0, 2).join(' | '))

  const passed = results.filter((r) => r.ok).length
  console.log(`=== ${passed}/${results.length} 通过 ===`)
  if (passed !== results.length) process.exitCode = 1
} catch (e) {
  check('测试脚本异常', false, e.message)
  console.log(`=== 0/${results.length} 通过 ===`)
  process.exitCode = 1
} finally {
  try { ws?.close() } catch {}
  chrome.kill()
}
