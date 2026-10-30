import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { createServer } from 'node:net';
import { fileURLToPath } from 'node:url';

process.chdir(fileURLToPath(new URL('../', import.meta.url)));
const [major, minor] = process.versions.node.split('.').map(Number);
if (major < 20 || (major === 20 && minor < 9)) {
  console.error('Node.js 20.9 veya üzerini nodejs.org üzerinden kurup tekrar açın. Görünümü kurulum olmadan görmek için release/Onizleme.html dosyasını açabilirsiniz.');
  process.exit(1);
}
const npm = process.platform === 'win32' ? 'npm.cmd' : 'npm';
function run(args) { return new Promise((resolve, reject) => {
  const child = spawn(npm, args, { stdio: 'inherit', shell: process.platform === 'win32' });
  child.on('error', reject); child.on('exit', code => code === 0 ? resolve() : reject(new Error(`npm ${args.join(' ')} başarısız (${code})`)));
}); }
try {
  if (!existsSync('node_modules/next')) await run(['ci']);
  await run(['run', 'build']);
  let port = 3000;
  for (; port <= 3010; port++) {
    const free = await new Promise(resolve => { const probe = createServer(); probe.once('error', () => resolve(false)); probe.listen(port, '0.0.0.0', () => probe.close(() => resolve(true))); });
    if (free) break;
  }
  if (port > 3010) throw new Error('3000–3010 portları dolu; açık uygulamaları kapatıp yeniden deneyin.');
  const server = spawn(npm, ['run', 'start', '--', '--hostname', '0.0.0.0', '--port', String(port)], { stdio: 'inherit', shell: process.platform === 'win32' });
  let opened = false;
  const timer = setInterval(async () => {
    if (opened) return;
    try {
      const url = `http://127.0.0.1:${port}`;
      const response = await fetch(url, { signal: AbortSignal.timeout(1000) });
      if (!response.ok) return;
      opened = true; clearInterval(timer);
      console.log(`Hazır: ${url} — bu adres artık SİZİN bilgisayarınızda çalışır. Kapatmak için bu pencereyi kapatın.`);
      if (process.env.EV_NO_BROWSER !== '1') {
        const [command, args] = process.platform === 'win32' ? ['cmd', ['/c', 'start', '', url]] : process.platform === 'darwin' ? ['open', [url]] : ['xdg-open', [url]];
        const browser = spawn(command, args, { stdio: 'ignore' }); browser.on('error', () => console.log('Tarayıcıda yukarıdaki adresi açın.'));
      }
    } catch { /* Wait for the application, not just the listening port. */ }
  }, 500);
  server.on('exit', code => { clearInterval(timer); process.exitCode = code ?? 1; });
  server.on('error', error => { clearInterval(timer); console.error(error.message); process.exitCode = 1; });
} catch (error) { console.error(error.message); process.exitCode = 1; }
