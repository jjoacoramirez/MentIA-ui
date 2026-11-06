import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// En desarrollo, /api se reenvía a MentIA-api: el navegador ve un solo origen y no hace falta CORS.
const apiTarget = process.env.MENTIA_API_TARGET || "http://localhost:8080";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: { proxy: { "/api": { target: apiTarget, changeOrigin: true } } },
  preview: { proxy: { "/api": { target: apiTarget, changeOrigin: true } } },
});
