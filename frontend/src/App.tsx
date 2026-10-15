import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './hooks/useAuth'
import { ProtectedRoute } from './components/ProtectedRoute'
import { Header } from './components/Header'
import { LoginPage } from './pages/LoginPage'
import { RegisterPage } from './pages/RegisterPage'
import { DashboardPage } from './pages/DashboardPage'
import { TransactionsPage } from './pages/TransactionsPage'
import { CreateTransactionPage } from './pages/CreateTransactionPage'
import { TransactionDetailPage } from './pages/TransactionDetailPage'
import { AccountsPage } from './pages/AccountsPage'
import { ApiPage } from './pages/ApiPage'
import { HealthPage } from './pages/HealthPage'

function AppShell() {
  const { user } = useAuth()

  return (
    <div className="min-h-screen bg-grid">
      {user && <Header />}
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        <Route element={<ProtectedRoute />}>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/transactions" element={<TransactionsPage />} />
          <Route path="/transactions/new" element={<CreateTransactionPage />} />
          <Route path="/transactions/:id" element={<TransactionDetailPage />} />
          <Route path="/accounts" element={<AccountsPage />} />
          <Route path="/api" element={<ApiPage />} />
          <Route path="/health" element={<HealthPage />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppShell />
      </AuthProvider>
    </BrowserRouter>
  )
}
