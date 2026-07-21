/// <reference types="vite/client" />

// If you need stronger typing on your own variables, you can augment like:
interface ImportMetaEnv {
  readonly VITE_API_URL: string;
}
interface ImportMeta {
  readonly env: ImportMetaEnv;
}
