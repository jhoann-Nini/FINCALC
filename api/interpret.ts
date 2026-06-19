// Vercel Serverless Function — interpreta problemas en lenguaje natural
// Devuelve JSON estructurado con: tipo de cálculo, parámetros extraídos, pasos de solución
// y la ruta de la calculadora correspondiente.

declare const process: {
  env: {
    GROQ_API_KEY?: string
  }
}

const SYSTEM_PROMPT = `Eres un motor de interpretación de problemas de Ingeniería Económica para la app FinCalc.

Tu único trabajo es analizar el enunciado que el usuario te envíe y devolver UN OBJETO JSON con este esquema exacto (sin texto adicional, sin markdown, solo el JSON):

{
  "tipo": "<string — uno de: simple | compuesto | tasas | amortizacion | anualidades | inflacion | desconocido>",
  "confianza": <number 0–1>,
  "incognita": "<string — la variable a calcular, ej: F, P, i, n, PMT, FV, PV, EA, TIR, VPN, inflacion_real, etc.>",
  "datos": {
    "<clave>": <valor numérico o null si no se menciona>
  },
  "params_url": "<string — query string lista para pegar en la URL del calculador, ej: ?mode=F&P=1000000&i=2&n=12&period=mes>",
  "resumen": "<string en español — 1 oración describiendo qué se busca>",
  "pasos": [
    "<paso 1 en español>",
    "<paso 2 en español>",
    ...
  ],
  "resultado_final": "<string — el resultado calculado con unidades, ej: $1.268.241,80>",
  "formula_usada": "<string — la fórmula con símbolos, ej: F = P × (1 + i)^n>",
  "interpretacion": "<string — qué significa el resultado en términos prácticos>",
  "preguntas_aclaratorias": ["<pregunta 1>", "<pregunta 2>"] // solo si faltan datos críticos
}

REGLAS DE EXTRACCIÓN:
- Tasas: conviértelas siempre a porcentaje numérico puro (ej: "2% mensual" → i=2, period="mes")
- Períodos: extrae la unidad del tiempo ("día", "semana", "mes", "bimestre", "trimestre", "semestre", "año")
- Si el enunciado dice "nominal mensual vencida" / "NMV", tipo="tasas", incognita="EA"
- Si hay pagos periódicos iguales → tipo="anualidades"
- Si hay tabla de cuotas o "cuota fija" / "sistema francés" → tipo="amortizacion"
- Si hay inflación o "tasa real" → tipo="inflacion"
- Si solo es capitalización sin pagos periódicos → tipo="compuesto"
- Si dice "interés simple" o el enunciado es de corto plazo con crecimiento lineal → tipo="simple"
- Si faltan 2 o más datos críticos, pon preguntas_aclaratorias y deja resultado_final: null
- Cuando SÍ tengas todos los datos, CALCULA el resultado completo paso a paso con aritmética exacta

MAPEO params_url por tipo:
- simple: ?mode=<F|P|i|n>&P=&i=&n=&period=
- compuesto: ?mode=<F|P|i|n>&P=&i=&n=&period=
- tasas: ?from=<NMV|NSV|NTV|EA|NMA>&to=<EA|NMV|...>&rate=&m=
- amortizacion: ?system=<frances|aleman>&P=&i=&n=&period=
- anualidades: ?mode=<PV|FV|PMT|n>&PMT=&i=&n=&period=&type=<ordinary|due>
- inflacion: ?mode=<real|nominal|inflacion>&nominal=&inflacion=&real=

Responde ÚNICAMENTE con el JSON. Sin backticks, sin explicaciones.`

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

  const { enunciado, context = [] } = body

  if (!enunciado || typeof enunciado !== 'string' || !enunciado.trim()) {
    res.status(400).json({ error: 'Missing enunciado' })
    return
  }

  const apiKey = process.env.GROQ_API_KEY
  if (!apiKey) {
    res.status(500).json({ error: 'API key not configured on server' })
    return
  }

  // Si hay contexto de preguntas aclaratorias previas, incluirlas
  const contextBlock =
    context.length > 0
      ? `\n\nCONTEXTO PREVIO (preguntas y respuestas del usuario para aclarar el problema):\n${context
          .map((c: { q: string; a: string }) => `P: ${c.q}\nR: ${c.a}`)
          .join('\n')}`
      : ''

  const userMessage = `Enunciado: ${enunciado.trim()}${contextBlock}`

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
        temperature: 0.1,
        max_tokens: 1024,
        response_format: { type: 'json_object' },
      }),
    })

    if (!groqRes.ok) {
      const errText = await groqRes.text()
      console.error('Groq STATUS:', groqRes.status)
      console.error('Groq BODY:', errText)
      res.status(502).json({ error: 'Groq API error', detail: errText })
      return
    }

    const data = await groqRes.json()
    const rawContent = data.choices?.[0]?.message?.content ?? '{}'

    let parsed: any
    try {
      parsed = JSON.parse(rawContent)
    } catch {
      res.status(502).json({ error: 'Invalid JSON from model', raw: rawContent })
      return
    }

    res.json(parsed)
  } catch (err: any) {
    res.status(500).json({ error: err?.message ?? 'Internal server error' })
  }
}