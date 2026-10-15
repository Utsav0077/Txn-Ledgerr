interface Endpoint {
  method: 'GET' | 'POST'
  path: string
  description: string
  auth: string
}

const ENDPOINTS: Endpoint[] = [
  { method: 'POST', path: '/api/auth/register', description: 'Register a new user and receive a JWT.', auth: 'Public' },
  { method: 'POST', path: '/api/auth/login', description: 'Authenticate and receive a JWT.', auth: 'Public' },
  { method: 'POST', path: '/api/auth/logout', description: 'Blacklist the current token.', auth: 'Bearer / Cookie' },
  { method: 'GET', path: '/api/auth/me', description: 'Get the current authenticated user.', auth: 'Bearer / Cookie' },
  { method: 'POST', path: '/api/accounts', description: 'Create a new account for the current user.', auth: 'Bearer / Cookie' },
  { method: 'GET', path: '/api/accounts', description: "List the current user's accounts with derived balances.", auth: 'Bearer / Cookie' },
  { method: 'GET', path: '/api/accounts/:accountId', description: 'Full detail + summary for one owned account.', auth: 'Bearer / Cookie' },
  { method: 'GET', path: '/api/accounts/balance/:accountId', description: 'Balance for one owned account.', auth: 'Bearer / Cookie' },
  { method: 'POST', path: '/api/transactions', description: 'Create a transfer between two accounts (idempotent).', auth: 'Bearer / Cookie' },
  { method: 'GET', path: '/api/transactions', description: "Paginated history for the user's accounts. Query: page, limit, status, accountId", auth: 'Bearer / Cookie' },
  { method: 'GET', path: '/api/transactions/:id', description: 'Transaction detail including its ledger entries.', auth: 'Bearer / Cookie' },
  { method: 'POST', path: '/api/transactions/:id/reverse', description: 'Reverse a COMPLETED transaction via compensating entries.', auth: 'Bearer / Cookie' },
  { method: 'POST', path: '/api/transactions/system/initial-funds', description: 'Seed an account from the system account.', auth: 'System user only' },
  { method: 'GET', path: '/api/health', description: 'Real API + database connectivity status.', auth: 'Public' },
]

export function ApiPage() {
  return (
    <div className="mx-auto max-w-4xl px-6 py-12">
      <h1 className="text-2xl font-bold tracking-tight">API</h1>
      <p className="mt-1 mb-8 text-xs text-[var(--text-dim)]">Live backend routes. Nothing here is invented.</p>

      <div className="divide-y divide-[var(--border)] rounded border border-[var(--border)]">
        {ENDPOINTS.map((e) => (
          <div key={e.method + e.path} className="flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:gap-6">
            <span
              className={`w-14 shrink-0 rounded px-2 py-1 text-center text-[10px] font-bold uppercase tracking-wider ${
                e.method === 'GET' ? 'bg-[var(--blue-dim)] text-[var(--blue)]' : 'bg-[var(--green-dim)] text-[var(--green)]'
              }`}
            >
              {e.method}
            </span>
            <span className="w-full shrink-0 font-mono text-sm sm:w-72">{e.path}</span>
            <span className="text-xs text-[var(--text-dim)]">{e.description}</span>
            <span className="shrink-0 text-[10px] uppercase tracking-wider text-[var(--text-faint)] sm:ml-auto">{e.auth}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
