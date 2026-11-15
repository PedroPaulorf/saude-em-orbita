import { useEffect, useRef, useState, type KeyboardEvent } from 'react'
import { RotateCcw, SendHorizontal, Trash2, WifiOff, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  buildContext,
  clearConversation,
  DEMO_MODE,
  OFFLINE_TEXT,
  send,
  useChat,
  useOnline,
  type ChatMessage,
} from '@/lib/chat'
import { useSpaceWeather } from '@/lib/donki'
import type { GameSummary } from '@/lib/game'
import { crew } from '@/lib/health'
import { cn } from '@/lib/utils'
import { CompanionFace } from './CompanionButton'
import { Dotted } from './Dot'

/*
  Painel do companheiro de IA (plano v2, seção 8). No desktop, um painel flutuante largo acima do botão;
  no celular, tela cheia. O visual é o mais caloroso do app: o mesmo rosto da barra, balões arredondados e respiro.
*/

const DISCLAIMER =
  'AI companion. Not a medical or psychological service. For health concerns, contact your flight surgeon. Conversations are not part of your ground report.'

/** Rosto pequeno ao lado das respostas do companheiro. */
function Avatar() {
  return <CompanionFace mood="happy" className="size-10 p-[3px]" />
}

function Bubble({ m, onRetry, disabled }: { m: ChatMessage; onRetry: () => void; disabled: boolean }) {
  const mine = m.role === 'user'
  return (
    <li className={cn('flex gap-2.5', mine ? 'justify-end' : 'justify-start')}>
      {!mine && <Avatar />}
      <div className={cn('flex max-w-[82%] flex-col gap-1', mine ? 'items-end' : 'items-start')}>
        <div
          role={m.error ? 'alert' : undefined}
          className={cn(
            'rounded-2xl px-4 py-3 text-base leading-relaxed whitespace-pre-wrap',
            mine ? 'rounded-br-md bg-panel text-ink' : 'rounded-tl-md bg-surface-2 text-ink',
            m.error && 'border border-flag-mark/60 bg-flag-tint text-flag-ink',
          )}
        >
          <span className="sr-only">{mine ? 'You: ' : 'Companion: '}</span>
          {m.text}
        </div>
        {m.demo && <span className="px-1 text-[11px] text-ink-soft/80">Demo reply</span>}
        {m.error && (
          <Button variant="ghost" size="sm" className="text-interactive" onClick={onRetry} disabled={disabled}>
            <RotateCcw aria-hidden />
            Try again
          </Button>
        )}
      </div>
    </li>
  )
}

function Typing() {
  return (
    <li className="flex items-start gap-2.5" aria-label="Companion is typing">
      <Avatar />
      <div className="flex gap-1.5 rounded-2xl rounded-tl-md bg-surface-2 px-4 py-4">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="size-2 animate-bounce rounded-full bg-ink-soft"
            style={{ animationDelay: `${i * 150}ms` }}
            aria-hidden
          />
        ))}
      </div>
    </li>
  )
}

