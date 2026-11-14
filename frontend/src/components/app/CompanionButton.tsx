import { useEffect, useState } from 'react'
import { SendHorizontal, X } from 'lucide-react'
import type { Line, Mood } from '@/lib/companion'
import { cn } from '@/lib/utils'

/*
  Barra do companheiro (o botão fixo da IA), parecida com uma barra de pesquisa: um rosto à esquerda,
  uma frase que muda de tempos em tempos e o convite para escrever. Abre o chat.

  O rosto é um visor de capacete com olhos de LED (matriz de 5×5 pontos por olho). A expressão acompanha
  a frase e, de vez em quando, o rosto pisca. Animação barata: troca de pontos e opacidade, nada de layout.
*/

// Olhos em 5×5: "#" aceso. [olho esquerdo, olho direito]
const EYE = {
  arc: ['.....', '..#..', '.#.#.', '#...#', '.....'],
  round: ['.###.', '#...#', '#...#', '#...#', '.###.'],
  line: ['.....', '.....', '#####', '.....', '.....'],
  up: ['.##..', '.##..', '.....', '.....', '.....'],
  heart: ['.#.#.', '#####', '#####', '.###.', '..#..'],
  dot: ['.....', '.###.', '.###.', '.###.', '.....'],
}
type Eye = keyof typeof EYE
const FACES: Record<Mood | 'blink', [Eye, Eye]> = {
  happy: ['arc', 'arc'],
  curious: ['round', 'dot'],
  thinking: ['up', 'up'],
  caring: ['heart', 'heart'],
  wink: ['arc', 'line'],
  blink: ['line', 'line'],
}
const LIT: Record<Mood, string> = {
  happy: 'fill-white',
  curious: 'fill-white',
  thinking: 'fill-sa-yonder',
  caring: 'fill-sa-rocket',
  wink: 'fill-sa-yellow',
}

function EyeDots({ eye, x, lit }: { eye: Eye; x: number; lit: string }) {
  return (
    <g transform={`translate(${x} 0)`}>
      {EYE[eye].flatMap((row, r) =>
        [...row].map((c, col) => (
          <circle key={`${r}-${col}`} cx={col * 4 + 2} cy={r * 4 + 2} r={1.35} className={c === '#' ? lit : 'fill-white/10'} />
        )),
      )}
    </g>
  )
}

/** Rosto: visor escuro dentro de um capacete azul, com dois olhos de LED. */
export function CompanionFace({ mood, blink, className }: { mood: Mood; blink?: boolean; className?: string }) {
  const [l, r] = FACES[blink ? 'blink' : mood]
  return (
    <span aria-hidden className={cn('grid size-[60px] shrink-0 place-items-center rounded-full bg-sa-neon-blue p-1', className)}>
      <span className="grid size-full place-items-center rounded-full bg-sa-deep">
        <svg viewBox="0 0 46 20" className="w-[42px]">
          <EyeDots eye={l} x={1} lit={LIT[mood]} />
          <EyeDots eye={r} x={25} lit={LIT[mood]} />
        </svg>
      </span>
    </span>
  )
}

export function CompanionButton({
  onClick,
  expanded,
  lines,
  ref,
}: {
  onClick?: () => void
  expanded?: boolean
  /** Frases do dia (lib/companion.ts). */
  lines: Line[]
  ref?: React.Ref<HTMLButtonElement>
}) {
  const [i, setI] = useState(0)
  const [blink, setBlink] = useState(false)
  const [shown, setShown] = useState(true)
  const line = lines[i % Math.max(lines.length, 1)] ?? { text: 'Need help, astronaut?', mood: 'curious' as Mood }

  // Troca a frase a cada 7 s (some, troca, volta) e pisca a cada ~4 s. Parado com o chat aberto.
  useEffect(() => {
    if (expanded) return
    let swap: ReturnType<typeof setTimeout> | undefined
    const talk = setInterval(() => {
      setShown(false)
      swap = setTimeout(() => {
        setI((n) => n + 1)
        setShown(true)
      }, 260)
    }, 7000)
    const eyes = setInterval(() => {
      setBlink(true)
      setTimeout(() => setBlink(false), 160)
    }, 4200)
    return () => {
      clearInterval(talk)
      clearInterval(eyes)
      if (swap) clearTimeout(swap)
    }
  }, [expanded])

  return (
    <button
      ref={ref}
      type="button"
      aria-label={expanded ? 'Close companion' : 'Open companion chat'}
      aria-expanded={expanded}
      onClick={onClick}
      className={cn(
        'group fixed right-4 bottom-20 left-4 z-40 flex h-[76px] items-center gap-3 rounded-full border-2 border-sa-neon-blue bg-surface-1 pr-2.5 pl-2 text-left shadow-float transition-colors hover:bg-surface-2',
        'md:right-6 md:bottom-6 md:left-auto md:w-[min(440px,calc(100vw-3rem))]',
      )}
    >
      <CompanionFace mood={line.mood} blink={blink} />
      <span className="min-w-0 flex-1">
        <span
          aria-hidden
          className={cn('line-clamp-2 text-base leading-snug font-semibold text-ink transition-opacity duration-200', shown ? 'opacity-100' : 'opacity-0')}
        >
          {expanded ? 'Close the chat' : line.text}
        </span>
      </span>
      <span aria-hidden className="grid size-12 shrink-0 place-items-center rounded-full bg-sa-rocket-600 text-white transition-transform group-hover:scale-105">
        {expanded ? <X className="size-5" /> : <SendHorizontal className="size-5" />}
      </span>
    </button>
  )
}
