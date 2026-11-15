import type { ReactNode } from 'react'
import { ExternalLink, HeartPulse, ListChecks, Moon } from 'lucide-react'
import { MeasureField, Question } from '@/components/app/CheckFlow'
import { Panel, PanelHeader } from '@/components/app/Panel'
import { RoadmapStepItem } from '@/components/app/RoadmapStep'
import { DemoTag } from '@/components/app/SourceTag'
import { StateBadge, StatusBadge } from '@/components/app/StatusBadge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import risks from '@/data/hrp-risks.json'
import type { VitalConfig } from '@/lib/health'
import { STATE_STATUS } from '@/lib/monitor'
import type { HealthLevel } from '@/lib/present'
import { cn } from '@/lib/utils'
import type { Vital } from '@/types'
import { STAGE, type Day } from './sim'

/*
  Telas do app dentro da landing page. Tudo aqui é montado com os componentes do próprio app
  (Panel, StatusBadge, MeasureField, RoadmapStepItem, Button...) e com os textos em inglês dele,
  para a landing mostrar o que a pessoa vai encontrar ao entrar. Os dados vêm de sim.ts.
*/

const RISKS = new Map((risks.risks as { id: string; title: string; url: string }[]).map((r) => [r.id, r]))
const PHASE = { today: 'bg-sa-rocket-600 text-white', 'next-days': 'bg-sa-yellow text-sa-deep', week: 'bg-sa-yonder text-sa-deep' } as const

/** Janela do app: moldura da landing (borda grossa, sombra dura) em volta de uma tela de verdade. */
export function AppWindow({ children, level = 'calm', className }: { children: ReactNode; level?: HealthLevel; className?: string }) {
  return (
    <div
      className={cn('rounded-2xl border-4 border-sa-deep p-3 text-left font-sans text-base text-ink shadow-[8px_8px_0_0_#07173f] transition-colors duration-500 sm:p-4', className)}
      style={{ backgroundColor: STAGE[level] }}
    >
      {children}
    </div>
  )
}

/** "Simulated data": o mesmo selo do cabeçalho do app. */
export function SimulatedChip() {
  return <span className="inline-flex items-center rounded-full border border-dashed border-ink-soft/60 px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap text-ink-soft">Simulated data</span>
}

/** Uma pergunta do check-up, como em CheckFlow: progresso, ícone, pergunta, campo grande e os botões. */
export function CheckCard({
  config,
  step,
  total,
  value,
  error,
  onChange,
  onNext,
  onBack,
  extra,
}: {
  config: VitalConfig
  step: number
  total: number
  value: string
  error?: string
  onChange?: (value: string) => void
  onNext?: () => void
  onBack?: () => void
  /** Conteúdo só da landing, entre o campo e os botões (valores de exemplo). */
  extra?: ReactNode
}) {
  const Icon = config.id === 'sleep' ? Moon : HeartPulse
  return (
    <div className="grid gap-3">
      <div className="grid gap-2">
        <div className="flex items-baseline justify-between gap-3">
          <p className="font-display text-lg font-semibold">Health check-up</p>
          <span className="font-mono text-sm text-ink-soft">
            {step + 1} of {total}
          </span>
        </div>
        <Progress value={((step + 1) / total) * 100} aria-label={`Health check-up, step ${step + 1} of ${total}`} />
      </div>
      <form
        noValidate
        onSubmit={(e) => {
          e.preventDefault()
          onNext?.()
        }}
        className="flex flex-col gap-5 rounded-xl border border-hairline bg-surface-1 p-5 md:p-6"
      >
        <span aria-hidden className="grid size-12 place-items-center rounded-lg bg-sa-rocket-600 text-white [&_svg]:size-6">
          <Icon />
        </span>
        <Question>{config.question}</Question>
        <MeasureField
          label={config.fieldLabel}
          unit={config.unit}
          hint={`Your pre-flight baseline is ${config.baseline} ${config.unit}.`}
          error={error}
          inputMode="decimal"
          autoComplete="off"
          placeholder={String(config.baseline)}
          value={value}
          readOnly={!onChange}
          onChange={(e) => onChange?.(e.target.value)}
        />
        {extra}
        <div className="flex items-center justify-between gap-3 border-t border-hairline pt-5">
          <Button type="button" variant="outline" onClick={onBack} disabled={!onBack}>
            {step === 0 ? 'Cancel' : 'Back'}
          </Button>
          <Button type="submit">{step + 1 === total ? 'Save' : 'Next'}</Button>
        </div>
      </form>
    </div>
  )
}

