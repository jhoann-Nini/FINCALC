// ============================================================
// BANCO DE MICRO-QUIZ — preguntas conceptuales cortas que se
// muestran tras un cálculo para validar la COMPRENSIÓN, no el
// número. Una pregunta, opción múltiple, con explicación.
// ============================================================

export interface QuizQuestion {
  q: string
  options: { text: string; correct: boolean }[]
  explain: string
}

export const QUIZ_BANK: Record<string, QuizQuestion[]> = {
  'interes-simple': [
    {
      q: 'En interés simple, ¿sobre qué monto se calcula el interés cada período?',
      options: [
        { text: 'Sobre el capital original, siempre', correct: true },
        { text: 'Sobre el saldo acumulado (capital + intereses)', correct: false },
        { text: 'Sobre el interés del período anterior', correct: false },
      ],
      explain:
        'El interés simple SIEMPRE se calcula sobre el capital inicial (P). Por eso el interés de cada período es igual y el crecimiento es lineal.',
    },
    {
      q: 'Si duplicas el tiempo (n) en interés simple, ¿qué pasa con el interés total?',
      options: [
        { text: 'Se duplica (crece de forma lineal)', correct: true },
        { text: 'Se cuadruplica', correct: false },
        { text: 'Crece de forma exponencial', correct: false },
      ],
      explain:
        'Como I = P · i · n, el interés es proporcional a n. Al duplicar n, el interés se duplica: es crecimiento lineal.',
    },
  ],
  gradiente: [
    {
      q: '¿Qué distingue a un gradiente aritmético de uno geométrico?',
      options: [
        { text: 'El aritmético crece una cantidad fija; el geométrico, un porcentaje fijo', correct: true },
        { text: 'El aritmético crece más rápido siempre', correct: false },
        { text: 'El geométrico no usa tasa de interés', correct: false },
      ],
      explain:
        'En el aritmético cada pago suma una cantidad constante G. En el geométrico cada pago se multiplica por (1+g), creciendo un porcentaje.',
    },
    {
      q: 'En un gradiente, ¿qué representa la "serie uniforme equivalente" (A_eq)?',
      options: [
        { text: 'El pago fijo único que tendría el mismo valor que toda la serie creciente', correct: true },
        { text: 'El pago del último período', correct: false },
        { text: 'El promedio simple de los pagos', correct: false },
      ],
      explain:
        'A_eq convierte una serie que cambia período a período en un pago igual equivalente, útil para comparar alternativas (CAUE).',
    },
  ],
  'interes-compuesto': [
    {
      q: '¿Qué hace diferente al interés compuesto frente al simple?',
      options: [
        { text: 'Los intereses se capitalizan y generan más intereses', correct: true },
        { text: 'La tasa siempre es mayor', correct: false },
        { text: 'No cobra interés el primer período', correct: false },
      ],
      explain:
        'En el compuesto, al final de cada período los intereses se suman al capital y en el siguiente período también generan interés. Por eso crece exponencialmente.',
    },
    {
      q: 'Para usar la fórmula F = P(1+i)ⁿ, ¿cómo deben estar i y n?',
      options: [
        { text: 'En la misma unidad de tiempo (ambas mensuales, etc.)', correct: true },
        { text: 'i anual y n en meses, siempre', correct: false },
        { text: 'No importa la unidad', correct: false },
      ],
      explain:
        'La tasa i y el número de períodos n deben estar en la misma unidad. Si la tasa es mensual, n debe contarse en meses.',
    },
  ],
}

export function pickQuestion(module: string, exclude?: number): { idx: number; q: QuizQuestion } | null {
  const bank = QUIZ_BANK[module]
  if (!bank || bank.length === 0) return null
  let idx = Math.floor(Math.random() * bank.length)
  if (bank.length > 1 && idx === exclude) idx = (idx + 1) % bank.length
  return { idx, q: bank[idx] }
}
