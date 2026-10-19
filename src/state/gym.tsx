import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import type { AppData } from '../types'
import { loadData, saveData } from '../lib/store'
import { broadcastEdit } from '../ui/Undo'
import { todayKey } from '../lib/utils'

export type Page = 'today' | 'history' | 'trends' | 'library' | 'me' | 'cultivation'

interface HistoryState {
  /** 每次可撤销的修改 +1 */
  version: number
  /** 撤销栈里的历史状态 */
  stack: AppData[]
}

type Action =
  | { type: 'update'; fn: (d: AppData) => AppData; undo: boolean }
  | { type: 'replace'; data: AppData; undo: boolean }
  | { type: 'undo' }
  | { type: 'sync'; data: AppData }

interface State {
  data: AppData
  hist: HistoryState
}

const MAX_UNDO = 30

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'update': {
      const next = action.fn(state.data)
      if (next === state.data) return state
      return {
        data: next,
        hist: action.undo
          ? {
              version: state.hist.version + 1,
              stack: [...state.hist.stack, state.data].slice(-MAX_UNDO),
            }
          : state.hist,
      }
    }
    case 'replace':
      return {
        data: action.data,
        hist: action.undo
          ? {
              version: state.hist.version + 1,
              stack: [...state.hist.stack, state.data].slice(-MAX_UNDO),
            }
          : state.hist,
      }
    case 'undo': {
      if (state.hist.stack.length === 0) return state
      return {
        data: state.hist.stack[state.hist.stack.length - 1],
        hist: {
          version: state.hist.version + 1,
          stack: state.hist.stack.slice(0, -1),
        },
      }
    }
    case 'sync':
      return { ...state, data: action.data }
    default:
      return state
  }
}

interface GymStore {
  data: AppData
  /** 应用一次不可变更新；默认记入撤销栈 */
  update: (fn: (d: AppData) => AppData, opts?: { undo?: boolean }) => void
  /** 整体替换（导入/清空用） */
  replace: (d: AppData) => void
  undo: () => void
  canUndo: boolean
  page: Page
  go: (p: Page) => void
  /** 当前编辑的日期 */
  date: string
  setDate: (d: string) => void
}

const Ctx = createContext<GymStore | null>(null)

export function GymProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, () => ({
    data: loadData(),
    hist: { version: 0, stack: [] },
  }))

  const [page, setPage] = useState<Page>(() => {
    const p = new URLSearchParams(location.search).get('page')
    return p === 'history' || p === 'trends' || p === 'library' || p === 'me' || p === 'cultivation'
      ? p
      : 'today'
  })

  const [date, setDateState] = useState<string>(() => {
    const params = new URLSearchParams(location.search)
    const d = params.get('date')
    const override = params.get('today')
    if (d && /^\d{4}-\d{2}-\d{2}$/.test(d)) return d
    return override && /^\d{4}-\d{2}-\d{2}$/.test(override) ? override : todayKey()
  })

  const update = useCallback((fn: (d: AppData) => AppData, opts?: { undo?: boolean }) => {
    dispatch({ type: 'update', fn, undo: opts?.undo !== false })
  }, [])

  const replace = useCallback((d: AppData) => {
    dispatch({ type: 'replace', data: d, undo: true })
  }, [])

  const undo = useCallback(() => {
    dispatch({ type: 'undo' })
  }, [])

  // 撤销快捷键（桌面端 Cmd/Ctrl+Z）
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault()
        undo()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [undo])

  // 持久化（节流到短暂延迟后写入）+ 通知撤销条
  const firstRender = useRef(true)
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false
      return
    }
    broadcastEdit()
    const t = window.setTimeout(() => saveData(state.data), 120)
    return () => window.clearTimeout(t)
  }, [state.data])

  // 跨标签页同步
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key !== 'gym-log:data') return
      dispatch({ type: 'sync', data: loadData() })
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  const go = useCallback((p: Page) => {
    setPage(p)
    window.scrollTo({ top: 0 })
  }, [])

  const setDate = useCallback((d: string) => setDateState(d), [])

  // 把当前页/日期写进 URL，刷新后保持（不新增历史条目）
  useEffect(() => {
    const url = new URL(location.href)
    if (page === 'today') url.searchParams.delete('page')
    else url.searchParams.set('page', page)
    if (date) url.searchParams.set('date', date)
    history.replaceState(null, '', url)
  }, [page, date])

  const value = useMemo<GymStore>(
    () => ({
      data: state.data,
      update,
      replace,
      undo,
      canUndo: state.hist.stack.length > 0,
      page,
      go,
      date,
      setDate,
    }),
    [state.data, state.hist.stack.length, update, replace, undo, page, go, date, setDate],
  )

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useGym(): GymStore {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useGym 必须在 GymProvider 内使用')
  return ctx
}
