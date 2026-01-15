import path from "path";
import { defineConfig, loadEnv } from "vite";
import type { Plugin } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// Plugin to replace %VITE_*% placeholders in index.html with env values
function htmlEnvPlugin(): Plugin {
  return {
    name: "html-env-plugin",
    transformIndexHtml: {
      order: "pre",
      handler(html, ctx) {
        // Load env vars for the current mode
        const env = loadEnv(
          ctx.server?.config.mode || "production",
          process.cwd(),
          "VITE_"
        );
        // Replace %VITE_*% placeholders
        return html.replace(
          /%VITE_(\w+)%/g,
          (_, key) => env[`VITE_${key}`] || ""
        );
      },
    },
  };
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [htmlEnvPlugin(), react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    proxy: {
      "/api": {
        target: "http://localhost:3000",
        changeOrigin: true,
      },
    },
  },
});
