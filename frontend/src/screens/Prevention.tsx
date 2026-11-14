import { ShieldCheck } from 'lucide-react'
import { Dot } from '@/components/app/Dot'
import { PatternCard } from '@/components/app/PatternCard'
import { DemoTag } from '@/components/app/SourceTag'
import { usePatterns } from '@/lib/usePrevention'

/*
  Prevention (plano v3, seção 6): a tese do projeto. Junta as medidas, compara com padrões de sinais
  precoces e, quando um padrão está ativo, mostra quais sinais estão presentes e qual regra gerou cada um.
  Padrão não é diagnóstico: vai para o relatório do cirurgião de voo.
*/
export function Prevention() {
  const patterns = usePatterns()
  const active = patterns.filter((p) => p.active)
  const inactive = patterns.filter((p) => !p.active)

  return (
    <div className="mx-auto max-w-[1360px] px-4 pt-4 pb-8 md:px-8">
      <header className="mb-5 max-w-3xl">
        <h1 className="font-display text-2xl font-semibold">Prevention</h1>
        <p className="mt-1 text-ink-soft">
          Your measures, all in one place, compared with patterns of early signs. When several signs show up together, you
          see which ones, and your flight surgeon sees them too.
        </p>
      </header>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)] lg:items-start">
        <div className="grid gap-4">
          {active.length === 0 ? (
            <section aria-labelledby="no-pattern" className="flex flex-col gap-3 rounded-xl border border-hairline bg-surface-1 p-5 md:p-6">
              <div className="flex items-center gap-3">
                <ShieldCheck className="size-6 text-interactive" aria-hidden />
                <h2 id="no-pattern" className="font-display text-xl font-semibold">
                  No early-sign pattern today. {patterns.length} patterns checked.
                </h2>
              </div>
              <ul className="grid gap-2">
                {patterns.map((p) => (
                  <li key={p.def.id} className="rounded-lg border border-hairline px-3 py-2.5">
                    <p className="font-semibold">{p.def.title}</p>
                    <p className="text-sm text-ink-soft">Looks at: {p.def.signs.map((s) => s.label.replace(/ for \d+ days or more$/, '').toLowerCase()).join('; ')}.</p>
                  </li>
                ))}
              </ul>
              <DemoTag className="self-start" />
            </section>
          ) : (
            active.map((r) => <PatternCard key={r.def.id} result={r} />)
          )}

          {active.length > 0 && inactive.length > 0 && (
            <section aria-label="Other patterns" className="rounded-xl border border-hairline bg-surface-1/60 px-5 py-4">
              <p className="text-ink">
                {inactive.length} other {inactive.length === 1 ? 'pattern' : 'patterns'} checked, not active:
              </p>
              <ul className="mt-1 grid gap-0.5 text-sm text-ink-soft">
                {inactive.map((p) => (
                  <li key={p.def.id}>
                    {p.def.title}
                    <Dot />
                    <span className="font-mono">{p.present}</span> of <span className="font-mono">{p.total}</span> signs, needs{' '}
                    <span className="font-mono">{p.def.minSigns}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>

        <aside className="grid gap-4">
          <section aria-labelledby="how-title" className="flex flex-col gap-2 rounded-xl border border-hairline bg-surface-1 p-5">
            <h2 id="how-title" className="font-display text-lg font-semibold">
              How this works
            </h2>
            <ul className="grid list-disc gap-1.5 pl-5 text-sm text-ink-soft">
              <li>Each sign is one measure or answer compared with your own baseline, using the rule written next to it.</li>
              <li>A pattern is active when enough of its signs are present on the same day.</li>
              <li>It is not a diagnosis. Your flight surgeon reviews every active pattern.</li>
              <li>The patterns are demonstration rules with no clinical source yet.</li>
            </ul>
          </section>
        </aside>
      </div>
    </div>
  )
}
