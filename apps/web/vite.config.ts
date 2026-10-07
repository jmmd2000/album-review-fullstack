import { createRequire } from "module";
import { defineConfig, version as viteVersion } from "vite";
import viteReact from "@vitejs/plugin-react";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import path from "path";

const require = createRequire(import.meta.url);
const reactVersion = require("react/package.json").version as string;
const siteVersion = require("../../package.json").version as string;

// https://vite.dev/config/
export default defineConfig(({ command }) => ({
  // Build info for the settings page. Jenkins sets GIT_SHA and BUILT_AT in the
  // image build, local runs fall back to "dev"
  define: {
    __GIT_SHA__: JSON.stringify(process.env.GIT_SHA ?? "dev"),
    __BUILT_AT__: JSON.stringify(process.env.BUILT_AT ?? ""),
    __REACT_VERSION__: JSON.stringify(reactVersion),
    __VITE_VERSION__: JSON.stringify(viteVersion),
    __SITE_VERSION__: JSON.stringify(siteVersion),
  },
  server: {
    host: "0.0.0.0",
    port: 5173,
    proxy: {
      // e2e points this at its own API
      "/api": {
        target: process.env.API_ORIGIN ?? "http://localhost:4000",
        changeOrigin: true,
      },
    },
    fs: {
      allow: [path.resolve(import.meta.dirname, "../..")],
    },
  },
  // The production image ships no app dependencies, so the server bundle
  // must inline everything it imports rather than reaching for node_modules.
  // Builds only, the dev module runner chokes on inlined commonjs
  ssr: {
    noExternal: command === "build" ? true : undefined,
  },
  // The ssr pass computes its own hash for the stylesheet it links in the
  // document shell. Emit the file rather than assuming the client pass
  // produced identical bytes, the dockerfile copies it into the public dir
  build: {
    ssrEmitAssets: true,
  },
  plugins: [tanstackStart(), viteReact()],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "src"),
      "@shared": path.resolve(import.meta.dirname, "../../packages/shared/src"),
    },
  },
}));
