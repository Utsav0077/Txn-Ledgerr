import { useEffect, useState } from 'react'
import * as api from '../services/api'
import type { AccountWithSummary } from '../types/api'
import { Card } from '../components/Card'
import { StatusDot } from '../components/StatusDot'
import { formatCurrency } from '../utils/currency'

export function AccountsPage() {
  const [accounts, setAccounts] = useState<AccountWithSummary[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)

  async function load() {
    setError(null)
    try {
      const data = await api.getMyAccounts()
      setAccounts(data ?? [])
    } catch (e) {
      setError(e instanceof api.ApiError ? e.message : 'Failed to load accounts')
    }
  }

  useEffect(() => {
    load()
  }, [])

  async function handleCreate() {
    setCreating(true)
    try {
      await api.createAccount()
      await load()
    } catch (e) {
      setError(e instanceof api.ApiError ? e.message : 'Failed to create account')
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-6 py-12">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <h1 className="text-2xl font-bold tracking-tight">ACCOUNTS</h1>
        <button
          onClick={handleCreate}
          disabled={creating}
          className="rounded bg-[var(--blue)] px-4 py-2 text-xs font-bold uppercase tracking-wider text-white hover:opacity-90 disabled:opacity-50"
        >
          {creating ? 'Creating...' : '+ New Account'}
        </button>
      </div>

      {error && (
        <div className="mb-6 rounded border border-[var(--red)]/40 bg-[var(--red-dim)] px-4 py-3 text-xs text-[var(--red)]">{error}</div>
      )}

      {accounts === null ? (
        <div className="text-xs text-[var(--text-dim)]">Loading...</div>
      ) : accounts.length === 0 ? (
        <div className="rounded border border-dashed border-[var(--border)] p-8 text-center text-sm text-[var(--text-dim)]">
          No accounts yet.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {accounts.map(({ account, summary }) => (
            <Card key={account._id}>
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-[10px] uppercase tracking-wider text-[var(--text-faint)]">Account</div>
                  <div className="font-mono text-sm">{account._id}</div>
                </div>
                <StatusDot tone={account.status === 'ACTIVE' ? 'green' : account.status === 'FROZEN' ? 'amber' : 'red'} label={account.status} />
              </div>

              <div className="mt-4 text-[10px] uppercase tracking-wider text-[var(--text-faint)]">Balance</div>
              <div className="text-2xl font-bold text-[var(--blue)]">{formatCurrency(summary.balance, account.currency)}</div>

              <div className="mt-4 grid grid-cols-3 gap-2 border-t border-[var(--border)] pt-4 text-center">
                <div>
                  <div className="text-[10px] uppercase tracking-wider text-[var(--text-faint)]">Credits</div>
                  <div className="mt-1 text-sm font-bold text-[var(--green)]">{formatCurrency(summary.totalCredit, account.currency)}</div>
                </div>
                <div>
                  <div className="text-[10px] uppercase tracking-wider text-[var(--text-faint)]">Debits</div>
                  <div className="mt-1 text-sm font-bold text-[var(--red)]">{formatCurrency(summary.totalDebit, account.currency)}</div>
                </div>
                <div>
                  <div className="text-[10px] uppercase tracking-wider text-[var(--text-faint)]">Txns</div>
                  <div className="mt-1 text-sm font-bold">{summary.transactionCount}</div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
