// ============================================================
// GLOSARIO — definiciones cortas de términos de Ingeniería
// Económica, para mostrar en tooltips contextuales sin que el
// estudiante tenga que salir de la calculadora.
// ============================================================

export interface GlossaryEntry {
  term: string
  def: string
}

export const GLOSSARY: Record<string, GlossaryEntry> = {
  capital: {
    term: 'Capital (P)',
    def: 'El dinero inicial, hoy. También se llama Valor Presente (VP). Es lo que inviertes o pides prestado al comienzo.',
  },
  monto: {
    term: 'Monto (M / F)',
    def: 'El valor futuro: cuánto suma el capital más los intereses al final del plazo. M = VF = F.',
  },
  interes: {
    term: 'Interés (I)',
    def: 'La ganancia (o costo) en dinero por usar el capital durante un tiempo. I = M − P.',
  },
  'tasa-periodica': {
    term: 'Tasa periódica (i)',
    def: 'El porcentaje de interés que se aplica en cada período (mes, trimestre, etc.). Debe estar en la misma unidad que n.',
  },
  'interes-simple': {
    term: 'Interés simple',
    def: 'El interés se calcula siempre sobre el capital original. Crecimiento lineal, sin interés sobre interés.',
  },
  'interes-compuesto': {
    term: 'Interés compuesto',
    def: 'Los intereses se suman al capital cada período y generan nuevos intereses (capitalización). Crecimiento exponencial.',
  },
  capitalizacion: {
    term: 'Capitalización',
    def: 'Cuando los intereses ganados se agregan al capital para que, en el siguiente período, también generen interés.',
  },
  'tasa-nominal': {
    term: 'Tasa nominal',
    def: 'Tasa anual que NO incluye el efecto de la capitalización. Ej: 24% nominal mensual = 2% mensual.',
  },
  'tasa-efectiva': {
    term: 'Tasa Efectiva Anual (EA)',
    def: 'El costo o rendimiento real de un año, ya con la capitalización incluida. Sirve para comparar productos.',
  },
  'tasa-vencida': {
    term: 'Tasa vencida',
    def: 'El interés se paga al FINAL del período. Es lo más común en créditos colombianos.',
  },
  'tasa-anticipada': {
    term: 'Tasa anticipada',
    def: 'El interés se cobra al INICIO del período. Siempre resulta más costosa para el deudor.',
  },
  amortizacion: {
    term: 'Amortización',
    def: 'Pagar una deuda gradualmente. Cada cuota tiene una parte de interés y una parte de abono a capital.',
  },
  anualidad: {
    term: 'Anualidad',
    def: 'Una serie de pagos iguales (PMT) hechos en intervalos de tiempo iguales. Base de créditos y ahorros.',
  },
  gradiente: {
    term: 'Gradiente',
    def: 'Serie de pagos que cambian período a período: por una cantidad fija (aritmético) o por un porcentaje (geométrico).',
  },
  inflacion: {
    term: 'Inflación (π)',
    def: 'El aumento general de precios que reduce el poder adquisitivo del dinero con el tiempo.',
  },
  'tasa-real': {
    term: 'Tasa real',
    def: 'El rendimiento verdadero una vez descontada la inflación. Ecuación de Fisher: (1+i) = (1+real)(1+π).',
  },
  vpn: {
    term: 'VPN',
    def: 'Valor Presente Neto: suma de todos los flujos de un proyecto traídos a hoy. Si VPN > 0, el proyecto crea valor.',
  },
  tir: {
    term: 'TIR',
    def: 'Tasa Interna de Retorno: la tasa que hace VPN = 0. Es el rendimiento propio del proyecto.',
  },
  tio: {
    term: 'TIO / TMAR',
    def: 'Tasa de Interés de Oportunidad: el mínimo que exiges a una inversión (tu costo de oportunidad).',
  },
}

export function getGlossary(key: string): GlossaryEntry | undefined {
  return GLOSSARY[key]
}
