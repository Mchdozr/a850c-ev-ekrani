import { build } from 'esbuild';
import { readFile, readdir, mkdir, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = fileURLToPath(new URL('../', import.meta.url));
const wallpapers = {};
for (const file of await readdir(path.join(root, 'public/wallpapers'))) {
  if (file.endsWith('.jpg')) wallpapers[file.slice(0, -4)] = 'data:image/jpeg;base64,' + (await readFile(path.join(root, 'public/wallpapers', file))).toString('base64');
}
const stubs = {
  'next/link': `import React from 'react'; export default function Link({href,children,...props}){ return <a {...props} href={'#'+href}>{children}</a>; }`,
  'next/navigation': `const router={push(path){location.hash=path}}; export function useRouter(){return router}`,
  '@/components/phone-pairing': `export function PhonePairing(){return <span style={{fontSize:12,color:'#c5ced8'}}>Dosya önizlemesi · Telefon için TV’deki QR kodunu kullanın</span>}`,
  '@/components/rea-panel': `export function ReaPanel(){return <p>APK incelemesi için projedeki Baslat dosyasıyla sunuculu sürümü açın.</p>}`,
  '@/components/use-remote-link': `export function useRemoteLink(){}`,
};
const bundle = await build({
  absWorkingDir: root, bundle: true, write: false, minify: true, jsx: 'automatic', define: { 'process.env.NODE_ENV': '"production"' },
  stdin: { resolveDir: root, loader: 'tsx', contents: `
    import React,{useEffect,useState} from 'react'; import {createRoot} from 'react-dom/client';
    import {Designer} from './components/designer'; import {TvStage} from './components/tv-stage';
    import {Toaster} from './components/ui/sonner';
    function App(){const [route,setRoute]=useState(location.hash);useEffect(()=>{const update=()=>setRoute(location.hash);addEventListener('hashchange',update);return()=>removeEventListener('hashchange',update)},[]);
    return <>{route==='#/tv'?<TvStage/>:route==='#/kumanda'?<main style={{padding:40}}><h1>Telefon kumandası</h1><p>Bu dosya görünümü denemek içindir. Gerçek TV kumandası için TV’de Menü → Telefonla bağlan QR kodunu okutun.</p><a href="#/">Tasarımcıya dön</a></main>:<Designer/>}<Toaster/></>};createRoot(document.getElementById('root')).render(<App/>);` },
  plugins: [{ name: 'offline-assets', setup(builder) {
    builder.onResolve({ filter: /^(next\/(link|navigation)|@\/components\/(phone-pairing|rea-panel|use-remote-link))$/ }, args => ({ path: args.path, namespace: 'offline-stub' }));
    builder.onLoad({ filter: /.*/, namespace: 'offline-stub' }, args => ({ contents: stubs[args.path], loader: 'tsx', resolveDir: root }));
    builder.onLoad({ filter: /[\\/]lib[\\/]design\.ts$/ }, async args => ({ contents: (await readFile(args.path, 'utf8')).replace('url("/wallpapers/${id}.jpg")', 'url("${' + JSON.stringify(wallpapers) + '[id]}")'), loader: 'ts' }));
  }}],
});
let css = '';
for (const name of await readdir(path.join(root, '.next/static/chunks'))) if (name.endsWith('.css')) css += await readFile(path.join(root, '.next/static/chunks', name), 'utf8');
css = css.replace(/url\(([^)]+\.ttf)\)/g, () => 'none');
for (const [file, family] of [['Inter.ttf', 'OfflineInter'], ['NunitoSans.ttf', 'OfflineNunito']]) {
  css += `@font-face{font-family:${family};src:url(data:font/ttf;base64,${(await readFile(path.join(root, 'public/fonts', file))).toString('base64')});font-weight:100 900;font-display:swap}`;
}
css += ':root{--font-inter:OfflineInter;--font-nunito-sans:OfflineNunito}';
const html = `<!doctype html><html lang="tr" class="dark"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Ev ekranı · İnternetsiz önizleme</title><style>${css}</style></head><body><div id="root"></div><script>${bundle.outputFiles[0].text.replaceAll('</script', '<\\/script')}</script></body></html>`;
await mkdir(path.join(root, 'release'), { recursive: true });
await writeFile(path.join(root, 'release/Onizleme.html'), html.replace(/[ \t]+$/gm, ''));
console.log('release/Onizleme.html oluşturuldu: aynı Designer/TV bileşenleri, gömülü 8 arka plan ve fontlar.');
