import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// IMPORTANT: base must match your repo name exactly (with slashes)
// Since your GitHub Pages URL is https://jeevan329-design.github.io/Jeevwn/
// the base is '/Jeevwn/'
export default defineConfig({
  plugins: [react()],
  base: '/ppp/',
})
