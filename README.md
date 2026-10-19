# 健身日志

记录每天练了哪些部位、做了哪些动作、每组多重多少次。本地优先：数据只存在你这台设备的浏览器里，不联网、不上传。

## 手机上安装（推荐）

**线上地址：https://tyrpy.github.io/gym-log/**

1. 手机浏览器打开上面的地址（Android 用 Chrome，iPhone 用 Safari；微信里打开不行）
2. **Android**：菜单 →「安装应用」/「添加到主屏幕」
3. **iPhone**：分享按钮 →「添加到主屏幕」→ 添加
4. 之后从桌面图标打开，**第一次加载完就能断网使用**

App 内也有入口：「我的 → 安装到手机主屏幕」，会按你的系统给出对应步骤。

## 本地开发

```bash
pnpm install     # 第一次
pnpm dev         # 开发模式：http://127.0.0.1:5173
pnpm build       # 生产构建到 dist/
pnpm preview     # 本地预览构建产物：http://127.0.0.1:4173
```

> **注意数据是分站点存的**：线上地址、`127.0.0.1`、`192.168.x.x` 在浏览器看来是不同站点，数据互不通用。
> 换站点时用「我的 → 导出备份 / 导入备份」搬运。日常请固定用线上那一个。

## 界面预览

![今天](docs/screenshots/today.png)
![历史](docs/screenshots/history.png)
![趋势](docs/screenshots/trends.png)

## 功能

| 页面 | 能做什么 |
|---|---|
| **今天** | 选部位 → 选动作 → 逐组填重量/次数 → 打勾完成；自动开始组间休息倒计时（可暂停/+15s） |
| **历史** | 月历上训练日按部位显示彩点；点某天看明细，可复制到「今天」 |
| **趋势** | 选任意动作，看最重重量 / 总容量随时间的折线图，以及相对上次的变化 |
| **我的** | 自定义动作、训练模板、休息时长与提示音、导出/导入备份 |

- **模板**：记录完一次训练 → 训练明细右上角「存为模板」，下次在「模板」面板一键套用
- **推荐模板**：「我的 → 我的模板 → + 载入推荐模板」可一键加入「推日 / 拉日 / 腿日 / 全身」四套起点模板，之后可在模板面板里删改
- **复制上次**：今天页空白时的「复制上次训练」，或模板面板里的「复制历史训练」
- **撤销**：误删动作或改错数字，点底部「撤销」（桌面端也支持 Ctrl/Cmd+Z）
- **预置动作库**：38 个常见动作。找不到就在「添加动作」面板底部新建

## 数据与备份

- 存储位置：浏览器 `localStorage`，键名 `gym-log:data`
- 清理浏览器缓存 / 换浏览器 / 用无痕模式 → 数据会丢
- 建议每隔一段时间在「我的 → 导出备份」存一个 JSON 文件

## 技术栈

React 19 + TypeScript + Vite 8，图表用 Recharts（趋势页按需加载）。
纯前端，无后端、无账号、无网络请求。

## 目录

```
src/
  types.ts              数据模型（日期 → 部位 → 动作 → 组）
  data/                 部位、预置动作库、子部位关键词
  lib/store.ts          全部读写操作（纯函数）+ 持久化 + 导入导出
  lib/utils.ts          日期、数字、格式化
  state/gym.tsx         全局状态：reducer + 撤销栈 + URL 同步
  components/           部位块、动作选择器、日历、休息计时器、图表
  pages/                今天 / 历史 / 趋势 / 我的
scripts/                端到端测试、截图、图标生成
```

## 开发脚本

```bash
pnpm typecheck          # 类型检查
pnpm build              # 构建到 dist/
node scripts/e2e.mjs    # 真实浏览器点一遍核心流程（需要先 pnpm dev）
node scripts/pwa.mjs    # 验证 manifest / Service Worker / 断网可用（需要先 pnpm preview）
node scripts/visual.mjs # 注入示例数据并截图到 .shots/ui/
```

## 发布

推送到 `main` 后，GitHub Actions 自动构建并部署到 Pages：

- 工作流：`.github/workflows/deploy.yml`
- 构建时会按仓库名设置子路径（`--base=/gym-log/`），所以资源路径不会错
- 仓库需在 **Settings → Pages → Source** 选 **GitHub Actions**
- 站点：https://tyrpy.github.io/gym-log/
- Actions 页：https://github.com/tyrpy/gym-log/actions

手动发布（本地）：

```bash
pnpm exec vite build --base=/gym-log/
```

然后把 `dist/` 里的内容传到任意静态托管（Cloudflare Pages、Vercel、对象存储皆可）。

## 常见问题

**手机上打不开？**
用线上地址 https://tyrpy.github.io/gym-log/ ；国内网络偶尔访问 GitHub Pages 较慢，多等几秒或换网络。

**安装后没网还能用吗？**
能。第一次成功打开后，页面、脚本、图标都会存进本机缓存。之后就算飞行模式也能记录，数据写在本机，联网后也不会自动上传（本来就不上传）。

**换手机 / 清理缓存后数据没了？**
数据在浏览器本地，换设备不会自动同步。用「我的 → 导出备份」，在新设备上「导入备份」。

**更新版本后数据还在吗？**
在。代码和数据分开存，更新只会替换页面文件。App 检测到新版本会在底部提示，你点「更新」才刷新。

**想改练法 / 加动作？**
动作在「添加动作」面板底部可以直接新建；整套流程在「我的 → 我的模板」里管理。
