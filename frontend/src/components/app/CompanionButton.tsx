import { MessageCircleHeart } from 'lucide-react'

/**
 * Botão da IA, fixo no canto inferior direito em todas as telas (o "AI · fixed button" do quadro).
 * No celular fica acima da barra de abas. Não é amarelo: a cor de ação fica para o botão principal da tela.
 */
export function CompanionButton({ onClick }: { onClick?: () => void }) {
  return (
    <button
      type="button"
      aria-label="Open companion"
      onClick={onClick}
      className="fixed right-4 bottom-20 z-40 flex h-14 items-center gap-2 rounded-full border border-hairline-strong bg-surface-2 pr-5 pl-4 font-semibold text-ink shadow-float transition-colors hover:bg-surface-3 md:right-8 md:bottom-8"
    >
      <MessageCircleHeart className="size-6 text-interactive" aria-hidden />
      <span className="text-[15px]">AI</span>
    </button>
  )
}
