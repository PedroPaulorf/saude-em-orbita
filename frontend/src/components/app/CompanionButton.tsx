import { MessageCircleHeart } from 'lucide-react'

/**
 * Botão da IA, fixo no canto inferior direito em todas as telas (o círculo "AI · fixed button" do quadro).
 * No celular fica acima da barra de abas. Não é amarelo: a cor de ação fica para o botão principal da tela.
 */
export function CompanionButton({ onClick }: { onClick?: () => void }) {
  return (
    <button
      type="button"
      aria-label="Open companion"
      onClick={onClick}
      className="fixed right-4 bottom-20 z-40 flex size-14 flex-col items-center justify-center gap-0.5 rounded-full border border-hairline-strong bg-surface-2 text-ink shadow-float transition-colors hover:bg-surface-3 md:right-6 md:bottom-6"
    >
      <MessageCircleHeart className="size-5 text-interactive" aria-hidden />
      <span className="text-[11px] leading-none font-bold tracking-wide">AI</span>
    </button>
  )
}
