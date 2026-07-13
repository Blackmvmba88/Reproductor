import {cp,mkdir} from 'node:fs/promises';
import {resolve} from 'node:path';
import {defineConfig,type Plugin} from 'vite';
import react from '@vitejs/plugin-react';

function copyRuntimeAssets():Plugin{
  return{name:'copy-runtime-assets',apply:'build',async writeBundle(options){
    const out=resolve(String(options.dir??'dist'));
    await mkdir(resolve(out,'player'),{recursive:true});
    await Promise.all([
      cp('public/piano',resolve(out,'piano'),{recursive:true}),
      cp('public/ganja-love-cover.png',resolve(out,'ganja-love-cover.png')),
      cp('public/player/library.json',resolve(out,'player/library.json')),
      cp('public/player/source-audit.json',resolve(out,'player/source-audit.json')).catch(() => {}),
    ]);
  }};
}

export default defineConfig({
  base:'./',
  plugins:[react(),copyRuntimeAssets()],
  server:{host:'127.0.0.1'},
  preview:{host:'127.0.0.1'},
  build:{sourcemap:true,copyPublicDir:false},
  test:{include:['src/tests/**/*.test.ts'],environment:'jsdom',setupFiles:['./src/tests/setup.ts'],coverage:{provider:'v8',reporter:['text','html'],include:['src/rhythm/engine/**/*.ts','src/storage/**/*.ts'],thresholds:{lines:85,functions:85,branches:75,statements:85}}},
});
