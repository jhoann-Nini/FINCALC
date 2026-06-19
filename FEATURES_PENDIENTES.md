# Features pedidas por el profesor — Estado

> Verificado contra el código el 2026-06-18. **Todas implementadas.** ✅
> Se conserva el requerimiento original para trazabilidad.

## Requerimiento original

1. Plantear el problema en **lenguaje natural** y que el sistema lo interprete (o pregunte qué necesitas y qué tipo de cálculo querés hacer).
2. En **interés simple y compuesto**, poder calcular: tasa de interés (i), interés (I), capital (P), monto (M) y número de períodos (n). Además, mostrar la **tabla de amortización** al calcular en interés simple y compuesto.
3. En las calculadoras de interés simple y compuesto, ingresar como dato el **número de períodos** y la **unidad de medida** (quincenal, mensual, bimestral, trimestral, cuatrimestral, semestral, anual).

## Estado de implementación

- [x] **1. Lenguaje natural** → módulo `/resolver` (`src/pages/Resolver/index.tsx`) + endpoint `api/interpret.ts` (Groq). Interpreta el enunciado, identifica el tipo de cálculo y resuelve paso a paso; si faltan datos, hace preguntas aclaratorias.
- [x] **2a. Calcular i, I, P, M, n** → modos `F` (= Monto M), `P`, `i`, `n` en ambas calculadoras (`src/pages/Calculators/SimpleInterest` y `CompoundInterest`). El **interés (I)** se muestra siempre como resultado ("Interés total generado", `result.I`) con su fórmula `I = P × i × n`; el export a Excel incluye la columna "Monto (M)".
- [x] **2b. Tabla por período** → "Tabla período a período" con columnas **#· Saldo inicial · Interés del período · Saldo final**, más exportación a Excel.
  - Nota: para interés simple/compuesto (un único capital que crece) la tabla correcta es la de **evolución del saldo**. La tabla de amortización con *cuota / abono a capital* corresponde a un crédito y vive en el módulo **Amortización** (francés y alemán).
- [x] **3. Unidad de período** → selector con día, quincena, mes, bimestre, trimestre, cuatrimestre, semestre y año, en ambas calculadoras.

## Próximas mejoras sugeridas (fuera del requerimiento original)

- [ ] Suite de pruebas (Vitest) para las funciones puras de `src/lib/` — hoy sin cobertura.
- [ ] CI/CD (GitHub Actions: lint + build + test).
