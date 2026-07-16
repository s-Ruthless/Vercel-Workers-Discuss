import { defineConfig } from 'vite';
import { resolve } from 'path';
import { readFileSync, copyFileSync, mkdirSync } from 'fs';
import cssInjectedByJsPlugin from 'vite-plugin-css-injected-by-js';

const pkg = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf-8'));
const banner = `/*! VWDComments widget v${pkg.version} */`;

function copyDtsPlugin() {
  return {
    name: 'copy-dts',
    closeBundle() {
      const src = resolve(__dirname, 'src/index.d.ts');
      const dests = [
        resolve(__dirname, 'dist/index.d.ts'),
        resolve(__dirname, 'dist/vwd.es.d.ts'),
        resolve(__dirname, 'dist/vwd.umd.d.ts')
      ];

      dests.forEach(dest => {
        try {
          copyFileSync(src, dest);
          console.log(`[copy-dts] Copied ${src} to ${dest}`);
        } catch (e) {
          console.error(`[copy-dts] Failed to copy .d.ts file to ${dest}: ${e}`);
        }
      });
    }
  }
}

function copyUmdToVwdPlugin() {
  return {
    name: 'copy-umd-to-vwd',
    closeBundle() {
      const src = resolve(__dirname, 'dist/vwd.umd.js');
      const dest = resolve(__dirname, 'dist/vwd.js');
      try {
        copyFileSync(src, dest);
        console.log(`[copy-umd-to-vwd] Copied ${src} to ${dest}`);
      } catch (e) {
        console.error(`[copy-umd-to-vwd] Failed to copy UMD bundle to vwd.js: ${e}`);
      }
    }
  }
}

function copyToPublicPlugin() {
  return {
    name: 'copy-to-public',
    closeBundle() {
      const src = resolve(__dirname, 'dist/vwd.js');
      const publicDir = resolve(__dirname, '../public');
      const dest = resolve(publicDir, 'vwd.js');
      try {
        mkdirSync(publicDir, { recursive: true });
        copyFileSync(src, dest);
        console.log(`[copy-to-public] Copied ${src} to ${dest}`);
      } catch (e) {
        console.error(`[copy-to-public] Failed to copy vwd.js to public: ${e}`);
      }
    }
  }
}

export default defineConfig({
  plugins: [cssInjectedByJsPlugin(), copyDtsPlugin(), copyUmdToVwdPlugin(), copyToPublicPlugin()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      '@shared': resolve(__dirname, '../shared'),
    },
  },
  build: {
    lib: {
      name: 'VWDComments',
      entry: resolve(__dirname, 'src/index.js'),
      formats: ['es', 'umd'],
      fileName: (format) => {
        if (format === 'es') return 'vwd.es.js';
        return 'vwd.umd.js';
      },
    },
    rollupOptions: {
      output: {
        exports: 'named',
        banner,
      },
    },
    sourcemap: false,
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: false,
      },
    },
  },
});
