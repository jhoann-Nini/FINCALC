import { useState } from 'react'
import { CheckCircle2, XCircle, RefreshCw, GraduationCap } from 'lucide-react'
import { pickQuestion, type QuizQuestion } from '../../lib/quizBank'

// Micro-quiz que aparece tras un cálculo: una pregunta conceptual para
// confirmar que el estudiante entendió el MECANISMO, no solo el número.
export function MicroQuiz({ module }: { module: string }) {
  const [state, setState] = useState(() => pickQuestion(module))
  const [selected, setSelected] = useState<number | null>(null)

  if (!state) return null
  const q: QuizQuestion = state.q

  function next() {
    setSelected(null)
    setState(pickQuestion(module, state?.idx))
  }

  const answered = selected !== null
  const isCorrect = answered && q.options[selected!]?.correct

  return (
    <div className="card overflow-hidden mt-6">
      <div
        className="px-5 py-3 flex items-center gap-2 text-sm font-semibold"
        style={{ background: 'var(--surface2)', color: 'var(--text)' }}
      >
        <GraduationCap size={16} strokeWidth={2} style={{ color: 'var(--accent)' }} />
        Comprueba que entendiste
      </div>

      <div className="p-5">
        <p className="text-sm font-medium mb-3" style={{ color: 'var(--text)' }}>
          {q.q}
        </p>

        <div className="flex flex-col gap-2">
          {q.options.map((opt, i) => {
            const chosen = selected === i
            const showAsCorrect = answered && opt.correct
            const showAsWrong = answered && chosen && !opt.correct
            return (
              <button
                key={i}
                type="button"
                disabled={answered}
                onClick={() => setSelected(i)}
                className="text-left text-sm px-3.5 py-2.5 rounded-lg transition-all"
                style={{
                  cursor: answered ? 'default' : 'pointer',
                  background: showAsCorrect
                    ? 'var(--accent-bg)'
                    : showAsWrong
                      ? 'var(--destructive-bg)'
                      : 'var(--bg)',
                  border: `1px solid ${
                    showAsCorrect
                      ? 'var(--accent-border)'
                      : showAsWrong
                        ? 'var(--destructive-border)'
                        : 'var(--border)'
                  }`,
                  color: showAsCorrect
                    ? 'var(--accent)'
                    : showAsWrong
                      ? 'var(--destructive)'
                      : 'var(--text)',
                }}
              >
                <span className="inline-flex items-center gap-2">
                  {showAsCorrect && <CheckCircle2 size={14} strokeWidth={2} />}
                  {showAsWrong && <XCircle size={14} strokeWidth={2} />}
                  {opt.text}
                </span>
              </button>
            )
          })}
        </div>

        {answered && (
          <div
            className="mt-3 rounded-lg px-3 py-2.5 text-xs"
            style={{
              background: isCorrect ? 'var(--accent-bg)' : 'var(--surface2)',
              border: `1px solid ${isCorrect ? 'var(--accent-border)' : 'var(--border)'}`,
              color: 'var(--text)',
              lineHeight: 1.6,
            }}
          >
            <strong style={{ color: isCorrect ? 'var(--accent)' : 'var(--text)' }}>
              {isCorrect ? '¡Correcto! ' : 'Casi. '}
            </strong>
            {q.explain}
            <button
              type="button"
              onClick={next}
              className="mt-2 flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg transition-all cursor-pointer"
              style={{ border: '1px solid var(--border)', color: 'var(--muted)', background: 'transparent' }}
            >
              <RefreshCw size={11} strokeWidth={2} /> Otra pregunta
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default MicroQuiz
