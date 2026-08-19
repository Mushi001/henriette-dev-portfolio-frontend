import { useState, useEffect, useCallback } from 'react'
import './admin.css'
import {
  ApiError,
  adminDeleteMessage,
  adminListMessages,
  adminLogin,
  adminSetMessageRead,
  clearToken,
  getToken,
  type AdminContactMessage,
} from './lib/api'

const PRIMARY = '#3B82F6'
const TEXT = '#FFFFFF'

const ff = {
  display: "'DM Sans', sans-serif",
  body: "'DM Sans', sans-serif",
  mono: "'DM Sans', sans-serif",
}

// ── Admin Portal Component ──
export default function AdminPortal() {
  const [authenticated, setAuthenticated] = useState(() => getToken() !== null)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loginError, setLoginError] = useState('')
  const [messages, setMessages] = useState<AdminContactMessage[]>([])
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [listError, setListError] = useState('')

  const handleSessionExpired = useCallback(() => {
    clearToken()
    setAuthenticated(false)
    setMessages([])
  }, [])

  const refreshMessages = useCallback(async () => {
    try {
      const list = await adminListMessages()
      setMessages(list)
      setListError('')
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        handleSessionExpired()
      } else {
        setListError(err instanceof ApiError ? err.message : 'Could not load messages.')
      }
    }
  }, [handleSessionExpired])

  // Load messages when authenticated
  useEffect(() => {
    if (authenticated) refreshMessages()
  }, [authenticated, refreshMessages])

  // Refresh messages periodically
  useEffect(() => {
    if (!authenticated) return
    const interval = setInterval(refreshMessages, 5000)
    return () => clearInterval(interval)
  }, [authenticated, refreshMessages])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setLoginError('')
    try {
      await adminLogin(username, password)
      setAuthenticated(true)
    } catch (err) {
      setLoginError(err instanceof ApiError ? err.message : 'Could not reach the server. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    clearToken()
    setAuthenticated(false)
    setPassword('')
  }

  const toggleExpand = async (id: string) => {
    const nowExpanded = expandedId === id ? null : id
    setExpandedId(nowExpanded)
    setDeleteConfirmId(null)

    const msg = messages.find((m) => m.id === id)
    if (nowExpanded && msg && !msg.is_read) {
      try {
        const updated = await adminSetMessageRead(id, true)
        setMessages((prev) => prev.map((m) => (m.id === id ? updated : m)))
      } catch (err) {
        if (err instanceof ApiError && err.status === 401) handleSessionExpired()
      }
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await adminDeleteMessage(id)
      setMessages((prev) => prev.filter((m) => m.id !== id))
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) handleSessionExpired()
    } finally {
      setDeleteConfirmId(null)
      setExpandedId(null)
    }
  }

  const markAllRead = async () => {
    const unread = messages.filter((m) => !m.is_read)
    try {
      const updates = await Promise.all(unread.map((m) => adminSetMessageRead(m.id, true)))
      const byId = new Map(updates.map((m) => [m.id, m]))
      setMessages((prev) => prev.map((m) => byId.get(m.id) ?? m))
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) handleSessionExpired()
    }
  }

  const clearAll = async () => {
    if (!window.confirm(`Permanently delete all ${messages.length} message(s)? This cannot be undone.`)) return
    try {
      await Promise.all(messages.map((m) => adminDeleteMessage(m.id)))
      setMessages([])
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) handleSessionExpired()
    } finally {
      setExpandedId(null)
      setDeleteConfirmId(null)
    }
  }

  // ── Stats ──
  const totalMessages = messages.length
  const unreadCount = messages.filter((m) => !m.is_read).length
  const todayCount = messages.filter((m) => {
    const msgDate = new Date(m.created_at).toDateString()
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
              <p className="admin-login-subtitle">Sign in with your admin credentials</p>
            </div>
            <form onSubmit={handleLogin} className="admin-login-form">
              <div className="admin-field">
                <label className="admin-field-label">USERNAME</label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter admin username"
                  className="admin-input"
                  autoFocus
                  autoComplete="username"
                  required
                />
              </div>
              <div className="admin-field">
                <label className="admin-field-label">PASSWORD</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter admin password"
                  className="admin-input"
                  autoComplete="current-password"
                  required
                />
              </div>
              {loginError && (
                <div className="admin-error">
                  <span className="admin-error-icon">!</span>
                  {loginError}
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
        {listError && (
          <div className="admin-error" style={{ marginBottom: 20 }}>
            <span className="admin-error-icon">!</span>
            {listError}
          </div>
        )}

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
            <div className="admin-empty-icon">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.3 }}>
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                <polyline points="22,6 12,13 2,6" />
              </svg>
            </div>
            <h3>No messages yet</h3>
            <p>When visitors submit the contact form, their messages will appear here.</p>
          </div>
        ) : (
          <div className="admin-messages-list">
            {[...messages].reverse().map(msg => (
              <div
                key={msg.id}
                className={`admin-message-card ${expandedId === msg.id ? 'expanded' : ''} ${!msg.is_read ? 'unread' : ''}`}
              >
                {/* Message Header (always visible) */}
                <button
                  className="admin-message-header"
                  onClick={() => toggleExpand(msg.id)}
                >
                  <div className="admin-message-left">
                    {!msg.is_read && <span className="admin-unread-dot" />}
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
                      {formatDate(msg.created_at)}
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
                      <span>Received: <strong>{new Date(msg.created_at).toLocaleString()}</strong></span>
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
