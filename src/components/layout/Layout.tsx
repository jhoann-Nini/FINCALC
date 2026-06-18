import { NavLink } from 'react-router-dom'
import { useState, ReactNode } from 'react'
import {
  TrendingUp,
  BarChart2,
  ArrowLeftRight,
  Table2,
  Sigma,
  ArrowUpRight,
  BookOpen,
  Menu,
  Sun,
  Moon,
  Sparkles,
} from 'lucide-react'
import { useTheme } from '../../hooks/useTheme'
import Chatbot from '../ui/Chatbot'
import AppGuide from '../ui/AppGuide'

const NAV = [
  {
    group: 'IA',
    items: [
      { to: '/resolver', label: 'Resolver con IA', icon: Sparkles },
    ],
  },
  {
    group: 'Calculadoras',
    items: [
      { to: '/tasas', label: 'Conversión de Tasas', icon: ArrowLeftRight },
      { to: '/simple', label: 'Interés Simple', icon: TrendingUp },
      { to: '/compuesto', label: 'Interés Compuesto', icon: BarChart2 },
      { to: '/anualidades', label: 'Anualidades', icon: Sigma },
      { to: '/amortizacion', label: 'Amortización', icon: Table2 },
      { to: '/inflacion', label: 'Inflación & Tasas Reales', icon: ArrowUpRight },
    ],
  },
  {
    group: 'Aprender',
    items: [{ to: '/wiki', label: 'Wiki de Conceptos', icon: BookOpen }],
  },
]

export default function Layout({ children }: { children: ReactNode }) {
  const [sideOpen, setSideOpen] = useState(false)
  const { theme, toggle } = useTheme()

  return (
    <div className="flex min-h-screen" style={{ background: 'var(--bg)' }}>
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex flex-col transition-transform duration-300
          ${sideOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0 lg:relative lg:flex`}
        style={{
          width: 240,
          minWidth: 240,
          background: 'var(--surface)',
          borderRight: '1px solid var(--border)',
        }}
      >
        {/* Logo + theme toggle */}
        <div
          className="flex items-center justify-between px-5 py-4 border-b"
          style={{ borderColor: 'var(--border)' }}
        >
          <NavLink to="/" className="flex items-center gap-3" style={{ textDecoration: 'none' }}>
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold"
              style={{ background: 'var(--accent)', color: '#fff' }}
            >
              <span style={{ fontFamily: 'Crimson Pro, serif', fontSize: 16 }}>Σ</span>
            </div>
            <span
              style={{
                fontFamily: 'Crimson Pro, serif',
                fontWeight: 600,
                fontSize: 18,
                color: 'var(--text)',
                letterSpacing: '-0.02em',
              }}
            >
              Fin<span style={{ color: 'var(--accent)' }}>Calc</span>
            </span>
          </NavLink>
          <button
            onClick={toggle}
            aria-label={theme === 'dark' ? 'Cambiar a tema claro' : 'Cambiar a tema oscuro'}
            title={theme === 'dark' ? 'Tema claro' : 'Tema oscuro'}
            className="p-2 rounded-lg transition-all duration-150 cursor-pointer flex items-center justify-center"
            style={{
              color: 'var(--muted)',
              border: '1px solid var(--border)',
              background: 'transparent',
            }}
          >
            {theme === 'dark' ? (
              <Sun size={15} strokeWidth={1.75} />
            ) : (
              <Moon size={15} strokeWidth={1.75} />
            )}
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-4 px-3">
          {NAV.map(({ group, items }) => (
            <div key={group} className="mb-5">
              <p
                className="px-2 mb-1 text-xs font-semibold uppercase tracking-widest"
                style={{ color: 'var(--muted)', fontFamily: 'JetBrains Mono' }}
              >
                {group}
              </p>
              {items.map(({ to, label, icon: Icon }) => (
                <NavLink
                  key={to}
                  to={to}
                  onClick={() => setSideOpen(false)}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2 rounded-lg mb-0.5 text-sm transition-all duration-150 cursor-pointer
                    ${isActive ? 'font-medium' : 'hover:opacity-80'}`
                  }
                  style={({ isActive }) =>
                    isActive
                      ? {
                          background: 'var(--accent-bg)',
                          color: 'var(--accent)',
                          border: '1px solid var(--accent-border)',
                          textDecoration: 'none',
                        }
                      : {
                          color: 'var(--muted)',
                          textDecoration: 'none',
                          border: '1px solid transparent',
                        }
                  }
                >
                  <Icon size={15} strokeWidth={1.75} />
                  {label}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>

        {/* Footer */}
        <div className="px-4 py-3 border-t" style={{ borderColor: 'var(--border)' }}>
          <span className="text-xs" style={{ color: 'var(--muted)', fontFamily: 'JetBrains Mono' }}>
            Ing. Económica · 2026
          </span>
        </div>
      </aside>

      {/* Mobile overlay */}
      {sideOpen && (
        <div
          className="fixed inset-0 z-30 lg:hidden"
          style={{ background: 'rgba(0,0,0,0.4)' }}
          onClick={() => setSideOpen(false)}
        />
      )}

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile topbar */}
        <header
          className="lg:hidden flex items-center gap-4 px-4 py-3 border-b"
          style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}
        >
          <button
            onClick={() => setSideOpen(true)}
            className="p-2.5 rounded-lg min-w-[44px] min-h-[44px] flex items-center justify-center cursor-pointer"
            style={{ color: 'var(--muted)', background: 'transparent', border: 'none' }}
            aria-label="Abrir menú"
          >
            <Menu size={18} strokeWidth={1.75} />
          </button>
          <span
            style={{
              fontFamily: 'Crimson Pro, serif',
              fontWeight: 600,
              fontSize: 18,
              color: 'var(--text)',
            }}
          >
            Fin<span style={{ color: 'var(--accent)' }}>Calc</span>
          </span>
          <div className="ml-auto">
            <button
              onClick={toggle}
              aria-label={theme === 'dark' ? 'Tema claro' : 'Tema oscuro'}
              className="p-2 rounded-lg cursor-pointer"
              style={{
                color: 'var(--muted)',
                background: 'transparent',
                border: '1px solid var(--border)',
              }}
            >
              {theme === 'dark' ? (
                <Sun size={14} strokeWidth={1.75} />
              ) : (
                <Moon size={14} strokeWidth={1.75} />
              )}
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>

      <Chatbot />
      <AppGuide />
    </div>
  )
}