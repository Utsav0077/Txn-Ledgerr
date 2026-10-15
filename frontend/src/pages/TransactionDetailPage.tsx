import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import * as api from '../services/api'
import type { Transaction, LedgerEntry } from '../types/api'
import { StatusDot, transactionStatusTone } from '../components/StatusDot'
import { TransactionFlowMini } from '../components/TransactionFlowMini'
import { formatCurrency } from '../utils/currency'

export function TransactionDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [transaction, setTransaction] = useState<Transaction | null>(null)
  const [ledgerEntries, setLedgerEntries] = useState<LedgerEntry[]>([])
  const [error, setError] = useState<string | null>(null)
  const [reversing, setReversing] = useState(false)
  const [currency, setCurrency] = useState<string | undefined>(undefined)

  async function load() {
    if (!id) return
    setError(null)
    try {
      const data = await api.getTransaction(id)
      if (data) {
        setTransaction(data.transaction)
        setLedgerEntries(data.ledgerEntries)

        // Currency lives on the Account, not the Transaction. The current user is
        // guaranteed to own at least one side of the transfer, so try both and use
        // whichever the backend actually lets us read - never invent a currency.
        const [fromDetail, toDetail] = await Promise.allSettled([
          api.getAccountDetail(data.transaction.fromAccount),
          api.getAccountDetail(data.transaction.toAccount),
        ])
        if (fromDetail.status === 'fulfilled' && fromDetail.value) {
          setCurrency(fromDetail.value.account.currency)
        } else if (toDetail.status === 'fulfilled' && toDetail.value) {
          setCurrency(toDetail.value.account.currency)
        }
      }
    } catch (e) {
      setError(e instanceof api.ApiError ? e.message : 'Failed to load transaction')
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  async function handleReverse() {
    if (!id) return
    setReversing(true)
    setError(null)
    try {
      await api.reverseTransaction(id)
      await load()
    } catch (e) {
      setError(e instanceof api.ApiError ? e.message : 'Reversal failed')
    } finally {
      setReversing(false)
    }
  }

  if (error && !transaction) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-12">
        <div className="rounded border border-[var(--red)]/40 bg-[var(--red-dim)] px-4 py-3 text-xs text-[var(--red)]">{error}</div>
      </div>
    )
  }

  if (!transaction) {
    return <div className="mx-auto max-w-3xl px-6 py-12 text-xs text-[var(--text-dim)]">Loading...</div>
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-12">
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <h1 className="font-mono text-lg font-bold">{transaction._id}</h1>
          <div className="mt-2">
            <StatusDot tone={transactionStatusTone(transaction.status)} label={transaction.status} />
          </div>
        </div>
        {transaction.status === 'COMPLETED' && (
          <button
            onClick={handleReverse}
            disabled={reversing}
            className="rounded border border-[var(--amber)]/50 px-3 py-1.5 text-[11px] uppercase tracking-wider text-[var(--amber)] hover:bg-[var(--amber-dim)] disabled:opacity-50"
          >
            {reversing ? 'Reversing...' : 'Reverse Transaction'}
          </button>
        )}
      </div>

      {error && (
        <div className="mb-6 rounded border border-[var(--red)]/40 bg-[var(--red-dim)] px-4 py-3 text-xs text-[var(--red)]">{error}</div>
      )}

      <div className="mb-10 grid grid-cols-2 gap-4 rounded border border-[var(--border)] bg-[var(--bg-raised)] p-6 text-xs sm:grid-cols-3">
        <Field label="Amount" value={formatCurrency(transaction.amount, currency)} />
        <Field label="Created" value={new Date(transaction.createdAt).toLocaleString()} />
        <Field label="Completed" value={new Date(transaction.updatedAt).toLocaleString()} />
        <Field label="Sender" value={transaction.fromAccount} mono />
        <Field label="Receiver" value={transaction.toAccount} mono />
        <Field label="Idempotency Key" value={transaction.idempotencyKey} mono />
        {transaction.description && <Field label="Description" value={transaction.description} />}
      </div>

      <h2 className="mb-6 text-center text-xs uppercase tracking-widest text-[var(--text-dim)]">Money Movement</h2>
      <TransactionFlowMini transaction={transaction} currency={currency} />

      {ledgerEntries.length > 0 && (
        <div className="mt-10">
          <h2 className="mb-3 text-xs uppercase tracking-widest text-[var(--text-dim)]">Ledger Entries</h2>
          <div className="overflow-hidden rounded border border-[var(--border)]">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[var(--border)] text-[10px] uppercase tracking-wider text-[var(--text-dim)]">
                  <th className="px-4 py-2">Account</th>
                  <th className="px-4 py-2">Type</th>
                  <th className="px-4 py-2">Amount</th>
                </tr>
              </thead>
              <tbody>
                {ledgerEntries.map((entry) => (
                  <tr key={entry._id} className="border-b border-[var(--border)] last:border-0">
                    <td className="px-4 py-2 font-mono text-[var(--text-dim)]">{entry.account}</td>
                    <td className={`px-4 py-2 font-bold ${entry.type === 'DEBIT' ? 'text-[var(--red)]' : 'text-[var(--green)]'}`}>
                      {entry.type}
                    </td>
                    <td className="px-4 py-2">{formatCurrency(entry.amount, currency)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

function Field({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wider text-[var(--text-faint)]">{label}</div>
      <div className={`mt-1 break-all ${mono ? 'font-mono text-[var(--text-dim)]' : 'text-[var(--text)]'}`}>{value}</div>
    </div>
  )
}
