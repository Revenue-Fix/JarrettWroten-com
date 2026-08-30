import fs from 'fs';
import http from 'http';
import path from 'path';

const TYPES = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.jpg': 'image/jpeg',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.mp4': 'video/mp4',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.webm': 'video/webm',
  '.webp': 'image/webp',
  '.woff2': 'font/woff2',
  '.xml': 'application/xml; charset=utf-8'
};

export async function startPreviewServer(rootDirectory) {
  const root = path.resolve(rootDirectory);
  const server = http.createServer((request, response) => {
    let pathname;
    try { pathname = decodeURIComponent(new URL(request.url, 'http://preview.local').pathname); }
    catch { response.writeHead(400).end(); return; }
    let target = path.resolve(root, '.' + pathname);
    if (target !== root && !target.startsWith(root + path.sep)) {
      response.writeHead(403).end();
      return;
    }
    try {
      if (fs.statSync(target).isDirectory()) target = path.join(target, 'index.html');
    } catch {}
    if (!fs.existsSync(target) || !fs.statSync(target).isFile()) {
      response.writeHead(404).end('Not found');
      return;
    }

    const size = fs.statSync(target).size;
    const headers = {
      'Accept-Ranges': 'bytes',
      'Content-Type': TYPES[path.extname(target).toLowerCase()] || 'application/octet-stream'
    };
    const range = request.headers.range && /^bytes=(\d*)-(\d*)$/.exec(request.headers.range);
    let start = 0;
    let end = size - 1;
    if (range) {
      start = range[1] ? Number(range[1]) : start;
      end = range[2] ? Number(range[2]) : end;
      if (start > end || start >= size) {
        response.writeHead(416, { ...headers, 'Content-Range': `bytes */${size}` }).end();
        return;
      }
      end = Math.min(end, size - 1);
      response.writeHead(206, { ...headers, 'Content-Length': end - start + 1, 'Content-Range': `bytes ${start}-${end}/${size}` });
    } else {
      response.writeHead(200, { ...headers, 'Content-Length': size });
    }
    if (request.method === 'HEAD') response.end();
    else fs.createReadStream(target, { start, end }).pipe(response);
  });

  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', resolve);
  });
  const address = server.address();
  return {
    url: `http://127.0.0.1:${address.port}`,
    close: () => new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()))
  };
}
