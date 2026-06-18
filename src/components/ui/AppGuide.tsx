import { useState, useEffect } from 'react'
import {
  X,
  ArrowLeftRight,
  TrendingUp,
  BarChart2,
  Sigma,
  Table2,
  ArrowUpRight,
  BookOpen,
  MessageCircle,
  ChevronRight,
  ChevronLeft,
} from 'lucide-react'

const STEPS = [
  {
    icon: <span style={{ fontSize: 32 }}>👋</span>,
    title: '¡Bienvenido a FinCalc!',
    desc: 'Tu calculadora de Ingeniería Económica. Esta guía rápida te muestra cómo aprovechar la app al máximo.',
    detail: null,
  },
  {
    icon: <ArrowLeftRight size={32} strokeWidth={1.5} />,
    title: 'Conversión de Tasas',
    desc: 'Convierte entre tasas nominales, efectivas, anticipadas y vencidas. Útil para comparar productos financieros.',
    detail: 'Ejemplo: ¿Cuánto es 24% NMV en EA? → ingresá la tasa y la frecuencia, y obtenés el resultado al instante.',
  },
  {
    icon: <TrendingUp size={32} strokeWidth={1.5} />,
    title: 'Interés Simple & Compuesto',
    desc: 'Calculá valor futuro, valor presente, tasa o número de períodos para cualquier operación de interés.',
    detail: 'Ejemplo: ¿Cuánto crecen $5.000.000 al 2% mensual durante 18 meses con capitalización?',
  },
  {
    icon: <Sigma size={32} strokeWidth={1.5} />,
    title: 'Anualidades',
    desc: 'Calculá cuotas, valor presente o futuro de series de pagos iguales (créditos, planes de ahorro, pensiones).',
    detail: 'Soporta anualidades ordinarias, anticipadas y diferidas. Visualizá el diagrama de flujo de caja.',
  },
  {
    icon: <Table2 size={32} strokeWidth={1.5} />,
    title: 'Amortización',
    desc: 'Generá la tabla completa de amortización de cualquier crédito: cuota, interés, capital y saldo período a período.',
    detail: 'Sistemas disponibles: cuota fija (francés) y capital constante (alemán). Exportable a Excel.',
  },
  {
    icon: <ArrowUpRight size={32} strokeWidth={1.5} />,
    title: 'Inflación & Tasas Reales',
    desc: 'Calculá la tasa real usando la ecuación de Fisher. Entendé el impacto de la inflación en tus inversiones.',
    detail: 'Aplica la ecuación exacta (1+iNom) = (1+iReal)×(1+π). Usá el IPC del DANE para Colombia.',
  },
  {
    icon: <BookOpen size={32} strokeWidth={1.5} />,
    title: 'Wiki de Conceptos',
    desc: 'Referencia rápida con definiciones, fórmulas y ejemplos de todos los conceptos del curso.',
    detail: 'Cubrimos: valor del dinero, interés simple/compuesto, tasas, amortización, anualidades, VPN, TIR y todos los factores de capitalización.',
  },
  {
    icon: <MessageCircle size={32} strokeWidth={1.5} />,
    title: 'Tutor IA — Lo nuevo 🚀',
    desc: 'El chatbot flotante (esquina inferior derecha) resuelve ejercicios paso a paso con todos los cálculos explicados.',
    detail: 'Copiá el enunciado del ejercicio tal cual, y el tutor identifica el concepto, aplica la fórmula y muestra cada operación. Funciona directo, sin configuración.',
  },
]

export default function AppGuide() {
  const [open, setOpen] = useState(false)
  const [step, setStep] = useState(0)

  // Mostrar automáticamente la primera vez
  useEffect(() => {
    const seen = localStorage.getItem('fincalc_guide_seen')
    if (!seen) {
      setOpen(true)
    }
  }, [])

  function close() {
    localStorage.setItem('fincalc_guide_seen', '1')
    setOpen(false)
    setStep(0)
  }

  function next() {
    if (step < STEPS.length - 1) setStep(step + 1)
    else close()
  }

  function prev() {
    if (step > 0) setStep(step - 1)
  }

  const current = STEPS[step]
  const isLast = step === STEPS.length - 1

  return (
    <>
      {/* Botón para reabrir */}
      <button
        className="guide-trigger"
        onClick={() => { setOpen(true); setStep(0) }}
        title="Ver guía de la app"
      >
        ?
      </button>

      {/* Modal */}
      {open && (
        <div className="guide-overlay" onClick={close}>
          <div className="guide-modal" onClick={(e) => e.stopPropagation()}>
            {/* Close */}
            <button className="guide-close" onClick={close}><X size={16} /></button>

            {/* Step indicator */}
            <div className="guide-dots">
              {STEPS.map((_, i) => (
                <button
                  key={i}
                  className={`guide-dot ${i === step ? 'active' : ''}`}
                  onClick={() => setStep(i)}
                />
              ))}
            </div>

            {/* Icon */}
            <div className="guide-icon" style={{ color: 'var(--accent)' }}>
              {current.icon}
            </div>

            {/* Content */}
            <h2 className="guide-title">{current.title}</h2>
            <p className="guide-desc">{current.desc}</p>
            {current.detail && (
              <div className="guide-detail">
                <span style={{ color: 'var(--accent)', marginRight: 6 }}>▸</span>
                {current.detail}
              </div>
            )}

            {/* Navigation */}
            <div className="guide-nav">
              <button
                className="guide-btn-sec"
                onClick={prev}
                disabled={step === 0}
              >
                <ChevronLeft size={16} /> Anterior
              </button>
              <span className="guide-counter">{step + 1} / {STEPS.length}</span>
              <button className="guide-btn-pri" onClick={next}>
                {isLast ? '¡Empezar!' : (<>Siguiente <ChevronRight size={16} /></>)}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
