# Guion de presentación — Finametrics

> **Pitch (1 frase):** Finametrics es una app web educativa de Ingeniería Económica cuyo lema es **«todo cuesta»**: hace *calculable* el principio del **valor del dinero en el tiempo**, combinando calculadoras con lógica exacta, una wiki de conceptos, modos de práctica/examen y un asistente con IA que resuelve problemas en lenguaje natural.

---

## Datos del equipo

| Campo | Dato |
|---|---|
| Materia | Ingeniería Económica |
| Profesor | _(completar)_ |
| Integrantes | _(completar)_ |
| Fecha de presentación | _(completar)_ |
| Repositorio / URL demo | _(completar)_ |

**Duración sugerida:** ~13–15 minutos (10–12 min de demo + 1–2 min de cierre + preguntas). Crecimos un poco porque sumamos calculadora de **Gradientes** y **anualidades especiales** (perpetua/anticipada/diferida).

**Reparto sugerido del equipo:**
- **Persona A** — narra el problema, el Home y el Resolver con IA.
- **Persona B** — maneja el computador y las calculadoras núcleo (incluye **Gradientes** y las **anualidades especiales**).
- **Persona C** — práctica/examen, wiki, progreso/ajustes y cierre + preguntas.

---

## Setup previo (hacer ANTES de presentar)

La app es un SPA en React + TypeScript + Vite + Tailwind. No tiene backend de datos: todo se guarda en `localStorage`. Hay un pequeño API serverless (Groq/Llama) **solo** para las funciones de IA.

```bash
# 1. Usar Node 22 (Vite 7 requiere Node 20+; el default del sistema puede ser 18 y falla)
nvm use 22

# 2. Levantar frontend (:5173) + API de IA (:3001) a la vez
npm run dev:full

# 3. Abrir en el navegador
#    http://localhost:5173
```

> **IA:** Las funciones de IA (Resolver, chatbot tutor, "Explícame este paso") llaman al API en `:3001`, que necesita `GROQ_API_KEY` en `.env.local`. **Sin esa clave o sin internet, todas las calculadoras siguen funcionando**; solo se caen las funciones de IA. Verificá que la clave esté puesta antes de la demo.

> **Tip de demo:** Antes de empezar, abrí una o dos calculadoras una vez para que el Historial y el Dashboard ("Mi Progreso") tengan datos que mostrar al final. Tené listo el modo claro/oscuro según la luz del salón (botón sol/luna arriba a la izquierda).

---

## Guion escena por escena

> La narrativa sube en complejidad: **el problema → IA (lo más vistoso) → calculadoras núcleo → gradientes → análisis de proyectos → práctica/examen → recursos → progreso/ajustes.**

### Escena 0 — Arranque: «todo cuesta» (Home, `/`)

- **Qué decir:** «El principio de Ingeniería Económica es que el dinero vale distinto según *cuándo* lo tengas: por eso nuestro lema es *todo cuesta*. Finametrics convierte ese principio en algo calculable.»
- **Qué hacer:** Mostrar el Home. Señalar el titular **"Todo cuesta."** y el índice editorial de módulos numerados **01–09** (Conversión de Tasas, Interés Simple, Compuesto, Anualidades, Amortización, Inflación, VPN/TIR, **Gradientes (08)** y **Wiki (09)**). Mostrar el botón **"✦ Resolver con IA"**.
- **Gancho:** En 5 segundos el profesor ve el alcance completo del curso organizado como una "tabla de contenidos" navegable.

---

### Escena 1 — Resolver con IA (`/resolver`) ⭐ lo más vistoso

- **Qué decir:** «Lo más importante que pidió el profe: poder plantear un problema en *lenguaje natural*. El sistema lo interpreta, dice qué tipo de cálculo es, extrae los datos y lo resuelve paso a paso.»
- **Qué hacer:**
  1. Ir a **Resolver con IA** (menú grupo "IA").
  2. En el textarea escribir un enunciado real (placeholder de ejemplo ya sugiere uno):
     > **"Invierto $3.000.000 al 2% mensual durante 12 meses con interés compuesto. ¿Cuánto tengo al final?"**
  3. Click en **"Resolver"** (ícono de estrellas).
  4. Mostrar: **Tipo detectado** (Interés Compuesto) con su **% de confianza**, los **Datos identificados** (P=3.000.000, i=2%, n=12), el **resultado final con interpretación** y la sección **"SOLUCIÓN PASO A PASO"**.
  5. Click en **"Ir a la calculadora"** para mostrar que los datos pasan precargados al módulo correspondiente.
