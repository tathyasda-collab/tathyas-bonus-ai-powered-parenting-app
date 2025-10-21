/// <reference types="vite/client" />

declare module '*.js' {
  const value: any;
  export default value;
}

interface ImportMetaEnv {
  readonly MODE: string;
  // add other env vars here if needed
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
