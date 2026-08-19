import { useState, useEffect, useRef, useCallback } from 'react'
import {
  ApiError,
  getExperience,
  getProcessSteps,
  getProfile,
  getProjects,
  getSkills,
  submitContact,
  type Experience,
  type ProcessStep,
  type Profile,
  type Project,
  type Skill,
} from './lib/api'

const NAV_LINKS = ['About', 'Skills', 'Process', 'Projects', 'Experience', 'Testimonials', 'Contact']

const PRIMARY_ACCENT = 'var(--accent)'
const BG = 'var(--bg)'
const SURFACE = 'var(--surface)'
const SURFACE2 = 'var(--surface2)'
const TEXT = 'var(--text)'
const TEXT_DIM = 'var(--text-dim)'
const TEXT_FAINT = 'var(--text-faint)'
const BORDER = 'var(--border)'
const BORDER_BRIGHT = 'var(--border-bright)'

// Additional theme-aware constants
const ACCENT_HOVER = 'var(--accent-hover)'
const ACCENT_DIM = 'var(--accent-dim)'
const NAV_BG = 'var(--nav-bg)'
const BTN_OUTLINE_BORDER = 'var(--btn-outline-border)'
const OVERLAY_BG = 'var(--overlay-bg)'
const IMG_PLACEHOLDER = 'var(--img-placeholder)'
const LABEL_COLOR = 'var(--label-color)'
const BG_FAINT = 'var(--bg-faint)'
const BG_FAINTER = 'var(--bg-fainter)'
const BORDER_FAINT = 'var(--border-faint)'
const LIST_BORDER = 'var(--list-border)'
const ACCENT_SUBTLE_BG = 'var(--accent-subtle-bg)'
const INPUT_FOCUS_BORDER = 'var(--input-focus-border)'
const ERROR_COLOR = '#EF4444'

const ff = {
  display: "'DM Sans', sans-serif",
  body: "'DM Sans', sans-serif",
  mono: "'DM Sans', sans-serif",
}

const ICON_PROPS = {
  width: 20,
  height: 20,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
}

const PROCESS_ICONS = [
  // Understand the problem — search
  <svg {...ICON_PROPS}>
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>,
  // Build in small loops — refresh cycle
  <svg {...ICON_PROPS}>
    <polyline points="23 4 23 10 17 10" />
    <polyline points="1 20 1 14 7 14" />
    <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
  </svg>,
  // Ship with confidence — rocket
  <svg {...ICON_PROPS}>
    <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z" />
    <path d="M12 15l-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z" />
    <path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0" />
    <path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5" />
  </svg>,
]

// ── Custom Hooks ──

function useScrollReveal(threshold = 0.15) {
  const [node, setNode] = useState<HTMLDivElement | null>(null)
  const [visible, setVisible] = useState(false)
  const ref = useCallback((el: HTMLDivElement | null) => setNode(el), [])

  useEffect(() => {
    if (!node) return
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true)
          obs.unobserve(node)
        }
      },
      { threshold }
    )
    obs.observe(node)
    return () => obs.disconnect()
  }, [node, threshold])

  return { ref, visible }
}

function useCountUp(end: number, duration = 2000, trigger = false) {
  const [count, setCount] = useState(0)

  useEffect(() => {
    if (!trigger) return
    let startTime: number | null = null
    let raf: number

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp
      const progress = Math.min((timestamp - startTime) / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3) // easeOutCubic
      setCount(Math.round(eased * end))
      if (progress < 1) {
        raf = requestAnimationFrame(animate)
      }
    }

    raf = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(raf)
  }, [end, duration, trigger])

  return count
}

// ── Portfolio data (fetched from the backend) ──

interface PortfolioData {
  profile: Profile
  skills: Skill[]
  projects: Project[]
  experience: Experience[]
  process: ProcessStep[]
}

