// 动作库冒烟测试：搜索、筛选、详情、加入今天
import { spawn } from 'node:child_process'
import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'

const url = process.argv[2] ?? 'http://127.0.0.1:5173/'
const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
const port = 9700 + Math.floor(Math.random() * 150)
const outDir = '.shots/e2e-library'
mkdirSync(outDir, { recursive: true })

const chrome = spawn(
  CHROME,
  ['--headless=new', '--disable-gpu', '--no-sandbox', '--hide-scrollbars',
   `--remote-debugging-port=${port}`, `--user-data-dir=${join(tmpdir(), `gymlog-e2e-lib-${Date.now()}`)}`, 'about:blank'],
  { stdio: 'ignore' },
)

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const results = []
function check(name, ok, detail = '') {
  results.push({ name, ok, detail })
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? '  — ' + detail : ''}`)
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

  let id = 0
  const pending = new Map()
  const consoleErrors = []
  ws.onmessage = (ev) => {
    const m = JSON.parse(ev.data)
    if (m.id && pending.has(m.id)) {
      const { resolve, reject } = pending.get(m.id)
      pending.delete(m.id)
      m.error ? reject(new Error(JSON.stringify(m.error))) : resolve(m.result)
    } else if (m.method === 'Runtime.exceptionThrown') {
      consoleErrors.push(m.params.exceptionDetails.exception?.description ?? 'exception')
    } else if (m.method === 'Runtime.consoleAPICalled' && m.params.type === 'error') {
      consoleErrors.push(m.params.args.map((a) => a.value ?? a.description).join(' '))
    }
  }
  const send = (method, params = {}) =>
    new Promise((resolve, reject) => {
      const mid = ++id
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
      const el = [...document.querySelectorAll('button')].find(e => e.textContent.includes(${JSON.stringify(text)}))
      if (!el) return false
      el.click(); return true
    })()`)
    await sleep(450)
    return ok
  }
  const shot = async (name) => {
    const r = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true })
    writeFileSync(`${outDir}/${name}.png`, Buffer.from(r.data, 'base64'))
  }

  await send('Page.enable')
  await send('Runtime.enable')
  await send('Emulation.setDeviceMetricsOverride', { width: 400, height: 860, deviceScaleFactor: 2, mobile: true })
  await send('Page.navigate', { url: url + (url.includes('?') ? '&' : '?') + 'page=library' })
  await sleep(2200)

  check('动作库页加载', (await bodyHas('动作库')) && (await bodyHas('38 个动作')))
  check('动作卡片渲染', (await evaluate(`document.querySelectorAll('svg[role="img"]').length`)) >= 19)

  const fillSearch = (text) => evaluate(`(() => {
    const el = document.querySelector('input[aria-label="搜索动作"]')
    if (!el) return false
    const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set
    setter.call(el, ${JSON.stringify(text)})
    el.dispatchEvent(new Event('input', { bubbles: true }))
    return true
  })()`)

  const inputOk = await fillSearch('深蹲')
  await sleep(500)
  check('搜索输入可用', inputOk)
  check('搜索「深蹲」只剩 1 个', await bodyHas('找到 1 个动作'))

  await fillSearch('')
  await sleep(400)
  await clickText('胸')
  await sleep(350)
  check('按部位筛选（胸）', await bodyHas('找到 7 个动作'))
  await clickText('全部部位')
  await sleep(350)

  await fillSearch('深蹲')
  await sleep(400)
  await clickText('深蹲')
  await sleep(500)
  check('打开动作详情', (await bodyHas('怎么做')) && (await bodyHas('杠铃放在斜方肌上部')))
  await shot('01-detail')

  await clickText('加入今天训练')
  await sleep(900)
  check('加入后跳到今天', await bodyHas('训练明细'))
  check('今天出现深蹲', await bodyHas('深蹲'))
  await shot('02-today')

  await send('Page.reload')
  await sleep(1600)
  check('刷新后仍保留', await bodyHas('深蹲'))
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
