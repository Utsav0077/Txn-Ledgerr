import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import * as api from '../services/api'

export function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      await login(email, password)
      navigate('/')
    } catch (err) {
      setError(err instanceof api.ApiError ? err.message : 'Login failed')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-grid px-6">
      <div className="w-full max-w-sm rounded border border-[var(--border)] bg-[var(--bg-raised)] p-8">
        <div className="mb-8 text-center">
          <div className="text-xl font-bold tracking-tight">LEDGER</div>
          <div className="mt-1 text-[11px] uppercase tracking-widest text-[var(--text-dim)]">Sign in</div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-[11px] uppercase tracking-wider text-[var(--text-dim)]">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm outline-none focus:border-[var(--blue)]"
              placeholder="you@example.com"
            />
          </div>
          <div>
            <label className="mb-1 block text-[11px] uppercase tracking-wider text-[var(--text-dim)]">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm outline-none focus:border-[var(--blue)]"
              placeholder="••••••••"
            />
          </div>

          {error && <div className="rounded border border-[var(--red)]/40 bg-[var(--red-dim)] px-3 py-2 text-xs text-[var(--red)]">{error}</div>}

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded bg-[var(--blue)] px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-white transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {submitting ? 'Signing in...' : 'Sign In →'}
          </button>
        </form>

        <div className="mt-6 text-center text-xs text-[var(--text-dim)]">
          No account?{' '}
          <Link to="/register" className="text-[var(--blue)] hover:underline">
            Register
          </Link>
        </div>
      </div>
    </div>
  )
}
