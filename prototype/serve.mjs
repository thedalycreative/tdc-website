// Minimal static file server for local preview (no dependencies).
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(fileURLToPath(new URL('.', import.meta.url)), '..');
const types = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.pdf': 'application/pdf',
};

createServer(async (req, res) => {
  const path = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  // mirrors Vercel's cleanUrls behaviour: /services → services.html, /blog → blog/index.html
  const candidates = path.endsWith('/')
    ? [path + 'index.html']
    : [path, path + '.html', path + '/index.html'];
  for (const candidate of candidates) {
    const file = normalize(join(root, candidate));
    if (!file.startsWith(root)) break;
    try {
      const data = await readFile(file);
      res.writeHead(200, { 'content-type': types[extname(file)] ?? 'application/octet-stream' });
      res.end(data);
      return;
    } catch { /* try next candidate */ }
  }
  try {
    const notFound = await readFile(join(root, '404.html'));
    res.writeHead(404, { 'content-type': 'text/html; charset=utf-8' }).end(notFound);
  } catch {
    res.writeHead(404, { 'content-type': 'text/plain' }).end('not found');
  }
}).listen(8642, '127.0.0.1', () => console.log('serving on http://127.0.0.1:8642'));