- **Dato de ejemplo para teclear:** P = $3.000.000, i = 2% mensual, n = 12 (compuesto) → F ≈ $3.804.728.
- **Bonus (preguntas aclaratorias):** Si querés mostrar la robustez, escribí un enunciado incompleto (ej: *"Tengo una deuda de $15.000.000 a 24 meses, ¿cuál es la cuota fija del sistema francés?"* omitiendo la tasa). El sistema responde en **"Necesito más información"** y vos contestás en el input **"Tu respuesta…"** + **"Continuar →"**.
- **Gancho pedagógico:** El estudiante no necesita saber *de antemano* qué fórmula usar; aprende a **identificar el tipo de problema**, que es justo la dificultad real en los parciales.

---

### Escena 2 — Conversión de Tasas (`/tasas`)

- **Qué decir:** «Antes de calcular casi cualquier cosa hay que hablar el mismo idioma de tasas. Aquí convertimos entre EA, nominal, y anticipada/vencida.»
- **Qué hacer:**
  1. Ir a **Conversión de Tasas**. Mostrar el toggle **Modo Simple / Experto** (en simple es un asistente guiado; en experto, formulario directo).
  2. Elegir la conversión **Nominal → EA**.
  3. Ingresar **24** en "Tasa Nominal (%)" y capitalización **12 (Mensual)**.
  4. Click **"→ Convertir"** → EA ≈ **26,82%**.
  5. Mostrar la **tabla de equivalencias** y el botón **"↓ Descargar Excel"**.
- **Dato de ejemplo:** 24% NMV, capitalización mensual → EA = 26,82%.
- **Gancho:** Resuelve el error más común del curso (confundir nominal con efectiva) y deja exportar la tabla de equivalencias a Excel para el cuaderno.

---

### Escena 3 — Interés Simple (`/simple`)

- **Qué decir:** «Crecimiento lineal. Acá se puede despejar cualquier incógnita: F, P, i o n, y siempre vemos el interés I y la tabla período a período.»
- **Qué hacer:**
  1. Ir a **Interés Simple**. Mostrar las pestañas de incógnita: **F · P · i · n**.
  2. Modo **F**: "Capital Inicial P" = **2.000.000**, "Tasa de interés mensual (i)" = **2.5**, "Número de meses n" = **12**, unidad de período = **Meses**.
  3. Click **"→ Calcular"** → F = **$2.600.000**, con tarjeta **"Interés total generado"** I = **$600.000**.
  4. Mostrar: la **narrativa en lenguaje sencillo** ("En palabras: …"), la **gráfica** de evolución del capital, la **tabla período a período** (con "↓ Descargar Excel"), y el **micro-quiz** de comprensión.
  5. Pasar el mouse sobre un término subrayado (glosario contextual / tooltips, ej. "capital", "tasa periódica").
- **Dato de ejemplo:** P = $2.000.000, i = 2.5% mensual, n = 12 → F = $2.600.000, I = $600.000.
- **Gancho:** Cubre literalmente lo que pidió el profe (calcular i, I, P, M y n) + unidad de período seleccionable, y refuerza con quiz y glosario.

---

### Escena 4 — Interés Compuesto (`/compuesto`)

- **Qué decir:** «La misma idea, pero con capitalización: los intereses generan más intereses. La gráfica muestra por qué el tiempo es tan poderoso.»
- **Qué hacer:**
  1. Ir a **Interés Compuesto**. Modo **F**.
  2. "Valor Presente P" = **3.000.000**, "Tasa efectiva mensual (i)" = **2**, "Número de meses n" = **12**.
  3. Click **"→ Calcular"** → F ≈ **$3.804.728**, con tarjetas "Interés compuesto" y "Factor (1+i)ⁿ".
  4. Mostrar la **gráfica comparativa "Compuesto vs Simple"** (la brecha visual entre las dos curvas).
  5. Click en **"Explícame con IA"** dentro de un paso del paso a paso → muestra una explicación corta del *por qué* de ese paso.