export default function App() {
  const [activeSection, setActiveSection] = useState('')
  const [menuOpen, setMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [formData, setFormData] = useState({ name: '', email: '', message: '' })
  const [submitted, setSubmitted] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [scrollProgress, setScrollProgress] = useState(0)
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('portfolio_theme')
    return saved ? saved === 'dark' : true
  })
  const cursorRef = useRef<HTMLDivElement>(null)
  const cursorPos = useRef({ x: 0, y: 0 })
  const cursorTarget = useRef({ x: 0, y: 0 })

  // ── Data loading ──
  const [data, setData] = useState<PortfolioData | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)

  const loadData = useCallback(async () => {
    setLoadError(null)
    try {
      const [profile, skills, projects, experience, process] = await Promise.all([
        getProfile(),
        getSkills(),
        getProjects(),
        getExperience(),
        getProcessSteps(),
      ])
      setData({ profile, skills, projects, experience, process })
    } catch (err) {
      setLoadError(err instanceof ApiError ? err.message : 'Could not reach the server. Please try again.')
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  // Scroll reveal refs
  const statsReveal = useScrollReveal(0.3)
  const aboutReveal = useScrollReveal()
  const skillsReveal = useScrollReveal()
  const processReveal = useScrollReveal()
  const projectsReveal = useScrollReveal()
  const experienceReveal = useScrollReveal()
  const testimonialsReveal = useScrollReveal()
  const contactReveal = useScrollReveal()

  // Counting stats
  const stats = data?.profile.stats
  const yearsCount = useCountUp(stats?.years_experience ?? 0, 1800, statsReveal.visible && !!stats)
  const projectsCount = useCountUp(stats?.projects_shipped ?? 0, 2000, statsReveal.visible && !!stats)
  const techCount = useCountUp(stats?.technologies ?? 0, 2200, statsReveal.visible && !!stats)
  const reposCount = useCountUp(stats?.github_repos ?? 0, 2400, statsReveal.visible && !!stats)

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 40)
      const scrollable = document.documentElement.scrollHeight - window.innerHeight
      setScrollProgress(scrollable > 0 ? (window.scrollY / scrollable) * 100 : 0)
      const ids = NAV_LINKS.map((l) => l.toLowerCase())
      let found = ''
      for (const id of ids) {
        const el = document.getElementById(id)
        if (el && window.scrollY >= el.offsetTop - 140) found = id
      }
      setActiveSection(found)
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    handleScroll()
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    const closeMenu = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMenuOpen(false)
    }
    window.addEventListener('keydown', closeMenu)
    return () => window.removeEventListener('keydown', closeMenu)
  }, [])

  // Cursor follower
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      cursorTarget.current = { x: e.clientX, y: e.clientY }
    }
    window.addEventListener('mousemove', handleMouseMove)

    let rafId: number
    const lerp = (a: number, b: number, t: number) => a + (b - a) * t
    const animate = () => {
      cursorPos.current.x = lerp(cursorPos.current.x, cursorTarget.current.x, 0.12)
      cursorPos.current.y = lerp(cursorPos.current.y, cursorTarget.current.y, 0.12)
      if (cursorRef.current) {
        cursorRef.current.style.transform = `translate(${cursorPos.current.x - 16}px, ${cursorPos.current.y - 16}px)`
      }
      rafId = requestAnimationFrame(animate)
    }
    rafId = requestAnimationFrame(animate)

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      cancelAnimationFrame(rafId)
    }
  }, [])

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', darkMode ? 'dark' : 'light')
    localStorage.setItem('portfolio_theme', darkMode ? 'dark' : 'light')
  }, [darkMode])

  const scrollTo = (id: string) => {
    document.getElementById(id.toLowerCase())?.scrollIntoView({ behavior: 'smooth' })
    setMenuOpen(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError(null)
    setFieldErrors({})
    setSubmitting(true)
    try {
      await submitContact(formData)
      setSubmitted(true)
    } catch (err) {
      if (err instanceof ApiError && err.fieldErrors) {
        const fe: Record<string, string> = {}
        err.fieldErrors.forEach((f) => {
          fe[f.field] = f.message
        })
        setFieldErrors(fe)
      } else if (err instanceof ApiError) {
        setFormError(err.message)
      } else {
        setFormError('Something went wrong. Please try again later.')
      }
    } finally {
      setSubmitting(false)
    }
  }

  // ── Loading / error states ──
  if (loadError) {
    return (
      <div
        data-theme={darkMode ? 'dark' : 'light'}
        style={{
          backgroundColor: BG,
          color: TEXT,
          fontFamily: ff.body,
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 16,
          padding: 24,
          textAlign: 'center',
        }}
      >
        <div style={{ fontFamily: ff.display, fontSize: '1.3rem', fontWeight: 700 }}>Couldn't load the site</div>
        <p style={{ color: TEXT_DIM, maxWidth: 420, fontSize: '0.9rem' }}>{loadError}</p>
        <button
          onClick={loadData}
          className="btn-primary"
          style={{
            backgroundColor: PRIMARY_ACCENT,
            color: BG,
            padding: '10px 24px',
            borderRadius: 4,
            fontFamily: ff.mono,
            fontSize: '0.8rem',
            fontWeight: 700,
            border: 'none',
            cursor: 'pointer',
          }}
        >
          Retry
        </button>
      </div>
    )
  }

  if (!data) {
    return (
      <div
        data-theme={darkMode ? 'dark' : 'light'}
        style={{
          backgroundColor: BG,
          color: TEXT,
          fontFamily: ff.body,
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: '50%',
            border: `2px solid ${BORDER}`,
            borderTopColor: PRIMARY_ACCENT,
            animation: 'spin 0.8s linear infinite',
          }}
        />
      </div>
    )
  }

  const { profile, skills, projects, experience, process } = data

  return (
    <div data-theme={darkMode ? 'dark' : 'light'} style={{ backgroundColor: BG, color: TEXT, fontFamily: ff.body, minHeight: '100vh', transition: 'background-color 0.4s ease, color 0.4s ease' }}>
      {/* Cursor follower */}
      <div
        ref={cursorRef}
        className="cursor-follower"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: 32,
          height: 32,
          borderRadius: '50%',
          border: `2px solid ${PRIMARY_ACCENT}`,
          backgroundColor: 'rgba(59, 130, 246, 0.08)',
          pointerEvents: 'none',
          zIndex: 9999,
          willChange: 'transform',
          boxShadow: '0 0 12px rgba(59, 130, 246, 0.25), 0 0 4px rgba(59, 130, 246, 0.15)',
          transition: 'width 0.3s, height 0.3s, opacity 0.3s',
        }}
      />
      <div className="scroll-progress" style={{ transform: `scaleX(${scrollProgress / 100})` }} aria-hidden="true" />
      {/* Full-page diagonal signature watermark */}
      <div className="page-watermark" aria-hidden="true">
        <span>{profile.surname}</span>
      </div>
      {/* ── Nav ── */}
      <nav
        className="nav-animated"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 50,
          transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
          backgroundColor: scrolled ? NAV_BG : 'transparent',
          backdropFilter: scrolled ? 'blur(20px)' : 'none',
          borderBottom: scrolled ? `1px solid ${BORDER}` : 'none',
        }}
      >
        <div
          style={{
            maxWidth: 1120,
            margin: '0 auto',
            padding: '0 24px',
            height: 64,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ fontFamily: ff.display, fontWeight: 800, fontSize: '1.1rem', letterSpacing: '-0.02em', cursor: 'pointer', transition: 'transform 0.2s' }} onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.05)')} onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}>
            <span style={{ color: PRIMARY_ACCENT }}>{`HM`}</span>
            <span style={{ color: TEXT }}>.dev</span>
          </div>
          <div className="desktop-nav" style={{ alignItems: 'center', gap: 32 }}>
            {NAV_LINKS.map((link, i) => (
              <button
                key={link}
                onClick={() => scrollTo(link)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  fontFamily: ff.mono,
                  fontSize: '0.78rem',
                  letterSpacing: '0.06em',
                  color: activeSection === link.toLowerCase() ? PRIMARY_ACCENT : TEXT_FAINT,
                  transition: 'color 0.2s, transform 0.2s',
                  padding: 0,
                  animation: `fadeInDown 0.5s cubic-bezier(0.16, 1, 0.3, 1) ${0.1 + i * 0.07}s both`,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)'
                  if (activeSection !== link.toLowerCase()) e.currentTarget.style.color = TEXT
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)'
                  if (activeSection !== link.toLowerCase()) e.currentTarget.style.color = TEXT_FAINT
                }}
              >
                {link}
              </button>
            ))}
            <button
              onClick={() => setDarkMode(!darkMode)}
              aria-label="Toggle theme"
              style={{
                background: 'none',
                border: `1px solid ${BORDER}`,
                borderRadius: '50%',
                cursor: 'pointer',
                padding: 0,
                width: 36,
                height: 36,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                transition: 'border-color 0.3s, transform 0.2s, background-color 0.2s',
                color: TEXT,
                animation: `fadeInDown 0.5s cubic-bezier(0.16, 1, 0.3, 1) 0.52s both`,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = PRIMARY_ACCENT
                e.currentTarget.style.transform = 'scale(1.12)'
                e.currentTarget.style.backgroundColor = ACCENT_SUBTLE_BG
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = BORDER
                e.currentTarget.style.transform = 'scale(1)'
                e.currentTarget.style.backgroundColor = 'transparent'
              }}
            >
              {darkMode ? (
                /* Sun — switch to light */
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="5" /><line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" />
                  <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                  <line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" />
                  <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
                </svg>
              ) : (
                /* Moon — switch to dark */
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                </svg>
              )}
            </button>
            <button
              onClick={() => scrollTo('Contact')}
              className="btn-primary"
              style={{
                backgroundColor: PRIMARY_ACCENT,
                color: BG,
                padding: '7px 20px',
                borderRadius: 4,
                fontFamily: ff.mono,
                fontSize: '0.76rem',
                fontWeight: 700,
                border: 'none',
                cursor: 'pointer',
                letterSpacing: '0.05em',
                animation: `fadeInDown 0.5s cubic-bezier(0.16, 1, 0.3, 1) 0.55s both`,
              }}
              onMouseEnter={(e) => ((e.target as HTMLElement).style.backgroundColor = ACCENT_HOVER)}
              onMouseLeave={(e) => ((e.target as HTMLElement).style.backgroundColor = PRIMARY_ACCENT)}
            >
              Hire me
            </button>
          </div>
          {/* Mobile hamburger */}
          <button
            className="mobile-hamburger"
            onClick={() => setMenuOpen(!menuOpen)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}
            aria-label="Toggle menu"
          >
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                style={{
                  width: 22,
                  height: 2,
                  backgroundColor: TEXT,
                  marginBottom: i < 2 ? 5 : 0,
                  transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                  transform:
                    menuOpen && i === 0
                      ? 'rotate(45deg) translate(5px, 5px)'
                      : menuOpen && i === 2
                        ? 'rotate(-45deg) translate(5px, -5px)'
                        : 'none',
                  opacity: menuOpen && i === 1 ? 0 : 1,
                }}
              />
            ))}
          </button>
        </div>
        {menuOpen && (
          <div style={{ backgroundColor: SURFACE, borderBottom: `1px solid ${BORDER}`, padding: '1rem 24px', animation: 'fadeInDown 0.3s ease both' }}>
            {NAV_LINKS.map((link, i) => (
              <button
                key={link}
                onClick={() => scrollTo(link)}
                style={{
                  display: 'block',
                  width: '100%',
                  textAlign: 'left',
                  background: 'none',
                  border: 'none',
                  borderBottom: `1px solid ${BORDER}`,
                  cursor: 'pointer',
                  padding: '12px 0',
                  fontFamily: ff.mono,
                  fontSize: '0.85rem',
                  color: activeSection === link.toLowerCase() ? PRIMARY_ACCENT : TEXT,
                  animation: `fadeInLeft 0.4s cubic-bezier(0.16, 1, 0.3, 1) ${i * 0.06}s both`,
                }}
              >
                {link}
              </button>
            ))}
            <button
              onClick={() => setDarkMode(!darkMode)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                width: '100%',
                textAlign: 'left',
                background: 'none',
                border: 'none',
                borderTop: `1px solid ${BORDER}`,
                cursor: 'pointer',
                padding: '12px 0',
                fontFamily: ff.mono,
                fontSize: '0.85rem',
                color: PRIMARY_ACCENT,
                marginTop: 4,
              }}
            >
              {darkMode ? (
                <>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="5" /><line x1="12" y1="1" x2="12" y2="3" /><line x1="12" y1="21" x2="12" y2="23" />
                    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" /><line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                    <line x1="1" y1="12" x2="3" y2="12" /><line x1="21" y1="12" x2="23" y2="12" />
                    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" /><line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
                  </svg>
                  Light Mode
                </>
              ) : (
                <>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                  </svg>
                  Dark Mode
                </>
              )}
            </button>
          </div>
        )}
      </nav>

      {/* ── Hero ── */}
      <section
        style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: '120px 24px 80px',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Grid background */}
        <div
          className="hero-grid-bg"
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: `linear-gradient(var(--hero-grid) 1px, transparent 1px), linear-gradient(90deg, var(--hero-grid) 1px, transparent 1px)`,
            backgroundSize: '60px 60px',
            pointerEvents: 'none',
          }}
        />
        {/* Glow blob */}
        <div
          className="hero-glow"
          style={{
            position: 'absolute',
            top: '25%',
            right: '15%',
            width: 500,
            height: 500,
            borderRadius: '50%',
            background: 'radial-gradient(circle, var(--hero-glow) 0%, transparent 70%)',
            pointerEvents: 'none',
          }}
        />
        <div style={{ maxWidth: 1120, margin: '0 auto', width: '100%', position: 'relative' }}>
          <div
            className="hero-badge"
            style={{
              fontFamily: ff.mono,
              fontSize: '0.75rem',
              color: PRIMARY_ACCENT,
              letterSpacing: '0.18em',
              marginBottom: '1.5rem',
              display: 'flex',
              alignItems: 'center',
              gap: 10,
            }}
          >
            <span className="section-line" style={{ height: 1, backgroundColor: PRIMARY_ACCENT, display: 'inline-block', flexShrink: 0 }} />
            {profile.tagline.toUpperCase()}
          </div>
          <h1
            style={{
              fontFamily: ff.display,
              fontWeight: 800,
              lineHeight: 1.0,
              letterSpacing: '-0.03em',
              marginBottom: '1.75rem',
            }}
          >
            <span className="hero-name-first" style={{ fontSize: 'clamp(3.5rem, 9vw, 7.5rem)', color: TEXT, display: 'block' }}>{profile.name}</span>
            <span className="hero-name-last" style={{ fontSize: 'clamp(2rem, 5.5vw, 4.8rem)', color: ACCENT_DIM, display: 'block' }}>{profile.surname}</span>
          </h1>
          <p
            className="hero-description"
            style={{
              maxWidth: 520,
              fontSize: '1.05rem',
              lineHeight: 1.75,
              color: TEXT_DIM,
              marginBottom: '2.5rem',
            }}
          >
            {profile.bio_short}
          </p>
          <div className="hero-buttons" style={{ display: 'flex', flexWrap: 'wrap', gap: 16 }}>
            <button
              onClick={() => scrollTo('Projects')}
              className="btn-primary"
              style={{
                backgroundColor: PRIMARY_ACCENT,
                color: BG,
                padding: '13px 30px',
                borderRadius: 4,
                fontFamily: ff.mono,
                fontSize: '0.82rem',
                fontWeight: 700,
                border: 'none',
                cursor: 'pointer',
                letterSpacing: '0.05em',
              }}
              onMouseEnter={(e) => ((e.target as HTMLElement).style.backgroundColor = ACCENT_HOVER)}
              onMouseLeave={(e) => ((e.target as HTMLElement).style.backgroundColor = PRIMARY_ACCENT)}
            >
              View Projects →
            </button>
            <button
              onClick={() => scrollTo('Contact')}
              className="btn-outline"
              style={{
                backgroundColor: 'transparent',
                color: TEXT,
                padding: '13px 30px',
                borderRadius: 4,
                fontFamily: ff.mono,
                fontSize: '0.82rem',
                fontWeight: 500,
                border: `1px solid ${BTN_OUTLINE_BORDER}`,
                cursor: 'pointer',
                letterSpacing: '0.05em',
              }}
              onMouseEnter={(e) => {
                ;(e.target as HTMLElement).style.borderColor = PRIMARY_ACCENT
                ;(e.target as HTMLElement).style.color = PRIMARY_ACCENT
              }}
              onMouseLeave={(e) => {
                ;(e.target as HTMLElement).style.borderColor = BTN_OUTLINE_BORDER
                ;(e.target as HTMLElement).style.color = TEXT
              }}
            >
              Get in touch
            </button>
          </div>
          {/* Stats */}
          <div
            ref={statsReveal.ref}
            className="hero-stats"
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '48px 64px',
              marginTop: 72,
              paddingTop: 48,
              borderTop: `1px solid ${BORDER}`,
            }}
          >
            {[
              { label: 'Years Experience', value: `${yearsCount}+` },
              { label: 'Projects Shipped', value: `${projectsCount}` },
              { label: 'Technologies', value: `${techCount}+` },
              { label: 'GitHub Repos', value: `${reposCount}` },
            ].map((stat, i) => (
              <div key={stat.label} style={{ opacity: statsReveal.visible ? 1 : 0, transform: statsReveal.visible ? 'translateY(0)' : 'translateY(20px)', transition: `all 0.6s cubic-bezier(0.16, 1, 0.3, 1) ${i * 0.12}s` }}>
                <div style={{ fontFamily: ff.display, fontSize: '2.2rem', fontWeight: 800, color: PRIMARY_ACCENT, lineHeight: 1 }}>
                  {stat.value}
                </div>
                <div
                  style={{
                    fontFamily: ff.mono,
                    fontSize: '0.68rem',
                    color: TEXT_FAINT,
                    marginTop: 5,
                    letterSpacing: '0.1em',
                  }}
                >
                  {stat.label.toUpperCase()}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── About ── */}
      <section id="about" style={{ padding: '100px 24px', backgroundColor: SURFACE2 }}>
        <div style={{ maxWidth: 1120, margin: '0 auto' }}>
          <div ref={aboutReveal.ref}>
            <SectionLabel visible={aboutReveal.visible}>About</SectionLabel>
          </div>
          <div className="about-layout" style={{ marginTop: 48 }}>
            <div
              className={`reveal-left about-intro ${aboutReveal.visible ? 'visible' : ''}`}
            >
              <div className="about-kicker">Developer · problem solver · teammate</div>
              <h2 className="about-statement">
                I turn complex product ideas into <span>clear, dependable experiences.</span>
              </h2>
            </div>
            <div className={`reveal-right ${aboutReveal.visible ? 'visible' : ''}`} style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <h2
                style={{
                  fontFamily: ff.display,
                  fontSize: 'clamp(1.8rem, 3.5vw, 2.8rem)',
                  fontWeight: 800,
                  letterSpacing: '-0.03em',
                  lineHeight: 1.1,
                  marginBottom: '1.5rem',
                }}
              >
                Building things that{' '}
                <span style={{ color: PRIMARY_ACCENT }}>actually work.</span>
              </h2>
              {profile.bio_paragraphs.map((para, i) => (
                <p key={i} style={{ color: TEXT_DIM, lineHeight: 1.8, marginBottom: i === profile.bio_paragraphs.length - 1 ? '2rem' : '1rem', fontSize: '0.95rem' }}>
                  {para}
                </p>
              ))}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                {[
                  { label: 'Location', value: profile.location },
                  { label: 'Education', value: profile.education },
                  { label: 'Status', value: profile.status },
                ].map((item, i) => (
                  <div
                    key={item.label}
                    style={{
                      padding: '9px 14px',
                      borderRadius: 4,
                      border: `1px solid ${BORDER}`,
                      backgroundColor: SURFACE,
                      opacity: aboutReveal.visible ? 1 : 0,
                      transform: aboutReveal.visible ? 'translateY(0)' : 'translateY(15px)',
                      transition: `all 0.5s cubic-bezier(0.16, 1, 0.3, 1) ${0.6 + i * 0.1}s`,
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = BORDER_BRIGHT
                      e.currentTarget.style.transform = 'translateY(-2px)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = BORDER
                      e.currentTarget.style.transform = 'translateY(0)'
                    }}
                  >
                    <div
                      style={{
                        fontFamily: ff.mono,
                        fontSize: '0.62rem',
                        color: 'rgba(59,130,246,0.8)',
                        letterSpacing: '0.12em',
                        marginBottom: 3,
                      }}
                    >
                      {item.label.toUpperCase()}
                    </div>
                    <div style={{ fontSize: '0.85rem', color: TEXT }}>{item.value}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Skills — infinite horizontal marquee ── */}
      <section id="skills" style={{ padding: '100px 0', backgroundColor: BG, overflow: 'hidden' }}>
        {/* Heading stays in the max-width container */}
        <div style={{ maxWidth: 1120, margin: '0 auto', padding: '0 24px', marginBottom: 56 }}>
          <div ref={skillsReveal.ref}>
            <SectionLabel visible={skillsReveal.visible}>Skills</SectionLabel>
          </div>
          <div
            className={`reveal-left ${skillsReveal.visible ? 'visible' : ''}`}
            style={{
              marginTop: 48,
              display: 'flex',
              flexWrap: 'wrap',
              gap: 32,
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <h2
              style={{
                fontFamily: ff.display,
                fontSize: 'clamp(1.8rem, 3vw, 2.6rem)',
                fontWeight: 800,
                letterSpacing: '-0.03em',
                lineHeight: 1.1,
              }}
            >
              Tools I reach<br />for every day.
            </h2>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 16,
                padding: '18px 24px',
                borderRadius: 10,
                border: `1px solid ${BORDER_BRIGHT}`,
                background: `linear-gradient(135deg, ${ACCENT_SUBTLE_BG}, transparent)`,
                maxWidth: 400,
              }}
            >
              <div
                style={{
                  width: 42,
                  height: 42,
                  borderRadius: '50%',
                  backgroundColor: ACCENT_SUBTLE_BG,
                  border: `1px solid ${PRIMARY_ACCENT}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  color: PRIMARY_ACCENT,
                }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
                </svg>
              </div>
              <div>
                <div style={{ fontFamily: ff.mono, fontSize: '0.68rem', color: PRIMARY_ACCENT, letterSpacing: '0.1em', marginBottom: 4 }}>
                  {skills.length}+ TECHNOLOGIES
                </div>
                <p style={{ color: TEXT_DIM, lineHeight: 1.6, fontSize: '0.85rem', margin: 0 }}>
                  A growing skill set sharpened through continuous, hands-on practice.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Full-viewport-width marquee rows */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Row 1 — scrolls left */}
          <div className="marquee-outer">
            <div className="marquee-track">
              {[...skills, ...skills].map((skill, i) => (
                <span
                  key={i}
                  style={{
                    padding: '8px 18px',
                    borderRadius: 4,
                    backgroundColor: SURFACE,
                    border: `1px solid ${BORDER}`,
                    fontFamily: ff.mono,
                    fontSize: '0.82rem',
                    color: TEXT,
                    whiteSpace: 'nowrap',
                    flex: '0 0 auto',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 7,
                  }}
                >
                  <span style={{ fontSize: '0.55rem', color: PRIMARY_ACCENT, opacity: 0.8 }}>▸</span>
                  {skill.name}
                </span>
              ))}
            </div>
          </div>

          {/* Row 2 — scrolls right */}
          <div className="marquee-outer">
            <div className="marquee-track-reverse">
              {[...[...skills].reverse(), ...[...skills].reverse()].map((skill, i) => (
                <span
                  key={i}
                  style={{
                    padding: '8px 18px',
                    borderRadius: 4,
                    backgroundColor: SURFACE,
                    border: `1px solid ${BORDER}`,
                    fontFamily: ff.mono,
                    fontSize: '0.82rem',
                    color: TEXT,
                    whiteSpace: 'nowrap',
                    flex: '0 0 auto',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 7,
                  }}
                >
                  <span style={{ fontSize: '0.55rem', color: PRIMARY_ACCENT, opacity: 0.8 }}>▸</span>
                  {skill.name}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Process ── */}
      <section id="process" style={{ padding: '100px 24px', backgroundColor: SURFACE2 }}>
        <div style={{ maxWidth: 1120, margin: '0 auto' }}>
          <div ref={processReveal.ref}>
            <SectionLabel visible={processReveal.visible}>How I work</SectionLabel>
          </div>
          <div className={`process-heading reveal ${processReveal.visible ? 'visible' : ''}`}>
            <h2>Thoughtful from first question to final commit.</h2>
            <p>A simple, collaborative process keeps the work focused and the outcome easy to use.</p>
          </div>
          <div className="process-grid">
            {process.map((item, index) => (
              <article
                className="process-card"
                key={item.id}
                style={{
                  opacity: processReveal.visible ? 1 : 0,
                  transform: processReveal.visible ? 'translateY(0)' : 'translateY(24px)',
                  transitionDelay: `${index * 0.1}s`,
                }}
              >
                <div className="process-icon">{PROCESS_ICONS[index % PROCESS_ICONS.length]}</div>
                <h3>{item.title}</h3>
                <p>{item.text}</p>
                <span className="process-card-watermark" aria-hidden="true">{item.number}</span>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ── Projects ── */}
      <section id="projects" style={{ padding: '100px 24px', backgroundColor: SURFACE2 }}>
        <div style={{ maxWidth: 1120, margin: '0 auto' }}>
          <div ref={projectsReveal.ref}>
            <SectionLabel visible={projectsReveal.visible}>Projects</SectionLabel>
          </div>
          <div
            className={`reveal ${projectsReveal.visible ? 'visible' : ''}`}
            style={{
              display: 'flex',
              alignItems: 'flex-end',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: 16,
              marginTop: 8,
              marginBottom: 48,
            }}
          >
            <h2
              style={{
                fontFamily: ff.display,
                fontSize: 'clamp(1.8rem, 3vw, 2.6rem)',
                fontWeight: 800,
                letterSpacing: '-0.03em',
                lineHeight: 1.1,
              }}
            >
              Selected work.
            </h2>
            <a
              href={profile.github_url ? `https://${profile.github_url.replace(/^https?:\/\//, '')}` : '#'}
              target="_blank"
              rel="noreferrer"
              style={{
                fontFamily: ff.mono,
                fontSize: '0.78rem',
                color: PRIMARY_ACCENT,
                textDecoration: 'none',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                paddingBottom: 4,
                transition: 'gap 0.2s ease',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.gap = '10px')}
              onMouseLeave={(e) => (e.currentTarget.style.gap = '6px')}
            >
              All repos on GitHub →
            </a>
          </div>
          <div className="grid md:grid-cols-3" style={{ gap: 20 }}>
            {projects.map((p, i) => (
              <ProjectCard key={p.id} project={p} delay={i * 0.15} visible={projectsReveal.visible} />
            ))}
          </div>
        </div>
      </section>

      {/* ── Experience ── */}
      <section id="experience" style={{ padding: '100px 24px', backgroundColor: BG }}>
        <div style={{ maxWidth: 1120, margin: '0 auto' }}>
          <div ref={experienceReveal.ref}>
            <SectionLabel visible={experienceReveal.visible}>Experience</SectionLabel>
          </div>
          <h2
            className={`reveal ${experienceReveal.visible ? 'visible' : ''}`}
            style={{
              fontFamily: ff.display,
              fontSize: 'clamp(1.8rem, 3vw, 2.6rem)',
              fontWeight: 800,
              letterSpacing: '-0.03em',
              lineHeight: 1.1,
              marginTop: 8,
              marginBottom: 40,
            }}
          >
            Where I've worked.
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {experience.map((exp, i) => (
              <ExperienceCard key={exp.id} exp={exp} defaultOpen={i === 0} delay={i * 0.15} visible={experienceReveal.visible} />
            ))}
          </div>
        </div>
      </section>

      {/* ── Testimonials ── */}
      <section id="testimonials" style={{ padding: '100px 24px', backgroundColor: SURFACE2 }}>
        <div style={{ maxWidth: 1120, margin: '0 auto' }}>
          <div ref={testimonialsReveal.ref}>
            <SectionLabel visible={testimonialsReveal.visible}>Testimonials</SectionLabel>
          </div>
          <h2
            className={`reveal ${testimonialsReveal.visible ? 'visible' : ''}`}
            style={{
              fontFamily: ff.display,
              fontSize: 'clamp(1.8rem, 3vw, 2.6rem)',
              fontWeight: 800,
              letterSpacing: '-0.03em',
              lineHeight: 1.1,
              marginTop: 8,
              marginBottom: 40,
            }}
          >
            Kind words from people I've worked with.
          </h2>
          <div className="grid md:grid-cols-2" style={{ gap: 20 }}>
            {TESTIMONIALS.map((t, i) => (
              <TestimonialCard key={t.name} testimonial={t} delay={i * 0.12} visible={testimonialsReveal.visible} />
            ))}
          </div>
        </div>
      </section>

      {/* ── Contact ── */}
      <section id="contact" style={{ padding: '100px 24px', backgroundColor: SURFACE2 }}>
        <div style={{ maxWidth: 1120, margin: '0 auto' }}>
          <div ref={contactReveal.ref}>
            <SectionLabel visible={contactReveal.visible}>Contact</SectionLabel>
          </div>
          <div className="grid md:grid-cols-2" style={{ gap: 64, marginTop: 48 }}>
            <div className={`reveal-left ${contactReveal.visible ? 'visible' : ''}`}>
              <h2
                style={{
                  fontFamily: ff.display,
                  fontSize: 'clamp(2rem, 4vw, 3.2rem)',
                  fontWeight: 800,
                  letterSpacing: '-0.03em',
                  lineHeight: 1.1,
                  marginBottom: '1.5rem',
                }}
              >
                Let's build<br />
                <span style={{ color: PRIMARY_ACCENT }}>something great.</span>
              </h2>
              <p style={{ color: TEXT_DIM, lineHeight: 1.75, fontSize: '0.95rem', marginBottom: '2.5rem', maxWidth: 380 }}>
                I'm open to full-time roles, contract work, and interesting side projects. If you have something in
                mind, I'd love to hear about it.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {[
                  { label: 'Email', value: profile.email },
                  { label: 'Phone', value: '+250 796 029 263' },
                  { label: 'GitHub', value: profile.github_url },
                  { label: 'LinkedIn', value: profile.linkedin_url },
                  { label: 'Instagram', value: 'instagram.com/h.e.n.r_i.e.t.t.e' },
                ].map((link, i) => (
                  <ContactLink key={link.label} label={link.label} value={link.value} delay={i * 0.1} visible={contactReveal.visible} />
                ))}
              </div>
            </div>
            <div className={`reveal-right ${contactReveal.visible ? 'visible' : ''}`}>
              {submitted ? (
                <div
                  style={{
                    height: '100%',
                    minHeight: 340,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    textAlign: 'center',
                    padding: '3rem',
                    borderRadius: 8,
                    border: `1px solid ${BORDER_BRIGHT}`,
                    backgroundColor: SURFACE,
                    animation: 'scaleIn 0.5s cubic-bezier(0.16, 1, 0.3, 1) both',
                  }}
                >
                  <div
                    style={{
                      width: 56,
                      height: 56,
                      borderRadius: '50%',
                      backgroundColor: ACCENT_SUBTLE_BG,
                      border: `1px solid ${PRIMARY_ACCENT}`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '1.5rem',
                      color: PRIMARY_ACCENT,
                      marginBottom: '1.5rem',
                      animation: 'scaleIn 0.6s cubic-bezier(0.16, 1, 0.3, 1) 0.2s both',
                    }}
                  >
                    ✓
                  </div>
                  <h3
                    style={{
                      fontFamily: ff.display,
                      fontWeight: 700,
                      fontSize: '1.3rem',
                      marginBottom: '0.5rem',
                    }}
                  >
                    Message sent!
                  </h3>
                  <p style={{ color: TEXT_DIM, fontSize: '0.9rem' }}>I'll get back to you within 48 hours.</p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {[
                    { id: 'name', label: 'Name', type: 'text', placeholder: 'Your full name' },
                    { id: 'email', label: 'Email', type: 'email', placeholder: 'your@email.com' },
                  ].map((field) => (
                    <div key={field.id}>
                      <FieldLabel>{field.label}</FieldLabel>
                      <input
                        id={field.id}
                        type={field.type}
                        placeholder={field.placeholder}
                        value={formData[field.id as keyof typeof formData]}
                        onChange={(e) => setFormData({ ...formData, [field.id]: e.target.value })}
                        required
                        style={{
                          width: '100%',
                          padding: '12px 16px',
                          borderRadius: 4,
                          border: `1px solid ${fieldErrors[field.id] ? ERROR_COLOR : BORDER}`,
                          backgroundColor: SURFACE,
                          color: TEXT,
                          fontSize: '0.9rem',
                          outline: 'none',
                          transition: 'border-color 0.3s, box-shadow 0.3s',
                          boxSizing: 'border-box',
                          fontFamily: ff.body,
                        }}
                        onFocus={(e) => (e.target.style.borderColor = INPUT_FOCUS_BORDER)}
                        onBlur={(e) => (e.target.style.borderColor = fieldErrors[field.id] ? ERROR_COLOR : BORDER)}
                      />
                      {fieldErrors[field.id] && (
                        <div style={{ color: ERROR_COLOR, fontSize: '0.75rem', marginTop: 6 }}>{fieldErrors[field.id]}</div>
                      )}
                    </div>
                  ))}
                  <div>
                    <FieldLabel>Message</FieldLabel>
                    <textarea
                      placeholder="Tell me about your project or idea..."
                      rows={5}
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      required
                      style={{
                        width: '100%',
                        padding: '12px 16px',
                        borderRadius: 4,
                        border: `1px solid ${fieldErrors.message ? ERROR_COLOR : BORDER}`,
                        backgroundColor: SURFACE,
                        color: TEXT,
                        fontSize: '0.9rem',
                        outline: 'none',
                        resize: 'vertical',
                        transition: 'border-color 0.3s, box-shadow 0.3s',
                        fontFamily: ff.body,
                        boxSizing: 'border-box',
                      }}
                      onFocus={(e) => (e.target.style.borderColor = INPUT_FOCUS_BORDER)}
                      onBlur={(e) => (e.target.style.borderColor = fieldErrors.message ? ERROR_COLOR : BORDER)}
                    />
                    {fieldErrors.message && (
                      <div style={{ color: ERROR_COLOR, fontSize: '0.75rem', marginTop: 6 }}>{fieldErrors.message}</div>
                    )}
                  </div>
                  {formError && (
                    <div
                      style={{
                        padding: '10px 14px',
                        borderRadius: 4,
                        border: `1px solid ${ERROR_COLOR}`,
                        backgroundColor: 'rgba(239,68,68,0.08)',
                        color: ERROR_COLOR,
                        fontSize: '0.82rem',
                      }}
                    >
                      {formError}
                    </div>
                  )}
                  <button
                    type="submit"
                    disabled={submitting}
                    className="btn-primary"
                    style={{
                      backgroundColor: PRIMARY_ACCENT,
                      color: BG,
                      padding: '14px 28px',
                      borderRadius: 4,
                      fontFamily: ff.mono,
                      fontSize: '0.82rem',
                      fontWeight: 700,
                      border: 'none',
                      cursor: submitting ? 'default' : 'pointer',
                      letterSpacing: '0.05em',
                      alignSelf: 'flex-start',
                      opacity: submitting ? 0.7 : 1,
                    }}
                    onMouseEnter={(e) => !submitting && ((e.target as HTMLElement).style.backgroundColor = ACCENT_HOVER)}
                    onMouseLeave={(e) => !submitting && ((e.target as HTMLElement).style.backgroundColor = PRIMARY_ACCENT)}
                  >
                    {submitting ? 'Sending…' : 'Send message →'}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer
        style={{
          padding: '2rem 24px',
          borderTop: `1px solid ${BORDER}`,
          backgroundColor: BG,
        }}
      >
        <div
          style={{
            maxWidth: 1120,
            margin: '0 auto',
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
          }}
        >
          <div style={{ fontFamily: ff.mono, fontSize: '0.7rem', color: TEXT_FAINT, letterSpacing: '0.05em' }}>
            © {new Date().getFullYear()} {profile.name} {profile.surname} · Built with React + TypeScript
          </div>
          <div
            style={{
              fontFamily: ff.mono,
              fontSize: '0.7rem',
              color: PRIMARY_ACCENT,
              letterSpacing: '0.08em',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <span
              className="status-dot"
              style={{
                width: 6,
                height: 6,
                borderRadius: '50%',
                backgroundColor: PRIMARY_ACCENT,
                display: 'inline-block',
              }}
            />
            {profile.status.toUpperCase()}
          </div>
        </div>
      </footer>
      {scrolled && (
        <button
          className="back-to-top"
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          aria-label="Back to top"
        >
          ↑
        </button>
      )}
    </div>
  )
}

// ── Sub-components ──

function SectionLabel({ children, visible = true }: { children: React.ReactNode; visible?: boolean }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        fontFamily: ff.mono,
        fontSize: '0.7rem',
        color: PRIMARY_ACCENT,
        letterSpacing: '0.18em',
        marginBottom: 6,
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateX(0)' : 'translateX(-20px)',
        transition: 'all 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
      }}
    >
      <span style={{ width: visible ? 20 : 0, height: 1, backgroundColor: PRIMARY_ACCENT, display: 'inline-block', flexShrink: 0, transition: 'width 0.6s cubic-bezier(0.16, 1, 0.3, 1) 0.2s' }} />
      {(children as string).toUpperCase()}
    </div>
  )
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <label
      style={{
        display: 'block',
        fontFamily: ff.mono,
        fontSize: '0.65rem',
        color: LABEL_COLOR,
        letterSpacing: '0.12em',
        marginBottom: 7,
      }}
    >
      {(children as string).toUpperCase()}
    </label>
  )
}

