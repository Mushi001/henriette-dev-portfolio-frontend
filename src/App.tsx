import { useState, useEffect, useRef, useCallback } from 'react'

const NAV_LINKS = ['About', 'Skills', 'Process', 'Projects', 'Experience', 'Contact']

const PROCESS = [
  { number: '01', title: 'Understand the problem', text: 'I start with the user, the business goal, and the constraints—so the solution solves the right problem.' },
  { number: '02', title: 'Build in small loops', text: 'I turn ideas into testable slices, share progress early, and use feedback before complexity has time to grow.' },
  { number: '03', title: 'Ship with confidence', text: 'I finish with accessibility, performance, testing, and clear documentation—not just a working happy path.' },
]

const SKILLS = [
  { name: 'React', cat: 'Frontend' },
  { name: 'Next.js', cat: 'Frontend' },
  { name: 'Tailwind CSS', cat: 'Frontend' },
  { name: 'TypeScript', cat: 'Language' },
  { name: 'JavaScript', cat: 'Language' },
  { name: 'Python', cat: 'Language' },
  { name: 'Node.js', cat: 'Backend' },
  { name: 'Express', cat: 'Backend' },
  { name: 'FastAPI', cat: 'Backend' },
  { name: 'PostgreSQL', cat: 'Database' },
  { name: 'MongoDB', cat: 'Database' },
  { name: 'Redis', cat: 'Database' },
  { name: 'Docker', cat: 'DevOps' },
  { name: 'AWS', cat: 'DevOps' },
  { name: 'Git', cat: 'DevOps' },
  { name: 'GraphQL', cat: 'API' },
  { name: 'REST APIs', cat: 'API' },
]

const PROJECTS = [
  {
    title: 'Taskflow',
    tagline: 'Real-time collaborative PM tool',
    description:
      'Kanban boards with drag-and-drop, WebSocket live updates, and team-based access control. Serving 1,200+ active users across 80+ organizations.',
    tech: ['React', 'Node.js', 'Socket.io', 'PostgreSQL', 'Redis'],
    type: 'Full Stack',
    year: '2024',
    imgId: '1611224923853-80b023f02d71',
    metrics: ['1.2k users', '99.2% uptime', '< 80ms p95'],
  },
  {
    title: 'MealKit API',
    tagline: 'Meal-kit delivery backend',
    description:
      'RESTful API powering inventory tracking, subscriptions, order management, and a collaborative filtering recommendation engine serving 50k daily requests.',
    tech: ['Python', 'FastAPI', 'PostgreSQL', 'Docker', 'Redis'],
    type: 'Backend',
    year: '2024',
    imgId: '1498837167922-ddd27525d352',
    metrics: ['50k req/day', '28ms avg resp', 'Docker-deployed'],
  },
  {
    title: 'DevMetrics',
    tagline: 'Developer productivity dashboard',
    description:
      'Aggregates GitHub activity, PR reviews, and WakaTime coding sessions into a personal analytics hub with streak tracking and weekly reports.',
    tech: ['Next.js', 'TypeScript', 'MongoDB', 'GitHub API'],
    type: 'Full Stack',
    year: '2023',
    imgId: '1551288049-bebda4e38f71',
    metrics: ['Open source', '340 ★ GitHub', '12 integrations'],
  },
]

const EXPERIENCE = [
  {
    role: 'Junior Full Stack Developer',
    company: 'Buildware Technologies',
    period: 'Jan 2024 – Present',
    location: 'Remote · San Francisco, CA',
    points: [
      'Built and maintained 6 microservices for a B2B SaaS platform with 4,000+ clients',
      'Reduced average API response time by 34% through query optimization and Redis caching',
      'Shipped an automated report-generation feature that saves clients 3+ hours per week',
      'Mentored 2 engineering interns on React best practices and code review workflows',
    ],
    tech: ['React', 'Node.js', 'PostgreSQL', 'Docker', 'AWS'],
  },
  {
    role: 'Software Engineering Intern',
    company: 'Novalign Studio',
    period: 'Jun 2023 – Dec 2023',
    location: 'Hybrid · New York, NY',
    points: [
      'Developed 15+ reusable UI components for a fintech analytics dashboard',
      'Integrated Stripe payment API to handle subscription billing for 800+ daily active users',
      'Improved Lighthouse performance score from 61 to 89 for the client-facing application',
      'Wrote end-to-end tests with Playwright achieving 87% coverage across critical flows',
    ],
    tech: ['Next.js', 'TypeScript', 'Stripe', 'MongoDB', 'Playwright'],
  },
]