- **Dato de ejemplo:** P = $3.000.000, i = 2% mensual, n = 12 → F ≈ $3.804.728 (mismo problema de la Escena 1; coherencia con el Resolver).
- **Gancho:** El gráfico "compuesto vs simple" hace tangible un concepto abstracto; el botón **"Explícame con IA"** es un tutor para cada paso.

---

### Escena 5 — Anualidades (`/anualidades`) — ahora con **tipos especiales**

- **Qué decir:** «Cuando hay pagos periódicos iguales —un ahorro o una cuota— usamos series uniformes: PV, FV o PMT. Y no solo la ordinaria: ahora soportamos **anticipada, diferida y perpetua**.»
- **Qué hacer:**
  1. Ir a **Anualidades**. Modo **FV**.
  2. "Pago periódico PMT" = **500.000**, "Tasa de interés (i)" = **1.5**, "Número de períodos n" = **36**.
  3. Click **"→ Calcular"** → FV ≈ **$19.5M** (con cards de Total pagado e Intereses totales).
  4. Mostrar la **gráfica de área** (valor acumulado vs aportes) y el diagrama de flujo de caja.
  5. **Activar el Modo experto** y usar el selector **"Tipo de anualidad"** (Ordinaria (vencida) · Anticipada · Diferida · Perpetua) para demostrar al menos dos casos:
     - **Perpetua** (el más impactante): seleccionarla → el campo **n se oculta** y el resultado muestra **Valor presente PV = $33.333.333,33** (= PMT ÷ i, con PMT=$500.000 e i=1,5%) y **Valor futuro = "∞ (no aplica)"**. Señalar el **recuadro explicativo** ("Anualidad perpetua: …") y la **narrativa "En palabras"** ("Una serie de pagos… que continúa para siempre… vale hoy $33.3M").
     - **Anticipada** (si hay tiempo): con PMT=$500.000, i=1,5%, n=36 → **PV = $14.037.797**, **FV = $23.992.554** (un período más de capitalización que la vencida). Mostrar el ajuste en el **paso a paso**.
  6. (Opcional) **Diferida:** aparece el campo **"Períodos de gracia (k)"** para modelar un crédito que arranca a pagar después.
- **Dato de ejemplo:** Ordinaria FV → PMT=$500.000, i=1,5%, n=36 → FV ≈ $19.537.000. Perpetua → PMT=$500.000, i=1,5% → PV = $33.333.333,33. Anticipada → PMT=$500.000, i=1,5%, n=36 → PV=$14.037.797, FV=$23.992.554.
- **Gancho:** Conecta con la vida real (ahorrar mensual, planes de cuotas) y muestra cuánto del resultado es aporte vs interés. La **perpetua** —una renta que nunca termina— vale una cifra **finita** hoy: ese "clic" conceptual es de los que más sorprenden en clase. Cada tipo trae su recuadro, su narrativa y su paso a paso con el ajuste correspondiente.

---

### Escena 6 — Amortización (`/amortizacion`)

- **Qué decir:** «Acá generamos la tabla completa de un crédito, en sistema francés (cuota fija) o alemán (capital constante).»
- **Qué hacer:**
  1. Ir a **Amortización**. Elegir sistema **Cuota Fija (Francés)** y tipo de tasa **Efectiva mensual (EM)**.
  2. "Monto del crédito (P)" = **20.000.000**, "Tasa de interés (i)" = **1.5**, "Número de cuotas (n)" = **12**.
  3. Click **"→ Generar tabla"** → cuota fija ≈ **$1.826.488**, con cards de Total pagado, Total intereses y Costo financiero.
  4. Mostrar la **tabla paginada** (columnas **Periodo · Cuota · Interés · Ab. Capital · Saldo**) y el botón **"↓ Descargar Excel"**.
  5. Cambiar a **Capital Constante (Alemán)** para que vean cómo cambia el comportamiento de las cuotas.
- **Dato de ejemplo:** P = $20.000.000, i = 1.5% EM, n = 12 → cuota francesa ≈ $1.826.488.
- **Gancho:** Es exactamente lo que un banco entrega; ver francés vs alemán lado a lado aclara dónde se paga más interés.

---