/**
 * Uma medida comparada com a linha de base, como no painel da região em Detailed stats: valor,
 * linha de base, diferença, estado e a regra por extenso. Com `hooks`, ganha classes para a
 * landing animar a contagem e o selo.
 */
export function MeasureTile({ v, hooks }: { v: Vital; hooks?: boolean }) {
  return (
    <li className="grid list-none gap-1.5 rounded-lg bg-surface-2/60 p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="font-semibold">{v.label}</span>
        <span className={cn('inline-flex', hooks && 'js-state')}>
          <StatusBadge status={v.status} />
        </span>
      </div>
      <p className="font-mono text-sm text-ink-soft">
        <span className={cn('text-2xl text-ink', hooks && 'js-bpm')}>{v.value}</span> {v.unit}
        <span className="ml-2">
          baseline {v.baseline} · <span className={cn('inline-block', hooks && 'js-delta')}>{v.delta}</span>
        </span>
      </p>
      <p className="text-xs text-ink-soft">Simulated device · Simulated data</p>
      <p className={cn('border-l-2 border-hairline-strong pl-3 text-sm text-ink-soft', hooks && 'js-rule')}>{v.rule}</p>
    </li>
  )
}

/** Risco da NASA ligado a uma região, com link para a fonte. */
export function RiskLink({ id }: { id?: string }) {
  const risk = id ? RISKS.get(id) : undefined
  if (!risk) return null
  return (
    <p className="text-sm text-ink-soft">
      NASA Human Research Program:{' '}
      <a href={risk.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-interactive underline underline-offset-3">
        {risk.title}
        <ExternalLink className="size-3.5" aria-hidden />
      </a>
    </p>
  )
}

/** Topo da tela Prevention: o estado do dia, a frase do guia de alertas e o porquê. */
export function StatePanel({ day, className }: { day: Day; className?: string }) {
  return (
    <Panel accent={STATE_STATUS[day.state]} className={cn('gap-2', className)}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="flex flex-wrap items-center gap-2 text-sm text-ink-soft">
          <StateBadge state={day.state} />
          <span aria-hidden>·</span> Day <span className="font-mono text-ink">19</span>
        </span>
        <DemoTag />
      </div>
      <p className="font-display text-xl leading-snug font-semibold text-ink">{day.wording}</p>
      <p className="text-[15px] text-ink-soft">
        <span className="font-semibold text-ink">Why:</span> {day.reason}.
      </p>
    </Panel>
  )
}

/** "What to do today" e os próximos dias, como em Prevention: passos do roteiro, os de hoje com caixa de marcar. */
export function TodayPanel({
  day,
  done = [],
  onToggle,
  className,
}: {
  day: Day
  done?: string[]
  onToggle?: (id: string) => void
  className?: string
}) {
  const [today, ...later] = day.phases
  return (
    <Panel
      className={cn('js-roadmap gap-4', className)}
      // O botão "Log a water serving" do app grava água na conta de quem está logado. Aqui é só
      // demonstração: o clique é interceptado e marca o passo como feito.
      onClickCapture={(e) => {
        const button = (e.target as Element).closest('button')
        if (!button || button.getAttribute('role') === 'checkbox') return
        e.stopPropagation()
        e.preventDefault()
        const water = today.steps.find((s) => s.action === 'water' && !done.includes(s.id))
        if (water) onToggle?.(water.id)
      }}
    >
      <PanelHeader
        icon={<ListChecks />}
        tone="orange"
        title="What to do today"
        aside={
          today.steps.length > 0 && (
            <span className="font-mono text-sm text-ink-soft">
              {today.steps.filter((s) => done.includes(s.id)).length}/{today.steps.length}
            </span>
          )
        }
      />
      {today.steps.length ? (
        <ul className="grid gap-4">
          {today.steps.map((s) => (
            <RoadmapStepItem key={s.id} step={s} checkable done={done.includes(s.id)} onToggle={() => onToggle?.(s.id)} />
          ))}
        </ul>
      ) : (
        <p className="text-ink-soft">Nothing extra today. Keep the routine.</p>
      )}
      {later.map(
        (phase) =>
          phase.steps.length > 0 && (
            <div key={phase.id} className="grid content-start gap-3 rounded-lg bg-surface-2/60 p-4">
              <p className={cn('justify-self-start rounded-md px-2 py-0.5 text-sm font-bold', PHASE[phase.id])}>{phase.title}</p>
              <ul className="grid gap-4">
                {phase.steps.map((s) => (
                  <RoadmapStepItem key={s.id} step={s} hideWhy links={false} />
                ))}
              </ul>
            </div>
          ),
      )}
    </Panel>
  )
}
