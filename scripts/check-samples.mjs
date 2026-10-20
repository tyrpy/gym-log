// 检查线上主包是否还包含「示例数据」相关文案
const base = process.argv[2] ?? 'https://tyrpy.github.io/gym-log/'

const html = await (await fetch(base)).text()
const match = html.match(/src="([^"]*index-[^"]*\.js)"/)
if (!match) {
  console.log('未找到主包')
  process.exit(1)
}
const jsUrl = new URL(match[1], base).href
const js = await (await fetch(jsUrl)).text()

console.log('主包:', jsUrl.replace(base, ''), `${Math.round(js.length / 1024)} KB`)
for (const kw of ['载入示例数据', '示例数据']) {
  console.log(`${kw}: ${js.includes(kw) ? '仍存在' : '已移除'}`)
}
