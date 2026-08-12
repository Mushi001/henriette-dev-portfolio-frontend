import { useState, useEffect } from 'react'
import './admin.css'

// ── Constants ──
const ADMIN_PASSWORD = 'admin123'
const STORAGE_KEY = 'portfolio_messages'
const SESSION_KEY = 'admin_authenticated'

const PRIMARY = '#3B82F6'
const BG = '#0D1117'
const SURFACE = '#161B22'
const TEXT = '#FFFFFF'
const TEXT_DIM = '#9CA3AF'
const BORDER = 'rgba(255,255,255,0.1)'

const ff = {
  display: "'DM Sans', sans-serif",
  body: "'DM Sans', sans-serif",
  mono: "'DM Sans', sans-serif",
}

export interface ContactMessage {
  id: string
  name: string
  email: string
  message: string
  timestamp: string
  read: boolean
}

export function getMessages(): ContactMessage[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export function saveMessages(messages: ContactMessage[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(messages))
}

// ── Admin Portal Component ──
export default function AdminPortal() {
  const [authenticated, setAuthenticated] = useState(false)
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [messages, setMessages] = useState<ContactMessage[]>([])
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  // Check session on mount
  useEffect(() => {
    if (sessionStorage.getItem(SESSION_KEY) === 'true') {
      setAuthenticated(true)
    }
  }, [])

  // Load messages when authenticated
  useEffect(() => {
    if (authenticated) {
      setMessages(getMessages())
    }
  }, [authenticated])

  // Refresh messages periodically
  useEffect(() => {
    if (!authenticated) return
    const interval = setInterval(() => {
      setMessages(getMessages())
    }, 3000)
    return () => clearInterval(interval)
  }, [authenticated])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    // Small delay for UX feel
    await new Promise(r => setTimeout(r, 400))

    if (password === ADMIN_PASSWORD) {
      sessionStorage.setItem(SESSION_KEY, 'true')
      setAuthenticated(true)
    } else {
      setError('Incorrect password. Please try again.')
    }
    setLoading(false)
  }

  const handleLogout = () => {
    sessionStorage.removeItem(SESSION_KEY)
    setAuthenticated(false)
    setPassword('')
  }

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id)
    setDeleteConfirmId(null)
    // Mark as read
    const updated = messages.map(m =>
      m.id === id ? { ...m, read: true } : m
    )
    setMessages(updated)
    saveMessages(updated)
  }

  const handleDelete = (id: string) => {
    const updated = messages.filter(m => m.id !== id)
    setMessages(updated)
    saveMessages(updated)
    setDeleteConfirmId(null)
    setExpandedId(null)
  }

  const markAllRead = () => {
    const updated = messages.map(m => ({ ...m, read: true }))
    setMessages(updated)
    saveMessages(updated)
  }

  const clearAll = () => {
    setMessages([])
    saveMessages([])
    setExpandedId(null)
    setDeleteConfirmId(null)
  }

  // ── Stats ──
  const totalMessages = messages.length
  const unreadCount = messages.filter(m => !m.read).length
  const todayCount = messages.filter(m => {
    const msgDate = new Date(m.timestamp).toDateString()
    return msgDate === new Date().toDateString()
  }).length

  // ── Login Screen ──
  if (!authenticated) {
    return (
      <div className="admin-root" style={{ fontFamily: ff.body }}>
        <div className="admin-login-container" style={{ backgroundImage: 'url(/bg.jpg)', backgroundSize: 'cover', backgroundPosition: 'center' }}>
          <div className="admin-login-card">
            <div className="admin-login-header">
              <div className="admin-logo">
                <span style={{ color: PRIMARY }}>HM</span>
                <span style={{ color: TEXT }}>.admin</span>
              </div>
              <p className="admin-login-subtitle">Enter your password to access the dashboard</p>
            </div>
            <form onSubmit={handleLogin} className="admin-login-form">
              <div className="admin-field">
                <label className="admin-field-label">PASSWORD</label>
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Enter admin password"
                  className="admin-input"
                  autoFocus
                  required
                />
              </div>
              {error && (
                <div className="admin-error">
                  <span className="admin-error-icon">!</span>
                  {error}
                </div>
              )}
              <button
                type="submit"
                className="admin-login-btn"
                disabled={loading}
              >
                {loading ? (
                  <span className="admin-spinner" />
                ) : (
                  'Sign in →'
                )}
              </button>
            </form>
            <a
              href="#/"
              className="admin-back-link"
            >
              ← Back to portfolio
            </a>
          </div>
        </div>
      </div>
    )
  }

  // ── Dashboard ──
  return (
    <div className="admin-root" style={{ fontFamily: ff.body }}>
      {/* Header */}
      <header className="admin-header">
        <div className="admin-header-inner">
          <div className="admin-header-left">
            <div className="admin-logo">
              <span style={{ color: PRIMARY }}>HM</span>
              <span style={{ color: TEXT }}>.admin</span>
            </div>
            <span className="admin-header-divider" />
            <span className="admin-header-title">Dashboard</span>
          </div>
          <div className="admin-header-right">
            <a href="#/" className="admin-portfolio-link">
              View Portfolio
            </a>
            <button onClick={handleLogout} className="admin-logout-btn">
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="admin-main">
        {/* Stats Row */}
        <div className="admin-stats-grid">
          <div className="admin-stat-card">
            <div className="admin-stat-number" style={{ color: PRIMARY }}>{totalMessages}</div>
            <div className="admin-stat-label">TOTAL MESSAGES</div>
          </div>
          <div className="admin-stat-card">
            <div className="admin-stat-number" style={{ color: unreadCount > 0 ? '#F59E0B' : PRIMARY }}>{unreadCount}</div>
            <div className="admin-stat-label">UNREAD</div>
          </div>
          <div className="admin-stat-card">
            <div className="admin-stat-number" style={{ color: PRIMARY }}>{todayCount}</div>
            <div className="admin-stat-label">TODAY</div>
          </div>
        </div>

        {/* Actions Bar */}
        <div className="admin-actions-bar">
          <h2 className="admin-section-title">
            Messages
            {unreadCount > 0 && (
              <span className="admin-unread-badge">{unreadCount} new</span>
            )}
          </h2>
          <div className="admin-actions-right">
            {unreadCount > 0 && (
              <button onClick={markAllRead} className="admin-action-btn">
                Mark all read
              </button>
            )}
            {totalMessages > 0 && (
              <button onClick={clearAll} className="admin-action-btn admin-action-btn-danger">
                Clear all
              </button>
            )}
          </div>
        </div>

        {/* Messages List */}
        {messages.length === 0 ? (
          <div className="admin-empty">
            <div className="admin-empty-icon">📭</div>
            <h3>No messages yet</h3>
            <p>When visitors submit the contact form, their messages will appear here.</p>
          </div>
        ) : (
          <div className="admin-messages-list">
            {[...messages].reverse().map(msg => (
              <div
                key={msg.id}
                className={`admin-message-card ${expandedId === msg.id ? 'expanded' : ''} ${!msg.read ? 'unread' : ''}`}
              >
                {/* Message Header (always visible) */}
                <button
                  className="admin-message-header"
                  onClick={() => toggleExpand(msg.id)}
                >
                  <div className="admin-message-left">
                    {!msg.read && <span className="admin-unread-dot" />}
                    <div>
                      <div className="admin-message-name">{msg.name}</div>
                      <div className="admin-message-email">{msg.email}</div>
                    </div>
                  </div>
                  <div className="admin-message-right">
                    <span className="admin-message-preview">
                      {expandedId !== msg.id && (
                        msg.message.length > 60
                          ? msg.message.substring(0, 60) + '...'
                          : msg.message
                      )}
                    </span>
                    <span className="admin-message-date">
                      {formatDate(msg.timestamp)}
                    </span>
                    <span className={`admin-expand-icon ${expandedId === msg.id ? 'rotated' : ''}`}>
                      +
                    </span>
                  </div>
                </button>

                {/* Expanded Content */}
                {expandedId === msg.id && (
                  <div className="admin-message-body">
                    <div className="admin-message-meta">
                      <span>From: <strong>{msg.name}</strong></span>
                      <span>Email: <strong>{msg.email}</strong></span>
                      <span>Received: <strong>{new Date(msg.timestamp).toLocaleString()}</strong></span>
                    </div>
                    <div className="admin-message-content">
                      {msg.message}
                    </div>
                    <div className="admin-message-actions">
                      <a
                        href={`mailto:${msg.email}?subject=Re: Portfolio Contact&body=Hi ${msg.name},%0A%0A`}
                        className="admin-reply-btn"
                      >
                        Reply via Email →
                      </a>
                      {deleteConfirmId === msg.id ? (
                        <div className="admin-delete-confirm">
                          <span>Delete this message?</span>
                          <button
                            onClick={() => handleDelete(msg.id)}
                            className="admin-delete-yes"
                          >
                            Yes, delete
                          </button>
                          <button
                            onClick={() => setDeleteConfirmId(null)}
                            className="admin-delete-no"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setDeleteConfirmId(msg.id)}
                          className="admin-delete-btn"
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}

// ── Helpers ──
function formatDate(timestamp: string): string {
  const date = new Date(timestamp)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}
