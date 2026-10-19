// 修为体系视觉预览：注入 9 天连续训练记录，截取境界页 / 完整等级表 / 今天与我的入口
import { spawn } from 'node:child_process'
import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'

const url = process.argv[2] ?? 'http://127.0.0.1:5173/'
const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
const port = 9950 + Math.floor(Math.random() * 40)
const outDir = '.shots/cultivation'
mkdirSync(outDir, { recursive: true })

const chrome = spawn(
  CHROME,
  ['--headless=new', '--disable-gpu', '--no-sandbox', '--hide-scrollbars', `--remote-debugging-port=${port}`,
   `--user-data-dir=${join(tmpdir(), `gymlog-cult-${Date.now()}`)}`, 'about:blank'],
  { stdio: 'ignore' },
)

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const dayKey = (offset) => {
  const x = new Date()
  x.setDate(x.getDate() + offset)
  return x.getFullYear() + '-' + String(x.getMonth() + 1).padStart(2, '0') + '-' + String(x.getDate()).padStart(2, '0')
}

let seq = 0
const id = (prefix) => `${prefix}${++seq}`
const ex = (exerciseId, name, sets) => ({
  id: id('ex'),
  exerciseId,
  name,
  sets: sets.map(([weight, reps]) => ({ id: id('set'), weight, reps, done: true })),
})
const ent = (bodyPart, exercises) => ({ id: id('bp'), bodyPart, exercises })
const day = (date, entries, note) => ({ date, updatedAt: Date.now(), entries, note })

const plan = [
  [dayKey(-8), 'chest', [
    ['bench-press', '杠铃卧推', [[60, 8], [60, 8], [60, 8]]],
    ['db-fly', '哑铃飞鸟', [[12, 12], [12, 12], [12, 12]]],
    ['tricep-pushdown', '绳索下压', [[25, 12], [25, 12], [25, 12]]],
  ]],
  [dayKey(-7), 'back', [
    ['deadlift', '硬拉', [[100, 5], [100, 5], [100, 5]]],
    ['barbell-row', '杠铃划船', [[50, 8], [50, 8], [50, 8]]],
    ['lat-pulldown', '高位下拉', [[45, 10], [45, 10], [45, 10]]],
  ]],
  [dayKey(-6), 'legs', [
    ['squat', '深蹲', [[80, 6], [80, 6], [80, 6]]],
    ['leg-press', '腿举', [[120, 10], [120, 10], [120, 10]]],
    ['calf-raise', '提踵', [[40, 12], [40, 12], [40, 12]]],
  ]],
  [dayKey(-5), 'shoulders', [
    ['ohp', '杠铃推举', [[40, 8], [40, 8], [40, 8]]],
    ['lateral-raise', '侧平举', [[8, 15], [8, 15], [8, 15]]],
    ['face-pull', '面拉', [[20, 12], [20, 12], [20, 12]]],
  ]],
  [dayKey(-4), 'arms', [
    ['barbell-curl', '杠铃弯举', [[25, 10], [25, 10], [25, 10]]],
    ['tricep-pushdown', '绳索下压', [[30, 12], [30, 12], [30, 12]]],
    ['hammer-curl', '锤式弯举', [[10, 12], [10, 12], [10, 12]]],
  ]],
  [dayKey(-3), 'chest', [
    ['bench-press', '杠铃卧推', [[64, 8], [64, 8], [64, 8]]],
    ['incline-bench', '上斜卧推', [[50, 8], [50, 8], [50, 8]]],
    ['db-fly', '哑铃飞鸟', [[14, 12], [14, 12], [14, 12]]],
  ]],
  [dayKey(-2), 'legs', [
    ['squat', '深蹲', [[88, 6], [88, 6], [88, 6]]],
    ['rdl', '罗马尼亚硬拉', [[70, 8], [70, 8], [70, 8]]],
    ['leg-press', '腿举', [[140, 10], [140, 10], [140, 10]]],
  ]],
  [dayKey(-1), 'back', [
    ['deadlift', '硬拉', [[112, 5], [112, 5], [112, 5]]],
    ['barbell-row', '杠铃划船', [[55, 8], [55, 8], [55, 8]]],
    ['lat-pulldown', '高位下拉', [[50, 10], [50, 10], [50, 10]]],
  ]],
  [dayKey(0), 'chest', [
    ['bench-press', '杠铃卧推', [[68, 8], [68, 8], [68, 8]]],
    ['db-bench', '哑铃卧推', [[24, 10], [24, 10], [24, 10]]],
    ['cable-crossover', '绳索夹胸', [[15, 12], [15, 12], [15, 12]]],
  ]],
]

