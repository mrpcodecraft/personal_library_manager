const http = require('http');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const PORT = 3000;
const DIST_DIR = path.join(__dirname, '..', 'dist');

if (!fs.existsSync(DIST_DIR) || !fs.existsSync(path.join(DIST_DIR, 'index.html'))) {
  console.log('[E2E Server] Exporting web distribution bundle for Playwright...');
  execSync('npx expo export --platform web', { stdio: 'inherit' });
}

const MIME_TYPES = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.ttf': 'font/ttf',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
};

const server = http.createServer((req, res) => {
  req.on('error', () => {});
  res.on('error', () => {});

  let reqPath = req.url.split('?')[0];
  if (reqPath === '/' || !path.extname(reqPath)) {
    reqPath = '/index.html';
  }

  const filePath = path.join(DIST_DIR, reqPath);

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      const fallbackPath = path.join(DIST_DIR, 'index.html');
      fs.readFile(fallbackPath, (fallbackErr, data) => {
        if (fallbackErr) {
          if (!res.headersSent) {
            res.writeHead(404, { 'Content-Type': 'text/plain' });
          }
          res.end('Not Found');
        } else {
          if (!res.headersSent) {
            res.writeHead(200, { 'Content-Type': 'text/html' });
          }
          res.end(data);
        }
      });
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    if (!res.headersSent) {
      res.writeHead(200, { 'Content-Type': contentType });
    }
    const stream = fs.createReadStream(filePath);
    stream.on('error', () => {
      res.end();
    });
    stream.pipe(res);
  });
});

server.on('error', (err) => {
  console.error('[E2E Server] Server error:', err);
});

process.on('uncaughtException', (err) => {
  console.error('[E2E Server] Uncaught exception:', err);
});

server.listen(PORT, '127.0.0.1', () => {
  console.log(`[E2E Server] Running on http://127.0.0.1:${PORT}`);
});
