import { Link } from 'react-router-dom'
import { Sparkles, ArrowRight } from 'lucide-react'

const MODULES = [
  {
    to: '/tasas',
    num: '01',
    label: 'Conversión de Tasas',
    desc: 'EA, nominal, anticipada, vencida.',
  },
  {
    to: '/simple',
    num: '02',
    label: 'Interés Simple',
    desc: 'Crecimiento lineal. Calcula F, P, i o n.',
  },
  {
    to: '/compuesto',
    num: '03',
    label: 'Interés Compuesto',
    desc: 'Capitalización. El poder del tiempo.',
  },
  { to: '/anualidades', num: '04', label: 'Anualidades', desc: 'Series uniformes, PV, FV, PMT.' },
  {
    to: '/amortizacion',
    num: '05',
    label: 'Amortización',
    desc: 'Tablas francés y alemán completas.',
  },
  {
    to: '/inflacion',
    num: '06',
    label: 'Inflación & Tasas Reales',
    desc: 'Ecuación de Fisher. Poder adquisitivo.',
  },
  {
    to: '/vpntir',
    num: '07',
    label: 'VPN / TIR',
    desc: 'Evalúa proyectos de inversión. Perfil del VPN y TIR.',
  },
  {
    to: '/gradientes',
    num: '08',
    label: 'Gradientes',
    desc: 'Series que crecen: gradiente aritmético (+G) y geométrico (+g%).',
  },
  {
    to: '/wiki',
    num: '09',
    label: 'Wiki de Conceptos',
    desc: 'Definiciones, fórmulas y ejemplos — expandibles y buscables.',
  },
]

export default function HomePage() {
  return (
    <div className="p-6 lg:p-12 max-w-3xl mx-auto">
      {/* Hero */}
      <div className="mb-14">
        <span
          className="section-chip mb-6 inline-flex opacity-0 animate-fade-up"
          style={{ animationDelay: '0.02s' }}
        >
          <Sparkles size={12} strokeWidth={2} />
          Ingeniería Económica · con IA
        </span>

        <h1
          className="display font-semibold opacity-0 animate-fade-up"
          style={{
            fontSize: 'clamp(2.6rem, 7vw, 4.25rem)',
            color: 'var(--text)',
            letterSpacing: '-0.035em',
            lineHeight: 0.98,
            animationDelay: '0.08s',
            margin: 0,
          }}
        >
          Todo <span style={{ color: 'var(--accent)', fontStyle: 'italic' }}>cuesta</span>.
        </h1>

        <p
          className="opacity-0 animate-fade-up"
          style={{
            color: 'var(--muted)',
            lineHeight: 1.7,
            maxWidth: '46ch',
            margin: '1.5rem 0 0',
            fontSize: '1.05rem',
            animationDelay: '0.16s',
          }}
        >
          El valor del dinero en el tiempo, hecho <strong style={{ color: 'var(--text)', fontWeight: 600 }}>calculable</strong>.
          Calculadoras con lógica exacta, una wiki de conceptos y un tutor con IA para dominar la materia.
        </p>

        <div
          className="flex flex-wrap gap-3 mt-8 opacity-0 animate-fade-up"
          style={{ animationDelay: '0.24s' }}
        >
          <Link
            to="/resolver"
            className="btn-primary inline-flex items-center justify-center gap-2"
            style={{ textDecoration: 'none' }}
          >
            <Sparkles size={16} strokeWidth={2} />
            Resolver con IA
          </Link>
          <Link
            to="/tasas"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-[10px] text-sm font-medium transition-all"
            style={{
              border: '1px solid var(--border)',
              color: 'var(--text)',
              textDecoration: 'none',
              background: 'var(--surface)',
            }}
          >
            Explorar calculadoras
            <ArrowRight size={15} strokeWidth={2} />
          </Link>
        </div>
      </div>

      {/* Module index — editorial numbered rows */}
      <div
        className="opacity-0 animate-fade-up"
        style={{ animationDelay: '0.32s' }}
      >
        <div
          className="flex items-baseline justify-between mb-2 px-1"
          style={{ borderBottom: '1px solid var(--border)', paddingBottom: '0.75rem' }}
        >
          <span
            className="text-xs uppercase tracking-widest"
            style={{ color: 'var(--muted)', fontFamily: 'JetBrains Mono', letterSpacing: '0.18em' }}
          >
            Módulos
          </span>
          <span
            className="text-xs"
            style={{ color: 'var(--muted)', fontFamily: 'JetBrains Mono' }}
          >
            {MODULES.length.toString().padStart(2, '0')}
          </span>
        </div>

        {MODULES.map((m) => (
          <div key={m.to}>
            <Link to={m.to} className="module-row group">
              <span className="module-num">{m.num}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p
                  className="text-sm font-semibold"
                  style={{ color: 'var(--text)', margin: 0, lineHeight: 1.3 }}
                >
                  {m.label}
                </p>
                <p className="text-xs mt-0.5" style={{ color: 'var(--muted)', margin: 0 }}>
                  {m.desc}
                </p>
              </div>
              <ArrowRight className="module-arrow" size={16} strokeWidth={2} />
            </Link>
            <div style={{ height: 1, background: 'var(--border)', margin: '0 0.75rem' }} />
          </div>
        ))}
      </div>
    </div>
  )
}
