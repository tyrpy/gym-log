// 注入示例数据后截取视口图（用于展示）
import { spawn } from 'node:child_process'
import { mkdirSync, writeFileSync } from 'node:fs'

const baseUrl = process.argv[2] ?? 'http://127.0.0.1:5173/'
const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
const port = 8600 + Math.floor(Math.random() * 90)
mkdirSync('.shots/final', { recursive: true })

const rnd = () => Math.random().toString(36).slice(2, 6)
const dayKey = (offset) => {
  const x = new Date()
  x.setDate(x.getDate() + offset)
  return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}-${String(x.getDate()).padStart(2, '0')}`
}
const mkEnt = (bodyPart, exs) => ({ id: 'bp' + rnd(), bodyPart, exercises: exs })
const mkEx = (id, name, sets) => ({
  id: 'ex' + rnd(),
  exerciseId: id,
  name,
  sets: sets.map(([w, r]) => ({ id: 's' + rnd(), weight: w, reps: r, done: true })),
})

const data = {
  version: 2,
  days: {
    [dayKey(0)]: {
      date: dayKey(0),
      updatedAt: Date.now(),
      entries: [
        mkEnt('chest', [
          mkEx('bench-press', '杠铃卧推', [[60, 10], [65, 8], [70, 6]]),
          mkEx('db-fly', '哑铃飞鸟', [[12, 12], [14, 10]]),
        ]),
        mkEnt('arms', [mkEx('tricep-pushdown', '绳索下压', [[25, 12], [30, 10]])]),
      ],
    },
    [dayKey(-2)]: {
      date: dayKey(-2),
      updatedAt: Date.now(),
      entries: [mkEnt('legs', [mkEx('squat', '深蹲', [[80, 8], [85, 6]])])],
    },
  },
  customExercises: [],
  templates: [],
  settings: { unit: 'kg', defaultRestSeconds: 90, autoStartRest: true, restSound: true },
}

const chrome = spawn(CHROME, ['--headless=new', '--disable-gpu', '--hide-scrollbars',
  `--remote-debugging-port=${port}`, `--user-data-dir=${process.env.TEMP}\\gymlog-fin-${Date.now()}`, 'about:blank'],
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
    if (r.exceptionDetails) throw new Error((r.exceptionDetails.exception?.description ?? r.exceptionDetails.text).slice(0, 200))
    return r.result.value
  }

  await send('Page.enable')
  await send('Runtime.enable')
  await send('Emulation.setDeviceMetricsOverride', { width: 414, height: 896, deviceScaleFactor: 3, mobile: true })

  await send('Page.navigate', { url: baseUrl })
  await sleep(1500)
  await evaluate(`localStorage.setItem('gym-log:data', ${JSON.stringify(JSON.stringify(data))}); true`)

  const pages = [
    ['today', ''],
    ['cultivation', '?page=cultivation'],
    ['library', '?page=library'],
  ]
  for (const [name, q] of pages) {
    await send('Page.navigate', { url: baseUrl + q })
    await sleep(1800)
    const shot = await send('Page.captureScreenshot', { format: 'png' })
    writeFileSync(`.shots/final/${name}.png`, Buffer.from(shot.data, 'base64'))
    console.log('shot', name)
  }
} finally {
  try { ws?.close() } catch {}
  chrome.kill()
}
