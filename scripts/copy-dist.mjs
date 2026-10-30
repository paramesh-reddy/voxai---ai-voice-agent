import fs from 'node:fs';

fs.cpSync('frontend/dist', 'dist', { recursive: true });
