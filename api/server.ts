/// <reference types="node" />
import { createServer, IncomingMessage, ServerResponse } from 'http';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { parse } from 'url';

// ── Cargar .env.local manualmente ──────────────────────────────
const envPath = join(process.cwd(), '.env.local');
if (existsSync(envPath)) {
  const lines = readFileSync(envPath, 'utf-8').split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const idx = trimmed.indexOf('=');
    if (idx === -1) continue;
    const key = trimmed.slice(0, idx).trim();
    const val = trimmed.slice(idx + 1).trim().replace(/^["']|["']$/g, '');
    process.env[key] = val;
  }
  console.log('✅ .env.local cargado');
} else {
  console.warn('⚠️  No se encontró .env.local — asegurate de crearlo con GROQ_API_KEY');
}

// ── Importar los handlers ──────────────────────────────────────
import chatHandler from './chat.js';
import interpretHandler from './interpret.js';

// ── Servidor HTTP ───────────────────────────────────────────────────
const PORT = 3001;

const server = createServer(async (req: IncomingMessage, res: ServerResponse) => {
  // CORS para desarrollo
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // Parsear la URL
  const parsedUrl = parse(req.url || '', true);
  const pathname = parsedUrl.pathname || '';

  // ── Endpoint de salud ──────────────────────────────────────────
  if (pathname === '/api/health' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      status: 'ok',
      message: 'API funcionando correctamente',
      config: {
        hasGroqKey: !!process.env.GROQ_API_KEY,
        nodeEnv: process.env.NODE_ENV || 'development'
      }
    }));
    return;
  }

  // ── Helper para manejar handlers tipo Vercel ───────────────────
  async function handleVercelStyle(
    handler: (req: any, res: any) => Promise<void>
  ) {
    let rawBody = '';

    req.on('data', (chunk: Buffer) => {
      rawBody += chunk.toString();
    });

    req.on('end', async () => {
      try {
        const mockReq: any = {
          method: req.method,
          body: rawBody,
        };

        let statusCode = 200;
        let headers: Record<string, string> = {};

        const mockRes: any = {
          status(code: number) {
            statusCode = code;
            return this;
          },
          setHeader(key: string, value: string) {
            headers[key] = value;
            return this;
          },
          json(data: any) {
            res.writeHead(statusCode, {
              'Content-Type': 'application/json',
              ...headers,
            });
            res.end(JSON.stringify(data));
          },
        };

        await handler(mockReq, mockRes);
      } catch (error: any) {
        console.error(`Error en ${pathname}:`, error);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          error: 'Internal server error',
          detail: error?.message || 'Unknown error'
        }));
      }
    });

    req.on('error', (error: Error) => {
      console.error('Error en la petición:', error);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Request error' }));
    });
  }

  // ── Endpoint del chat ──────────────────────────────────────────
  if (pathname === '/api/chat' && req.method === 'POST') {
    await handleVercelStyle(chatHandler);
    return;
  }

  // ── Endpoint de interpretación ─────────────────────────────────
  if (pathname === '/api/interpret' && req.method === 'POST') {
    await handleVercelStyle(interpretHandler);
    return;
  }

  // ── Ruta no encontrada ──────────────────────────────────────────
  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({
    error: 'Not found',
    message: `La ruta ${pathname} no existe`,
    availableEndpoints: ['GET /api/health', 'POST /api/chat', 'POST /api/interpret']
  }));
});

// ── Iniciar servidor ──────────────────────────────────────────────
server.listen(PORT, () => {
  console.log('');
  console.log('🚀  API local corriendo en http://localhost:' + PORT);
  console.log('📡  Endpoints disponibles:');
  console.log('    GET  http://localhost:' + PORT + '/api/health');
  console.log('    POST http://localhost:' + PORT + '/api/chat');
  console.log('    POST http://localhost:' + PORT + '/api/interpret');
  console.log('');
  console.log('💡  El proxy de Vite redirige /api/* → localhost:' + PORT + '/api/*');
  console.log('');
});

// ── Manejar errores del servidor ──────────────────────────────────
server.on('error', (error: Error) => {
  console.error('❌ Error del servidor:', error);
});