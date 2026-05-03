import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import electron from 'vite-plugin-electron/simple';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      '@/shared': path.resolve(__dirname, 'src/shared'),
      '@/renderer': path.resolve(__dirname, 'src/renderer'),
      '@/main': path.resolve(__dirname, 'src/main'),
    },
  },
  plugins: [
    react(),
    electron({
      main: {
        entry: 'src/main/index.ts',
        vite: {
          resolve: {
            alias: {
              '@/shared': path.resolve(__dirname, 'src/shared'),
              '@/main': path.resolve(__dirname, 'src/main'),
            },
          },
          build: {
            outDir: 'dist-electron/main',
            rollupOptions: {
              // @anthropic-ai/claude-agent-sdk は dynamic import() で読み込むため external に含める
            // dotenv は Node.js ネイティブなので external に含める
            external: ['electron', '@anthropic-ai/claude-agent-sdk', 'dotenv'],
              output: {
                entryFileNames: '[name].js',
              },
            },
          },
        },
      },
      preload: {
        input: 'src/preload/index.ts',
        vite: {
          resolve: {
            alias: {
              '@/shared': path.resolve(__dirname, 'src/shared'),
            },
          },
          build: {
            outDir: 'dist-electron/preload',
            rollupOptions: {
              external: ['electron'],
              output: {
                entryFileNames: '[name].js',
              },
            },
          },
        },
      },
      renderer: {},
    }),
  ],
});
