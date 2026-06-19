// Vercel Serverless Function — explica UN paso de una solución en lenguaje sencillo.
// Reusa Groq (Llama 3.3 70b). La API key vive solo en variables de entorno.

declare const process: {
  env: {
    GROQ_API_KEY?: string
  }
}

const SYSTEM_PROMPT = `Eres un tutor paciente de Ingeniería Económica para estudiantes universitarios colombianos. Responde SIEMPRE en español.

Te van a dar UN paso de la solución de un ejercicio (su título, su expresión matemática y opcionalmente un detalle), más el contexto del cálculo. Tu trabajo es explicar ESE paso de forma muy clara:
- Explica POR QUÉ se hace ese paso y QUÉ significa, no repitas la fórmula textualmente.
- Usa una analogía simple si ayuda.
- Máximo 3 frases. Directo, sin introducciones ni despedidas, sin markdown ni viñetas.`

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  let body: any
  try {
    body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body
  } catch {
    res.status(400).json({ error: 'Invalid JSON' })
    return
  }

  const { paso, contexto = '' } = body ?? {}
  if (!paso || typeof paso !== 'object' || !paso.title) {
    res.status(400).json({ error: 'Missing paso' })
    return
  }

  const apiKey = process.env.GROQ_API_KEY
  if (!apiKey) {
    res.status(500).json({ error: 'API key not configured on server' })
    return
  }

  const userMessage =
    `Contexto del cálculo: ${contexto || 'cálculo de ingeniería económica'}\n\n` +
    `Paso a explicar:\n` +
    `- Título: ${paso.title}\n` +
    (paso.expr ? `- Expresión: ${paso.expr}\n` : '') +
    (paso.detail ? `- Detalle: ${paso.detail}\n` : '') +
    `\nExplica este paso en máximo 3 frases sencillas.`

  try {
    const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: userMessage },
        ],
        temperature: 0.3,
        max_tokens: 300,
      }),
    })

    if (!groqRes.ok) {
      const errText = await groqRes.text()
      console.error('Groq STATUS:', groqRes.status)
      console.error('Groq DETAIL:', errText)
      res.status(502).json({ error: 'Groq API error', detail: errText })
      return
    }

    const data = await groqRes.json()
    const explicacion =
      data.choices?.[0]?.message?.content ?? 'No pude generar la explicación. Intentá de nuevo.'
    res.json({ explicacion })
  } catch (err: any) {
    res.status(500).json({ error: err?.message ?? 'Internal server error' })
  }
}
