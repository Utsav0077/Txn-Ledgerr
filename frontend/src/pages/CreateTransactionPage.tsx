import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import * as api from '../services/api'
import type { AccountWithSummary } from '../types/api'
import { formatCurrency } from '../utils/currency'

function generateIdempotencyKey() {
  return `web-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
}

export function CreateTransactionPage() {
  const navigate = useNavigate()
  const [accounts, setAccounts] = useState<AccountWithSummary[]>([])
  const [fromAccount, setFromAccount] = useState('')
  const [toAccount, setToAccount] = useState('')
  const [amount, setAmount] = useState('')
  const [description, setDescription] = useState('')
  const [idempotencyKey, setIdempotencyKey] = useState(generateIdempotencyKey())
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<{ id: string; status: string } | null>(null)

  useEffect(() => {
    api.getMyAccounts().then((data) => {
      if (data) {
        setAccounts(data)
        if (data[0]) setFromAccount(data[0].account._id)
      }
    })
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    setSubmitting(true)
    try {
      const result = await api.createTransaction({
        fromAccount,
        toAccount,
        amount: parseFloat(amount),
        description: description || undefined,
        idempotencyKey,
      })
      if (result) {
        setSuccess({ id: result.transaction._id, status: result.transaction.status })
        setIdempotencyKey(generateIdempotencyKey())
      }
    } catch (err) {
      setError(err instanceof api.ApiError ? err.message : 'Transaction failed')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="mx-auto max-w-lg px-6 py-12">
      <h1 className="text-2xl font-bold tracking-tight">CREATE TRANSACTION</h1>
      <p className="mt-1 mb-8 text-xs text-[var(--text-dim)]">Move funds between two active accounts.</p>

      <form onSubmit={handleSubmit} className="space-y-4 rounded border border-[var(--border)] bg-[var(--bg-raised)] p-6">
        <div>
          <label className="mb-1 block text-[11px] uppercase tracking-wider text-[var(--text-dim)]">From Account</label>
          <select
            required
            value={fromAccount}
            onChange={(e) => setFromAccount(e.target.value)}
            className="w-full rounded border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm outline-none focus:border-[var(--blue)]"
          >
            <option value="" disabled>Select an owned account</option>
            {accounts.map((a) => (
              <option key={a.account._id} value={a.account._id}>
                {a.account._id?.slice(-10) || 'Unknown'} · {formatCurrency(a.summary.balance, a.account.currency)}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-[11px] uppercase tracking-wider text-[var(--text-dim)]">To Account</label>
          <input
            required
            value={toAccount}
            onChange={(e) => setToAccount(e.target.value)}
            placeholder="Recipient account ID"
            className="w-full rounded border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm font-mono outline-none focus:border-[var(--blue)]"
          />
        </div>

        <div>
          <label className="mb-1 block text-[11px] uppercase tracking-wider text-[var(--text-dim)]">Amount</label>
          <input
            required
            type="number"
            min="0.01"
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            className="w-full rounded border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm outline-none focus:border-[var(--blue)]"
          />
        </div>

        <div>
          <label className="mb-1 block text-[11px] uppercase tracking-wider text-[var(--text-dim)]">Description</label>
          <input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Optional note"
            className="w-full rounded border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm outline-none focus:border-[var(--blue)]"
          />
        </div>

        <div>
          <label className="mb-1 block text-[11px] uppercase tracking-wider text-[var(--text-dim)]">Idempotency Key</label>
          <input
            value={idempotencyKey}
            onChange={(e) => setIdempotencyKey(e.target.value)}
            className="w-full rounded border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm font-mono text-[var(--text-dim)] outline-none focus:border-[var(--blue)]"
          />
        </div>

        {error && (
          <div className="rounded border border-[var(--red)]/40 bg-[var(--red-dim)] px-3 py-2 text-xs text-[var(--red)]">{error}</div>
        )}
        {success && (
          <div className="rounded border border-[var(--green)]/40 bg-[var(--green-dim)] px-3 py-2 text-xs text-[var(--green)]">
            Created {success.id.slice(-10)} — {success.status}.{' '}
            <button type="button" onClick={() => navigate(`/transactions/${success.id}`)} className="underline">
              View details →
            </button>
          </div>
        )}

        <button
          type="submit"
          disabled={submitting || !fromAccount}
          className="w-full rounded bg-[var(--blue)] px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-white transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {submitting ? 'Processing...' : 'Execute Transaction →'}
        </button>
      </form>
    </div>
  )
}