export function ChatPanel({ game, onClose }: { game: GameSummary; onClose: () => void }) {
  const { messages, pending } = useChat()
  const online = useOnline()
  const weather = useSpaceWeather()
  const [draft, setDraft] = useState('')
  const input = useRef<HTMLTextAreaElement>(null)
  const list = useRef<HTMLDivElement>(null)

  const context = () => buildContext(game, { snapshot: weather.state.snapshot, source: weather.state.source })
  const canSend = online && !pending
  const empty = messages.length === 0

  useEffect(() => {
    input.current?.focus()
  }, [])

  // Rola para a mensagem mais nova.
  useEffect(() => {
    list.current?.scrollTo({ top: list.current.scrollHeight, behavior: 'smooth' })
  }, [messages.length, pending])

  // A caixa de texto cresce com a mensagem, até o max-h.
  useEffect(() => {
    const el = input.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${el.scrollHeight}px`
  }, [draft])

  function submit(text = draft) {
    if (!text.trim() || !canSend) return
    void send(text, context())
    setDraft('')
  }

  function retry(m: ChatMessage) {
    const original = messages.find((x) => x.id === m.error?.retryOf)
    if (original) void send(original.text, context(), { retryOf: original.id })
  }

  function onKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      submit()
    }
  }

  return (
    <div
      role="dialog"
      aria-label="Companion"
      onKeyDown={(e) => e.key === 'Escape' && onClose()}
      className={cn(
        'fixed inset-0 z-50 flex flex-col bg-surface-1',
        'md:inset-auto md:right-6 md:bottom-[7.5rem] md:h-[min(780px,calc(100dvh-12.5rem))] md:w-[min(520px,calc(100vw-3rem))] md:overflow-hidden md:rounded-3xl md:border md:border-hairline-strong md:shadow-float',
      )}
    >
      <header className="flex items-center gap-3 border-b border-hairline bg-surface-2/40 px-5 py-3.5">
        <CompanionFace mood="happy" className="size-12" />
        <div className="min-w-0 flex-1">
          <h2 className="flex items-center gap-2 font-display text-xl leading-tight font-semibold">
            Companion
            <span className="rounded-full border border-hairline-strong px-2 py-0.5 font-sans text-[11px] font-bold tracking-wide text-ink-soft">
              AI
            </span>
          </h2>
          <p className="text-xs text-ink-soft sm:text-sm">
            <Dotted text={DEMO_MODE ? 'Demo mode · ready-made replies' : messages.at(-1)?.error ? 'AI temporarily unavailable · you can retry' : 'Here to talk, any time'} />
          </p>
        </div>
        {!empty && (
          <Button variant="ghost" size="icon" onClick={clearConversation} aria-label="Clear conversation" title="Clear conversation">
            <Trash2 aria-hidden />
          </Button>
        )}
        <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close companion">
          <X aria-hidden />
        </Button>
      </header>

      <div ref={list} className="flex-1 overflow-y-auto px-5 py-6">
        {empty ? (
          <div className="flex min-h-full flex-col justify-end gap-6">
            <div className="grid gap-3">
              <CompanionFace mood="caring" className="size-20" />
              <p className="font-display text-3xl leading-tight font-semibold">Hi, {crew.displayName}.</p>
              <p className="text-lg leading-relaxed text-ink-soft">
                I&apos;m here whenever you want to talk, about your day, your crew or anything on your mind.
              </p>
            </div>
            <p className="rounded-xl bg-surface-2/60 px-4 py-3 text-sm leading-snug text-ink-soft">{DISCLAIMER}</p>
          </div>
        ) : (
          <ul className="flex flex-col gap-5" aria-live="polite" aria-relevant="additions">
            {messages.map((m) => (
              <Bubble key={m.id} m={m} onRetry={() => retry(m)} disabled={!canSend} />
            ))}
            {pending && <Typing />}
          </ul>
        )}
      </div>

      <div className="border-t border-hairline px-4 pt-3 pb-3">
        {!online && (
          <p role="status" className="mb-2 flex items-start gap-2 rounded-lg bg-surface-2 px-3 py-2 text-sm text-ink">
            <WifiOff className="mt-0.5 size-4 shrink-0 text-ink-soft" aria-hidden />
            {OFFLINE_TEXT}
          </p>
        )}
        <form
          className="flex items-end gap-2 rounded-3xl border border-hairline-strong bg-ground p-1.5 pl-4 focus-within:border-ink"
          onSubmit={(e) => {
            e.preventDefault()
            submit()
          }}
        >
          <label htmlFor="chat-input" className="sr-only">
            Message your companion
          </label>
          <textarea
            id="chat-input"
            ref={input}
            rows={1}
            value={draft}
            disabled={!online}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder={online ? 'Write a message' : 'No ground link'}
            className="max-h-40 min-h-11 flex-1 resize-none bg-transparent py-2.5 text-base text-ink outline-none placeholder:text-ink-soft/70 disabled:opacity-60"
          />
          <button
            type="submit"
            disabled={!canSend || !draft.trim()}
            aria-label="Send message"
            className="grid size-11 shrink-0 place-items-center rounded-full bg-sa-rocket-600 text-white transition hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink disabled:bg-surface-3 disabled:text-ink-soft"
          >
            <SendHorizontal className="size-5" aria-hidden />
          </button>
        </form>
        {!empty && (
          <p className="mt-2 px-1 text-center text-xs text-ink-soft" title={DISCLAIMER}>
            Not a medical service. Health concerns go to your flight surgeon.
            <span className="sr-only"> {DISCLAIMER}</span>
          </p>
        )}
      </div>
    </div>
  )
}
