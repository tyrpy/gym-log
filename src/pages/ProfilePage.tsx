import { useMemo, useRef, useState } from 'react'
import type { BodyPartId, Equipment } from '../types'
import { BODY_PARTS, BODY_PART_MAP, EQUIPMENT_LABEL } from '../data/exercises'
import { PART_COLORS } from '../data/details'
import { C } from '../ui/tokens'
import { Icon } from '../ui/Icon'
import { Page, PageHeader, SectionTitle, SettingRow, Stat } from '../ui/layout'
import { Button, Card, Chip, Switch, inputStyle } from '../ui/base'
import { Sheet } from '../ui/Sheet'
import { Modal } from '../ui/Sheet'
import { toast } from '../ui/toast'
import { useGym } from '../state/gym'
import { InstallSheet, useInstallState } from '../ui/Install'
import { CultivationStrip } from '../components/CultivationStrip'
import { emptyCultivation } from '../lib/cultivation'
import {
  addCustomExercise,
  addDefaultTemplates,
  daySetCount,
  dayVolume,
  exportJson,
  importJson,
  loggedDates,
  removeCustomExercise,
  removeTemplate,
} from '../lib/store'
import { fmtNumber, todayKey, uid } from '../lib/utils'

const EQUIPMENTS: Equipment[] = ['barbell', 'dumbbell', 'machine', 'cable', 'bodyweight', 'kettlebell', 'other']

