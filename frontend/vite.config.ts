import { fileURLToPath, URL } from 'node:url'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// O design system fica fora desta pasta (../health7-design-system).
// Importamos de lá para ter uma fonte só de tokens e classes h7-.
const designSystem = fileURLToPath(new URL('../health7-design-system', import.meta.url))

export default defineConfig({
  // Caminhos relativos: o build funciona no GitHub Pages (subpasta) e na Vercel.
  base: './',
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      '@ds': designSystem,
    },
  },
  server: {
    fs: { allow: ['.', designSystem] },
  },
})
