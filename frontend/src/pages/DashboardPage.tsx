import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import * as api from '../services/api'
import type { AccountWithSummary } from '../types/api'
import { MetricCard } from '../components/Card'
import { LedgerFlowDiagram } from '../components/LedgerFlowDiagram'
import { Globe } from '../components/Globe'
import { formatCurrency } from '../utils/currency'

interface CurrencyTotals {
  balance: number
  credits: number
  debits: number
  txns: number
}

export function DashboardPage() {
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

  async function handleCreateAccount() {
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

  // Accounts can (in principle) carry different currencies, so totals are
  // grouped per currency rather than summed together - summing ₹ and $
  // into one number would be meaningless.
  const totalsByCurrency = (accounts ?? []).reduce<Record<string, CurrencyTotals>>((acc, a) => {
    const currency = a.account.currency
    const existing = acc[currency] ?? { balance: 0, credits: 0, debits: 0, txns: 0 }
    acc[currency] = {
      balance: existing.balance + a.summary.balance,
      credits: existing.credits + a.summary.totalCredit,
      debits: existing.debits + a.summary.totalDebit,
      txns: existing.txns + a.summary.transactionCount,
    }
    return acc
  }, {})

  const currencies = Object.keys(totalsByCurrency)

  return (
    <div className="w-full px-6 py-12">
      {/* Hero */}
      <div className="relative mx-auto max-w-6xl border-b border-[var(--border)] pb-12">
        <div className="flex flex-col md:flex-row items-start gap-8">
          <div className="flex-1">
            <div className="mb-4 text-[11px] uppercase tracking-widest text-[var(--text-dim)]">
              /api/v1 · Node.js · MongoDB
            </div>
            <h1 className="text-4xl font-bold leading-tight tracking-tight sm:text-5xl">
              FINANCIAL
              <br />
              INFRASTRUCTURE,
              <br />
              BUILT FOR
              <br />
              ACCOUNTABILITY.
            </h1>
            <p className="mt-6 max-w-xl text-sm leading-relaxed text-[var(--text-dim)]">
              A transaction ledger that records account-level money movement through immutable
              debit and credit entries.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                to="/transactions"
                className="rounded bg-[var(--blue)] px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-white hover:opacity-90"
              >
                View Transactions →
              </Link>
              <Link
                to="/health"
                className="rounded border border-[var(--border)] px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-[var(--text-dim)] hover:border-[var(--border-strong)] hover:text-[var(--text)]"
              >
                Check System Health
              </Link>
            </div>
          </div>
          <div className="hidden md:block flex-shrink-0 w-[400px]"></div>
        </div>
        {/* Globe Container - positioned absolutely outside the max-w-6xl container */}
        <div className="absolute top-0 right-0 h-full w-[600px] pointer-events-none overflow-hidden">
          <Globe />
        </div>
      </div>

      {error && (
        <div className="mt-6 rounded border border-[var(--red)]/40 bg-[var(--red-dim)] px-4 py-3 text-xs text-[var(--red)]">
          {error}
        </div>
      )}

      {/* Metrics */}
      <div className="mt-12">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xs uppercase tracking-widest text-[var(--text-dim)]">Dashboard Metrics</h2>
          <button
            onClick={handleCreateAccount}
            disabled={creating}
            className="rounded border border-[var(--border)] px-3 py-1.5 text-[11px] uppercase tracking-wider text-[var(--text-dim)] hover:border-[var(--blue)] hover:text-[var(--blue)] disabled:opacity-50"
          >
            {creating ? 'Creating...' : '+ New Account'}
          </button>
        </div>

        {accounts === null ? (
          <div className="text-xs text-[var(--text-dim)]">Loading...</div>
        ) : accounts.length === 0 ? (
          <div className="rounded border border-dashed border-[var(--border)] p-8 text-center text-sm text-[var(--text-dim)]">
            No accounts yet. Create one to start moving money.
          </div>
        ) : (
          <div className="space-y-6">
            {currencies.map((currency) => (
              <div key={currency}>
                {currencies.length > 1 && (
                  <div className="mb-2 text-[10px] uppercase tracking-widest text-[var(--text-faint)]">{currency}</div>
                )}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <MetricCard
                    label="Current Balance"
                    value={formatCurrency(totalsByCurrency[currency].balance, currency)}
                    live
                    tone="text-[var(--blue)]"
                  />
                  <MetricCard
                    label="Total Credits"
                    value={formatCurrency(totalsByCurrency[currency].credits, currency)}
                    tone="text-[var(--green)]"
                  />
                  <MetricCard
                    label="Total Debits"
                    value={formatCurrency(totalsByCurrency[currency].debits, currency)}
                    tone="text-[var(--red)]"
                  />
                  <MetricCard label="Transactions" value={String(totalsByCurrency[currency].txns)} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Flow visualization */}
      <div className="mt-16 border-t border-[var(--border)] pt-12">
        <h2 className="mb-2 text-center text-xs uppercase tracking-widest text-[var(--text-dim)]">
          Ledger Architecture
        </h2>
        <p className="mb-8 text-center text-[11px] text-[var(--text-faint)]">
          Conceptual visualization of the real system
        </p>
        <LedgerFlowDiagram />
      </div>
    </div>
  )
}
