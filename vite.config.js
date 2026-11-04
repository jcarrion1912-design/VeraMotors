import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// El navegador habla con la API en su mismo origen para que la cookie de sesión
// (httpOnly + SameSite=Strict) viaje. En producción, el servidor web debe hacer lo mismo con /api.
const proxy = {
  '/api': 'http://127.0.0.1:8000',
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: { proxy },
  preview: { proxy },
})
