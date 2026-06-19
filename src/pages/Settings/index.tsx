import { PageHeader, Select } from '../../components/ui'
import { useSettingsStore } from '../../store/settingsStore'
import { fmtCOP, fmtPct } from '../../utils/format'
import { RotateCcw } from 'lucide-react'

const DECIMAL_OPTIONS = Array.from({ length: 9 }, (_, i) => ({
  value: String(i),
  label: `${i} decimal${i === 1 ? '' : 'es'}`,
}))

export default function SettingsPage() {
  const { moneyDecimals, rateDecimals, setMoneyDecimals, setRateDecimals, reset } =
    useSettingsStore()

  return (
    <div className="p-6 lg:p-12 max-w-2xl mx-auto">
      <PageHeader
        chip="Ajustes"
        title="Preferencias de cálculo"
        description="Configura cómo se redondean los montos y las tasas en toda la app. El profesor puede fijar un nivel para que todos obtengan el mismo resultado."
      />

      <div className="card p-6 animate-fade-up">
        <div className="grid sm:grid-cols-2 gap-5">
          <div>
            <Select
              label="Decimales en montos ($)"
              value={String(moneyDecimals)}
              onChange={(v) => setMoneyDecimals(Number(v))}
              options={DECIMAL_OPTIONS}
            />
            <p className="text-xs mt-2" style={{ color: 'var(--muted)' }}>
              Vista previa:{' '}
              <span className="mono" style={{ color: 'var(--text)' }}>
                {fmtCOP(1234567.8912)}
              </span>
            </p>
          </div>

          <div>
            <Select
              label="Decimales en tasas (%)"
              value={String(rateDecimals)}
              onChange={(v) => setRateDecimals(Number(v))}
              options={DECIMAL_OPTIONS}
            />
            <p className="text-xs mt-2" style={{ color: 'var(--muted)' }}>
              Vista previa:{' '}
              <span className="mono" style={{ color: 'var(--text)' }}>
                {fmtPct(2.456789)}
              </span>
            </p>
          </div>
        </div>

        <div
          className="mt-6 pt-5 flex items-center justify-between gap-3 flex-wrap"
          style={{ borderTop: '1px solid var(--border)' }}
        >
          <p className="text-xs" style={{ color: 'var(--muted)', maxWidth: '40ch' }}>
            Los cambios se guardan en este dispositivo y se aplican a resultados, tablas y
            exportaciones.
          </p>
          <button
            onClick={reset}
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg transition-all"
            style={{ color: 'var(--muted)', border: '1px solid var(--border)', cursor: 'pointer' }}
          >
            <RotateCcw size={12} strokeWidth={1.75} />
            Restablecer (2 y 4)
          </button>
        </div>
      </div>
    </div>
  )
}
