type Tone = 'green' | 'amber' | 'red' | 'blue' | 'dim'

const TONE_MAP: Record<Tone, string> = {
  green: 'text-[var(--green)]',
  amber: 'text-[var(--amber)]',
  red: 'text-[var(--red)]',
  blue: 'text-[var(--blue)]',
  dim: 'text-[var(--text-faint)]',
}

export function StatusDot({ tone, label }: { tone: Tone; label: string }) {
  return (
    <span className={`inline-flex items-center gap-2 text-xs uppercase tracking-wider ${TONE_MAP[tone]}`}>
      <span className="scanline-dot inline-block h-1.5 w-1.5 rounded-full bg-current" />
      {label}
    </span>
  )
}

export function transactionStatusTone(status: string): Tone {
  switch (status) {
    case 'COMPLETED':
      return 'green'
    case 'PENDING':
      return 'amber'
    case 'FAILED':
      return 'red'
    case 'REVERSED':
      return 'blue'
    default:
      return 'dim'
  }
}