const data = {
  version: 2,
  days: Object.fromEntries(
    plan.map(([date, part, exs], i) => [
      date,
      day(date, [ent(part, exs.map(([eid, name, sets]) => ex(eid, name, sets)))], i === 8 ? '状态不错，卧推有明显进步。' : undefined),
    ]),
  ),
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
  const errors = []
  ws.onmessage = (ev) => {
    const m = JSON.parse(ev.data)
    if (m.id && pending.has(m.id)) {
      const p = pending.get(m.id); pending.delete(m.id)
      m.error ? p.reject(new Error(JSON.stringify(m.error))) : p.resolve(m.result)
    } else if (m.method === 'Runtime.exceptionThrown') errors.push(m.params.exceptionDetails.exception?.description ?? 'ex')
    else if (m.method === 'Runtime.consoleAPICalled' && m.params.type === 'error') errors.push(m.params.args.map(a => a.value ?? a.description).join(' '))
  }
  const send = (method, params = {}) => new Promise((resolve, reject) => {
    const mid = ++idn
    pending.set(mid, { resolve, reject })
    ws.send(JSON.stringify({ id: mid, method, params }))
  })
  const evaluate = async (expression) => {
    const r = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true })
    if (r.exceptionDetails) throw new Error((r.exceptionDetails.exception?.description ?? r.exceptionDetails.text).slice(0, 500))
    return r.result.value
  }
  const shot = async (name, full = false) => {
    const r = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: full })
    writeFileSync(`${outDir}/${name}.png`, Buffer.from(r.data, 'base64'))
  }
  const clickText = async (text) => {
    const ok = await evaluate(`(() => {
      const b = [...document.querySelectorAll('button')].find(x => x.textContent.includes(${JSON.stringify(text)}))
      if (!b) return false
      b.click(); return true
    })()`)
    await sleep(650)
    return ok
  }

  await send('Page.enable')
  await send('Runtime.enable')
  await send('Emulation.setDeviceMetricsOverride', { width: 400, height: 860, deviceScaleFactor: 2, mobile: true })
  await send('Page.navigate', { url })
  await sleep(1600)
  await evaluate(`localStorage.setItem('gym-log:data', ${JSON.stringify(JSON.stringify(data))}); true`)
  await send('Page.navigate', { url: url + (url.includes('?') ? '&' : '?') + 'page=cultivation&today=' + dayKey(0) })
  await sleep(2200)

  await shot('01-hero')
  await evaluate('window.scrollTo(0, 720)')
  await sleep(400)
  await shot('02-realms')
  await evaluate('window.scrollTo(0, 1460)')
  await sleep(400)
  await shot('03-breakdown')
  await evaluate('window.scrollTo(0, 0)')
  await sleep(300)

  const opened = await clickText('查看完整')
  if (opened) await shot('04-level-table')
  await evaluate(`document.querySelector('[aria-label="关闭"]')?.click()`)
  await sleep(400)

  await evaluate(`(() => { const b=[...document.querySelectorAll('nav button')].find(x=>x.textContent.includes('今天')); b&&b.click() })()`)
  await sleep(700)
  await shot('05-today-strip')

  await evaluate(`(() => { const b=[...document.querySelectorAll('nav button')].find(x=>x.textContent.includes('我的')); b&&b.click() })()`)
  await sleep(700)
  await shot('06-profile')

  const summary = await evaluate(`(() => {
    const t = document.body.innerText
    return {
      hasLevel: /第 \\d+ 级/.test(t),
      text: t.slice(0, 260)
    }
  })()`)
  console.log('summary', JSON.stringify(summary))
  console.log('errors:', errors.length ? errors.slice(0, 3) : 'none')
  console.log('shots ->', outDir)
} catch (e) {
  console.log('ERROR', e.message)
} finally {
  try { ws?.close() } catch {}
  chrome.kill()
}
