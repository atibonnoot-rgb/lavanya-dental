import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, type Plugin } from 'vite';

function inlineCss(): Plugin {
  return {
    name: 'inline-css',
    enforce: 'post' as const,
    generateBundle(_options: unknown, bundle: any) {
      let htmlKey = '';
      let cssKey = '';
      for (const [key, asset] of Object.entries(bundle)) {
        const a = asset as any;
        if (key.endsWith('.html') && a?.type === 'asset') htmlKey = key;
        if (key.endsWith('.css') && a?.type === 'asset') cssKey = key;
      }
      if (htmlKey && cssKey) {
        const htmlAsset = bundle[htmlKey];
        const cssAsset = bundle[cssKey];
        const cssContent = typeof cssAsset.source === 'string' ? cssAsset.source : new TextDecoder().decode(cssAsset.source);
        const htmlContent = typeof htmlAsset.source === 'string' ? htmlAsset.source : new TextDecoder().decode(htmlAsset.source);
        htmlAsset.source = htmlContent.replace(
          new RegExp(`<link rel="stylesheet"[^>]*href="[^"]*${cssKey}"[^>]*>`, 'i'),
          `<style>${cssContent}</style>`
        );
      }
    }
  };
}

export default defineConfig(({ mode }) => {
  const isProd = mode === 'production';
  return {
    plugins: [react(), tailwindcss(), inlineCss()],
    resolve: {
      alias: {
        '@': path.resolve(import.meta.dirname, '.'),
        'react': 'preact/compat',
        'react-dom/test-utils': 'preact/test-utils',
        'react-dom': 'preact/compat',
        'react/jsx-runtime': 'preact/jsx-runtime',
      },
    },
    esbuild: {
      drop: isProd ? ['console', 'debugger'] : [],
    },
    build: {
      minify: 'terser',
      terserOptions: {
        compress: {
          drop_console: isProd,
          drop_debugger: isProd,
          passes: 2,
        },
        format: {
          comments: false,
        },
      },
      cssMinify: true,
      chunkSizeWarningLimit: 600,
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('node_modules/preact') || id.includes('node_modules/react') || id.includes('node_modules/react-dom')) {
              return 'vendor-react';
            }
            if (id.includes('node_modules/@supabase')) {
              return 'vendor-supabase';
            }
            if (id.includes('node_modules/lucide-react')) {
              return 'vendor-icons';
            }
            if (id.includes('node_modules/canvas-confetti')) {
              return 'vendor-confetti';
            }
            if (id.includes('node_modules/xlsx')) {
              return 'vendor-xlsx';
            }
          },
        },
      },
    },
    server: {
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});

