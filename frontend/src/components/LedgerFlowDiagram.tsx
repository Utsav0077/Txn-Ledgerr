/**
 * Conceptual visualization of the real Ledger architecture:
 * ACCOUNT -> TRANSACTION -> (DEBIT + CREDIT) -> LEDGER -> BALANCE
 */
export function LedgerFlowDiagram() {
  const nodeStyle = 'fill-[var(--bg-raised)] stroke-[var(--border-strong)]'
  const textStyle = 'fill-[var(--text)] text-[11px] font-bold uppercase tracking-wider'
  const labelStyle = 'fill-[var(--text-faint)] text-[9px] uppercase tracking-widest'

  return (
    <svg viewBox="0 0 720 420" className="mx-auto w-full max-w-2xl" role="img" aria-label="Ledger data flow diagram">
      <defs>
        <marker id="arrow" markerWidth="8" markerHeight="8" refX="4" refY="4" orient="auto">
          <path d="M0,0 L8,4 L0,8 Z" className="fill-[var(--border-strong)]" />
        </marker>
      </defs>

      {/* ACCOUNT */}
      <rect x="290" y="10" width="140" height="48" rx="4" className={nodeStyle} strokeWidth="1" />
      <text x="360" y="39" textAnchor="middle" className={textStyle}>ACCOUNT</text>
      <line x1="360" y1="58" x2="360" y2="90" stroke="currentColor" className="text-[var(--border-strong)]" markerEnd="url(#arrow)" />

      {/* TRANSACTION */}
      <rect x="270" y="92" width="180" height="48" rx="4" className={nodeStyle} strokeWidth="1" />
      <text x="360" y="121" textAnchor="middle" className={textStyle}>TRANSACTION</text>
      <text x="360" y="76" textAnchor="middle" className={labelStyle}>opens</text>

      {/* Split lines to DEBIT / CREDIT */}
      <path d="M330,140 L330,160 L200,160 L200,182" fill="none" stroke="currentColor" className="text-[var(--border-strong)]" markerEnd="url(#arrow)" />
      <path d="M390,140 L390,160 L520,160 L520,182" fill="none" stroke="currentColor" className="text-[var(--border-strong)]" markerEnd="url(#arrow)" />

      {/* DEBIT */}
      <rect x="120" y="184" width="160" height="48" rx="4" className={nodeStyle} strokeWidth="1" />
      <text x="200" y="213" textAnchor="middle" className={`${textStyle} fill-[var(--red)]`}>DEBIT</text>

      {/* CREDIT */}
      <rect x="440" y="184" width="160" height="48" rx="4" className={nodeStyle} strokeWidth="1" />
      <text x="520" y="213" textAnchor="middle" className={`${textStyle} fill-[var(--green)]`}>CREDIT</text>

      {/* Merge into LEDGER */}
      <path d="M200,232 L200,260 L360,260 L360,272" fill="none" stroke="currentColor" className="text-[var(--border-strong)]" />
      <path d="M520,232 L520,260 L360,260 L360,272" fill="none" stroke="currentColor" className="text-[var(--border-strong)]" markerEnd="url(#arrow)" />

      {/* LEDGER */}
      <rect x="270" y="274" width="180" height="48" rx="4" className={nodeStyle} strokeWidth="1" />
      <text x="360" y="303" textAnchor="middle" className={textStyle}>LEDGER</text>
      <text x="360" y="266" textAnchor="middle" className={labelStyle}>immutable entries</text>
      <line x1="360" y1="322" x2="360" y2="354" stroke="currentColor" className="text-[var(--border-strong)]" markerEnd="url(#arrow)" />

      {/* BALANCE */}
      <rect x="270" y="356" width="180" height="48" rx="4" className={`${nodeStyle}`} strokeWidth="1" />
      <text x="360" y="385" textAnchor="middle" className={`${textStyle} fill-[var(--blue)]`}>BALANCE</text>
      <text x="360" y="416" textAnchor="middle" className={labelStyle}>derived, never stored</text>
    </svg>
  )
}
