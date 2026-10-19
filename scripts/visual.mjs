// 视觉验证：注入一周训练数据，截取关键界面
import { spawn } from 'node:child_process'
import { mkdirSync, writeFileSync } from 'node:fs'

const url = process.argv[2] ?? 'http://127.0.0.1:5173/'
const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
const port = 9800 + Math.floor(Math.random() * 150)
const outDir = '.shots/ui'
mkdirSync(outDir, { recursive: true })

const chrome = spawn(
  CHROME,
  ['--headless=new', '--disable-gpu', '--hide-scrollbars', `--remote-debugging-port=${port}`,
   `--user-data-dir=${process.env.TEMP}\\gymlog-ui-${Date.now()}`, 'about:blank'],
  { stdio: 'ignore' },
)

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

const rnd = () => Math.random().toString(36).slice(2, 7)
const dayKey = (offset) => {
  const x = new Date()
  x.setDate(x.getDate() + offset)
  return x.getFullYear() + '-' + String(x.getMonth() + 1).padStart(2, '0') + '-' + String(x.getDate()).padStart(2, '0')
}
const ent = (bodyPart, exs) => ({ id: 'bp' + rnd(), bodyPart, exercises: exs })
const ex = (id, name, sets) => ({
  id: 'ex' + rnd(),
  exerciseId: id,
  name,
  sets: sets.map(([weight, reps]) => ({ id: 's' + rnd(), weight, reps, done: true })),
})

let ws
try {
  for (let i = 0; i < 60; i++) {
    try { await (await fetch(`http://127.0.0.1:${port}/json/version`)).json(); break } catch { await sleep(200) }
  }
  const targets = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json()
  const page = targets.find((t) => t.type === 'page')
  ws = new WebSocket(page.webSocketDebuggerUrl)
  await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej })

  let id = 0
  const pending = new Map()
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
  const shot = async (name) => {
    const r = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true })
    writeFileSync(`${outDir}/${name}.png`, Buffer.from(r.data, 'base64'))
  }
  const clickText = async (text, exact = false) => {
    const ok = await evaluate(`(() => {
      const b=[...document.querySelectorAll('button')].find(x => ${exact ? `x.textContent.trim()===${JSON.stringify(text)}` : `x.textContent.includes(${JSON.stringify(text)})`});
      if (!b) return false; b.click(); return true;
    })()`)
    await sleep(700)
    return ok
  }

  await send('Page.enable')
  await send('Runtime.enable')
  await send('Emulation.setDeviceMetricsOverride', { width: 400, height: 860, deviceScaleFactor: 2, mobile: true })

  const data = {
    version: 2,
    days: {
      [dayKey(0)]: {
        date: dayKey(0), updatedAt: Date.now(),
        note: '状态不错，卧推最后一组有点吃力。',
        entries: [
          ent('chest', [
            ex('bench-press', '杠铃卧推', [[60, 10], [65, 8], [65, 8], [70, 6]]),
            ex('db-fly', '哑铃飞鸟', [[12, 12], [12, 12], [14, 10]]),
          ]),
          ent('arms', [ex('tricep-pushdown', '绳索下压', [[25, 12], [25, 12], [30, 10]])]),
        ],
      },
      [dayKey(-2)]: { date: dayKey(-2), updatedAt: Date.now(), entries: [
        ent('legs', [ex('squat', '深蹲', [[80, 8], [85, 6], [85, 6]]), ex('leg-press', '腿举', [[120, 12], [140, 10], [140, 10]])])] },
      [dayKey(-4)]: { date: dayKey(-4), updatedAt: Date.now(), entries: [
        ent('back', [ex('deadlift', '硬拉', [[100, 5], [110, 5], [110, 3]]), ex('lat-pulldown', '高位下拉', [[45, 12], [50, 10], [50, 10]])])] },
      [dayKey(-6)]: { date: dayKey(-6), updatedAt: Date.now(), entries: [
        ent('chest', [ex('bench-press', '杠铃卧推', [[55, 10], [60, 8], [60, 8]])])] },
      [dayKey(-8)]: { date: dayKey(-8), updatedAt: Date.now(), entries: [
        ent('chest', [ex('bench-press', '杠铃卧推', [[50, 10], [55, 8], [60, 6]])])] },
    },
    customExercises: [
      { id: 'custom-1', name: '绳索面拉', bodyPart: 'shoulders', equipment: 'cable', isCustom: true },
    ],
    templates: [
      { id: 'tpl1', name: '推日（胸 + 三头）', items: [
        { exerciseId: 'bench-press', bodyPart: 'chest' },
        { exerciseId: 'db-fly', bodyPart: 'chest' },
        { exerciseId: 'tricep-pushdown', bodyPart: 'arms' }], createdAt: Date.now() },
      { id: 'tpl2', name: '腿日', items: [
        { exerciseId: 'squat', bodyPart: 'legs' },
        { exerciseId: 'leg-press', bodyPart: 'legs' }], createdAt: Date.now() },
    ],
    settings: { unit: 'kg', defaultRestSeconds: 90, autoStartRest: true, restSound: true },
  }

  // 先打开站点写入数据，再导航到目标页
  await send('Page.navigate', { url })
  await sleep(1500)
  await evaluate(`localStorage.setItem('gym-log:data', ${JSON.stringify(JSON.stringify(data))}); true`)
  await send('Page.navigate', { url: url + (url.includes('?') ? '&' : '?') + 'today=' + dayKey(0) })
  await sleep(2200)

  const nav = async (i) => { await evaluate(`document.querySelectorAll('nav button')[${i}].click()`); await sleep(1000) }

  await shot('01-today')
  await clickText('添加动作')
  await shot('02-picker')
  await clickText('关闭', true)

  await nav(1)
  await shot('03-history')
  await evaluate(`(() => { const b=[...document.querySelectorAll('button')].find(x=>x.textContent.includes('个动作')); b&&b.click(); return !!b })()`)
  await sleep(900)
  await shot('04-day-detail')
  await clickText('关闭', true)

  await nav(2)
  await sleep(1600)
  await shot('05-trends')
  await clickText('容量', true)
  await shot('06-trends-volume')

  await nav(3)
  await shot('07-profile')

  await nav(0)
  await sleep(700)
  await clickText('模板', true)
  await shot('08-templates')

  console.log('errors:', errors.length ? errors.slice(0, 3) : 'none')
  console.log('shots ->', outDir)
} catch (e) {
  console.log('ERROR', e.message)
} finally {
  try { ws?.close() } catch {}
  chrome.kill()
}
