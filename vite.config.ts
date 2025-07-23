import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { nodePolyfills } from 'vite-plugin-node-polyfills';

export default defineConfig({
  plugins: [
    react(),
    nodePolyfills({
      // Explicitly specify globals, though Buffer and process are defaults.
      // This ensures our intent is clear.
      globals: {
        Buffer: true,
        global: true,
        process: true,
      },
      // Enable polyfill for `node:` protocol imports if any dependency uses them.
      protocolImports: true,
    }),
  ],
  define: {
    global: 'globalThis',
    'process.env': {},
  },
  resolve: {
    alias: {
      process: 'process/browser',
      buffer: 'buffer',
      crypto: 'crypto-browserify',
      stream: 'stream-browserify',
      util: 'util',
      events: 'events',
    },
  },
  optimizeDeps: {
    exclude: ['lucide-react'],
    include: [
      'buffer',
      'process/browser',
      'crypto-browserify',
      'stream-browserify',
      'util',
      'events',
      'jsonwebtoken' // Add jsonwebtoken here
    ],
    esbuildOptions: {
      define: {
        global: 'globalThis',
      },
      // No longer need esbuild-specific polyfill plugins here,
      // as vite-plugin-node-polyfills handles it more globally.
      plugins: [],
    },
  },
  build: {
    commonjsOptions: {
      transformMixedEsModules: true,
      // Reverted to default by removing 'include' array
    },
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          utils: ['date-fns', 'lucide-react'],
          polyfills: ['buffer', 'process', 'crypto-browserify', 'stream-browserify', 'util', 'events'],
        }
      }
    }
  }
});