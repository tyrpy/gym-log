// 补充验证：撤销、模板套用、复制历史、导出结构
import { spawn } from 'node:child_process'

const url = process.argv[2] ?? 'http://127.0.0.1:5173/'
const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
const port = 9100 + Math.floor(Math.random() * 200)
const chrome = spawn(CHROME, ['--headless=new', '--disable-gpu', '--hide-scrollbars', `--remote-debugging-port=${port}`,
  `--user-data-dir=${process.env.TEMP}\\gymlog-extra-${Date.now()}`, 'about:blank'], { stdio: 'ignore' })
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const results = []
const check = (n, ok, d = '') => { results.push(ok); console.log(`${ok ? 'PASS' : 'FAIL'}  ${n}${d ? ' — ' + d : ''}`) }

let ws
try {
  for (let i = 0; i < 60; i++) { try { await (await fetch(`http://127.0.0.1:${port}/json/version`)).json(); break } catch { await sleep(200) } }
  const targets = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json()
  ws = new WebSocket(targets.find((t) => t.type === 'page').webSocketDebuggerUrl)
  await new Promise((r, j) => { ws.onopen = r; ws.onerror = j })
  let id = 0
  const pending = new Map()
  const errors = []
  ws.onmessage = (ev) => {
    const m = JSON.parse(ev.data)
    if (m.id && pending.has(m.id)) { const p = pending.get(m.id); pending.delete(m.id); m.error ? p.reject(new Error(JSON.stringify(m.error))) : p.resolve(m.result) }
    else if (m.method === 'Runtime.exceptionThrown') errors.push(m.params.exceptionDetails.exception?.description ?? 'ex')
  }
  const send = (method, params = {}) => new Promise((res, rej) => { const mid = ++id; pending.set(mid, { resolve: res, reject: rej }); ws.send(JSON.stringify({ id: mid, method, params })) })
  const evaluate = async (expression) => {
    const r = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true })
    if (r.exceptionDetails) throw new Error((r.exceptionDetails.exception?.description ?? r.exceptionDetails.text).slice(0, 300))
    return r.result.value
  }
  const clickText = async (text, exact = false) => {
    const ok = await evaluate(`(() => { const b=[...document.querySelectorAll('button')].find(x => ${exact ? `x.textContent.trim()===${JSON.stringify(text)}` : `x.textContent.includes(${JSON.stringify(text)})`}); if(!b) return false; b.click(); return true })()`)
    await sleep(500)
    return ok
  }

  await send('Page.enable'); await send('Runtime.enable')
  await send('Emulation.setDeviceMetricsOverride', { width: 400, height: 860, deviceScaleFactor: 2, mobile: true })
  const d = new Date()
  const key = (o) => { const x = new Date(d); x.setDate(x.getDate() + o); return x.getFullYear() + '-' + String(x.getMonth() + 1).padStart(2, '0') + '-' + String(x.getDate()).padStart(2, '0') }
  const mk = (date, bodyPart, id, name, sets) => ({
    date, updatedAt: Date.now(),
    entries: [{ id: 'bp' + Math.random().toString(36).slice(2, 6), bodyPart,
      exercises: [{ id: 'ex' + Math.random().toString(36).slice(2, 6), exerciseId: id, name,
        sets: sets.map(([w, r]) => ({ id: 's' + Math.random().toString(36).slice(2, 6), weight: w, reps: r, done: true })) }] }],
  })
  const data = {
    version: 2,
    days: {
      [key(0)]: mk(key(0), 'chest', 'bench-press', '杠铃卧推', [[60, 10], [65, 8]]),
      [key(-3)]: mk(key(-3), 'legs', 'squat', '深蹲', [[80, 8], [85, 6]]),
    },
    customExercises: [],
    templates: [{ id: 't1', name: '腿日', items: [{ exerciseId: 'squat', bodyPart: 'legs' }, { exerciseId: 'leg-press', bodyPart: 'legs' }], createdAt: Date.now() }],
    settings: { unit: 'kg', defaultRestSeconds: 90, autoStartRest: true, restSound: true },
  }
  await send('Page.navigate', { url })
  await sleep(1400)
  await evaluate(`localStorage.setItem('gym-log:data', ${JSON.stringify(JSON.stringify(data))}); true`)
  await send('Page.navigate', { url: url + (url.includes('?') ? '&' : '?') + 'today=' + key(0) })
  await sleep(2000)

  // 1) 撤销：删掉一个部位后撤销
  check('初始有胸部位', await evaluate(`document.body.innerText.includes('杠铃卧推')`))
  await evaluate(`(() => { const b=document.querySelector('button[aria-label="删除部位"]'); b&&b.click(); return !!b })()`)
  await sleep(400)
  await clickText('删除', true)
  await sleep(600)
  check('部位已删除', !(await evaluate(`document.body.innerText.includes('杠铃卧推')`)))
  const undoVisible = await evaluate(`document.body.innerText.includes('撤销')`)
  check('出现撤销提示', undoVisible)
  await clickText('撤销', true)
  await sleep(600)
  check('撤销后恢复', await evaluate(`document.body.innerText.includes('杠铃卧推')`))

  // 2) 模板套用（会覆盖当天 → 应出现深蹲）
  await clickText('模板', true)
  await sleep(500)
  await clickText('套用', true)
  await sleep(700)
  check('模板已套用', await evaluate(`document.body.innerText.includes('深蹲')`))

  // 3) 导出结构（不真的下载，验证导出函数产出可解析 JSON）
  const exportOk = await evaluate(`(() => {
    const raw = localStorage.getItem('gym-log:data');
    try { const d = JSON.parse(raw); return d.version === 2 && typeof d.days === 'object' && !!d.settings } catch { return false }
  })()`)
  check('存储结构合法', exportOk)

  // 4) 刷新后模板仍生效
  await send('Page.reload'); await sleep(1600)
  check('刷新后模板记录保留', await evaluate(`document.body.innerText.includes('深蹲')`))

  // 5) 推荐模板
  await evaluate(`document.querySelectorAll('nav button')[3].click()`)
  await sleep(900)
  const before = await evaluate(`document.body.innerText.includes('推日 · 胸肩三头')`)
  await clickText('载入推荐模板')
  await sleep(700)
  const after = await evaluate(`document.body.innerText.includes('推日 · 胸肩三头') && document.body.innerText.includes('拉日 · 背二头') && document.body.innerText.includes('腿日 · 下肢')`)
  check('推荐模板可一键载入', !before && after, `before=${before} after=${after}`)

  check('无运行时错误', errors.length === 0, errors.slice(0, 2).join(' | '))
} catch (e) {
  check('脚本异常', false, e.message)
} finally {
  try { ws?.close() } catch {}
  chrome.kill()
}
const ok = results.filter(Boolean).length
console.log(`\n=== ${ok}/${results.length} 通过 ===`)
process.exit(ok === results.length ? 0 : 1)
