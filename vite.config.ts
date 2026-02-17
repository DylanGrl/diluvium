import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    proxy: {
      "/json": {
        target: "http://localhost:8112",
        changeOrigin: true,
      },
      "/upload": {
        target: "http://localhost:8112",
        changeOrigin: true,
      },
    },
  },
});
