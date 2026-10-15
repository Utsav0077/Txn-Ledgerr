/**
 * Centralized API client. Every HTTP call in the app goes through here —
 * no component talks to fetch()/axios directly. Auth token is stored in
 * memory + localStorage (the backend also sets an httpOnly-less cookie,
 * but we send the bearer token explicitly so the client works cross-origin
 * in dev without relying on cookies).
 */
import axios, { AxiosError } from 'axios'
import type {
  User,
  Account,
  AccountWithSummary,
  Transaction,
  LedgerEntry,
  Pagination,
  HealthResponse,
} from '../types/api'

const client = axios.create({
  baseURL: '/api',
  withCredentials: true,
})

const TOKEN_KEY = 'ledger_token'

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY)
}

export function setToken(token: string | null) {
  if (token) localStorage.setItem(TOKEN_KEY, token)
  else localStorage.removeItem(TOKEN_KEY)
}

client.interceptors.request.use((config) => {
  const token = getToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

/**
 * If the backend ever returns 401 (expired JWT, blacklisted/invalid token,
 * or the user no longer exists), the token in localStorage is now stale -
 * clear it immediately and tell the rest of the app so it can drop back to
 * the logged-out state instead of silently failing every subsequent call.
 */
export const UNAUTHORIZED_EVENT = 'ledger:unauthorized'

client.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error instanceof AxiosError && error.response?.status === 401 && getToken()) {
      setToken(null)
      window.dispatchEvent(new Event(UNAUTHORIZED_EVENT))
    }
    return Promise.reject(error)
  }
)

export class ApiError extends Error {
  status: number
  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

function unwrap(error: unknown): never {
  if (error instanceof AxiosError) {
    const status = error.response?.status ?? 0
    const message =
      error.response?.data?.message ||
      (status === 0 ? 'Cannot reach the Ledger API. Is the backend running?' : `Request failed (${status})`)
    throw new ApiError(status, message)
  }
  throw error
}

// ---- Auth ----

export async function register(email: string, password: string, name: string) {
  try {
    const { data } = await client.post<{ user: User; token: string }>('/auth/register', {
      email,
      password,
      name,
    })
    return data
  } catch (e) {
    unwrap(e)
  }
}

export async function login(email: string, password: string) {
  try {
    const { data } = await client.post<{ user: User; token: string }>('/auth/login', { email, password })
    return data
  } catch (e) {
    unwrap(e)
  }
}

export async function logout() {
  try {
    await client.post('/auth/logout')
  } catch (e) {
    unwrap(e)
  }
}

export async function getCurrentUser() {
  try {
    const { data } = await client.get<{ user: User }>('/auth/me')
    return data.user
  } catch (e) {
    unwrap(e)
  }
}

// ---- Accounts ----

export async function createAccount() {
  try {
    const { data } = await client.post<{ account: Account }>('/accounts')
    return data.account
  } catch (e) {
    unwrap(e)
  }
}

export async function getMyAccounts() {
  try {
    const { data } = await client.get<{ accounts: AccountWithSummary[] }>('/accounts')
    return data.accounts
  } catch (e) {
    unwrap(e)
  }
}

export async function getAccountDetail(accountId: string) {
  try {
    const { data } = await client.get<{ account: Account; summary: AccountWithSummary['summary'] }>(
      `/accounts/${accountId}`
    )
    return data
  } catch (e) {
    unwrap(e)
  }
}

// ---- Transactions ----

export interface ListTransactionsParams {
  page?: number
  limit?: number
  status?: string
  accountId?: string
}

export async function listTransactions(params: ListTransactionsParams = {}) {
  try {
    const { data } = await client.get<{ transactions: Transaction[]; pagination: Pagination }>('/transactions', {
      params,
    })
    return data
  } catch (e) {
    unwrap(e)
  }
}

export async function getTransaction(id: string) {
  try {
    const { data } = await client.get<{ transaction: Transaction; ledgerEntries: LedgerEntry[] }>(
      `/transactions/${id}`
    )
    return data
  } catch (e) {
    unwrap(e)
  }
}

export interface CreateTransactionInput {
  fromAccount: string
  toAccount: string
  amount: number
  description?: string
  idempotencyKey: string
}

export async function createTransaction(input: CreateTransactionInput) {
  try {
    const { data } = await client.post<{ message: string; transaction: Transaction }>('/transactions', input)
    return data
  } catch (e) {
    unwrap(e)
  }
}

export async function reverseTransaction(id: string) {
  try {
    const { data } = await client.post<{ message: string; transaction: Transaction }>(`/transactions/${id}/reverse`)
    return data
  } catch (e) {
    unwrap(e)
  }
}

// ---- Health ----

export async function getHealth() {
  try {
    const { data } = await client.get<HealthResponse>('/health')
    return data
  } catch (e) {
    unwrap(e)
  }
}