### Escena 7 — Inflación & Tasas Reales (`/inflacion`)

- **Qué decir:** «Ganar 14% no sirve de nada si los precios suben 6,5%. Con la ecuación de Fisher calculamos la tasa *real* y el poder adquisitivo.»
- **Qué hacer:**
  1. Ir a **Inflación & Tasas Reales**.
  2. "Tasa nominal EA (%)" = **14**, "Inflación anual (%)" = **6.5**, "Capital inicial P" = **10.000.000**, "Años n" = **5**.
  3. Click **"→ Calcular tasa real"** → Tasa real (Fisher) ≈ **7,04%**.
  4. Mostrar la **ecuación de Fisher** mostrada en pantalla, las cards "FV nominal" vs "FV en poder adquisitivo real", y la **gráfica** con la brecha (poder adquisitivo perdido).
- **Dato de ejemplo:** Nominal 14% EA, inflación 6.5%, P = $10.000.000, n = 5 → tasa real ≈ 7,04%.
- **Gancho:** Conecta la teoría con la realidad colombiana (IPC) y deja claro por qué la tasa real importa.

---

### Escena 8 — VPN / TIR (`/vpntir`)

- **Qué decir:** «Para decidir si un proyecto vale la pena: VPN, TIR, período de recuperación, y un reporte ejecutivo en PDF.»
- **Qué hacer:**
  1. Ir a **VPN / TIR**.
  2. "TIO — Tasa de interés de oportunidad" = **12**, "Inversión inicial (período 0)" = **50.000.000**.
  3. Agregar flujos con **"+ Agregar período"**: Período 1, 2 y 3 = **20.000.000** cada uno.
  4. Click **"Calcular VPN y TIR"** → VPN ≈ **$5.8M** (badge **"Proyecto VIABLE"**), TIR ≈ **16,3%**, payback ≈ **2,5 períodos**.
  5. Mostrar el **gráfico "Perfil del VPN"** (curva del VPN, la TIO actual y el punto de la TIR donde VPN = 0).
  6. Click en **"Exportar Reporte Ejecutivo"** → genera un PDF con resumen, indicadores y conclusión.
- **Dato de ejemplo:** Inversión $50.000.000; flujos $20.000.000 × 3; TIO 12% → VPN ≈ $5.8M, TIR ≈ 16,3%, payback ≈ 2,5.
- **Gancho:** El perfil del VPN y el reporte PDF lo hacen sentir como una herramienta profesional, no un ejercicio de cuaderno.

---

### Escena 8.5 — Gradientes (`/gradientes`) ⭐ módulo nuevo

- **Qué decir:** «Hasta ahora los pagos eran iguales. Pero en la vida muchos costos e ingresos **escalan**: suben un monto fijo cada mes (aritmético) o un porcentaje (geométrico). Para eso está el módulo de **Gradientes**, el **08**, recién agregado.»
- **Qué hacer:**
  1. Ir a **Gradientes** (menú grupo "Calculadoras", justo después de VPN/TIR). Señalar el chip **"Módulo 08"**.
  2. Mostrar las dos pestañas: **"Gradiente aritmético (+G fijo)"** y **"Gradiente geométrico (+g %)"**.
  3. **Aritmético** (viene precargado): "Pago base A (período 1)" = **$1.000.000**, "Gradiente G (aumento por período)" = **$100.000**, "Tasa de interés por período (i)" = **2**, "Períodos (n)" = **12**, Unidad = **Meses**.
  4. Click **"→ Calcular"** → **Valor presente (P) ≈ $16.142.456**, además **Valor futuro (F)** y la **Serie uniforme equivalente (A_eq)** (con el desglose VP base (A) + VP gradiente (G)).
  5. Mostrar la **narrativa "En palabras"**, el **paso a paso** (con su botón **"Explícame con IA"** en cada paso), la **gráfica de barras** del flujo creciente y la **tabla** período a período.
  6. Cambiar a la pestaña **Geométrico**: "Primer pago A₁" = **$1.000.000**, "Crecimiento g (% por período)" = **5**, i = **2**, n = **12** → **P ≈ $13.867.348**. Notar cómo el campo cambia de "Gradiente G en $" a "Crecimiento g en %".