const PRIMARY_ACCENT = '#3B82F6'
const BG = '#0D1117'
const SURFACE = '#161B22'
const SURFACE2 = '#0D1117'
const TEXT = '#FFFFFF'
const TEXT_DIM = '#9CA3AF'
const TEXT_FAINT = 'rgba(156, 163, 175, 0.5)'
const BORDER = 'rgba(255,255,255,0.1)'
const BORDER_BRIGHT = 'rgba(59,130,246,0.3)'

const ff = {
  display: "'DM Sans', sans-serif",
  body: "'DM Sans', sans-serif",
  mono: "'DM Sans', sans-serif",
}

// ── Custom Hooks ──

function useScrollReveal(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true)
          obs.unobserve(el)
        }
      },
      { threshold }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [threshold])

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

export default function App() {
  const [activeSection, setActiveSection] = useState('')
  const [menuOpen, setMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [formData, setFormData] = useState({ name: '', email: '', message: '' })
  const [submitted, setSubmitted] = useState(false)
  const [scrollProgress, setScrollProgress] = useState(0)

  // Scroll reveal refs
  const statsReveal = useScrollReveal(0.3)
  const aboutReveal = useScrollReveal()
  const skillsReveal = useScrollReveal()
  const processReveal = useScrollReveal()
  const projectsReveal = useScrollReveal()
  const experienceReveal = useScrollReveal()
  const contactReveal = useScrollReveal()

  // Counting stats
  const yearsCount = useCountUp(2, 1800, statsReveal.visible)
  const projectsCount = useCountUp(18, 2000, statsReveal.visible)
  const techCount = useCountUp(17, 2200, statsReveal.visible)
  const reposCount = useCountUp(34, 2400, statsReveal.visible)

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

  const scrollTo = (id: string) => {
    document.getElementById(id.toLowerCase())?.scrollIntoView({ behavior: 'smooth' })
    setMenuOpen(false)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Save to localStorage for admin portal
    const STORAGE_KEY = 'portfolio_messages'
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      const existing = raw ? JSON.parse(raw) : []
      const newMessage = {
        id: crypto.randomUUID(),
        name: formData.name,
        email: formData.email,
        message: formData.message,
        timestamp: new Date().toISOString(),
        read: false,
      }
      existing.push(newMessage)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(existing))
    } catch {
      // Silently fail — message still shows success UI
    }
    setSubmitted(true)
  }

  return (
    <div style={{ backgroundColor: BG, color: TEXT, fontFamily: ff.body, minHeight: '100vh' }}>
      <div className="scroll-progress" style={{ transform: `scaleX(${scrollProgress / 100})` }} aria-hidden="true" />
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
          backgroundColor: scrolled ? 'rgba(12,12,20,0.88)' : 'transparent',
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
              onMouseEnter={(e) => ((e.target as HTMLElement).style.backgroundColor = '#2563eb')}
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
            backgroundImage:
              'linear-gradient(rgba(59,130,246,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(59,130,246,0.04) 1px, transparent 1px)',
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
            background: 'radial-gradient(circle, rgba(59,130,246,0.1) 0%, transparent 70%)',
            pointerEvents: 'none',
          }}
        />
        {/* Background watermark text */}
        <div
          className="hero-watermark watermark-text"
          style={{
            position: 'absolute',
            bottom: '-2%',
            left: '50%',
            transform: 'translateX(-50%)',
            fontFamily: ff.display,
            fontWeight: 800,
            fontSize: 'clamp(4rem, 14vw, 13rem)',
            letterSpacing: '-0.04em',
            color: 'transparent',
            WebkitTextStroke: '1px rgba(59,130,246,0.08)',
            whiteSpace: 'nowrap',
            userSelect: 'none',
            pointerEvents: 'none',
            lineHeight: 1,
          }}
        >
          Mushimiyimana
        </div>
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
            FULL STACK DEVELOPER · 2 YEARS EXPERIENCE
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
            <span className="hero-name-first" style={{ fontSize: 'clamp(3.5rem, 9vw, 7.5rem)', color: TEXT, display: 'block' }}>Henriette</span>
            <span className="hero-name-last" style={{ fontSize: 'clamp(2rem, 5.5vw, 4.8rem)', color: 'rgba(59,130,246,0.7)', display: 'block' }}>Mushimiyimana</span>
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
            I build fast, reliable full-stack applications — from polished React UIs to well-structured APIs and cloud deployments. Currently at{' '}
            <span style={{ color: TEXT }}>Buildware Technologies</span>.
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
              onMouseEnter={(e) => ((e.target as HTMLElement).style.backgroundColor = '#2563eb')}
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
                border: '1px solid rgba(240,240,248,0.18)',
                cursor: 'pointer',
                letterSpacing: '0.05em',
              }}
              onMouseEnter={(e) => {
                ;(e.target as HTMLElement).style.borderColor = PRIMARY_ACCENT
                ;(e.target as HTMLElement).style.color = PRIMARY_ACCENT
              }}
              onMouseLeave={(e) => {
                ;(e.target as HTMLElement).style.borderColor = 'rgba(240,240,248,0.18)'
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
              <p style={{ color: TEXT_DIM, lineHeight: 1.8, marginBottom: '1rem', fontSize: '0.95rem' }}>
                I'm Henriette, a full-stack developer based in San Francisco. I got into programming during university and
                haven't stopped since. In two years of professional work I've gone from shipping my first React
                components to designing and owning entire service architectures.
              </p>
              <p style={{ color: TEXT_DIM, lineHeight: 1.8, marginBottom: '2rem', fontSize: '0.95rem' }}>
                I care deeply about code that's readable, systems that scale cleanly, and products that feel polished to
                use. When I'm not writing code, I'm usually contributing to open source or hiking the Marin Headlands.
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                {[
                  { label: 'Location', value: 'San Francisco, CA' },
                  { label: 'Education', value: 'B.Sc. CS · UC Davis' },
                  { label: 'Status', value: 'Open to offers' },
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

      {/* ── Skills ── */}
      <section id="skills" style={{ padding: '100px 24px', backgroundColor: BG }}>
        <div style={{ maxWidth: 1120, margin: '0 auto' }}>
          <div ref={skillsReveal.ref}>
            <SectionLabel visible={skillsReveal.visible}>Skills</SectionLabel>
          </div>
          <div className="grid md:grid-cols-2" style={{ gap: 64, marginTop: 48, alignItems: 'start' }}>
            <div className={`reveal-left ${skillsReveal.visible ? 'visible' : ''}`}>
              <h2
                style={{
                  fontFamily: ff.display,
                  fontSize: 'clamp(1.8rem, 3vw, 2.6rem)',
                  fontWeight: 800,
                  letterSpacing: '-0.03em',
                  lineHeight: 1.1,
                  marginBottom: '1rem',
                }}
              >
                Tools I reach<br />for every day.
              </h2>
              <p style={{ color: TEXT_DIM, lineHeight: 1.75, fontSize: '0.95rem', maxWidth: 380 }}>
                Two years of deliberate practice across the full stack — from pixel-pushing in React to debugging slow
                Postgres queries at midnight.
              </p>
            </div>
            <div className={`reveal-right ${skillsReveal.visible ? 'visible' : ''}`}>
              {['Frontend', 'Language', 'Backend', 'Database', 'DevOps', 'API'].map((cat, catIndex) => {
                const catSkills = SKILLS.filter((s) => s.cat === cat)
                if (!catSkills.length) return null
                return (
                  <div key={cat} style={{ marginBottom: 20, opacity: skillsReveal.visible ? 1 : 0, transform: skillsReveal.visible ? 'translateY(0)' : 'translateY(15px)', transition: `all 0.5s cubic-bezier(0.16, 1, 0.3, 1) ${0.2 + catIndex * 0.1}s` }}>
                    <div
                      style={{
                        fontFamily: ff.mono,
                        fontSize: '0.65rem',
                        color: 'rgba(59,130,246,0.65)',
                        letterSpacing: '0.14em',
                        marginBottom: 8,
                      }}
                    >
                      {cat.toUpperCase()}
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      {catSkills.map((skill, si) => (
                        <SkillTag key={skill.name} name={skill.name} delay={0.3 + catIndex * 0.1 + si * 0.05} visible={skillsReveal.visible} />
                      ))}
                    </div>
                  </div>
                )
              })}
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
            {PROCESS.map((item, index) => (
              <article
                className="process-card"
                key={item.number}
                style={{
                  opacity: processReveal.visible ? 1 : 0,
                  transform: processReveal.visible ? 'translateY(0)' : 'translateY(24px)',
                  transitionDelay: `${index * 0.1}s`,
                }}
              >
                <div className="process-number">{item.number}</div>
                <h3>{item.title}</h3>
                <p>{item.text}</p>
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
              href="#"
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
            {PROJECTS.map((p, i) => (
              <ProjectCard key={p.title} project={p} delay={i * 0.15} visible={projectsReveal.visible} />
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
            {EXPERIENCE.map((exp, i) => (
              <ExperienceCard key={exp.company} exp={exp} defaultOpen={i === 0} delay={i * 0.15} visible={experienceReveal.visible} />
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
                  { label: 'Email', value: 'henriettemayor@gmail.com' },
                  { label: 'GitHub', value: 'github.com/Mushi001' },
                  { label: 'LinkedIn', value: 'linkedin.com/in/mushimiyimana-henriette' },
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
                    border: `1px solid rgba(59,130,246,0.2)`,
                    backgroundColor: SURFACE,
                    animation: 'scaleIn 0.5s cubic-bezier(0.16, 1, 0.3, 1) both',
                  }}
                >
                  <div
                    style={{
                      width: 56,
                      height: 56,
                      borderRadius: '50%',
                      backgroundColor: 'rgba(59,130,246,0.1)',
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
                          border: `1px solid rgba(255,255,255,0.1)`,
                          backgroundColor: SURFACE,
                          color: TEXT,
                          fontSize: '0.9rem',
                          outline: 'none',
                          transition: 'border-color 0.3s, box-shadow 0.3s',
                          boxSizing: 'border-box',
                          fontFamily: ff.body,
                        }}
                        onFocus={(e) => (e.target.style.borderColor = 'rgba(59,130,246,0.5)')}
                        onBlur={(e) => (e.target.style.borderColor = 'rgba(255,255,255,0.1)')}
                      />
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
                        border: `1px solid rgba(255,255,255,0.1)`,
                        backgroundColor: SURFACE,
                        color: TEXT,
                        fontSize: '0.9rem',
                        outline: 'none',
                        resize: 'vertical',
                        transition: 'border-color 0.3s, box-shadow 0.3s',
                        fontFamily: ff.body,
                        boxSizing: 'border-box',
                      }}
                      onFocus={(e) => (e.target.style.borderColor = 'rgba(59,130,246,0.5)')}
                      onBlur={(e) => (e.target.style.borderColor = 'rgba(255,255,255,0.1)')}
                    />
                  </div>
                  <button
                    type="submit"
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
                      cursor: 'pointer',
                      letterSpacing: '0.05em',
                      alignSelf: 'flex-start',
                    }}
                    onMouseEnter={(e) => ((e.target as HTMLElement).style.backgroundColor = '#2563eb')}
                    onMouseLeave={(e) => ((e.target as HTMLElement).style.backgroundColor = PRIMARY_ACCENT)}
                  >
                    Send message →
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
            © 2025 Henriette Mushimiyimana · Built with React + TypeScript
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
            OPEN TO WORK
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
        color: 'rgba(240,240,248,0.4)',
        letterSpacing: '0.12em',
        marginBottom: 7,
      }}
    >
      {(children as string).toUpperCase()}
    </label>
  )
}

function SkillTag({ name, delay = 0, visible = true }: { name: string; delay?: number; visible?: boolean }) {
  const [hov, setHov] = useState(false)
  return (
    <span
      className="skill-tag"
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        padding: '5px 12px',
        borderRadius: 3,
        backgroundColor: hov ? 'rgba(59,130,246,0.07)' : SURFACE,
        border: `1px solid ${hov ? BORDER_BRIGHT : BORDER}`,
        fontFamily: ff.mono,
        fontSize: '0.78rem',
        color: hov ? PRIMARY_ACCENT : TEXT,
        cursor: 'default',
        display: 'inline-block',
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0) scale(1)' : 'translateY(10px) scale(0.95)',
        transition: `opacity 0.4s cubic-bezier(0.16, 1, 0.3, 1) ${delay}s, transform 0.4s cubic-bezier(0.16, 1, 0.3, 1) ${delay}s, background-color 0.25s, border-color 0.25s, color 0.25s, box-shadow 0.25s`,
      }}
    >
      {name}
    </span>
  )
}

