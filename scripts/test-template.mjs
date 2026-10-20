// 测试：从零新建模板的完整流程
import { spawn } from 'node:child_process'
import { mkdirSync, writeFileSync } from 'node:fs'

const base = process.argv[2] ?? 'http://127.0.0.1:5173/'
const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
const port = 8300 + Math.floor(Math.random() * 90)
mkdirSync('.shots/tpl', { recursive: true })

const chrome = spawn(CHROME, ['--headless=new', '--disable-gpu', '--hide-scrollbars',
  `--remote-debugging-port=${port}`, `--user-data-dir=${process.env.TEMP}\\gymlog-tp-${Date.now()}`, 'about:blank'],
  { stdio: 'ignore' })
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const results = []
const check = (n, ok, d = '') => { results.push(ok); console.log(`${ok ? 'PASS' : 'FAIL'}  ${n}${d ? ' — ' + d : ''}`) }

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
  const errors = []
  ws.onmessage = (ev) => {
    const m = JSON.parse(ev.data)
    if (m.id && pending.has(m.id)) {
      const p = pending.get(m.id); pending.delete(m.id)
      m.error ? p.reject(new Error(JSON.stringify(m.error))) : p.resolve(m.result)
    } else if (m.method === 'Runtime.exceptionThrown') {
      errors.push(m.params.exceptionDetails.exception?.description ?? 'ex')
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
  const clickText = async (text, tag = 'button') => {
    const ok = await evaluate(`(() => {
      const els = [...document.querySelectorAll('${tag}')];
      const el = els.find(e => e.textContent.replace(/\\s/g,'').includes(${JSON.stringify(text.replace(/\s/g, ''))}));
      if (!el) return false; el.click(); return true;
    })()`)
    await sleep(500)
    return ok
  }

  await send('Page.enable')
  await send('Runtime.enable')
  await send('Emulation.setDeviceMetricsOverride', { width: 414, height: 896, deviceScaleFactor: 2, mobile: true })

  await send('Page.navigate', { url: base })
  await sleep(1400)
  await evaluate(`localStorage.clear(); true`)
  await send('Page.navigate', { url: base + '?page=me' })
  await sleep(2000)

  check('打开我的页', await evaluate(`document.body.innerText.includes('我的模板')`))
  const clickedNew = await evaluate(`(() => { const b = document.querySelector('button[aria-label="新建模板"]'); if (!b) return false; b.click(); return true })()`)
  await sleep(600)
  check('有「新建模板」入口', clickedNew)
  check('编辑器打开', await evaluate(`document.body.innerText.includes('模板名称')`))

  // 填名称
  await evaluate(`(() => {
    const input = [...document.querySelectorAll('input')].find(i => i.placeholder && i.placeholder.includes('推日'));
    if (!input) return false;
    const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
    setter.call(input, '胸日 · 自建');
    input.dispatchEvent(new Event('input', { bubbles: true }));
    return true;
  })()`)
  await sleep(300)

  // 选部位「胸」
  await clickText('胸', 'button')
  await sleep(400)
  check('已加入部位', await evaluate(`document.body.innerText.includes('个动作')`))

  // 添加动作
  await clickText('添加动作')
  await sleep(700)
  check('动作库打开', await evaluate(`document.body.innerText.includes('杠铃卧推')`))
  await clickText('杠铃卧推')
  await sleep(600)
  check('动作已加入编辑器', await evaluate(`document.body.innerText.includes('杠铃卧推')`))

  // 截图编辑器
  const shot1 = await send('Page.captureScreenshot', { format: 'png' })
  writeFileSync('.shots/tpl/editor.png', Buffer.from(shot1.data, 'base64'))

  // 保存
  check('点击保存', await clickText('保存模板'))
  await sleep(800)

  const state = await evaluate(`(() => {
    const d = JSON.parse(localStorage.getItem('gym-log:data') || '{}')
    return { templates: (d.templates || []).map(t => ({ name: t.name, n: t.items.length })), body: document.body.innerText.includes('胸日 · 自建') }
  })()`)
  check('模板已写入', state.templates.length === 1 && state.templates[0].n === 1, JSON.stringify(state.templates))
  check('列表出现新模板', state.body)

  const shot2 = await send('Page.captureScreenshot', { format: 'png' })
  writeFileSync('.shots/tpl/saved.png', Buffer.from(shot2.data, 'base64'))

  // 编辑入口
  const hasEdit = await evaluate(`!!document.querySelector('button[aria-label="编辑模板"]')`)
  check('有编辑按钮', hasEdit)
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
