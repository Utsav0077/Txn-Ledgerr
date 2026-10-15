import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import type { User } from '../types/api'
import * as api from '../services/api'

interface AuthContextValue {
  user: User | null
  loading: boolean
  error: string | null
  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string, name: string) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const token = api.getToken()
    if (!token) {
      setLoading(false)
      return
    }
    api
      .getCurrentUser()
      .then((u) => setUser(u ?? null))
      .catch(() => api.setToken(null))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    // Fired by the api.ts response interceptor whenever the backend returns
    // 401 (expired JWT, blacklisted token, or the user no longer exists).
    // Drop back to the logged-out state immediately instead of leaving the
    // UI in a broken half-authenticated limbo.
    function handleUnauthorized() {
      setUser(null)
    }
    window.addEventListener(api.UNAUTHORIZED_EVENT, handleUnauthorized)
    return () => window.removeEventListener(api.UNAUTHORIZED_EVENT, handleUnauthorized)
  }, [])

  async function login(email: string, password: string) {
    setError(null)
    try {
      const result = await api.login(email, password)
      if (result) {
        api.setToken(result.token)
        setUser(result.user)
      }
    } catch (e) {
      setError(e instanceof api.ApiError ? e.message : 'Login failed')
      throw e
    }
  }

  async function register(email: string, password: string, name: string) {
    setError(null)
    try {
      const result = await api.register(email, password, name)
      if (result) {
        api.setToken(result.token)
        setUser(result.user)
      }
    } catch (e) {
      setError(e instanceof api.ApiError ? e.message : 'Registration failed')
      throw e
    }
  }

  async function logout() {
    await api.logout().catch(() => {})
    api.setToken(null)
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, error, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
