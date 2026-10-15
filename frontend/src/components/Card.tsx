import type { ReactNode } from 'react'

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={`rounded border border-[var(--border)] bg-[var(--bg-raised)] p-6 ${className}`}>{children}</div>
  )
}

export function MetricCard({
  label,
  value,
  live,
  tone = 'text-[var(--text)]',
}: {
  label: string
  value: string
  live?: boolean
  tone?: string
}) {
  return (
    <Card>
      <div className="text-[11px] uppercase tracking-wider text-[var(--text-dim)]">{label}</div>
      <div className={`mt-2 text-2xl font-bold ${tone}`}>{value}</div>
      {live && (
        <div className="mt-2 flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-[var(--green)]">
          <span className="scanline-dot inline-block h-1.5 w-1.5 rounded-full bg-current" />
          Live
        </div>
      )}
    </Card>
  )
}
