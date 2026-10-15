import type { Transaction } from '../types/api'
import { formatCurrency } from '../utils/currency'

/**
 * Small linear flow used on the transaction detail page:
 * SENDER -> DEBIT -> TRANSACTION -> CREDIT -> RECEIVER
 */
export function TransactionFlowMini({ transaction, currency }: { transaction: Transaction; currency?: string }) {
  const steps = [
    { label: 'SENDER ACCOUNT', sub: transaction.fromAccount.slice(-8), tone: 'text-[var(--text)]' },
    { label: 'DEBIT', sub: `- ${formatCurrency(transaction.amount, currency)}`, tone: 'text-[var(--red)]' },
    { label: 'TRANSACTION', sub: transaction.status, tone: 'text-[var(--text)]' },
    { label: 'CREDIT', sub: `+ ${formatCurrency(transaction.amount, currency)}`, tone: 'text-[var(--green)]' },
    { label: 'RECEIVER ACCOUNT', sub: transaction.toAccount.slice(-8), tone: 'text-[var(--text)]' },
  ]

  return (
    <div className="flex flex-col gap-0">
      {steps.map((step, i) => (
        <div key={step.label} className="flex flex-col items-center">
          <div className="w-full max-w-sm rounded border border-[var(--border)] bg-[var(--bg-raised)] px-4 py-3 text-center">
            <div className={`text-xs font-bold uppercase tracking-wider ${step.tone}`}>{step.label}</div>
            <div className="mt-1 font-mono text-[11px] text-[var(--text-dim)]">{step.sub}</div>
          </div>
          {i < steps.length - 1 && <div className="h-6 w-px bg-[var(--border-strong)]" />}
        </div>
      ))}
    </div>
  )
}