- **Dato de ejemplo:** Aritmético A=$1.000.000, G=$100.000, i=2%, n=12 → P ≈ $16.142.456. Geométrico A₁=$1.000.000, g=5%, i=2%, n=12 → P ≈ $13.867.348.
- **Gancho:** **Cierra una brecha real:** la Wiki ya *enseñaba* los gradientes (factores P/G y A/G) pero no los *calculaba*. Ahora sirve para modelar costos que crecen (mantenimiento, arriendos indexados) o ingresos que escalan, con su serie uniforme equivalente para compararlos con una cuota fija. Trae además **glosario contextual** (chips "Conceptos:") y **micro-quiz** de comprensión.

---

### Escena 9 — Modo Práctica (`/practica`) y Modo Examen (`/examen`)

- **Qué decir:** «Para estudiar: ejercicios generados automáticamente, con solución paso a paso; y un simulacro de examen cronometrado y calificado.»
- **Qué hacer:**
  1. **Práctica:** mostrar un ejercicio generado, escribir una respuesta, click **"Verificar"**, y abrir **"Ver solución paso a paso"**. Señalar la barra de puntaje (correctos / intentos / %).
  2. **Examen:** mostrar la pantalla de configuración (**5 preguntas · 20 min · 5 temas**), click **"⏱ Iniciar examen"**, responder un par y mostrar el **temporizador**, el navegador de preguntas y la **pantalla de revisión calificada** al finalizar.
- **Gancho:** Cubre el ciclo completo de estudio (aprender → practicar → autoevaluarse) sin que el profe tenga que armar bancos de preguntas. En modo examen se **ocultan las fórmulas y el chatbot** para que sea evaluación real.
- **Comparador (`/comparador`):** Si sobra tiempo, mostrar **"Simple vs Compuesto"** y **"Francés vs Alemán"** lado a lado con su gráfica y la diferencia en pesos.

---

### Escena 10 — Wiki de Conceptos (`/wiki`, ahora módulo **09**)

- **Qué decir:** «Todo el marco teórico del curso en un solo lugar: definiciones, fórmulas y ejemplos, buscable. Ahora es el módulo **09** porque entró Gradientes como **08**.»
- **Qué hacer:** Ir a **Wiki de Conceptos**. Escribir en **"Buscar concepto..."** (ej. "Fisher" o "TIR"), filtrar por categoría (Fundamentos, Interés, Tasas, Crédito, Series, Inflación, Evaluación, Factores) y **expandir** una tarjeta para mostrar fórmula + explicación.
- **Gancho:** Es un repaso rápido durante un ejercicio sin salir de la app; incluye los factores (P/F, F/P, P/A, A/P, etc.). **Tip de hilo:** acá se puede cerrar el círculo con la Escena de Gradientes: «la Wiki enseña los factores P/G y A/G, y ahora el módulo 08 los *calcula*».

---

### Escena 11 — Tutor IA flotante (chatbot)

- **Qué decir:** «En cualquier pantalla hay un tutor con IA, limitado a los conceptos del curso.»
- **Qué hacer:** Click en el botón flotante (esquina inferior). Usar un chip rápido (ej. **"Interés Compuesto"**) o pegar un ejercicio. Si detecta un ejercicio, ofrece un botón **"Abrir en [calculadora]"** que lleva al módulo con los datos.
- **Gancho:** Acompañamiento permanente, pero **acotado al temario** (no se va de tema).

---

### Escena 12 — Historial, Mi Progreso y Ajustes

- **Qué decir:** «Todo lo que el estudiante calcula queda registrado, con estadísticas de uso, y el profe puede fijar el redondeo para que todos den el mismo resultado.»
- **Qué hacer:**
  1. **Historial (`/historial`):** mostrar que los cálculos se guardan **automáticamente** (en `localStorage`). Señalar **Exportar** / **Importar** (respaldo en JSON) y el botón ↺ para reabrir un cálculo.
  2. **Mi Progreso (`/dashboard`):** mostrar las estadísticas (ejercicios totales, de hoy, racha, módulo top) y la gráfica de actividad de los últimos 7 días.
  3. **Ajustes (`/ajustes`):** mostrar **"Decimales en montos ($)"** y **"Decimales en tasas (%)"** con su vista previa; mencionar que «el profe puede fijar un nivel para que todos obtengan el mismo resultado». De paso, mostrar el **tema claro/oscuro**.
