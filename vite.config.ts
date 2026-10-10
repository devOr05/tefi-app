import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  define: {
    'process.env': {},
    global: 'globalThis'
  },
  resolve: {
    alias: {
      buffer: 'buffer'
    }
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'icon.svg'],
      manifest: {
        name: 'Tefi.app - Corner store credit notebook on Solana',
        short_name: 'Tefi',
        description: 'Corner store credit (el fiado) co-signed by store and neighbor on Solana, building a portable repayment history',
        theme_color: '#00A650',
        background_color: '#F5F5F5',
        display: 'standalone',
        orientation: 'portrait',
        icons: [
          {
            src: 'icon.svg',
            sizes: '192x192 512x512',
            type: 'image/svg+xml',
            purpose: 'any maskable'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
        cleanupOutdatedCaches: true,
        clientsClaim: true,
        skipWaiting: true
      }
    })
  ]
})
