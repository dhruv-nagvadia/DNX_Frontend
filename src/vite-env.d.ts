/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

// Allow importing CSS modules with typed default export.
declare module '*.module.css' {
  const classes: { readonly [key: string]: string };
  export default classes;
}
