import { useState, useRef, useEffect } from 'react'
import { MessageCircle, X, Trash2, AlertCircle } from 'lucide-react'

type Role = 'user' | 'assistant'

interface Message {
  id: number
  role: Role
  content: string
}

let msgId = 1
const nextId = () => msgId++

const QUICK_TOPICS = [
  '📝 Resolver ejercicio',
  'Interés Simple',
  'Interés Compuesto',
  'Tasa Nominal → EA',
  'Anticipada vs Vencida',
  'Amortización',
  'Anualidades',
  'VPN',
  'TIR',
  'Factor F/P',
  'Factor P/A',
  'Gradiente aritmético',
  'Inflación',
]

const WELCOME = `¡Hola! 👋 Soy tu tutor de **Ingeniería Económica**.

Puedo ayudarte a:
▸ **Resolver ejercicios** paso a paso con todos los cálculos
▸ Explicar conceptos: interés, tasas, VPN, TIR, anualidades...
▸ Orientarte a la calculadora correcta de la app

📝 **Para resolver un ejercicio**, simplemente pégalo o escríbelo tal cual aparece en tu taller o examen. Por ejemplo:

_"Blanca Elena deposita $500.000 en 5 meses, $800.000 en 7 meses y $1.000.000 en 10 meses en una cuenta al 1% mensual. Calcular el saldo al final del año."_

¿Con qué te ayudo hoy?`

export default function Chatbot() {
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

  async function send(text?: string) {
    const q = (text ?? input).trim()
    if (!q || loading) return
    setInput('')
    setApiError('')

    const userMsg: Message = { id: nextId(), role: 'user', content: q }
    const allMsgs = [...messages, userMsg]
    setMessages(allMsgs)
    setLoading(true)

    // El backend (api/chat.ts) espera history SIN el mensaje de bienvenida
    // ni el mensaje actual (que se envía aparte como "message").
    const history = allMsgs.slice(1, -1).map((m) => ({ role: m.role, content: m.content }))

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: q, history }),
      })

      if (!res.ok) {
        const err = (await res.json().catch(() => ({}))) as { error?: string; detail?: string }
        const msg = err.error ?? `Error HTTP ${res.status}`
        setApiError(msg)
        setMessages((prev) => prev.slice(0, -1))
        return
      }

      const data = (await res.json()) as { reply?: string }
      const reply = data.reply ?? 'Sin respuesta. Intentá de nuevo.'
      setMessages((prev) => [...prev, { id: nextId(), role: 'assistant', content: reply }])
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

  // Auto-resize textarea
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
            <p>Resuelve ejercicios · Gemini</p>
          </div>
          <div className="actions">
            <button onClick={clearChat} title="Limpiar">
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
                placeholder="Pegá tu ejercicio aquí... (Enter para enviar, Shift+Enter para salto de línea)"
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
