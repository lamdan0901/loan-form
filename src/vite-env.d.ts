/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_JSONBIN_MASTER_KEY?: string;
  readonly VITE_JSONBIN_ACCESS_KEY?: string;
  readonly VITE_JSONBIN_BIN_ID?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
