import { NavLink, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { getHealth } from '../services/api'
import { StatusDot } from './StatusDot'

const NAV_ITEMS = [
  { to: '/', label: 'Dashboard', end: true },
  { to: '/transactions', label: 'Transactions' },
  { to: '/accounts', label: 'Accounts' },
  { to: '/api', label: 'API' },
  { to: '/health', label: 'Health' },
]

export function Header() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [operational, setOperational] = useState<boolean | null>(null)

  async function refresh() {
    setOperational(null)
    const health = await getHealth().catch(() => null)
    setOperational(health?.status === 'OPERATIONAL')
  }

  useEffect(() => {
    refresh()
  }, [])

  return (
    <header className="sticky top-0 z-20 border-b border-[var(--border)] bg-[var(--bg)]/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-6 px-6 py-4">
        <NavLink to="/" className="shrink-0">
          <div className="text-lg font-bold tracking-tight">LEDGER</div>
          <div className="text-[11px] text-[var(--text-dim)]">Financial transaction infrastructure</div>
        </NavLink>

        {user && (
          <nav className="hidden flex-1 items-center gap-6 md:flex">
            {NAV_ITEMS.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `border-b-2 pb-1 text-xs uppercase tracking-wider transition-colors ${
                    isActive
                      ? 'border-[var(--blue)] text-[var(--text)]'
                      : 'border-transparent text-[var(--text-dim)] hover:text-[var(--text)]'
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
        )}

        <div className="flex shrink-0 items-center gap-4">
          {operational === null ? (
            <StatusDot tone="dim" label="CHECKING" />
          ) : (
            <StatusDot tone={operational ? 'green' : 'red'} label={operational ? 'OPERATIONAL' : 'DEGRADED'} />
          )}
          <button
            onClick={refresh}
            className="rounded border border-[var(--border)] px-3 py-1.5 text-xs uppercase tracking-wider text-[var(--text-dim)] transition-colors hover:border-[var(--border-strong)] hover:text-[var(--text)]"
          >
            Refresh
          </button>
          {user ? (
            <button
              onClick={() => {
                logout()
                navigate('/login')
              }}
              className="rounded border border-[var(--border)] px-3 py-1.5 text-xs uppercase tracking-wider text-[var(--text-dim)] transition-colors hover:border-[var(--red)] hover:text-[var(--red)]"
            >
              Logout
            </button>
          ) : null}
        </div>
      </div>
    </header>
  )
}
