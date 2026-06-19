import { useState, useRef, useEffect } from 'react'
import { MessageCircle, X, Trash2, AlertCircle, ExternalLink } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useCarryStore } from '../../store/carryStore'

type Role = 'user' | 'assistant'

interface CalcAction {
  tipo: string
  label: string
  datos: Record<string, number | null>
}

interface Message {
  id: number
  role: Role
  content: string
  calcAction?: CalcAction
}

let msgId = 1
const nextId = () => msgId++

const QUICK_TOPICS = [
  'Interés Simple',
  'Interés Compuesto',
  'Conversión de Tasas',
  'Amortización',
  'Anualidades',
  'VPN / TIR',
  'Inflación',
]

const WELCOME = `¡Hola! Soy tu tutor de **Ingeniería Económica**.

Pega tu ejercicio aquí y lo resuelvo paso a paso. También puedo explicar cualquier concepto del curso.`

const CALC_LABELS: Record<string, string> = {
  simple: 'Interés Simple',
  compuesto: 'Interés Compuesto',
  tasas: 'Conversión de Tasas',
  amortizacion: 'Amortización',
  anualidades: 'Anualidades',
  inflacion: 'Inflación & Tasas Reales',
}

const CALC_ROUTES: Record<string, string> = {
  simple: '/simple',
  compuesto: '/compuesto',
  tasas: '/tasas',
  amortizacion: '/amortizacion',
  anualidades: '/anualidades',
  inflacion: '/inflacion',
}

function looksLikeExercise(text: string): boolean {
  return /\d/.test(text) && text.length > 35 && text.length < 800
}

export default function Chatbot() {
  const navigate = useNavigate()
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([
    { id: 0, role: 'assistant', content: WELCOME },
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [apiError, setApiError] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (isOpen) setTimeout(() => inputRef.current?.focus(), 100)
  }, [isOpen])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  async function tryAutoDetect(userMsg: string, botMsgId: number) {
    if (!looksLikeExercise(userMsg)) return
    try {
      const res = await fetch('/api/interpret', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enunciado: userMsg, context: [] }),
      })
      if (!res.ok) return
      const data = await res.json()
      if (!data.tipo || data.tipo === 'desconocido' || data.confianza < 0.6) return
      const label = CALC_LABELS[data.tipo]
      if (!label) return
      setMessages((prev) =>
        prev.map((m) =>
          m.id === botMsgId
            ? { ...m, calcAction: { tipo: data.tipo, label, datos: data.datos ?? {} } }
            : m
        )
      )
    } catch {
      // Silently ignore — auto-detect is a best-effort feature
    }
  }

  function openCalculator(action: CalcAction) {
    const route = CALC_ROUTES[action.tipo]
    if (!route) return
    const d = action.datos
    useCarryStore.getState().set({
      amount: d.P ?? d.PV ?? d.monto ?? undefined,
      rate: d.i ?? d.tasa ?? undefined,
      periods: d.n ?? undefined,
      from: '/chatbot',
    })
    navigate(route)
    setIsOpen(false)
  }

  async function send(text?: string) {
    const q = (text ?? input).trim()
    if (!q || loading) return
    setInput('')
    setApiError('')

    const userMsg: Message = { id: nextId(), role: 'user', content: q }
    const allMsgs = [...messages, userMsg]
    setMessages(allMsgs)
    setLoading(true)

    const history = allMsgs.slice(1, -1).map((m) => ({ role: m.role, content: m.content }))

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: q, history }),
      })

      if (!res.ok) {
        const err = (await res.json().catch(() => ({}))) as { error?: string }
        setApiError(err.error ?? `Error HTTP ${res.status}`)
        setMessages((prev) => prev.slice(0, -1))
        return
      }

      const data = (await res.json()) as { reply?: string }
      const reply = data.reply ?? 'Sin respuesta. Intentá de nuevo.'
      const botId = nextId()
      setMessages((prev) => [...prev, { id: botId, role: 'assistant', content: reply }])

      // Auto-detect calculator in background
      tryAutoDetect(q, botId)
    } catch {
      setApiError('Error de red. Verificá tu conexión.')
      setMessages((prev) => prev.slice(0, -1))
    } finally {
      setLoading(false)
    }
  }

  function clearChat() {
    setMessages([{ id: 0, role: 'assistant', content: WELCOME }])
    setInput('')
    setApiError('')
  }

  function handleInput(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setInput(e.target.value)
    e.target.style.height = 'auto'
    e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px'
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey && !loading) {
      e.preventDefault()
      send()
    }
  }

  return (
    <>
      <button className="chatbot-fab" onClick={() => setIsOpen((o) => !o)} aria-label="Abrir asistente">
        {isOpen ? <X size={26} /> : <MessageCircle size={26} />}
      </button>

      <div className={`chatbot-widget ${isOpen ? 'open' : ''}`}>
        {/* Header */}
        <div className="chatbot-header">
          <div className="icon">◎</div>
          <div className="info">
            <h2>Tutor IA</h2>
            <p>Resuelve ejercicios · Groq / Llama</p>
          </div>
          <div className="actions">
            <button onClick={clearChat} title="Limpiar chat">
              <Trash2 size={14} />
            </button>
            <button onClick={() => setIsOpen(false)} title="Cerrar">
              <X size={14} />
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="chatbot-body">
          <div className="chatbot-msgs">
            {messages.map((m) => (
              <div key={m.id} className={`msg ${m.role === 'user' ? 'user' : 'bot'}`}>
                <div className="bubble" style={{ whiteSpace: 'pre-wrap' }}>
                  {m.content}
                </div>
                {m.calcAction && m.role === 'assistant' && (
                  <button
                    onClick={() => openCalculator(m.calcAction!)}
                    className="chatbot-calc-btn"
                  >
                    <ExternalLink size={11} />
                    Abrir en {m.calcAction.label}
                  </button>
                )}
              </div>
            ))}
            {loading && (
              <div className="msg bot">
                <div className="bubble chatbot-thinking"><span /><span /><span /></div>
              </div>
            )}
            {apiError && (
              <div className="chatbot-inline-error">
                <AlertCircle size={12} /> {apiError}
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick topics + input */}
          <div className="chatbot-input-area">
            <div className="chips">
              {QUICK_TOPICS.map((t) => (
                <span key={t} className="chip" onClick={() => send(t)}>{t}</span>
              ))}
            </div>
            <div className="chatbot-textarea-row">
              <textarea
                ref={inputRef}
                rows={1}
                placeholder="Pega tu ejercicio aquí… (Enter para enviar)"
                value={input}
                onChange={handleInput}
                onKeyDown={handleKeyDown}
                disabled={loading}
              />
              <button onClick={() => send()} disabled={loading || !input.trim()}>↑</button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
