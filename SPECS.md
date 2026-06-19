# FinCalc — Ingeniería Económica

Aplicación web educativa con calculadoras y wiki de conceptos para Ingeniería Económica.

## Stack
- React 18 + TypeScript 5
- Vite (build tool)
- Tailwind CSS
- Recharts (gráficas)
- Zustand (estado)
- React Router v6

## Módulos
1. **Interés Simple** — Calcula F, P, i o n
2. **Interés Compuesto** — Despejar cualquier variable, gráfica compuesto vs simple
3. **Conversión de Tasas** — EA, Nominal, Anticipada, Vencida + tabla de equivalencias
4. **Amortización** — Sistema francés y alemán, paginada
5. **Anualidades** — Series uniformes PV, FV, PMT
6. **Inflación & Tasas Reales** — Ecuación de Fisher
7. **Wiki de Conceptos** — 9 conceptos con búsqueda y filtros

## Desarrollo local
```bash
npm install
npm run dev
```

## Arquitectura
```
src/
├── lib/          ← Lógica pura (sin React, testeable)
├── pages/        ← Una página por módulo
├── components/   ← UI reutilizable
├── utils/        ← Formatters
├── store/        ← Zustand
└── types/        ← TypeScript interfaces
```
