// 打印本机可用的访问地址（手机与电脑需要在同一 Wi-Fi）
import { networkInterfaces } from 'node:os'

const nets = networkInterfaces()
const addresses = []
for (const [name, list] of Object.entries(nets)) {
  if (!list) continue
  for (const n of list) {
    if (n.family !== 'IPv4' || n.internal) continue
    if (/^(vEthernet|VMware|VirtualBox|Loopback)/i.test(name)) continue
    addresses.push({ name, ip: n.address })
  }
}

console.log('')
console.log('  电脑访问:  http://127.0.0.1:5173')
for (const a of addresses) {
  console.log(`  手机访问:  http://${a.ip}:5173   (${a.name})`)
}
console.log('')
console.log('  提示：手机和电脑连同一个 Wi-Fi 才能打开；')
console.log('  用哪个地址当主入口就一直用哪个，数据是按地址分开存的。')
console.log('')
