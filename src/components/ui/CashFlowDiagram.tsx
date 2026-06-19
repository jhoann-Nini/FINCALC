import { useState, useEffect } from 'react'
import { fmtCOP, fmtPct } from '../../utils/format'

interface CashFlowDiagramProps {
  p?: number // Present Value (Capital / Principal)
  f?: number // Future Value (Monto Final)
  pmt?: number // Payment (Anualidad / Cuota constante)
  iPct?: number // Interest rate (percentage)
  n: number // Number of periods
  periodType?: string // e.g. "mes", "año", etc.
  type: 'simple' | 'compound' | 'amortization' | 'annuities' | 'inflation'
  annuityMode?: 'PV' | 'FV' | 'PMT' // For Annuities specific logic
  payments?: { period: number; payment: number; principal: number; interest: number }[] // For Amortization details
  nominalFV?: number // For Inflation specific logic
  realFV?: number // For Inflation specific logic
}

type Perspective = 'investor' | 'debtor'

export default function CashFlowDiagram({
  p = 0,
  f = 0,
  pmt = 0,
  iPct = 0,
  n,
  periodType = 'período',
  type,
  annuityMode = 'FV',
  payments = [],
  nominalFV = 0,
  realFV = 0,
}: CashFlowDiagramProps) {
  // Determinar perspectiva inicial por defecto
  const getDefaultPerspective = (): Perspective => {
    if (type === 'amortization') return 'debtor'
    if (type === 'annuities' && (annuityMode === 'PV' || annuityMode === 'PMT')) return 'debtor'
    return 'investor'
  }

  const [perspective, setPerspective] = useState<Perspective>(getDefaultPerspective())

  // Sincronizar perspectiva si cambia el tipo o modo de anualidad
  useEffect(() => {
    setPerspective(getDefaultPerspective())
  }, [type, annuityMode])

  // Formateador abreviado para etiquetas del SVG
  function fmtShortCOP(num: number): string {
    const isNeg = num < 0
    const absNum = Math.abs(num)
    const format = (value: number, minFraction = 0, maxFraction = 0) =>
      new Intl.NumberFormat('es-CO', {
        minimumFractionDigits: minFraction,
        maximumFractionDigits: maxFraction,
        useGrouping: true,
      }).format(value)

    let res = ''
    if (absNum >= 1_000_000) {
      const value = absNum / 1_000_000
      res = `$${format(value, 0, 1)}M`
    } else if (absNum >= 1_000) {
      const value = absNum / 1_000
      res = `$${format(value, 0, 0)}K`
    } else {
      res = `$${format(absNum, 0, 0)}`
    }
    return isNeg ? `-${res}` : res
  }

  const roundedN = Math.ceil(n)
  const isLongTimeline = roundedN > 8

  // Helper para obtener coordenada X de un período
  const getX = (period: number) => {
    if (!isLongTimeline) {
      return 80 + (640 * period) / roundedN
    }
    // Eje truncado para n largo: 0, 1, 2, 3 [Corte] n-1, n
    if (period === 0) return 80
    if (period === 1) return 170
    if (period === 2) return 260
    if (period === 3) return 350
    if (period === roundedN - 1) return 570
    if (period === roundedN) return 660
    return -1 // No se dibuja
  }

  // Componente interno para dibujar flechas
  interface ArrowProps {
    x: number
    dir: 'up' | 'down'
    label: string
    value: string
    color: string
    heightScale?: number // Proporción de altura (0.2 a 1.0)
  }

  const Arrow = ({ x, dir, label, value, color, heightScale = 1 }: ArrowProps) => {
    const isUp = dir === 'up'
    const yStart = 120
    const amplitude = 65 * heightScale
    const yEnd = isUp ? 120 - amplitude : 120 + amplitude
    const yHead = isUp ? yEnd + 10 : yEnd - 10
    const yTextVal = isUp ? yEnd - 8 : yEnd + 16
    const yTextLabel = isUp ? yEnd - 20 : yEnd + 28

    return (
      <g className="transition-all duration-300">
        {/* Línea vertical */}
        <line
          x1={x}
          y1={yStart}
          x2={x}
          y2={yHead}
          stroke={color}
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        {/* Cabeza de flecha */}
        <polygon
          points={
            isUp
              ? `${x - 5},${yHead + 2} ${x},${yEnd} ${x + 5},${yHead + 2}`
              : `${x - 5},${yHead - 2} ${x},${yEnd} ${x + 5},${yHead - 2}`
          }
          fill={color}
        />
        {/* Etiquetas de texto */}
        <text
          x={x}
          y={yTextVal}
          textAnchor="middle"
          className="font-bold mono text-[10px]"
          fill="var(--text)"
        >
          {value}
        </text>
        <text x={x} y={yTextLabel} textAnchor="middle" className="text-[9px]" fill="var(--muted)">
          {label}
        </text>
      </g>
    )
  }

  // Obtener nombre del período en plural para el eje
  const getPeriodLabelPlural = () => {
    const pt = periodType.toLowerCase()
    if (pt.endsWith('a') || pt.endsWith('e') || pt.endsWith('o')) return pt + 's'
    if (pt.endsWith('l') || pt.endsWith('r') || pt.endsWith('n')) return pt + 'es'
    return pt
  }

  // Renderizar las flechas específicas según el tipo de calculadora
  const renderFlows = () => {
    const elements: React.JSX.Element[] = []

    // Paleta de colores consistente
    const colInflow = 'var(--accent)' // Verde
    const colOutflow = 'var(--destructive)' // Rojo
    const colGold = 'var(--gold)' // Dorado (para inflación real)

    if (type === 'simple' || type === 'compound') {
      // Período 0: Valor Presente (Capital inicial P)
      const pDir = perspective === 'investor' ? 'down' : 'up'
      const pColor = pDir === 'up' ? colInflow : colOutflow
      elements.push(
        <Arrow
          key="p-arrow"
          x={getX(0)}
          dir={pDir}
          label="Presente (P)"
          value={fmtShortCOP(p)}
          color={pColor}
        />
      )

      // Período n: Valor Futuro F
      const fDir = perspective === 'investor' ? 'up' : 'down'
      const fColor = fDir === 'up' ? colInflow : colOutflow
      elements.push(
        <Arrow
          key="f-arrow"
          x={getX(roundedN)}
          dir={fDir}
          label="Futuro (F)"
          value={fmtShortCOP(f)}
          color={fColor}
        />
      )
    } else if (type === 'amortization') {
      // Período 0: Préstamo / Desembolso (P)
      const pDir = perspective === 'debtor' ? 'up' : 'down'
      const pColor = pDir === 'up' ? colInflow : colOutflow
      elements.push(
        <Arrow
          key="amort-p"
          x={getX(0)}
          dir={pDir}
          label={perspective === 'debtor' ? 'Crédito Recibido (P)' : 'Préstamo Entregado (P)'}
          value={fmtShortCOP(p)}
          color={pColor}
        />
      )

      // Determinar la cuota máxima para escalar la altura de las flechas (útil en amortización alemana)
      const maxPayment = payments.length > 0 ? Math.max(...payments.map((p) => p.payment)) : pmt

      // Períodos 1..n: Cuotas mensuales de pago
      const pmtDir = perspective === 'debtor' ? 'down' : 'up'
      const pmtColor = pmtDir === 'up' ? colInflow : colOutflow

      const periodsToDraw = isLongTimeline
        ? [1, 2, 3, roundedN - 1, roundedN]
        : Array.from({ length: roundedN }, (_, i) => i + 1)

      periodsToDraw.forEach((k) => {
        const xPos = getX(k)
        if (xPos !== -1) {
          // Si tenemos el desglose de filas, buscamos el valor exacto de la cuota
          const rowData = payments.find((r) => r.period === k)
          const cuotaVal = rowData ? rowData.payment : pmt

          // Escalar altura proporcionalmente (mínimo 0.4 para que se note)
          const scale = maxPayment > 0 ? 0.4 + 0.6 * (cuotaVal / maxPayment) : 1

          elements.push(
            <Arrow
              key={`amort-pmt-${k}`}
              x={xPos}
              dir={pmtDir}
              label={`Cuota ${k}`}
              value={fmtShortCOP(cuotaVal)}
              color={pmtColor}
              heightScale={scale}
            />
          )
        }
      })
    } else if (type === 'annuities') {
      if (annuityMode === 'FV') {
        // Modo Ahorro/Valor Futuro
        // Período 0: Sin flujo inicial
        // Períodos 1..n: Cuotas de ahorro periódicas
        const pmtDir = perspective === 'investor' ? 'down' : 'up'
        const pmtColor = pmtDir === 'up' ? colInflow : colOutflow
        const periodsToDraw = isLongTimeline
          ? [1, 2, 3, roundedN - 1, roundedN]
          : Array.from({ length: roundedN }, (_, i) => i + 1)

        periodsToDraw.forEach((k) => {
          const xPos = getX(k)
          if (xPos !== -1) {
            elements.push(
              <Arrow
                key={`annuity-pmt-${k}`}
                x={xPos}
                dir={pmtDir}
                label={`Aporte ${k}`}
                value={fmtShortCOP(pmt)}
                color={pmtColor}
              />
            )
          }
        })

        // Período n: Valor Futuro retirado
        const fvDir = perspective === 'investor' ? 'up' : 'down'
        const fvColor = fvDir === 'up' ? colInflow : colOutflow
        // Colocamos el FV un poco desplazado hacia la derecha al final o superpuesto
        // Para que no colisione con el último aporte, lo desplazamos 20px
        elements.push(
          <Arrow
            key="annuity-fv"
            x={getX(roundedN) + 20}
            dir={fvDir}
            label="Monto Ahorrado (FV)"
            value={fmtShortCOP(f)}
            color={fvColor}
            heightScale={1.1} // Hacemos la flecha de retiro ligeramente más grande para destacar
          />
        )
      } else {
        // Modo Crédito/Valor Presente o Cuota dada PV
        // Período 0: Préstamo recibido o capital depositado (PV)
        const pvDir = perspective === 'debtor' ? 'up' : 'down'
        const pvColor = pvDir === 'up' ? colInflow : colOutflow
        elements.push(
          <Arrow
            key="annuity-pv"
            x={getX(0)}
            dir={pvDir}
            label={perspective === 'debtor' ? 'Monto Recibido (PV)' : 'Desembolso (PV)'}
            value={fmtShortCOP(p)}
            color={pvColor}
          />
        )

        // Períodos 1..n: Cuotas uniformes de amortización (PMT)
        const pmtDir = perspective === 'debtor' ? 'down' : 'up'
        const pmtColor = pmtDir === 'up' ? colInflow : colOutflow
        const periodsToDraw = isLongTimeline
          ? [1, 2, 3, roundedN - 1, roundedN]
          : Array.from({ length: roundedN }, (_, i) => i + 1)

        periodsToDraw.forEach((k) => {
          const xPos = getX(k)
          if (xPos !== -1) {
            elements.push(
              <Arrow
                key={`annuity-pmt-${k}`}
                x={xPos}
                dir={pmtDir}
                label={`Pago ${k}`}
                value={fmtShortCOP(pmt)}
                color={pmtColor}
              />
            )
          }
        })
      }
    } else if (type === 'inflation') {
      // Módulo de Inflación: Perspectiva Inversionista por excelencia
      // Período 0: Capital inicial P (Outflow, abajo)
      const pDir = perspective === 'investor' ? 'down' : 'up'
      const pColor = pDir === 'up' ? colInflow : colOutflow
      elements.push(
        <Arrow
          key="inf-p"
          x={getX(0)}
          dir={pDir}
          label="Inversión Inicial"
          value={fmtShortCOP(p)}
          color={pColor}
        />
      )

      // Período n: Dos flechas a la derecha
      // Flecha 1: Valor Futuro Nominal (UP)
      const nomDir = perspective === 'investor' ? 'up' : 'down'
      const nomColor = nomDir === 'up' ? colInflow : colOutflow
      elements.push(
        <Arrow
          key="inf-nom-fv"
          x={getX(roundedN) - 15} // Desplazada a la izquierda
          dir={nomDir}
          label="VF Nominal"
          value={fmtShortCOP(nominalFV)}
          color={nomColor}
          heightScale={1.0}
        />
      )

      // Flecha 2: Valor Futuro Real (UP, pero más pequeña y de color dorado/alerta)
      const realDir = perspective === 'investor' ? 'up' : 'down'
      const realColor = colGold
      // Calcular escala de altura basada en el poder adquisitivo real relativo al nominal
      const scale = nominalFV > 0 ? Math.max(0.3, realFV / nominalFV) : 0.7

      elements.push(
        <Arrow
          key="inf-real-fv"
          x={getX(roundedN) + 15} // Desplazada a la derecha
          dir={realDir}
          label="VF Real (Poder Adquisitivo)"
          value={fmtShortCOP(realFV)}
          color={realColor}
          heightScale={scale}
        />
      )
    }

    return elements
  }

  // Ticks y etiquetas del eje horizontal
  const renderTicks = () => {
    const ticks: React.JSX.Element[] = []
    const periods = isLongTimeline
      ? [0, 1, 2, 3, roundedN - 1, roundedN]
      : Array.from({ length: roundedN + 1 }, (_, i) => i)

    periods.forEach((k) => {
      const x = getX(k)
      if (x !== -1) {
        ticks.push(
          <g key={`tick-${k}`} className="transition-all duration-300">
            {/* Pequeña línea vertical del eje */}
            <line x1={x} y1={116} x2={x} y2={124} stroke="var(--border)" strokeWidth="1.5" />
            {/* Texto de período */}
            <text x={x} y={136} textAnchor="middle" className="mono text-[10px]" fill="var(--text)">
              {k}
            </text>
          </g>
        )
      }
    })

    return ticks
  }

  return (
    <div className="card p-5 mb-6 animate-fade-up">
      {/* Cabecera del Flujograma */}
      <div
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5 pb-4 border-b"
        style={{ borderColor: 'var(--border)' }}
      >
        <div>
          <h4
            className="font-semibold text-sm display tracking-wide"
            style={{ color: 'var(--text)' }}
          >
            📊 Diagrama de Flujo de Caja
          </h4>
          <p className="text-xs" style={{ color: 'var(--muted)' }}>
            Línea de tiempo del dinero · Tasa: {fmtPct(iPct, 2)} · {roundedN}{' '}
            {getPeriodLabelPlural()}
          </p>
        </div>

        {/* Interruptor de Perspectiva */}
        <div
          className="flex p-0.5 rounded-lg border text-xs"
          style={{ borderColor: 'var(--border)', background: 'var(--surface2)' }}
        >
          <button
            onClick={() => setPerspective('investor')}
            className="px-3 py-1.5 rounded-md font-medium transition-all cursor-pointer"
            style={
              perspective === 'investor'
                ? {
                    background: 'var(--surface)',
                    color: 'var(--accent)',
                    fontWeight: 700,
                    boxShadow: 'var(--shadow-card)',
                  }
                : { background: 'transparent', color: 'var(--muted)' }
            }
          >
            Inversionista 📈
          </button>
          <button
            onClick={() => setPerspective('debtor')}
            className="px-3 py-1.5 rounded-md font-medium transition-all cursor-pointer"
            style={
              perspective === 'debtor'
                ? {
                    background: 'var(--surface)',
                    color: 'var(--blue)',
                    fontWeight: 700,
                    boxShadow: 'var(--shadow-card)',
                  }
                : { background: 'transparent', color: 'var(--muted)' }
            }
          >
            Deudor 📉
          </button>
        </div>
      </div>

      {/* Contenedor del Gráfico SVG (Totalmente responsivo) */}
      <div className="w-full overflow-x-auto">
        <svg
          viewBox="0 0 800 250"
          className="w-full h-auto min-w-[650px] mx-auto select-none"
          style={{ fontFamily: "'Hanken Grotesk', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" }}
        >
          {/* Fondo o cuadrículas decorativas */}
          <rect width="800" height="250" fill="transparent" />

          {/* Línea horizontal central del eje temporal */}
          {!isLongTimeline ? (
            <line
              x1="50"
              y1="120"
              x2="740"
              y2="120"
              stroke="var(--border)"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
          ) : (
            // Eje con corte de tiempo si es largo
            <g>
              <line
                x1="50"
                y1="120"
                x2="390"
                y2="120"
                stroke="var(--border)"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
              {/* Símbolo de corte // */}
              <path
                d="M 445,108 L 455,132 M 455,108 L 465,132"
                stroke="var(--border)"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
              <line
                x1="520"
                y1="120"
                x2="740"
                y2="120"
                stroke="var(--border)"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
            </g>
          )}

          {/* Flecha final de dirección del tiempo en el eje */}
          <polygon points="735,115 745,120 735,125" fill="var(--border)" />
          <text
            x="755"
            y="124"
            className="text-[10px]"
            fill="var(--muted)"
            style={{ fontWeight: 500 }}
          >
            {getPeriodLabelPlural()}
          </text>

          {/* Ticks del Eje */}
          {renderTicks()}

          {/* Flujos del dinero (Flechas entrantes y salientes) */}
          {renderFlows()}
        </svg>
      </div>

      {/* Nota educativa corta */}
      <div
        className="mt-3 p-3 rounded-lg border text-[11px] leading-relaxed"
        style={{ borderColor: 'var(--border)', color: 'var(--muted)', background: 'var(--surface2)' }}
      >
        {perspective === 'investor' ? (
          <p>
            💡 <strong>Perspectiva del Inversionista:</strong> Las flechas hacia abajo (
            <span style={{ color: 'var(--destructive)' }}>rojas</span>) indican egresos de dinero
            (la inversión o depósito inicial). Las flechas hacia arriba (
            <span style={{ color: 'var(--accent)' }}>índigo</span>) representan ingresos de dinero
            (los retornos, intereses o el retiro final del capital).
          </p>
        ) : (
          <p>
            💡 <strong>Perspectiva del Deudor:</strong> Las flechas hacia arriba (
            <span style={{ color: 'var(--accent)' }}>índigo</span>) representan ingresos de dinero
            (el crédito o préstamo recibido inicialmente). Las flechas hacia abajo (
            <span style={{ color: 'var(--destructive)' }}>rojas</span>) indican egresos de dinero
            (las cuotas periódicas o la devolución de la deuda).
          </p>
        )}
      </div>
    </div>
  )
}
