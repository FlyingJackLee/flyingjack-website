#!/usr/bin/env node
// 本地预览。零依赖：改 data/ 或 src/ 自动重建，浏览器手动刷新即可。

import { createServer } from 'node:http';
import { readFile, watch } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { extname, join, normalize } from 'node:path';

const PORT = Number(process.env.PORT) || 4173;
const ROOT = 'dist';

const TYPES = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8', '.json': 'application/json',
  '.webp': 'image/webp', '.jpg': 'image/jpeg', '.png': 'image/png',
  '.svg': 'image/svg+xml', '.ico': 'image/x-icon', '.pdf': 'application/pdf',
};

const build = () => {
  try {
    execFileSync('node', ['build.js'], { stdio: 'inherit' });
    return true;
  } catch { return false; }
};

build();

createServer(async (req, res) => {
  let p = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  if (p.endsWith('/')) p += 'index.html';
  // 防目录穿越
  const file = join(ROOT, normalize(p).replace(/^(\.\.[/\\])+/, ''));
  const target = existsSync(file) ? file : file + '.html';
  try {
    const body = await readFile(target);
    res.writeHead(200, {
      'content-type': TYPES[extname(target)] ?? 'application/octet-stream',
      'cache-control': 'no-store',
    });
    res.end(body);
  } catch {
    res.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' });
    res.end('404 ' + p);
  }
}).listen(PORT, () => {
  console.log(`\n  预览  http://localhost:${PORT}/`);
  console.log(`  详情  http://localhost:${PORT}/projects/bid-agent.html`);
  console.log(`  英文  http://localhost:${PORT}/?lang=en`);
  console.log(`\n  正在监听 data/ 与 src/，改动后自动重建（浏览器需手动刷新）\n`);
});

// 监听源文件
let timer;
for (const dir of ['data', 'src']) {
  (async () => {
    for await (const _ of watch(dir, { recursive: true })) {
      clearTimeout(timer);
      timer = setTimeout(() => { console.log('\n── 重建 ──'); build(); }, 80);
    }
  })();
}
