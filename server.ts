import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import express from 'express';
import app from './backend/src/index.ts';

const here = path.dirname(fileURLToPath(import.meta.url));

function findFrontendDist(): string | null {
  const candidates = [
    path.resolve(process.cwd(), 'frontend/dist'),
    path.resolve(process.cwd(), 'dist'),
    path.resolve(here, 'frontend/dist'),
    path.resolve(here, 'dist'),
  ];
  return candidates.find((dir) => fs.existsSync(path.join(dir, 'index.html'))) ?? null;
}

const distPath = findFrontendDist();
if (distPath) {
  app.use(express.static(distPath, { index: false }));
  app.use((req, res, next) => {
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      next();
      return;
    }
    if (req.path.startsWith('/api')) {
      next();
      return;
    }
    res.sendFile(path.join(distPath, 'index.html'), (err) => {
      if (err) next(err);
    });
  });
} else {
  console.warn('Frontend build not found. API routes are still available.');
}

app.use((err: unknown, _req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err);
  if (res.headersSent) {
    next(err);
    return;
  }
  res.status(500).json({ detail: 'Request failed due to an internal error.' });
});

export default app;
