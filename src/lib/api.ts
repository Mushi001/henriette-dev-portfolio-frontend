const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8080'

const TOKEN_KEY = 'admin_token'
const TOKEN_EXPIRY_KEY = 'admin_token_expiry'

// ── Public response types (snake_case, matches backend Jackson config) ──

export interface Profile {
  name: string
  surname: string
  title: string
  tagline: string
  bio_short: string
  bio_paragraphs: string[]
  current_company: string
  location: string
  education: string
  status: string
  email: string
  github_url: string
  linkedin_url: string
  stats: {
    years_experience: number
    projects_shipped: number
    technologies: number
    github_repos: number
  }
}

export interface Skill {
  id: number
  name: string
  category: string
}

export interface Project {
  id: number
  title: string
  tagline: string
  description: string
  tech: string[]
  type: string
  year: string
  image_url: string
  metrics: string[]
  github_url: string | null
  live_url: string | null
  featured: boolean
  sort_order: number
}

export interface Experience {
  id: number
  role: string
  company: string
  period: string
  location: string
  is_current: boolean
  points: string[]
  tech: string[]
  sort_order: number
}

export interface ProcessStep {
  id: number
  number: string
  title: string
  text: string
  sort_order: number
}

export interface AdminContactMessage {
  id: string
  name: string
  email: string
  message: string
  ip_address: string | null
  is_read: boolean
  created_at: string
}

// ── Errors ──

export class ApiError extends Error {
  status: number
  fieldErrors?: { field: string; message: string }[]

  constructor(status: number, message: string, fieldErrors?: { field: string; message: string }[]) {
    super(message)
    this.status = status
    this.fieldErrors = fieldErrors
  }
}

// ── Token storage ──

export function getToken(): string | null {
  const token = sessionStorage.getItem(TOKEN_KEY)
  const expiry = sessionStorage.getItem(TOKEN_EXPIRY_KEY)
  if (!token || !expiry) return null
  if (Date.now() >= Number(expiry)) {
    clearToken()
    return null
  }
  return token
}

export function setToken(token: string, expiresInSeconds: number) {
  sessionStorage.setItem(TOKEN_KEY, token)
  sessionStorage.setItem(TOKEN_EXPIRY_KEY, String(Date.now() + expiresInSeconds * 1000))
}

export function clearToken() {
  sessionStorage.removeItem(TOKEN_KEY)
  sessionStorage.removeItem(TOKEN_EXPIRY_KEY)
}

// ── Core request helper ──

async function request<T>(path: string, options: RequestInit = {}, auth = false): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> | undefined),
  }

  if (auth) {
    const token = getToken()
    if (!token) throw new ApiError(401, 'Not authenticated.')
    headers.Authorization = `Bearer ${token}`
  }

  const res = await fetch(`${BASE_URL}${path}`, { ...options, headers })

  if (res.status === 204) return undefined as T

  let body: unknown = null
  try {
    body = await res.json()
  } catch {
    // no body
  }

  if (!res.ok) {
    if (auth && res.status === 401) clearToken()

    const b = body as { message?: string; errors?: { field: string; message: string }[] } | null
    if (b?.errors) {
      throw new ApiError(res.status, 'Please check the form for errors.', b.errors)
    }
    throw new ApiError(res.status, b?.message ?? `Request failed (${res.status}).`)
  }

  return body as T
}

// ── Public endpoints ──

export function getProfile() {
  return request<Profile>('/api/profile')
}

export function getSkills() {
  return request<{ skills: Skill[] }>('/api/skills').then((r) => r.skills)
}

export function getProjects() {
  return request<{ projects: Project[] }>('/api/projects').then((r) => r.projects)
}

export function getExperience() {
  return request<{ experience: Experience[] }>('/api/experience').then((r) => r.experience)
}

export function getProcessSteps() {
  return request<{ steps: ProcessStep[] }>('/api/process').then((r) => r.steps)
}

export function submitContact(data: { name: string; email: string; message: string }) {
  return request<{ success: boolean; message: string }>('/api/contact', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

// ── Admin endpoints ──

export async function adminLogin(username: string, password: string) {
  const res = await request<{ token: string; token_type: string; expires_in_seconds: number }>(
    '/api/admin/auth/login',
    { method: 'POST', body: JSON.stringify({ username, password }) }
  )
  setToken(res.token, res.expires_in_seconds)
  return res
}

export function adminListMessages() {
  return request<{ messages: AdminContactMessage[] }>('/api/admin/messages', {}, true).then((r) => r.messages)
}

export function adminSetMessageRead(id: string, isRead: boolean) {
  return request<AdminContactMessage>(
    `/api/admin/messages/${id}`,
    { method: 'PUT', body: JSON.stringify({ is_read: isRead }) },
    true
  )
}

export function adminDeleteMessage(id: string) {
  return request<void>(`/api/admin/messages/${id}`, { method: 'DELETE' }, true)
}
