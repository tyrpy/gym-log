/** 各部位的独立强调色（比大部位色更细分，用于图表与标签） */
export const PART_COLORS: Record<string, string> = {
  chest: '#e5484d',
  back: '#0d74ce',
  legs: '#30a46c',
  shoulders: '#f76b15',
  arms: '#8e5bd9',
  core: '#d6409f',
  cardio: '#c99a00',
}

/** 子部位：只用于选动作时的快速筛选（不单独存储） */
export interface PartGroup {
  id: string
  name: string
  /** 匹配动作名中的关键词 */
  keywords: string[]
}

export const PART_GROUPS: Record<string, PartGroup[]> = {
  chest: [
    { id: 'upper', name: '上胸', keywords: ['上斜'] },
    { id: 'middle', name: '中胸', keywords: ['卧推', '飞鸟', '夹胸'] },
    { id: 'lower', name: '下胸', keywords: ['下斜'] },
  ],
  back: [
    { id: 'width', name: '背宽', keywords: ['下拉', '引体'] },
    { id: 'thickness', name: '背厚', keywords: ['划船', '硬拉'] },
  ],
  legs: [
    { id: 'quad', name: '股四头', keywords: ['深蹲', '腿举', '腿屈伸', '箭步'] },
    { id: 'ham', name: '腘绳肌', keywords: ['硬拉', '腿弯举'] },
    { id: 'calf', name: '小腿', keywords: ['提踵'] },
  ],
  shoulders: [
    { id: 'front', name: '前束', keywords: ['推举'] },
    { id: 'side', name: '中束', keywords: ['侧平举'] },
    { id: 'rear', name: '后束', keywords: ['反向飞鸟', '面拉'] },
  ],
  arms: [
    { id: 'biceps', name: '二头', keywords: ['弯举'] },
    { id: 'triceps', name: '三头', keywords: ['下压', '臂屈伸', '臂屈伸'] },
  ],
  core: [{ id: 'abs', name: '腹肌', keywords: [] }],
  cardio: [{ id: 'aerobic', name: '有氧', keywords: [] }],
}
