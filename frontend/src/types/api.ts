export type AccountStatus = 'ACTIVE' | 'FROZEN' | 'CLOSED'
export type TransactionStatus = 'PENDING' | 'COMPLETED' | 'FAILED' | 'REVERSED'
export type LedgerEntryType = 'DEBIT' | 'CREDIT'

export interface User {
  _id: string
  email: string
  name: string
}

export interface Account {
  _id: string
  user: string
  status: AccountStatus
  currency: string
  createdAt: string
  updatedAt: string
}

export interface AccountSummary {
  balance: number
  totalCredit: number
  totalDebit: number
  transactionCount: number
}

export interface AccountWithSummary {
  account: Account
  summary: AccountSummary
}

export interface Transaction {
  _id: string
  fromAccount: string
  toAccount: string
  amount: number
  status: TransactionStatus
  idempotencyKey: string
  description?: string
  createdAt: string
  updatedAt: string
}

export interface LedgerEntry {
  _id: string
  account: string
  amount: number
  transaction: string
  type: LedgerEntryType
}

export interface Pagination {
  page: number
  limit: number
  total: number
  totalPages: number
}

export interface HealthResponse {
  status: 'OPERATIONAL' | 'DEGRADED'
  checks: {
    api: string
    database: string
  }
  timestamp: string
}

export interface ApiErrorBody {
  message: string
}
