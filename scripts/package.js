import { readFileSync, writeFileSync, mkdirSync, copyFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { crc32 } from 'node:zlib';
const root = fileURLToPath(new URL('../', import.meta.url));
const docs = join(root, 'docs');
mkdirSync(join(docs, 'downloads'), { recursive: true });
for (const file of ['app.js', 'style.css', 'galaxy.png', 'galaxy.gif']) copyFileSync(join(root, 'public', file), join(docs, file));
writeFileSync(join(docs, 'index.html'), readFileSync(join(root, 'public/index.html'), 'utf8').replace('<body>', '<body data-hosted>'));
writeFileSync(join(docs, '.nojekyll'), '');
// Standard uncompressed ZIP: no executable bundler, package download, or build dependency.
const files = ['README.md', 'DEVELOPMENT.md', 'LICENSE', 'package.json', 'Start OpenAI Presence.cmd', 'Enable Automatic Startup.cmd', 'scripts/startup.js',
  ...readdirSync(join(root, 'src')).filter(f => f.endsWith('.js')).map(f => `src/${f}`),
  ...['index.html', 'style.css', 'app.js', 'galaxy.png', 'galaxy.gif'].map(f => `public/${f}`)];
const entries = []; const central = []; let offset = 0;
for (const file of files) {
  const data = readFileSync(join(root, file));
  const name = Buffer.from(`openai-discord-presence/${file}`);
  const crc = crc32(data);
  const local = Buffer.alloc(30);
  local.writeUInt32LE(0x04034b50); local.writeUInt16LE(20, 4); local.writeUInt16LE(0x800, 6);
  local.writeUInt16LE(33, 12); local.writeUInt32LE(crc, 14);
  local.writeUInt32LE(data.length, 18); local.writeUInt32LE(data.length, 22); local.writeUInt16LE(name.length, 26);
  entries.push(local, name, data);
  const dir = Buffer.alloc(46);
  dir.writeUInt32LE(0x02014b50); dir.writeUInt16LE(20, 4); dir.writeUInt16LE(20, 6); dir.writeUInt16LE(0x800, 8);
  dir.writeUInt16LE(33, 14); dir.writeUInt32LE(crc, 16);
  dir.writeUInt32LE(data.length, 20); dir.writeUInt32LE(data.length, 24); dir.writeUInt16LE(name.length, 28); dir.writeUInt32LE(offset, 42);
  central.push(dir, name); offset += local.length + name.length + data.length;
}
const directory = Buffer.concat(central); const end = Buffer.alloc(22);
end.writeUInt32LE(0x06054b50); end.writeUInt16LE(files.length, 8); end.writeUInt16LE(files.length, 10);
end.writeUInt32LE(directory.length, 12); end.writeUInt32LE(offset, 16);
writeFileSync(join(docs, 'downloads/openai-presence-windows.zip'), Buffer.concat([...entries, directory, end]));
console.log(`Prepared public page and Windows ZIP (${files.length} allowlisted files).`);
