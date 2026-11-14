/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Webhook do n8n para o chat do companheiro. Vazio = modo de demonstração. Endereço público. */
  readonly VITE_N8N_CHAT_WEBHOOK_URL?: string
}
