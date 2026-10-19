// PWA 验证：manifest、Service Worker 注册、断网后仍可打开、数据保留
import { spawn } from 'node:child_process'
import { mkdirSync, writeFileSync } from 'node:fs'

const url = process.argv[2] ?? 'http://127.0.0.1:4173/'
const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
const port = 9250 + Math.floor(Math.random() * 150)
const outDir = '.shots/pwa'
mkdirSync(outDir, { recursive: true })

const chrome = spawn(
  CHROME,
  ['--headless=new', '--disable-gpu', '--hide-scrollbars', '--no-first-run', '--no-default-browser-check',
   `--remote-debugging-port=${port}`, `--user-data-dir=${process.env.TEMP}\\gymlog-pwa-${Date.now()}`, 'about:blank'],
  { stdio: 'ignore' },
)

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const results = []
const check = (n, ok, d = '') => { results.push(ok); console.log(`${ok ? 'PASS' : 'FAIL'}  ${n}${d ? '  — ' + d : ''}`) }

let ws
try {
  for (let i = 0; i < 60; i++) {
    try { await (await fetch(`http://127.0.0.1:${port}/json/version`)).json(); break } catch { await sleep(200) }
  }
  const targets = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json()
  ws = new WebSocket(targets.find((t) => t.type === 'page').webSocketDebuggerUrl)
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
  const shot = async (name) => {
    const r = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true })
    writeFileSync(`${outDir}/${name}.png`, Buffer.from(r.data, 'base64'))
  }

  await send('Page.enable')
  await send('Runtime.enable')
  await send('Network.enable')
  await send('Emulation.setDeviceMetricsOverride', { width: 400, height: 860, deviceScaleFactor: 2, mobile: true })

  // 1) 首次加载
  await send('Page.navigate', { url })
  await sleep(2500)
  await evaluate(`localStorage.clear(); true`)
  await send('Page.reload')
  await sleep(2500)

  check('页面渲染', await evaluate(`document.body.innerText.includes('记录部位')`))

  // 2) manifest
  const manifestLink = await evaluate(`document.querySelector('link[rel="manifest"]')?.getAttribute('href') ?? ''`)
  check('manifest 已注入', !!manifestLink, manifestLink)
  const manifest = await evaluate(`fetch(${JSON.stringify(manifestLink)}).then(r => r.json())`)
  check('manifest display=standalone', manifest?.display === 'standalone', `display=${manifest?.display}`)
  check('manifest 有图标', Array.isArray(manifest?.icons) && manifest.icons.length >= 2, `${manifest?.icons?.length} 个`)
  check('manifest start_url', !!manifest?.start_url, `start_url=${manifest?.start_url}`)

  // 3) Service Worker 注册并接管
  const swState = await evaluate(`(async () => {
    if (!('serviceWorker' in navigator)) return { ok: false, why: 'no serviceWorker' }
    const reg = await navigator.serviceWorker.ready
    for (let i = 0; i < 40 && !navigator.serviceWorker.controller; i++) {
      await new Promise(r => setTimeout(r, 150))
    }
    return { ok: !!navigator.serviceWorker.controller, scope: reg.scope, active: !!reg.active }
  })()`)
  check('Service Worker 已激活并接管页面', swState?.ok === true, JSON.stringify(swState))

  // 4) 预缓存内容
  const cached = await evaluate(`(async () => {
    const keys = await caches.keys()
    let total = 0
    for (const k of keys) { const c = await caches.open(k); total += (await c.keys()).length }
    return { keys, total }
  })()`)
  check('缓存已写入', cached.total >= 10, `${cached.total} 个资源 / ${cached.keys.length} 个缓存桶`)

  // 5) 先录一条数据，后面验证断网后还在
  await evaluate(`(() => {
    const t = new Date(); const k = t.getFullYear()+'-'+String(t.getMonth()+1).padStart(2,'0')+'-'+String(t.getDate()).padStart(2,'0');
    const d = { version:2, days:{ [k]:{ date:k, updatedAt:Date.now(), entries:[{ id:'bp1', bodyPart:'chest', exercises:[{ id:'ex1', exerciseId:'bench-press', name:'杠铃卧推', sets:[{ id:'s1', weight:80, reps:5, done:true }] }] }] } }, customExercises:[], templates:[], settings:{ unit:'kg', defaultRestSeconds:90, autoStartRest:true, restSound:true } };
    localStorage.setItem('gym-log:data', JSON.stringify(d)); return true })()`)

  // 6) 断网后重新加载
  await send('Network.emulateNetworkConditions', { offline: true, latency: 0, downloadThroughput: 0, uploadThroughput: 0 })
  await send('Page.reload')
  await sleep(3000)

  check('断网后页面仍可打开', await evaluate(`document.body.innerText.includes('记录部位')`))
  check('断网后训练数据仍在', await evaluate(`document.body.innerText.includes('杠铃卧推') && document.body.innerText.includes('80')`))
  await shot('01-offline')

  // 断网下打开按需加载的趋势页
  await evaluate(`document.querySelectorAll('nav button')[2].click()`)
  await sleep(2500)
  const trendOk = await evaluate(`document.body.innerText.includes('进步趋势') && !document.body.innerText.includes('加载中')`)
  check('断网后趋势页可用（按需分包已缓存）', trendOk)
  await shot('01b-offline-trends')
  await evaluate(`document.querySelectorAll('nav button')[0].click()`)
  await sleep(600)

  // 7) 恢复网络
  await send('Network.emulateNetworkConditions', { offline: false, latency: 0, downloadThroughput: -1, uploadThroughput: -1 })
  await send('Page.reload')
  await sleep(2000)
  check('恢复网络后正常', await evaluate(`document.body.innerText.includes('记录部位')`))

  // 8) 安装入口（个人页）
  await evaluate(`document.querySelectorAll('nav button')[3].click()`)
  await sleep(900)
  check('个人页有安装入口', await evaluate(`document.body.innerText.includes('安装到手机主屏幕')`))
  await shot('02-install-entry')
  await evaluate(`(() => { const b=[...document.querySelectorAll('button')].find(x=>x.textContent.includes('安装到手机主屏幕')); b&&b.click(); return true })()`)
  await sleep(700)
  await shot('03-install-sheet')
  check('安装说明面板打开', await evaluate(`document.body.innerText.includes('添加到主屏幕') || document.body.innerText.includes('立即安装')`))

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