function ProjectCard({ project, delay = 0, visible = true }: { project: (typeof PROJECTS)[0]; delay?: number; visible?: boolean }) {
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
        cursor: 'pointer',
        opacity: visible ? 1 : 0,
        animation: visible ? `slideInStagger 0.7s cubic-bezier(0.16, 1, 0.3, 1) ${delay}s both` : 'none',
      }}
    >
      <div style={{ aspectRatio: '16/9', overflow: 'hidden', backgroundColor: '#1a1a2e', position: 'relative' }}>
        <img
          className="project-image"
          src={`https://images.unsplash.com/photo-${project.imgId}?w=600&h=340&fit=crop&auto=format`}
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
            background: 'linear-gradient(180deg, transparent 40%, rgba(19,19,31,0.7) 100%)',
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
            backgroundColor: 'rgba(12,12,20,0.75)',
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
            backgroundColor: 'rgba(12,12,20,0.75)',
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
                backgroundColor: 'rgba(255,255,255,0.04)',
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

function ExperienceCard({ exp, defaultOpen, delay = 0, visible = true }: { exp: (typeof EXPERIENCE)[0]; defaultOpen: boolean; delay?: number; visible?: boolean }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div
      className="exp-card"
      style={{
        borderRadius: 8,
        border: `1px solid ${open ? 'rgba(59,130,246,0.2)' : BORDER}`,
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
                  borderBottom: i < exp.points.length - 1 ? `1px solid rgba(255,255,255,0.04)` : 'none',
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
                  backgroundColor: 'rgba(255,255,255,0.03)',
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
        border: `1px solid ${hov ? 'rgba(59,130,246,0.25)' : 'rgba(255,255,255,0.06)'}`,
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
