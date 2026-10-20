// 用 CDP 查询某个元素实际使用了哪个字体文件
import { spawn } from 'node:child_process'

const url = process.argv[2] ?? 'http://127.0.0.1:5173/'
const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
const port = 8700 + Math.floor(Math.random() * 90)

const chrome = spawn(CHROME, ['--headless=new', '--disable-gpu', '--hide-scrollbars',
  `--remote-debugging-port=${port}`, `--user-data-dir=${process.env.TEMP}\\gymlog-wf-${Date.now()}`, 'about:blank'],
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

  await send('Page.enable')
  await send('DOM.enable')
  await send('CSS.enable')
  await send('Emulation.setDeviceMetricsOverride', { width: 414, height: 896, deviceScaleFactor: 2, mobile: true })
  await send('Page.navigate', { url })
  await sleep(2600)

  const { root } = await send('DOM.getDocument', { depth: -1 })
  const targets = [
    ['标题「今天」', 'h1, [class]'],
  ]

  // 直接按文本内容找元素
  const evalRes = await send('Runtime.evaluate', {
    expression: `(() => {
      const out = [];
      const h = [...document.querySelectorAll('*')].find(e => e.children.length === 0 && /^今\\s*天$/.test(e.textContent.trim()));
      if (h) out.push(['标题 今天', h]);
      const p = [...document.querySelectorAll('*')].find(e => e.children.length === 0 && e.textContent.includes('点「记录部位」'));
      if (p) out.push(['正文段落', p]);
      const b = [...document.querySelectorAll('button')].find(e => e.textContent.includes('记录部位'));
      if (b) out.push(['主按钮', b]);
      return out.map(([n, el]) => n);
    })()`,
    returnByValue: true,
  })
  console.log('找到元素:', evalRes.result.value)

  const ids = await send('Runtime.evaluate', {
    expression: `(() => {
      const els = [];
      const h = [...document.querySelectorAll('*')].find(e => e.children.length === 0 && /^今\\s*天$/.test(e.textContent.trim()));
      if (h) els.push(h);
      const p = [...document.querySelectorAll('*')].find(e => e.children.length === 0 && e.textContent.includes('点「记录部位」'));
      if (p) els.push(p);
      const b = [...document.querySelectorAll('button')].find(e => e.textContent.includes('记录部位'));
      if (b) els.push(b);
      return els;
    })()`,
    returnByValue: false,
  })

  const objectGroup = 'fontcheck'
  const props = await send('Runtime.getProperties', { objectId: ids.result.objectId })
  let i = 0
  for (const prop of props.result) {
    if (!/^\d+$/.test(prop.name)) continue
    i++
    const node = await send('DOM.requestNode', { objectId: prop.value.objectId })
    const fonts = await send('CSS.getPlatformFontsForNode', { nodeId: node.nodeId })
    console.log(`元素 ${i}:`, JSON.stringify(fonts.fonts))
  }
  void objectGroup
  void root
  void targets
} finally {
  try { ws?.close() } catch {}
  chrome.kill()
}
