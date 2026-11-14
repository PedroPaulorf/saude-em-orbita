/** Tela provisória para abas que ainda vão ser feitas (fases 5 e 7 do plano). */
export function Placeholder({ title, text }: { title: string; text: string }) {
  return (
    <div className="mx-auto max-w-[1360px] px-4 py-8 md:px-8">
      <section className="rounded-xl border border-hairline bg-surface-1 p-6">
        <h1 className="font-display text-2xl font-semibold">{title}</h1>
        <p className="mt-2 max-w-prose text-ink-soft">{text}</p>
      </section>
    </div>
  )
}
