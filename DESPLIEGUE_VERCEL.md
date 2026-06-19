# Guía de despliegue en Vercel — Finametrics

Esta guía explica cómo publicar **Finametrics** (frontend Vite + funciones serverless de IA) en Vercel.

> **TL;DR**
> 1. Sube el proyecto a un repositorio Git (GitHub/GitLab/Bitbucket).
> 2. Impórtalo en Vercel (detecta Vite automáticamente).
> 3. Agrega la variable de entorno `GROQ_API_KEY`.
> 4. Deploy. ✅

---

## 0. Qué se va a desplegar

- **Frontend (SPA)**: se compila con `npm run build` → carpeta `dist/`. Vercel la sirve como sitio estático.
- **Funciones serverless** (carpeta `api/`): Vercel convierte automáticamente en endpoints:
  - `POST /api/chat` → tutor con IA (`api/chat.ts`)
  - `POST /api/interpret` → "Resolver con IA" (`api/interpret.ts`)
  - `POST /api/explain` → "Explícame con IA" (`api/explain.ts`)
- `api/server.ts` **NO** se despliega (es solo el servidor local de desarrollo). Ya está excluido en `.vercelignore`.
- `vercel.json` ya está configurado: redirige todo lo que **no** empiece por `/api/` a `index.html` (SPA) y añade cabeceras de seguridad.

**Importante:** las calculadoras, la wiki, práctica/examen, historial, ajustes, etc. funcionan **sin internet ni API key**. La API key solo se necesita para las 3 funciones de IA (chatbot, Resolver, "Explícame con IA").

---

## 1. Requisitos previos

- Cuenta en [vercel.com](https://vercel.com) (el plan gratuito Hobby alcanza de sobra).
- Una **API key de Groq** (gratuita): https://console.groq.com/keys — empieza por `gsk_...`.
- El proyecto subido a un repositorio Git (recomendado) **o** la CLI de Vercel instalada.

---

## 2. Opción A — Desde el panel de Vercel (recomendado)

### 2.1 Subir el proyecto a Git

Si el proyecto aún no es un repositorio Git:

```bash
cd FINCALC-main
git init
git add .
git commit -m "Finametrics: app de Ingeniería Económica"
# Crea un repo vacío en GitHub y luego:
git remote add origin https://github.com/<usuario>/<repo>.git
git branch -M main
git push -u origin main
```

> El `.gitignore` ya excluye `node_modules/`, `dist/` y `.env.local` (tu API key local **no** se sube). 👍

### 2.2 Importar en Vercel

1. Entra a https://vercel.com/new
2. Elige **Import Git Repository** y selecciona tu repo.
3. Vercel detecta el framework automáticamente. Verifica que quede así:
   - **Framework Preset:** `Vite`
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
   - **Install Command:** `npm install`
   - (No cambies nada más; los valores por defecto funcionan.)

### 2.3 Configurar la variable de entorno

Antes de hacer deploy, abre **Environment Variables** y agrega:

| Name | Value | Environments |
|------|-------|--------------|
| `GROQ_API_KEY` | `gsk_...` (tu key de Groq) | Production, Preview, Development |

> Sin esta variable, la app despliega bien pero las funciones de IA responden con error 500 ("API key not configured"). Las calculadoras siguen funcionando.

### 2.4 Deploy

Pulsa **Deploy**. En ~1–2 minutos tendrás una URL pública (`https://<tu-proyecto>.vercel.app`).

Cada `git push` a la rama `main` redepliega producción; cada push a otra rama crea un **Preview Deployment** con su propia URL.

---

## 3. Opción B — Con la CLI de Vercel (sin Git)

```bash
npm i -g vercel          # instalar la CLI
cd FINCALC-main
vercel login             # autenticarte
vercel                   # primer deploy (responde las preguntas; acepta los defaults de Vite)
```

Agregar la API key y redeplegar a producción:

```bash
vercel env add GROQ_API_KEY production   # pega tu key gsk_... cuando lo pida
# (repite para 'preview' y 'development' si quieres)
vercel --prod                            # deploy a producción
```

---

## 4. Verificar que quedó bien

1. Abre la URL de producción → debe cargar la Home ("Todo *cuesta*").
2. Prueba una calculadora (ej. Interés Compuesto) → funciona sin IA.
3. Prueba la IA: ve a **Resolver con IA** y escribe un enunciado, o usa **"Explícame con IA"** en cualquier paso a paso.
   - Chequeo rápido del endpoint (reemplaza la URL):
     ```bash
     curl -s -X POST https://<tu-proyecto>.vercel.app/api/chat \
       -H "Content-Type: application/json" \
       -d '{"message":"¿Qué es interés simple?"}'
     ```
     Debe devolver `{"reply":"..."}`. Si devuelve error de API key, revisa el paso 2.3.

---

## 5. Problemas comunes

| Síntoma | Causa / Solución |
|--------|------------------|
| Build falla con "does not export a default function" en `api/server.ts` | `api/server.ts` no debe desplegarse. Verifica que exista `.vercelignore` con la línea `api/server.ts` (ya incluido en el repo). |
| El build falla por versión de Node | Vite 7 requiere Node 20+. `package.json` ya declara `"engines": { "node": ">=20" }`. En Vercel: **Settings → General → Node.js Version** = 20.x o 22.x. |
| Las funciones de IA dan 500 | Falta `GROQ_API_KEY` en las variables de entorno de Vercel, o la key es inválida/expiró. |
| Cambié la API key pero sigue fallando | Las variables se aplican en el **siguiente** deploy. Vuelve a desplegar (`vercel --prod` o un nuevo push / "Redeploy" en el panel). |
| Las rutas internas dan 404 al recargar | Es una SPA; el rewrite a `index.html` ya está en `vercel.json`. Asegúrate de no haber borrado ese archivo. |
| 404 en `/api/...` | Revisa que los archivos sigan en la carpeta `api/` y que el nombre de la ruta coincida (`/api/chat`, `/api/interpret`, `/api/explain`). |

---

## 6. Notas

- **Costo:** plan Hobby gratuito. Groq tiene capa gratuita generosa; revisa límites en su consola.
- **Seguridad:** la `GROQ_API_KEY` vive **solo** en el servidor (variables de Vercel); nunca se expone al navegador. No la subas al repo.
- **Dominio propio:** opcional, en **Settings → Domains** del proyecto en Vercel.