- **Gancho:** Trazabilidad del aprendizaje + control de precisión a nivel de curso, sin instalar nada ni crear cuentas.

---

## Diferenciadores pedagógicos (transversales) — opcional, 30–60 s

> Si querés rematar mostrando *por qué* esto es una herramienta de aprendizaje y no solo una calculadora, estos cinco detalles aparecen en varias pantallas. No es necesario abrir una escena nueva: se pueden señalar de paso en las escenas de interés simple/compuesto y gradientes.

- **"En palabras":** Bajo los resultados (interés simple, compuesto, gradientes y anualidades especiales) hay una frase que **traduce el número a la realidad** ("Si colocas $X a tasa Y durante n meses, al final tendrás $Z…"). Quita el miedo al número pelado.
- **Glosario contextual ("Conceptos:"):** Una fila de **chips** que abren **tooltips** con la definición (en interés simple, compuesto y gradientes). Repaso instantáneo sin salir del ejercicio.
- **Micro-quiz "Comprueba que entendiste":** Tras calcular (interés simple, compuesto y gradientes) aparece **una pregunta conceptual** con retroalimentación y botón **"Otra pregunta"**. Convierte el cálculo en aprendizaje activo.
- **"Explícame con IA" por paso:** El botón está en **cada paso** del paso a paso de **todas** las calculadoras (llama al endpoint `api/explain.ts` con Groq). Es como tener un tutor explicando *por qué* de cada línea.
- **Redondeo configurable (Ajustes):** El profe fija los decimales de montos y tasas para todo el grupo → **todos obtienen el mismo resultado** (se acaban las disputas de redondeo).

---

## Cierre (1–2 min)

«Para resumir, Finametrics cubre **exactamente** lo que se pidió, y más:»

- ✅ **Lenguaje natural** → módulo *Resolver con IA* interpreta el enunciado, identifica el tipo de cálculo y, si faltan datos, hace **preguntas aclaratorias**.
- ✅ **Cálculo de i, I, P, M (=F) y n** en interés simple y compuesto, con el **interés I siempre visible** (fórmula `I = P × i × n`).
- ✅ **Tabla por período** en cada cálculo, exportable a Excel.
- ✅ **Unidad de período seleccionable** (quincenal, mensual, bimestral, trimestral, cuatrimestral, semestral, anual… y más).
- ✅ **Gradientes** (aritmético +G y geométrico +g %) con P, F y serie uniforme equivalente — módulo **08**, ya entregado.
- ✅ **Anualidades especiales** (anticipada, diferida y perpetua) integradas en el módulo de Anualidades, ya entregadas.

**Diferenciadores:** asistente con IA + chatbot tutor, **paso a paso didáctico** con botón "Explícame con IA" (en *todas* las calculadoras), **glosario contextual** (tooltips), **micro-quiz** de comprensión, **narrativa "En palabras"**, modos práctica/examen, comparadores visuales, reporte PDF en VPN/TIR, **respaldo del historial en JSON (exportar/importar)**, redondeo configurable y tema claro/oscuro. Todo en español, en pesos COP, y **las calculadoras funcionan sin internet** (la IA es un extra).

---

## Posibles preguntas del profesor y cómo responderlas

**1. ¿Las fórmulas son correctas / de dónde sale la matemática?**
Toda la matemática financiera vive en funciones puras de `src/lib/` (interés simple, compuesto, conversión de tasas, amortización, anualidades, Fisher), separadas de la interfaz. Cada función produce además su paso a paso (`build*Steps()`), así que el resultado y su explicación salen de la **misma** fuente. Usamos formato `es-CO` y pesos COP de forma centralizada para evitar errores de redondeo.

**2. ¿Por qué Groq/Llama y no otro modelo? ¿Es la IA la que calcula?**
Groq da respuestas muy rápidas y económicas con Llama 3.3, ideal para una demo en clase. **La IA no es la fuente de verdad de los cálculos:** en las calculadoras, el resultado lo da nuestro código en `src/lib/`. La IA se usa para *interpretar* el lenguaje natural y *explicar* en palabras; cuando "Ir a la calculadora", el número final lo recalcula nuestra lógica exacta.

