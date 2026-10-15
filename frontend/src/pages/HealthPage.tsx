import { useEffect, useState } from 'react'
import * as api from '../services/api'
import type { HealthResponse } from '../types/api'
import { StatusDot } from '../components/StatusDot'

export function HealthPage() {
  const [health, setHealth] = useState<HealthResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function load() {
    setLoading(true)
    setError(null)
    try {
      const data = await api.getHealth()
      setHealth(data ?? null)
    } catch (e) {
      setError(e instanceof api.ApiError ? e.message : 'Backend unreachable')
      setHealth(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  return (
    <div className="mx-auto max-w-2xl px-6 py-12">
      <div className="mb-8 flex items-end justify-between">
        <h1 className="text-2xl font-bold tracking-tight">SYSTEM STATUS</h1>
        <button
          onClick={load}
          disabled={loading}
          className="rounded border border-[var(--border)] px-3 py-1.5 text-[11px] uppercase tracking-wider text-[var(--text-dim)] hover:text-[var(--text)]"
        >
          {loading ? 'Checking...' : 'Refresh'}
        </button>
      </div>

      {error && (
        <div className="mb-6 rounded border border-[var(--red)]/40 bg-[var(--red-dim)] px-4 py-3 text-xs text-[var(--red)]">{error}</div>
      )}

      <div className="divide-y divide-[var(--border)] rounded border border-[var(--border)] bg-[var(--bg-raised)]">
        <Row label="API" value={health?.checks.api ?? 'UNKNOWN'} ok={health?.checks.api === 'OPERATIONAL'} />
        <Row label="DATABASE" value={health?.checks.database ?? 'UNKNOWN'} ok={health?.checks.database === 'CONNECTED'} />
      </div>

      {health && (
        <div className="mt-4 text-[11px] text-[var(--text-faint)]">
          Last checked {new Date(health.timestamp).toLocaleString()}
        </div>
      )}
    </div>
  )
}

function Row({ label, value, ok }: { label: string; value: string; ok: boolean }) {
  return (
    <div className="flex items-center justify-between px-6 py-4">
      <span className="text-xs uppercase tracking-wider text-[var(--text-dim)]">{label}</span>
      <StatusDot tone={ok ? 'green' : 'red'} label={value} />
    </div>
  )
}
