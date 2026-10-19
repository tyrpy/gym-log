import { C, R } from '../ui/tokens'
import { Icon } from '../ui/Icon'
import { Sheet } from '../ui/Sheet'
import { Button } from '../ui/base'
import { DaySummaryCard } from './DaySummaryCard'
import { useGym } from '../state/gym'
import { copyDay, dayBodyParts, daySetCount, hasAnyLog } from '../lib/store'
import { formatDateCN, todayKey } from '../lib/utils'
import { toast } from '../ui/toast'

/** 历史里点某天：看详情，可去编辑 / 复制到今天 */
export function DayDetailSheet({
  date,
  onClose,
}: {
  date: string
  onClose: () => void
}) {
  const { data, update, setDate, go } = useGym()
  const day = data.days[date]
  const today = todayKey()
  const empty = !hasAnyLog(day)

  return (
    <Sheet open onClose={onClose} title={formatDateCN(date, true)} subtitle={empty ? '没有记录' : `${daySetCount(day)} 组`}>
      <div style={{ display: 'grid', gap: 14 }}>
        {empty ? (
          <div style={{ color: C.muted, fontSize: 13.5, lineHeight: 1.7 }}>
            这一天还没有训练记录。
            {date === today ? '回「今天」页面开始记录吧。' : '可以补记这一天的训练。'}
          </div>
        ) : (
          <DaySummaryCard data={data} date={date} showDate={false} />
        )}

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <Button
            variant="primary"
            onClick={() => {
              setDate(date)
              onClose()
              go('today')
            }}
            style={{ flex: 1 }}
          >
            <Icon name="edit" size={15} />
            {empty ? '去记录' : '查看 / 编辑'}
          </Button>
          {!empty && date !== today ? (
            <Button
              onClick={() => {
                update((d) => copyDay(d, date, today))
                onClose()
                toast('已复制到今天', 'success')
              }}
            >
              <Icon name="copy" size={15} />
              复制到今天
            </Button>
          ) : null}
        </div>

        {!empty && dayBodyParts(day).length > 0 ? (
          <div
            style={{
              display: 'flex',
              gap: 10,
              padding: '10px 12px',
              background: C.surfaceAlt,
              borderRadius: R.md,
              fontSize: 12,
              color: C.muted,
              lineHeight: 1.6,
            }}
          >
            <Icon name="target" size={16} style={{ flex: 'none', marginTop: 1 }} />
            同一天可以练多个部位；点「查看 / 编辑」后还能继续往上加动作和组。
          </div>
        ) : null}
      </div>
    </Sheet>
  )
}