**3. ¿Qué pasa si no hay internet o falla la API key?**
Las **calculadoras, la wiki, práctica/examen, historial y dashboard funcionan 100% offline** porque corren en el navegador. Solo se desactivan las tres funciones de IA (Resolver, chatbot y "Explícame con IA"), que requieren `GROQ_API_KEY` y conexión. La app degrada con gracia y muestra un aviso.

**4. ¿Dónde y cómo se guardan los datos? ¿Privacidad?**
No hay backend de datos ni cuentas: el historial y el progreso se guardan en el **`localStorage` del navegador del estudiante** (historial limitado a los últimos 50 cálculos). Se puede **exportar/importar en JSON** como respaldo. La clave de la IA vive solo en variables de entorno del servidor; nunca se envía al cliente.

**5. ¿Cómo garantizan que todos obtengan el mismo resultado en un parcial?**
En **Ajustes** se configura el número de decimales de montos y tasas; el profe puede fijar un estándar para todo el grupo. Además, el **Modo Examen** oculta fórmulas y el chatbot y califica automáticamente.

**6. ¿La tabla "período a período" es una amortización?**
En interés simple/compuesto es una tabla de **evolución del saldo** (un solo capital que crece), que es lo correcto para ese caso. La **tabla de amortización** con cuota y abono a capital corresponde a un crédito y vive en el módulo **Amortización** (francés y alemán), con su tabla completa exportable.

**7. ¿Está probado el código?**
Hoy la corrección se valida manualmente a través de la UI y del paso a paso. Como las funciones de cálculo son puras y están aisladas en `src/lib/`, son la superficie natural para una **suite de pruebas (Vitest)**, que está en nuestro roadmap.

**8. ¿Qué sigue / próximas mejoras?**
A nivel funcional ya **entregamos** lo que antes era roadmap: **gradientes** (series aritméticas/geométricas, con P, F y serie uniforme equivalente A_eq) como módulo dedicado (08), y **anualidades especiales** (anticipada/diferida/perpetua) integradas en Anualidades. El roadmap real que queda es de **ingeniería**: suite de pruebas automatizadas (Vitest) y CI/CD (lint + build + test). A nivel didáctico, seguir sumando tipos de ejercicio en práctica/examen.

---

## Checklist de demo (verificar antes de presentar)

- [ ] `nvm use 22` y `npm run dev:full` corriendo sin errores (frontend `:5173` + API `:3001`).
- [ ] `.env.local` tiene `GROQ_API_KEY` y hay internet (probar el Resolver una vez antes de empezar).
- [ ] Plan B listo por si la IA falla: tener a mano el screenshot o saber que "todo lo demás funciona offline".
- [ ] Hacer 2–3 cálculos previos para que **Historial** y **Mi Progreso** tengan datos al mostrarlos.
- [ ] Tema claro/oscuro elegido según el proyector/salón.
- [ ] Navegador en pantalla completa, zoom adecuado para que se lea desde el fondo.
- [ ] Datos de ejemplo de cada escena anotados (sobre todo: Resolver $3.000.000/2%/12; VPN $50M con flujos $20M×3, TIO 12%; Gradiente aritmético A=$1M/G=$100k/i=2%/n=12 → P≈$16.142.456).
- [ ] Permisos de descarga listos para mostrar "↓ Descargar Excel" y el PDF de VPN/TIR.
- [ ] **Abrir `/gradientes`** y probar las dos pestañas (aritmético y geométrico) una vez antes de empezar.
- [ ] **Probar la anualidad perpetua** en `/anualidades` (Modo experto → Tipo de anualidad → Perpetua → PV=$33.333.333,33 y FV="∞ (no aplica)").
- [ ] **Mostrar `/ajustes`** y verificar que cambiar los decimales se refleja en vivo (vista previa) y en las calculadoras.
- [ ] **Usar "Explícame con IA"** en un paso del paso a paso con el API (`:3001`) corriendo (depende de `GROQ_API_KEY` + internet).
- [ ] **Historial:** probar "Exportar" e "Importar" (respaldo JSON) si se va a mencionar.
- [ ] Repartido quién narra y quién maneja el teclado.
- [ ] Cronometrar un ensayo completo (objetivo: ≤ 15 min).
