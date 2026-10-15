import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import * as api from '../services/api'
import type { Transaction, Pagination } from '../types/api'
import { StatusDot, transactionStatusTone } from '../components/StatusDot'
import { formatCurrency, buildCurrencyMap } from '../utils/currency'

const STATUS_FILTERS = ['ALL', 'PENDING', 'COMPLETED', 'FAILED', 'REVERSED'] as const

export function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[] | null>(null)
  const [pagination, setPagination] = useState<Pagination | null>(null)
  const [page, setPage] = useState(1)
  const [status, setStatus] = useState<(typeof STATUS_FILTERS)[number]>('ALL')
  const [error, setError] = useState<string | null>(null)
  const [currencyMap, setCurrencyMap] = useState<Map<string, string>>(new Map())

  useEffect(() => {
    api.getMyAccounts().then((accounts) => {
      if (accounts) setCurrencyMap(buildCurrencyMap(accounts.map((a) => a.account)))
    })
  }, [])

  async function load() {
    setError(null)
    try {
      const data = await api.listTransactions({ page, limit: 20, status: status === 'ALL' ? undefined : status })
      if (data) {
        setTransactions(data.transactions)
        setPagination(data.pagination)
      }
    } catch (e) {
      setError(e instanceof api.ApiError ? e.message : 'Failed to load transactions')
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, status])

  return (
    <div className="mx-auto max-w-6xl px-6 py-12">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">TRANSACTIONS</h1>
          <p className="mt-1 text-xs text-[var(--text-dim)]">Complete financial movement history.</p>
        </div>
        <Link
          to="/transactions/new"
          className="rounded bg-[var(--blue)] px-4 py-2 text-xs font-bold uppercase tracking-wider text-white hover:opacity-90"
        >
          Create Transaction →
        </Link>
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        {STATUS_FILTERS.map((s) => (
          <button
            key={s}
            onClick={() => {
              setStatus(s)
              setPage(1)
            }}
            className={`rounded border px-3 py-1.5 text-[11px] uppercase tracking-wider transition-colors ${
              status === s
                ? 'border-[var(--blue)] text-[var(--blue)]'
                : 'border-[var(--border)] text-[var(--text-dim)] hover:border-[var(--border-strong)]'
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      {error && (
        <div className="mb-4 rounded border border-[var(--red)]/40 bg-[var(--red-dim)] px-4 py-3 text-xs text-[var(--red)]">
          {error}
        </div>
      )}

      {transactions === null ? (
        <div className="text-xs text-[var(--text-dim)]">Loading...</div>
      ) : transactions.length === 0 ? (
        <div className="rounded border border-dashed border-[var(--border)] p-8 text-center text-sm text-[var(--text-dim)]">
          No transactions match this filter.
        </div>
      ) : (
        <div className="overflow-x-auto rounded border border-[var(--border)]">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[var(--border)] text-[10px] uppercase tracking-wider text-[var(--text-dim)]">
                <th className="px-4 py-3">Transaction ID</th>
                <th className="px-4 py-3">Amount</th>
                <th className="px-4 py-3">From</th>
                <th className="px-4 py-3">To</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Timestamp</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((t) => (
                <tr key={t._id} className="border-b border-[var(--border)] last:border-0 hover:bg-white/[0.02]">
                  <td className="px-4 py-3">
                    <Link to={`/transactions/${t._id}`} className="text-[var(--blue)] hover:underline">
                      {t._id.slice(-10)}
                    </Link>
                  </td>
                  <td className="px-4 py-3 font-bold">
                    {formatCurrency(t.amount, currencyMap.get(t.fromAccount) ?? currencyMap.get(t.toAccount))}
                  </td>
                  <td className="px-4 py-3 text-[var(--text-dim)]">{t.fromAccount.slice(-8)}</td>
                  <td className="px-4 py-3 text-[var(--text-dim)]">{t.toAccount.slice(-8)}</td>
                  <td className="px-4 py-3">
                    <StatusDot tone={transactionStatusTone(t.status)} label={t.status} />
                  </td>
                  <td className="px-4 py-3 text-[var(--text-dim)]">{new Date(t.createdAt).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {pagination && pagination.totalPages > 1 && (
        <div className="mt-4 flex items-center justify-center gap-4 text-xs text-[var(--text-dim)]">
          <button
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
            className="rounded border border-[var(--border)] px-3 py-1.5 disabled:opacity-30"
          >
            ← Prev
          </button>
          <span>
            Page {pagination.page} / {pagination.totalPages}
          </span>
          <button
            disabled={page >= pagination.totalPages}
            onClick={() => setPage((p) => p + 1)}
            className="rounded border border-[var(--border)] px-3 py-1.5 disabled:opacity-30"
          >
            Next →
          </button>
        </div>
      )}
    </div>
  )
}
