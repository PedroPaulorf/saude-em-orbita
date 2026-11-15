import { ExternalLink } from 'lucide-react'
import { Disclosure } from './Disclosure'

/** "What can be done" do NASA Human Research Program, fechado por padrão, com a fonte. */
export function NasaAdvice({ risk }: { risk: { title: string; url: string; whatCanBeDone: string } }) {
  return (
    <Disclosure summary="What NASA is doing about it" className="border-t border-hairline pt-2">
      <p className="text-[15px] leading-relaxed text-ink">{risk.whatCanBeDone}</p>
      <a href={risk.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 self-start text-sm text-interactive underline underline-offset-3">
        NASA Human Research Program: {risk.title}
        <ExternalLink className="size-3.5" aria-hidden />
        <span className="sr-only">(opens in a new tab)</span>
      </a>
    </Disclosure>
  )
}
