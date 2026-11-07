import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const NAAM_API_BASE = 'https://naam.gredin.app';

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Proxy /api/users/* to https://naam.gredin.app/users/* to avoid browser CORS preflight issues
  app.post('/api/users/:endpoint', async (req, res) => {
    const { endpoint } = req.params;
    const allowedEndpoints = new Set(['submit', 'verify-otp', 'resend-otp']);

    if (!allowedEndpoints.has(endpoint)) {
      res.status(404).json({ message: 'Unsupported waitlist endpoint' });
      return;
    }

    try {
      const upstreamResponse = await fetch(`${NAAM_API_BASE}/users/${endpoint}`, {
        method: 'POST',
        headers: {
          accept: '*/*',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(req.body),
      });

      const contentType = upstreamResponse.headers.get('content-type') || '';
      const rawText = await upstreamResponse.text();

      res.status(upstreamResponse.status);
      if (contentType.includes('application/json')) {
        try {
          res.json(JSON.parse(rawText));
          return;
        } catch {
          // Fall through to text response
        }
      }
      res.send(rawText);
    } catch (error) {
      console.error(`Error proxying /api/users/${endpoint}:`, error);
      res.status(502).json({
        message: 'Unable to reach Naam waitlist server. Please try again in a moment.',
      });
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'mpa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('/privacy', (_req, res) => {
      res.sendFile(path.join(distPath, 'privacy.html'));
    });
    app.get('/terms', (_req, res) => {
      res.sendFile(path.join(distPath, 'terms.html'));
    });
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Naam Dating server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
