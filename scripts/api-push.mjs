// 通过 GitHub Git Data API 提交（github.com:443 不通时的备用方案）
import { execSync } from 'node:child_process'
import { readFileSync } from 'node:fs'

const TOKEN = process.argv[2]
const OWNER = 'tyrpy'
const REPO = 'gym-log'
const API = `https://api.github.com/repos/${OWNER}/${REPO}`
const HEADERS = {
  Authorization: `token ${TOKEN}`,
  'User-Agent': 'gym-log-deploy',
  Accept: 'application/vnd.github+json',
}

const api = async (path, init = {}) => {
  const res = await fetch(`${API}${path}`, {
    ...init,
    headers: { ...HEADERS, 'Content-Type': 'application/json', ...(init.headers ?? {}) },
  })
  const text = await res.text()
  if (!res.ok) throw new Error(`${res.status} ${path}: ${text.slice(0, 300)}`)
  return text ? JSON.parse(text) : null
}

const sh = (cmd) => execSync(cmd, { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 }).trim()

// 1) 远端当前 main
const ref = await api('/git/ref/heads/main')
const baseSha = ref.object.sha
const baseCommit = await api(`/git/commits/${baseSha}`)
const baseTree = baseCommit.tree.sha
console.log(`远端 main: ${baseSha.slice(0, 7)}  tree=${baseTree.slice(0, 7)}`)

const localHead = sh('git rev-parse HEAD')
console.log(`本地 HEAD: ${localHead.slice(0, 7)}`)

// 2) 本地相对远端基线改动的文件
const diff = sh(`git diff --name-status ${baseSha} HEAD`)
const entries = []
const files = diff
  .split('\n')
  .filter(Boolean)
  .map((line) => {
    const [status, ...rest] = line.split('\t')
    return { status, path: rest.join('\t') }
  })

console.log(`改动文件数: ${files.length}`)

for (const f of files) {
  if (f.status === 'D') {
    entries.push({ path: f.path, mode: '100644', type: 'blob', sha: null })
    continue
  }
  // 重命名时取新路径
  const path = f.status.startsWith('R') ? f.path.split('\t').pop() : f.path
  const content = readFileSync(path)
  const isBinary = content.includes(0)
  const blob = await api('/git/blobs', {
    method: 'POST',
    body: JSON.stringify(
      isBinary
        ? { content: content.toString('base64'), encoding: 'base64' }
        : { content: content.toString('utf8'), encoding: 'utf-8' },
    ),
  })
  // 保留可执行位
  let mode = '100644'
  try {
    const m = sh(`git ls-files -s -- "${path}"`).split(' ')[0]
    if (m === '100755') mode = '100755'
  } catch {
    /* ignore */
  }
  entries.push({ path, mode, type: 'blob', sha: blob.sha })
  process.stdout.write('.')
}
console.log('')

// 3) 新 tree
const tree = await api('/git/trees', {
  method: 'POST',
  body: JSON.stringify({ base_tree: baseTree, tree: entries }),
})

// 4) 新 commit
const message = sh(`git log -1 --pretty=%B`)
const commit = await api('/git/commits', {
  method: 'POST',
  body: JSON.stringify({ message, tree: tree.sha, parents: [baseSha] }),
})

// 5) 更新 main
await api('/git/refs/heads/main', {
  method: 'PATCH',
  body: JSON.stringify({ sha: commit.sha, force: false }),
})

console.log(`已推送: ${commit.sha.slice(0, 7)}  ${message.split('\n')[0]}`)
console.log(`https://github.com/${OWNER}/${REPO}/commit/${commit.sha}`)
