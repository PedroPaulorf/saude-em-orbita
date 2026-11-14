import { useEffect, useRef, useState, type KeyboardEvent } from 'react'
import { MessageCircleHeart, RotateCcw, SendHorizontal, Trash2, WifiOff, X } from 'lucide-react'
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
import { Dotted } from './Dot'

/*
  Painel do companheiro de IA (plano v2, seção 8). No desktop, um painel flutuante ancorado ao botão;
  no celular, tela cheia. O visual é o mais caloroso do app: balões arredondados e mais respiro.
*/

const SUGGESTIONS = ["I'd like to talk about my day", 'Help me unwind before sleep', 'I miss home']

function Bubble({ m, onRetry, disabled }: { m: ChatMessage; onRetry: () => void; disabled: boolean }) {
  const mine = m.role === 'user'
  return (
    <li className={cn('flex flex-col gap-1', mine ? 'items-end' : 'items-start')}>
      <div
        className={cn(
          'max-w-[85%] rounded-2xl px-4 py-2.5 text-[15px] leading-relaxed whitespace-pre-wrap',
          mine ? 'rounded-br-md bg-panel text-ink' : 'rounded-bl-md bg-surface-2 text-ink',
          m.error && 'border border-flag-mark/60 bg-flag-tint text-flag-ink',
        )}
      >
        <span className="sr-only">{mine ? 'You: ' : 'Companion: '}</span>
        {m.text}
      </div>
      {m.demo && <span className="px-1 text-xs text-ink-soft">Demo reply</span>}
      {m.error && (
        <Button variant="ghost" size="sm" className="text-interactive" onClick={onRetry} disabled={disabled}>
          <RotateCcw aria-hidden />
          Try again
        </Button>
      )}
    </li>
  )
}

function Typing() {
  return (
    <li className="flex items-start" aria-label="Companion is typing">
      <div className="flex gap-1.5 rounded-2xl rounded-bl-md bg-surface-2 px-4 py-3.5">
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

  useEffect(() => {
    input.current?.focus()
  }, [])

  // Rola para a mensagem mais nova.
  useEffect(() => {
    list.current?.scrollTo({ top: list.current.scrollHeight, behavior: 'smooth' })
  }, [messages.length, pending])

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
      className="fixed inset-0 z-50 flex flex-col bg-surface-1 md:inset-auto md:right-6 md:bottom-24 md:h-[min(600px,calc(100dvh-8rem))] md:w-[400px] md:rounded-2xl md:border md:border-hairline-strong md:shadow-float"
    >
      <header className="flex items-center gap-3 border-b border-hairline px-4 py-3">
        <span aria-hidden className="grid size-9 place-items-center rounded-full bg-surface-2 text-interactive">
          <MessageCircleHeart className="size-5" />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="flex items-center gap-2 font-display text-lg leading-tight font-semibold">
            Companion
            <span className="rounded-full border border-hairline-strong px-2 py-0.5 font-sans text-[11px] font-bold tracking-wide text-ink-soft">
              AI
            </span>
          </h2>
          <p className="truncate text-xs text-ink-soft">
            <Dotted text={DEMO_MODE ? 'Demo mode · ready-made replies' : 'Here to talk, any time'} />
          </p>
        </div>
        {messages.length > 0 && (
          <Button variant="ghost" size="icon-sm" onClick={clearConversation} aria-label="Clear conversation" title="Clear conversation">
            <Trash2 aria-hidden />
          </Button>
        )}
        <Button variant="ghost" size="icon-sm" onClick={onClose} aria-label="Close companion">
          <X aria-hidden />
        </Button>
      </header>

      <div ref={list} className="flex-1 overflow-y-auto px-4 py-5">
        {messages.length === 0 ? (
          <div className="flex h-full flex-col justify-end gap-4">
            <div>
              <p className="font-display text-2xl leading-tight font-semibold">Hi, {crew.displayName}.</p>
              <p className="mt-2 text-ink-soft">
                I&apos;m here whenever you want to talk, about your day, your crew or anything on your mind.
              </p>
            </div>
            <div className="flex flex-col items-start gap-2">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  type="button"
                  disabled={!canSend}
                  onClick={() => submit(s)}
                  className="min-h-11 rounded-2xl border border-hairline-strong px-4 py-2 text-left text-[15px] text-ink transition-colors hover:bg-surface-2 disabled:opacity-50"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <ul className="flex flex-col gap-4" aria-live="polite" aria-relevant="additions">
            {messages.map((m) => (
              <Bubble key={m.id} m={m} onRetry={() => retry(m)} disabled={!canSend} />
            ))}
            {pending && <Typing />}
          </ul>
        )}
      </div>

      <div className="border-t border-hairline px-4 pt-3 pb-4">
        <p className="mb-2 text-xs leading-snug text-ink-soft">
          AI companion. Not a medical or psychological service. For health concerns, contact your flight surgeon.
          Conversations are not part of your ground report.
        </p>
        {!online && (
          <p role="status" className="mb-2 flex items-start gap-2 rounded-lg bg-surface-2 px-3 py-2 text-sm text-ink">
            <WifiOff className="mt-0.5 size-4 shrink-0 text-ink-soft" aria-hidden />
            {OFFLINE_TEXT}
          </p>
        )}
        <form
          className="flex items-end gap-2"
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
            className="max-h-32 min-h-11 flex-1 resize-none rounded-2xl border border-hairline-strong bg-ground px-4 py-2.5 text-[15px] text-ink placeholder:text-ink-soft/70 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink disabled:opacity-60"
          />
          <Button type="submit" variant="secondary" size="icon" disabled={!canSend || !draft.trim()} aria-label="Send message" className="rounded-full">
            <SendHorizontal aria-hidden />
          </Button>
        </form>
      </div>
    </div>
  )
}
