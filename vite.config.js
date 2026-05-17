import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

import { cloudflare } from "@cloudflare/vite-plugin";

export default defineConfig({
  build: {
    chunkSizeWarningLimit: 700,
    rollupOptions: {
      output: {
        // Split heavy / page-specific vendor code into dedicated chunks so the
        // initial download stays small. Recharts in particular is large and
        // is only needed on the reptile detail page.
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'supabase': ['@supabase/supabase-js'],
          'recharts': ['recharts'],
        },
      },
    },
  },
  plugins: [react(), VitePWA({
    registerType: 'autoUpdate',
    workbox: {
      skipWaiting: true,
      clientsClaim: true,
    },
    includeAssets: ['favicon.svg'],
    manifest: {
      name: 'Reptile Logger',
      short_name: 'ReptileLog',
      description: 'Track and log your reptile collection',
      theme_color: '#1a2e1a',
      background_color: '#121a12',
      display: 'standalone',
      orientation: 'portrait',
      start_url: '/',
      icons: [
        {
          src: 'favicon.svg',
          sizes: 'any',
          type: 'image/svg+xml',
          purpose: 'any',
        },
      ],
    },
  }), cloudflare()],
});