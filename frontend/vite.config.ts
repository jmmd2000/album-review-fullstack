import { defineConfig } from "vite";
import viteReact from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { TanStackRouterVite } from "@tanstack/router-plugin/vite";
import path from "path";

// https://vite.dev/config/
export default defineConfig({
  server: {
    host: "0.0.0.0",
    port: 5173,
    fs: {
      allow: [
        // Allow local frontend project directory
        path.resolve(__dirname),
        // Allow shared directory
        path.resolve(__dirname, "../shared"),
      ],
    },
  },
  plugins: [TanStackRouterVite({ autoCodeSplitting: true }), viteReact(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
      "@components": path.resolve(__dirname, "src/components"),
      "@shared": path.resolve(__dirname, "../shared/src"), // ✅ THIS IS CORRECT
    },
  },
});