export function ProfilePage() {
  const { data, update, replace } = useGym()
  const [newOpen, setNewOpen] = useState(false)
  const [confirmReset, setConfirmReset] = useState(false)
  const [installOpen, setInstallOpen] = useState(false)
  const install = useInstallState()
  const [name, setName] = useState('')
  const [part, setPart] = useState<BodyPartId>('chest')
  const [equip, setEquip] = useState<Equipment>('machine')
  const fileRef = useRef<HTMLInputElement>(null)
  const apkRef = useRef<HTMLAnchorElement>(null)

  const dates = useMemo(() => loggedDates(data), [data])
  const totalSets = dates.reduce((s, d) => s + daySetCount(data.days[d]), 0)
  const totalVolume = dates.reduce((s, d) => s + dayVolume(data.days[d]), 0)

  const doExport = () => {
    const blob = new Blob([exportJson(data)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `健身日志-${todayKey()}.json`
    a.click()
    URL.revokeObjectURL(url)
    toast('已导出备份文件', 'success')
  }

  const doImport = async (file: File) => {
    const text = await file.text()
    const parsed = importJson(text)
    if (!parsed) {
      toast('文件格式不对，导入失败')
      return
    }
    replace(parsed)
    toast('导入成功', 'success')
  }

  const submitNew = () => {
    const n = name.trim()
    if (!n) {
      toast('先填动作名称')
      return
    }
    update((d) => addCustomExercise(d, { id: uid('custom-'), name: n, bodyPart: part, equipment: equip }))
    setName('')
    setNewOpen(false)
    toast('已加入动作库', 'success')
  }

  return (
    <Page>
      <PageHeader tone={C.textSecondary} title="我的" subtitle="训练档案、动作与设置" />

      <CultivationStrip style={{ marginTop: 14 }} />

      <Card style={{ marginTop: 10, padding: 14 }}>
        <div style={{ display: 'flex', gap: 8 }}>
          <Stat plain first label="训练日" value={dates.length} unit="天" />
          <Stat plain label="总组数" value={totalSets} unit="组" />
          <Stat plain label="总容量" value={fmtNumber(totalVolume)} unit="kg" />
        </div>
      </Card>

      {/* 自定义动作 */}
      <SectionTitle
        right={
          <button onClick={() => setNewOpen(true)} style={{ fontSize: 12.5, color: C.info, fontWeight: 600 }}>
            + 新建
          </button>
        }
      >
        我的动作（{data.customExercises.length}）
      </SectionTitle>
      <Card style={{ overflow: 'hidden' }}>
        {data.customExercises.length === 0 ? (
          <div style={{ padding: 16, fontSize: 13, color: C.muted, lineHeight: 1.7 }}>
            还没有自定义动作。预置了 38 个常见动作；找不到你的动作时，点右上角「新建」，之后就能在记录时直接选。
          </div>
        ) : (
          data.customExercises.map((ex) => (
            <div
              key={ex.id}
              className="setting-row"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '12px 16px',
                borderTop: `1px solid ${C.border}`,
              }}
            >
              <span style={{ width: 7, height: 7, borderRadius: 99, background: PART_COLORS[ex.bodyPart] }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 600 }}>{ex.name}</div>
                <div style={{ fontSize: 11.5, color: C.muted }}>
                  {BODY_PART_MAP[ex.bodyPart].name} · {EQUIPMENT_LABEL[ex.equipment]}
                </div>
              </div>
              <button
                aria-label="删除自定义动作"
                onClick={() => {
                  update((d) => removeCustomExercise(d, ex.id))
                  toast('已删除（历史记录不受影响）')
                }}
                style={{ color: C.muted, display: 'flex', padding: 4 }}
              >
                <Icon name="trash" size={15} />
              </button>
            </div>
          ))
        )}
      </Card>

      {/* 模板 */}
      <SectionTitle
        right={
          <button
            onClick={() => {
              update((d) => addDefaultTemplates(d))
              toast('已加入推荐模板', 'success')
            }}
            style={{ fontSize: 12.5, color: C.info, fontWeight: 600 }}
          >
            + 载入推荐模板
          </button>
        }
      >
        我的模板（{data.templates.length}）
      </SectionTitle>
      <Card style={{ overflow: 'hidden' }}>
        {data.templates.length === 0 ? (
          <div style={{ padding: 16, fontSize: 13, color: C.muted, lineHeight: 1.7 }}>
            还没有模板。在「今天」记录完一次训练后，点训练明细右上角「存为模板」，就能把整套流程存下来。
          </div>
        ) : (
          data.templates.map((t) => (
            <div
              key={t.id}
              className="setting-row"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '12px 16px',
                borderTop: `1px solid ${C.border}`,
              }}
            >
              <Icon name="list" size={16} style={{ color: C.muted }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 600 }}>{t.name}</div>
                <div style={{ fontSize: 11.5, color: C.muted }}>{t.items.length} 个动作</div>
              </div>
              <button
                aria-label="删除模板"
                onClick={() => {
                  update((d) => removeTemplate(d, t.id))
                  toast('模板已删除')
                }}
                style={{ color: C.muted, display: 'flex', padding: 4 }}
              >
                <Icon name="trash" size={15} />
              </button>
            </div>
          ))
        )}
      </Card>

      {/* 设置 */}
      <SectionTitle>训练设置</SectionTitle>
      <Card style={{ overflow: 'hidden' }}>
        <SettingRow
          label="默认组间休息"
          desc="完成一组后自动倒计时的时长"
          control={
            <div style={{ display: 'flex', gap: 6 }}>
              {[60, 90, 120, 180].map((s) => (
                <Chip
                  key={s}
                  active={data.settings.defaultRestSeconds === s}
                  onClick={() => update((d) => ({ ...d, settings: { ...d.settings, defaultRestSeconds: s } }))}
                  style={{ padding: '5px 10px', fontSize: 12.5 }}
                >
                  {s}s
                </Chip>
              ))}
            </div>
          }
        />
        <SettingRow
          label="完成一组后自动开始计时"
          control={
            <Switch
              label="自动开始计时"
              checked={data.settings.autoStartRest}
              onChange={(v) => update((d) => ({ ...d, settings: { ...d.settings, autoStartRest: v } }))}
            />
          }
        />
        <SettingRow
          label="计时结束提示音"
          desc="需要在页面上点过任意按钮后才会生效（浏览器限制）"
          control={
            <Switch
              label="提示音"
              checked={data.settings.restSound}
              onChange={(v) => update((d) => ({ ...d, settings: { ...d.settings, restSound: v } }))}
            />
          }
        />
      </Card>

      {/* 设备与数据 */}
      <SectionTitle>设备与数据</SectionTitle>
      <Card style={{ overflow: 'hidden' }}>
        <SettingRow
          label={install.installed ? '已安装到主屏幕' : '安装到手机主屏幕'}
          desc={
            install.installed
              ? '现在是从主屏幕启动的独立 App'
              : '像普通 App 一样打开，第一次加载后断网也能用'
          }
          onClick={() => setInstallOpen(true)}
          control={
            <Icon
              name={install.installed ? 'check' : 'download'}
              size={18}
              style={{ color: install.installed ? C.success : C.muted }}
            />
          }
        />
        <SettingRow
          label="下载安卓安装包（APK）"
          desc="约 8 MB · Android 7.0 以上 · 断网可用"
          onClick={() => apkRef.current?.click()}
          control={<Icon name="download" size={18} style={{ color: C.muted }} />}
        />
        <SettingRow
          label="导出备份"
          desc="下载一个 JSON 文件，换设备或防丢失"
          onClick={doExport}
          control={<Icon name="download" size={18} style={{ color: C.muted }} />}
        />
        <SettingRow
          label="导入备份"
          desc="会覆盖当前设备上的全部数据"
          onClick={() => fileRef.current?.click()}
          control={<Icon name="upload" size={18} style={{ color: C.muted }} />}
        />
      </Card>

      <Card style={{ marginTop: 10, overflow: 'hidden' }}>
        <SettingRow
          label={<span style={{ color: C.danger }}>清空全部数据</span>}
          desc="不可恢复，建议先导出备份"
          onClick={() => setConfirmReset(true)}
          control={<Icon name="trash" size={18} style={{ color: C.danger }} />}
        />
      </Card>

      <div style={{ textAlign: 'center', fontSize: 11.5, color: C.muted, marginTop: 22, lineHeight: 1.8 }}>
        健身日志 v1.1 · 数据只保存在本机浏览器（localStorage）
        <br />
        换浏览器或清理缓存会丢数据，记得导出备份
      </div>

      <a ref={apkRef} href="./gym-log-tyrpy.apk" download="gym-log-tyrpy.apk" style={{ display: 'none' }} />

      <input
        ref={fileRef}
        type="file"
        accept="application/json,.json"
        style={{ display: 'none' }}
        onChange={(e) => {
          const f = e.target.files?.[0]
          if (f) void doImport(f)
          e.target.value = ''
        }}
      />

      {/* 新建自定义动作 */}
      <Sheet open={newOpen} onClose={() => setNewOpen(false)} title="新建自定义动作">
        <div style={{ display: 'grid', gap: 14 }}>
          <div style={{ display: 'grid', gap: 6 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: C.textSecondary }}>名称</div>
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="例如：绳索面拉"
              style={inputStyle}
            />
          </div>
          <div style={{ display: 'grid', gap: 6 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: C.textSecondary }}>部位</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {BODY_PARTS.map((p) => (
                <Chip key={p.id} active={part === p.id} color={p.color} onClick={() => setPart(p.id)}>
                  {p.name}
                </Chip>
              ))}
            </div>
          </div>
          <div style={{ display: 'grid', gap: 6 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: C.textSecondary }}>器械</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {EQUIPMENTS.map((eq) => (
                <Chip key={eq} active={equip === eq} onClick={() => setEquip(eq)}>
                  {EQUIPMENT_LABEL[eq]}
                </Chip>
              ))}
            </div>
          </div>
          <Button variant="primary" full onClick={submitNew}>
            保存到动作库
          </Button>
        </div>
      </Sheet>

      <InstallSheet
        open={installOpen}
        onClose={() => setInstallOpen(false)}
        ios={install.ios}
        canPrompt={install.canPrompt}
        onPrompt={async () => {
          const r = await install.promptInstall()
          if (r === 'accepted') toast('已开始安装', 'success')
          setInstallOpen(false)
        }}
      />

      <Modal
        open={confirmReset}
        onClose={() => setConfirmReset(false)}
        title="清空全部数据？"
        footer={
          <>
            <Button onClick={() => setConfirmReset(false)}>取消</Button>
            <Button
              variant="danger"
              onClick={() => {
                replace({
                  ...data,
                  days: {},
                  customExercises: [],
                  templates: [],
                  cultivation: emptyCultivation(),
                })
                setConfirmReset(false)
                toast('已清空')
              }}
            >
              确认清空
            </Button>
          </>
        }
      >
        所有训练记录、自定义动作、模板都会被删除，且无法恢复。建议先「导出备份」。
      </Modal>
    </Page>
  )
}

