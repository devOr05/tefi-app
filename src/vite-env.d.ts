/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Nodo RPC de Solana Devnet. Si no se define, se usa el nodo público https://api.devnet.solana.com */
  readonly VITE_SOLANA_DEVNET_RPC_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
