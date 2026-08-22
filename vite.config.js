import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    host: "0.0.0.0",
    port: 5173,
    proxy: {
      // Forward all /api/v1 requests to the NestJS backend
      // Eliminates CORS issues in development
      "/api/v1": {
        target: "http://localhost:3000",
        changeOrigin: true,
        secure: false,
      },
      // Forward all /uploads requests to NestJS static file server
      "/uploads": {
        target: "http://localhost:3000",
        changeOrigin: true,
        secure: false,
      },
    },
  },
});
