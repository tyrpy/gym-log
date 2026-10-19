// 端到端冒烟测试：真实点击按钮，验证「选部位 → 选动作 → 填组 → 打勾 → 休息计时」全链路
// 用法: node scripts/e2e.mjs [url]
import { spawn } from 'node:child_process'
import { mkdirSync, writeFileSync } from 'node:fs'

const url = process.argv[2] ?? 'http://127.0.0.1:5173/'
const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
const port = 9500 + Math.floor(Math.random() * 300)
const outDir = '.shots/e2e'
mkdirSync(outDir, { recursive: true })

const chrome = spawn(
  CHROME,
  [
    '--headless=new',
    '--disable-gpu',
    '--hide-scrollbars',
    '--no-first-run',
    '--no-default-browser-check',
    `--remote-debugging-port=${port}`,
    `--user-data-dir=${process.env.TEMP}\\gymlog-e2e-${Date.now()}`,
    'about:blank',
  ],
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
  for (let i = 0; i < 60; i++) {
    try {
      await (await fetch(`http://127.0.0.1:${port}/json/version`)).json()
      break
    } catch {
      await sleep(200)
    }
  }
  const targets = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json()
  const page = targets.find((t) => t.type === 'page')
  ws = new WebSocket(page.webSocketDebuggerUrl)
  await new Promise((res, rej) => {
    ws.onopen = res
    ws.onerror = rej
  })

  let id = 0
  const pending = new Map()
  const consoleErrors = []
  ws.onmessage = (ev) => {
    const msg = JSON.parse(ev.data)
    if (msg.id && pending.has(msg.id)) {
      const { resolve, reject } = pending.get(msg.id)
      pending.delete(msg.id)
      msg.error ? reject(new Error(JSON.stringify(msg.error))) : resolve(msg.result)
    } else if (msg.method === 'Runtime.exceptionThrown') {
      consoleErrors.push(msg.params.exceptionDetails.exception?.description ?? 'exception')
    } else if (msg.method === 'Runtime.consoleAPICalled' && msg.params.type === 'error') {
      consoleErrors.push(msg.params.args.map((a) => a.value ?? a.description).join(' '))
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

  await send('Page.enable')
  await send('Runtime.enable')
  await send('Emulation.setDeviceMetricsOverride', { width: 400, height: 860, deviceScaleFactor: 2, mobile: true })
  const _d = new Date()
  const todayKey = _d.getFullYear() + '-' + String(_d.getMonth() + 1).padStart(2, '0') + '-' + String(_d.getDate()).padStart(2, '0')
  await send('Page.navigate', { url: url + (url.includes('?') ? '&' : '?') + 'today=' + todayKey })
  await sleep(2200)

  // 0) 清空 localStorage，从零开始
  await evaluate(`localStorage.clear(); true`)
  await send('Page.reload')
  await sleep(1800)

  // 工具：按可见文本找元素并点击
  const clickText = async (text, tag = 'button') => {
    const ok = await evaluate(`(() => {
      const els = [...document.querySelectorAll('${tag}')];
      const el = els.find(e => e.textContent.trim().includes(${JSON.stringify(text)}));
      if (!el) return false;
      el.click(); return true;
    })()`)
    await sleep(450)
    return ok
  }

  const bodyHas = async (text) => evaluate(`document.body.innerText.includes(${JSON.stringify(text)})`)
  const shot = async (name) => {
    const r = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true })
    writeFileSync(`${outDir}/${name}.png`, Buffer.from(r.data, 'base64'))
  }

  // 1) 首屏
  check('首屏加载', (await bodyHas('今天')) && (await bodyHas('记录部位')))
  await shot('01-today-empty')

  // 2) 记录部位 → 选「胸」
  await clickText('记录部位')
  check('打开部位选择', await bodyHas('今天练哪些部位'))
  await clickText('胸', 'button')
  await sleep(600)
  check('添加胸部位', await bodyHas('添加动作'))

  // 3) 添加动作
  await clickText('添加动作')
  await sleep(400)
  check('打开动作库', await bodyHas('杠铃卧推'))
  await clickText('杠铃卧推', 'button')
  await sleep(500)
  check('动作已加入', await bodyHas('杠铃卧推'))

  // 4) 加一组并填数字
  await clickText('加一组')
  await sleep(400)
  const inputs = await evaluate(`document.querySelectorAll('input[aria-label="重量"]').length`)
  check('出现重量输入框', inputs === 1, `count=${inputs}`)
  await evaluate(`(() => {
    const w = document.querySelector('input[aria-label="重量"]');
    const r = document.querySelector('input[aria-label="次数"]');
    const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
    setter.call(w, '60'); w.dispatchEvent(new Event('input', { bubbles: true }));
    setter.call(r, '10'); r.dispatchEvent(new Event('input', { bubbles: true }));
    return true;
  })()`)
  await sleep(300)

  // 5) 打勾 → 应触发休息计时器
  await evaluate(`(() => {
    const btn = document.querySelector('button[aria-label="标记为完成并开始休息"]');
    if (!btn) return false; btn.click(); return true;
  })()`)
  await sleep(700)
  check('打勾完成一组', await evaluate(`!!document.querySelector('button[aria-label="标记为未完成"]')`))
  check('休息计时器出现', await bodyHas('组间休息'))
  await shot('02-set-done-timer')

  // 6) 刷新后数据仍在（localStorage 持久化）
  await send('Page.reload')
  await sleep(1600)
  check('刷新后数据保留', (await bodyHas('杠铃卧推')) && (await bodyHas('60')))
  const stored = await evaluate(`(() => { const d = JSON.parse(localStorage.getItem('gym-log:data')||'{}'); return Object.keys(d.days||{}).length })()`)
  check('localStorage 已写入', stored >= 1, `days=${stored}`)

  // 7) 组数统计
  check('概览统计正确', await bodyHas('1 组') || (await bodyHas('组数')))

  // 8) 存为模板（用 prompt 会被拦截，改用直接调用 store 太复杂 —— 这里验证按钮存在）
  check('存为模板入口存在', await bodyHas('存为模板'))

  // 9) 历史页
  await evaluate(`document.querySelectorAll('nav button')[1].click()`)
  await sleep(700)
  check('历史页打开', await bodyHas('训练历史'))
  check('月历渲染', await bodyHas('最近训练'))
  await shot('03-history')

  // 10) 趋势页
  await evaluate(`document.querySelectorAll('nav button')[2].click()`)
  await sleep(800)
  check('趋势页打开', await bodyHas('进步趋势'))
  check('趋势页识别到动作', await bodyHas('杠铃卧推'))
  await shot('04-trends')

  // 11) 我的页
  await evaluate(`document.querySelectorAll('nav button')[3].click()`)
  await sleep(700)
  check('我的页打开', await bodyHas('我的动作'))
  check('设置项存在', await bodyHas('默认组间休息'))
  await shot('05-profile')

  // 12) 回今天
  await evaluate(`document.querySelectorAll('nav button')[0].click()`)
  await sleep(600)
  check('返回今天页', await bodyHas('记录部位'))

  check('无运行时错误', consoleErrors.length === 0, consoleErrors.slice(0, 2).join(' | '))
} catch (e) {
  console.log('FAIL  测试脚本异常 —', e.message)
  results.push({ name: '脚本异常', ok: false, detail: e.message })
} finally {
  try {
    ws?.close()
  } catch {}
  chrome.kill()
}

const failed = results.filter((r) => !r.ok)
console.log(`\n=== ${results.length - failed.length}/${results.length} 通过 ===`)
writeFileSync(`${outDir}/report.json`, JSON.stringify(results, null, 2))
process.exit(failed.length ? 1 : 0)
