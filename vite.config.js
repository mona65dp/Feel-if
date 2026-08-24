import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  base: '/Feel-if/',
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icon.ico', 'logo.png', 'icons.svg'],
      manifest: {
        name: 'Feel-it App',
        short_name: 'Feel-it',
        description: 'Feel-it Application',
        theme_color: '#ffffff',
        icons: [
          {
            src: '192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: '512.png',
            sizes: '512x512',
            type: 'image/png'
          },
          {
            src: '512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      }
    })
  ]
})