import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: { 
    port: 3000, 
    host: '0.0.0.0',        // Ye phone aur ngrok ko allow karega
    allowedHosts: true,     // Ngrok ke link ko block hone se bachayega
    proxy: { '/api': 'http://localhost:5000' } 
  },
});