import 'dotenv/config';
import express, { type NextFunction, type Request, type Response } from 'express';
import fs from 'fs';
import path from 'path';
import { sql } from 'drizzle-orm';
import { closePool, db } from './src/db/index.ts';
import { requireAdmin } from './src/server/auth.ts';
import { createPublicRouter } from './src/server/routes/public.ts';
import { createAdminAuthRouter } from './src/server/routes/adminAuth.ts';
import { createAdminContentRouter } from './src/server/routes/adminContent.ts';
import { createAdminEnquiriesRouter } from './src/server/routes/adminEnquiries.ts';
import { createAdminAnalyticsRouter } from './src/server/routes/adminAnalytics.ts';

async function startServer() {
  const app = express();
  const port = Number(process.env.PORT || 3000);
  const isProd = process.env.NODE_ENV === 'production';

  app.disable('x-powered-by');
  app.set('trust proxy', true);

  // Baseline security & indexing headers (preserve iframe embed compatibility)
  app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
    if (req.path.startsWith('/api') || req.path.startsWith('/admin')) {
      res.setHeader('X-Robots-Tag', 'noindex, nofollow');
    }
    next();
  });

  app.use(express.json({ limit: '2mb' }));

  // Database & service health readiness endpoint
  app.get('/api/health', async (_req, res) => {
    try {
      await db.execute(sql`SELECT 1`);
      res.setHeader('Cache-Control', 'no-store');
      res.json({
        status: 'ok',
        database: 'connected',
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Health check failed:', error);
      res.status(503).json({
        status: 'error',
        database: 'disconnected',
      });
    }
  });

  // Public API routes
  app.use('/api', createPublicRouter());

  // Admin Authentication routes (login, session check, logout)
  app.use('/api/admin/auth', createAdminAuthRouter());

  // Protected Admin API routes
  app.use('/api/admin', requireAdmin, createAdminContentRouter());
  app.use('/api/admin', requireAdmin, createAdminEnquiriesRouter());
  app.use('/api/admin', requireAdmin, createAdminAnalyticsRouter());

  // Return JSON 404 for unknown /api/* routes instead of falling back to index.html
  app.use('/api', (_req, res) => {
    res.status(404).json({ error: 'API endpoint not found.' });
  });

  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distDir, { index: false }));
    app.get('*', (_req, res) => {
      const indexFile = path.join(distDir, 'index.html');
      if (fs.existsSync(indexFile)) {
        res.sendFile(indexFile);
      } else {
        res.status(404).send('Build output not found.');
      }
    });
  }

  // Global error handler for malformed JSON bodies and unhandled Express errors
  app.use((err: unknown, req: Request, res: Response, _next: NextFunction) => {
    const parseErr = err as { status?: number; type?: string; message?: string };
    if (parseErr?.type === 'entity.parse.failed' || (err instanceof SyntaxError && parseErr?.status === 400)) {
      res.status(400).json({ error: 'Invalid JSON request payload.' });
      return;
    }
    console.error('Unhandled Express error:', err);
    if (req.path.startsWith('/api')) {
      res.status(500).json({ error: 'Internal server error.' });
      return;
    }
    res.status(500).send('Internal server error.');
  });

  const server = app.listen(port, '0.0.0.0', () => {
    console.log(`Server listening on http://0.0.0.0:${port}`);
  });

  const shutdown = async (signal: string) => {
    console.log(`Received ${signal}, shutting down gracefully...`);
    server.close(async () => {
      await closePool().catch((err) => console.error('Error closing DB pool:', err));
      process.exit(0);
    });
    setTimeout(() => process.exit(1), 10000).unref();
  };

  process.on('SIGTERM', () => {
    void shutdown('SIGTERM');
  });
  process.on('SIGINT', () => {
    void shutdown('SIGINT');
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
