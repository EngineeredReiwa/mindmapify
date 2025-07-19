import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

console.log('PORT from env:', process.env.PORT);

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: parseInt(process.env.PORT || '5173', 10),
  },
})