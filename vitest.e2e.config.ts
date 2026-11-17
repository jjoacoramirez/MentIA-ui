import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

// Prueba de punta a punta contra MentIA-api real: `npm run test:e2e` con el backend y `npm run dev` levantados.
export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    setupFiles: ["./tests/setup.ts"],
    include: ["tests-e2e/**/*.e2e.test.{ts,tsx}"],
  },
});
