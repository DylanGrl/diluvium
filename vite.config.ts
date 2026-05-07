import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const proxyTarget = env.DELUGE_URL || "http://localhost:8112";

  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    build: {
      sourcemap: false,
    },
    server: {
      proxy: {
        "/json": {
          target: proxyTarget,
          changeOrigin: true,
          secure: false,
          timeout: 600_000,
          proxyTimeout: 600_000,
        },
        "/upload": {
          target: proxyTarget,
          changeOrigin: true,
          secure: false,
          timeout: 600_000,
          proxyTimeout: 600_000,
        },
        "/torrent": {
          target: proxyTarget,
          changeOrigin: true,
          secure: false,
        },
      },
    },
  };
});
