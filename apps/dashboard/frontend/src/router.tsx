import { Routes, Route } from 'react-router-dom'
import { DashboardPage } from './pages/DashboardPage'
import { JobsPage } from './pages/JobsPage'
import { JobDetailPage } from './pages/JobDetailPage'
import { KnowledgePage } from './pages/KnowledgePage'
import { KnowledgeDetailPage } from './pages/KnowledgeDetailPage'
import { MedicationPage } from './pages/MedicationPage'

export function AppRouter() {
  return (
    <Routes>
      <Route path="/" element={<DashboardPage />} />
      <Route path="/jobs" element={<JobsPage />} />
      <Route path="/jobs/:id" element={<JobDetailPage />} />
      <Route path="/knowledge" element={<KnowledgePage />} />
      <Route path="/knowledge/:id" element={<KnowledgeDetailPage />} />
      <Route path="/medication" element={<MedicationPage />} />
    </Routes>
  )
}
