import { createRequire } from "module";
import { defineConfig, version as viteVersion } from "vite";
import viteReact from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import path from "path";

const require = createRequire(import.meta.url);
const reactVersion = require("react/package.json").version as string;

// https://vite.dev/config/
export default defineConfig({
  // Build info for the settings page. Jenkins sets GIT_SHA and BUILT_AT in the
  // image build, local runs fall back to "dev"
  define: {
    __GIT_SHA__: JSON.stringify(process.env.GIT_SHA ?? "dev"),
    __BUILT_AT__: JSON.stringify(process.env.BUILT_AT ?? ""),
    __REACT_VERSION__: JSON.stringify(reactVersion),
    __VITE_VERSION__: JSON.stringify(viteVersion),
  },
  server: {
    host: "0.0.0.0",
    port: 5173,
    proxy: {
      "/api": {
        target: "http://localhost:4000",
        changeOrigin: true,
      },
    },
    fs: {
      allow: [
        // Allow local frontend project directory
        path.resolve(__dirname),
        // Allow shared directory
        path.resolve(__dirname, "../../packages/shared"),
      ],
    },
  },
  plugins: [tanstackStart(), viteReact(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
      "@shared": path.resolve(__dirname, "../../packages/shared/src"),
    },
  },
});
