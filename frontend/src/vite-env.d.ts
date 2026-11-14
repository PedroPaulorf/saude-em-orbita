/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Webhook do n8n para o chat do companheiro. Vazio = modo de demonstração. Endereço público. */
  readonly VITE_N8N_CHAT_WEBHOOK_URL?: string
  /** Webhook do n8n que devolve o roteiro preventivo em JSON. Vazio = roteiro montado no aparelho. */
  readonly VITE_N8N_ROADMAP_WEBHOOK_URL?: string
  readonly VITE_API_URL?: string
}