function ProjectCard({ project, delay = 0, visible = true }: { project: Project; delay?: number; visible?: boolean }) {
  const [hov, setHov] = useState(false)
  return (
    <div
      className="project-card"
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        borderRadius: 8,
        overflow: 'hidden',
        border: `1px solid ${hov ? BORDER_BRIGHT : BORDER}`,
        backgroundColor: SURFACE,
        transform: hov ? 'translateY(-8px)' : 'translateY(0)',
        display: 'flex',
        flexDirection: 'column',
        cursor: project.live_url || project.github_url ? 'pointer' : 'default',
        opacity: visible ? 1 : 0,
        animation: visible ? `slideInStagger 0.7s cubic-bezier(0.16, 1, 0.3, 1) ${delay}s both` : 'none',
      }}
      onClick={() => {
        const url = project.live_url || project.github_url
        if (url) window.open(url, '_blank', 'noreferrer')
      }}
    >
      <div style={{ aspectRatio: '16/9', overflow: 'hidden', backgroundColor: IMG_PLACEHOLDER, position: 'relative' }}>
        <img
          className="project-image"
          src={project.image_url}
          alt={project.title}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            display: 'block',
            transform: hov ? 'scale(1.08)' : 'scale(1)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: `linear-gradient(180deg, transparent 40%, var(--card-overlay-end) 100%)`,
          }}
        />
        <div
          style={{
            position: 'absolute',
            top: 12,
            left: 12,
            fontFamily: ff.mono,
            fontSize: '0.62rem',
            color: PRIMARY_ACCENT,
            letterSpacing: '0.1em',
            backgroundColor: OVERLAY_BG,
            padding: '3px 8px',
            borderRadius: 2,
          }}
        >
          {project.type.toUpperCase()}
        </div>
        <div
          style={{
            position: 'absolute',
            top: 12,
            right: 12,
            fontFamily: ff.mono,
            fontSize: '0.62rem',
            color: TEXT_FAINT,
            backgroundColor: OVERLAY_BG,
            padding: '3px 8px',
            borderRadius: 2,
          }}
        >
          {project.year}
        </div>
      </div>
      <div style={{ padding: '1.25rem', flex: 1, display: 'flex', flexDirection: 'column' }}>
        <h3
          style={{
            fontFamily: ff.display,
            fontWeight: 700,
            fontSize: '1.15rem',
            color: TEXT,
            marginBottom: 4,
          }}
        >
          {project.title}
        </h3>
        <p style={{ fontFamily: ff.mono, fontSize: '0.72rem', color: PRIMARY_ACCENT, marginBottom: 10 }}>{project.tagline}</p>
        <p style={{ fontSize: '0.85rem', color: TEXT_DIM, lineHeight: 1.65, marginBottom: 14, flex: 1 }}>
          {project.description}
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 14 }}>
          {project.tech.map((t) => (
            <span
              key={t}
              style={{
                fontFamily: ff.mono,
                fontSize: '0.65rem',
                color: TEXT_FAINT,
                backgroundColor: BG_FAINT,
                border: `1px solid ${BORDER}`,
                padding: '2px 8px',
                borderRadius: 2,
                transition: 'border-color 0.2s, color 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = BORDER_BRIGHT
                e.currentTarget.style.color = TEXT
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = BORDER
                e.currentTarget.style.color = TEXT_FAINT
              }}
            >
              {t}
            </span>
          ))}
        </div>
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '4px 16px',
            borderTop: `1px solid ${BORDER}`,
            paddingTop: 12,
          }}
        >
          {project.metrics.map((m) => (
            <span key={m} style={{ fontFamily: ff.mono, fontSize: '0.62rem', color: TEXT_FAINT, letterSpacing: '0.05em' }}>
              {m}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}

function ExperienceCard({ exp, defaultOpen, delay = 0, visible = true }: { exp: Experience; defaultOpen: boolean; delay?: number; visible?: boolean }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div
      className="exp-card"
      style={{
        borderRadius: 8,
        border: `1px solid ${open ? BORDER_BRIGHT : BORDER}`,
        backgroundColor: SURFACE,
        overflow: 'hidden',
        transition: 'border-color 0.3s, box-shadow 0.3s',
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(30px)',
        transitionProperty: 'opacity, transform, border-color, box-shadow',
        transitionDuration: '0.6s',
        transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)',
        transitionDelay: `${delay}s`,
      }}
    >
      <button
        onClick={() => setOpen(!open)}
        style={{
          width: '100%',
          padding: '1.5rem',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          textAlign: 'left',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 16,
        }}
      >
        <div>
          <div
            style={{
              fontFamily: ff.display,
              fontWeight: 700,
              fontSize: '1.05rem',
              color: TEXT,
              marginBottom: 6,
            }}
          >
            {exp.role}
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 14px', alignItems: 'center' }}>
            <span style={{ fontFamily: ff.mono, fontSize: '0.78rem', color: PRIMARY_ACCENT }}>{exp.company}</span>
            <span style={{ fontFamily: ff.mono, fontSize: '0.7rem', color: TEXT_FAINT }}>{exp.period}</span>
            <span style={{ fontFamily: ff.mono, fontSize: '0.7rem', color: TEXT_FAINT }}>{exp.location}</span>
          </div>
        </div>
        <span
          style={{
            color: PRIMARY_ACCENT,
            fontSize: '1.3rem',
            lineHeight: 1,
            transition: 'transform 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
            transform: open ? 'rotate(45deg)' : 'rotate(0deg)',
            flexShrink: 0,
          }}
        >
          +
        </span>
      </button>
      <div
        style={{
          maxHeight: open ? 600 : 0,
          overflow: 'hidden',
          transition: 'max-height 0.5s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        <div style={{ padding: '0 1.5rem 1.5rem' }}>
          <ul style={{ margin: '0 0 1.25rem', padding: 0, listStyle: 'none' }}>
            {exp.points.map((pt, i) => (
              <li
                key={i}
                style={{
                  display: 'flex',
                  gap: 10,
                  alignItems: 'flex-start',
                  padding: '7px 0',
                  fontSize: '0.88rem',
                  color: TEXT_DIM,
                  lineHeight: 1.65,
                  borderBottom: i < exp.points.length - 1 ? `1px solid ${LIST_BORDER}` : 'none',
                  opacity: open ? 1 : 0,
                  transform: open ? 'translateX(0)' : 'translateX(-10px)',
                  transition: `opacity 0.4s ease ${i * 0.08}s, transform 0.4s ease ${i * 0.08}s`,
                }}
              >
                <span style={{ color: PRIMARY_ACCENT, flexShrink: 0, marginTop: 3, fontSize: '0.65rem' }}>▶</span>
                {pt}
              </li>
            ))}
          </ul>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {exp.tech.map((t) => (
              <span
                key={t}
                style={{
                  fontFamily: ff.mono,
                  fontSize: '0.68rem',
                  color: TEXT_FAINT,
                  backgroundColor: BG_FAINTER,
                  border: `1px solid ${BORDER}`,
                  padding: '3px 10px',
                  borderRadius: 3,
                  transition: 'border-color 0.2s, color 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = BORDER_BRIGHT
                  e.currentTarget.style.color = TEXT
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = BORDER
                  e.currentTarget.style.color = TEXT_FAINT
                }}
              >
                {t}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function ContactLink({ label, value, delay = 0, visible = true }: { label: string; value: string; delay?: number; visible?: boolean }) {
  const [hov, setHov] = useState(false)
  return (
    <div
      className="contact-link"
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        padding: '14px 18px',
        borderRadius: 6,
        border: `1px solid ${hov ? 'var(--contact-hover-border)' : BORDER_FAINT}`,
        backgroundColor: SURFACE,
        cursor: 'pointer',
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateX(0)' : 'translateX(-20px)',
        transition: `opacity 0.5s cubic-bezier(0.16, 1, 0.3, 1) ${0.4 + delay}s, transform 0.5s cubic-bezier(0.16, 1, 0.3, 1) ${0.4 + delay}s, border-color 0.3s, box-shadow 0.3s`,
      }}
    >
      <div
        style={{
          fontFamily: ff.mono,
          fontSize: '0.62rem',
          color: PRIMARY_ACCENT,
          letterSpacing: '0.12em',
          minWidth: 64,
        }}
      >
        {label.toUpperCase()}
      </div>
      <div style={{ fontSize: '0.9rem', color: TEXT }}>{value}</div>
    </div>
  )
}

const TESTIMONIALS = [
  {
    name: 'Alex Carter',
    role: 'CTO',
    company: 'Buildware Technologies',
    avatar: 'AC',
    text: "Henriette delivered the microservices architecture ahead of schedule with zero critical bugs. Her attention to detail and proactive communication made her one of the best junior developers I've worked with.",
    rating: 5,
  },
  {
    name: 'Sarah Kim',
    role: 'Lead Engineer',
    company: 'Novalign Studio',
    avatar: 'SK',
    text: 'Working with Henriette on our fintech dashboard was a great experience. She has a solid grasp of React patterns and writes clean, maintainable code. She improved our Lighthouse score significantly on her own initiative.',
    rating: 5,
  },
  {
    name: 'Marcus Johnson',
    role: 'Product Manager',
    company: 'Buildware Technologies',
    avatar: 'MJ',
    text: 'Henriette consistently shipped features on time and communicated blockers early. Her automated reporting feature saved our clients hours every week — a real impact player on the team.',
    rating: 5,
  },
  {
    name: 'Priya Nair',
    role: 'Senior Developer',
    company: 'Freelance Collaborator',
    avatar: 'PN',
    text: 'I collaborated with Henriette on a side project and was blown away by her API design skills. She built a clean, well-documented REST API that was a pleasure to integrate with. Would absolutely work together again.',
    rating: 5,
  },
]

function TestimonialCard({
  testimonial,
  delay = 0,
  visible = true,
}: {
  testimonial: (typeof TESTIMONIALS)[0]
  delay?: number
  visible?: boolean
}) {
  const [hov, setHov] = useState(false)
  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        padding: '1.75rem',
        borderRadius: 10,
        border: `1px solid ${hov ? BORDER_BRIGHT : BORDER}`,
        backgroundColor: SURFACE,
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(24px)',
        transition: `opacity 0.6s cubic-bezier(0.16,1,0.3,1) ${delay}s, transform 0.6s cubic-bezier(0.16,1,0.3,1) ${delay}s, border-color 0.3s`,
        cursor: 'default',
      }}
    >
      {/* Stars */}
      <div style={{ display: 'flex', gap: 4 }}>
        {Array.from({ length: testimonial.rating }).map((_, i) => (
          <svg key={i} width="14" height="14" viewBox="0 0 24 24" fill={PRIMARY_ACCENT}>
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
          </svg>
        ))}
      </div>
      {/* Quote */}
      <p style={{ fontSize: '0.92rem', color: TEXT_DIM, lineHeight: 1.75, fontStyle: 'italic', flex: 1 }}>
        "{testimonial.text}"
      </p>
      {/* Author */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, paddingTop: 14, borderTop: `1px solid ${BORDER}` }}>
        <div
          style={{
            width: 44,
            height: 44,
            borderRadius: '50%',
            backgroundColor: ACCENT_SUBTLE_BG,
            border: `1px solid ${BORDER_BRIGHT}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: ff.mono,
            fontSize: '0.68rem',
            color: PRIMARY_ACCENT,
            fontWeight: 700,
            flexShrink: 0,
            letterSpacing: '0.04em',
          }}
        >
          {testimonial.avatar}
        </div>
        <div>
          <div style={{ fontFamily: ff.display, fontWeight: 700, fontSize: '0.92rem', color: TEXT }}>
            {testimonial.name}
          </div>
          <div style={{ fontFamily: ff.mono, fontSize: '0.68rem', color: TEXT_FAINT, marginTop: 2 }}>
            {testimonial.role} · {testimonial.company}
          </div>
        </div>
      </div>
    </div>
  )
}
