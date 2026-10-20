import { lazy, Suspense } from 'react'
import { GymProvider, useGym } from './state/gym'
import { RestTimerProvider } from './components/RestTimer'
import { BottomNav } from './components/BottomNav'
import { ToastHost } from './ui/toast'
import { UndoHost } from './ui/Undo'
import { UpdatePrompt } from './ui/UpdatePrompt'
import { C } from './ui/tokens'
import { TodayPage } from './pages/TodayPage'
import { HistoryPage } from './pages/HistoryPage'
import { ProfilePage } from './pages/ProfilePage'
import { LibraryPage } from './pages/LibraryPage'
import { CultivationPage } from './pages/CultivationPage'

// 趋势页依赖图表库，单独拆包，首屏更快
const TrendsPage = lazy(() => import('./pages/TrendsPage').then((m) => ({ default: m.TrendsPage })))

function PageFallback() {
  return (
    <div style={{ padding: '80px 20px', textAlign: 'center', color: C.muted, fontSize: 13 }}>加载中…</div>
  )
}

function Router() {
  const { page } = useGym()
  return (
    <>
      {page === 'today' ? <TodayPage /> : null}
      {page === 'history' ? <HistoryPage /> : null}
      {page === 'trends' ? (
        <Suspense fallback={<PageFallback />}>
          <TrendsPage />
        </Suspense>
      ) : null}
      {page === 'library' ? <LibraryPage /> : null}
      {page === 'cultivation' ? <CultivationPage /> : null}
      {page === 'me' ? <ProfilePage /> : null}
    </>
  )
}

export default function App() {
  return (
    <GymProvider>
      <RestTimerProvider>
        <Router />
        <BottomNav />
        <ToastHost />
        <UndoHost />
        <UpdatePrompt />
      </RestTimerProvider>
    </GymProvider>
  )
}
