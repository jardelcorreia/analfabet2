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
    'process.env': {},
  },
  resolve: {
    alias: {
      // No longer need to manually alias Node.js modules.
      // The `vite-plugin-node-polyfills` plugin handles this.
    },
  },
  optimizeDeps: {
    exclude: ['lucide-react'],
    esbuildOptions: {
      // No longer need esbuild-specific polyfill plugins here,
      // as vite-plugin-node-polyfills handles it more globally.
    },
  },
  build: {
    commonjsOptions: {
      transformMixedEsModules: true,
    },
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          utils: ['date-fns', 'lucide-react'],
        }
      }
    }
  }
});