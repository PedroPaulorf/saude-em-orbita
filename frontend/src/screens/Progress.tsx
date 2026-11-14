import { useMemo } from 'react'
import { Award, CalendarCheck, CircleCheck, CircleDashed, HeartPulse, Lock, Route, Smile, Users } from 'lucide-react'
import { Dot } from '@/components/app/Dot'
import { Panel, PanelHeader } from '@/components/app/Panel'
import { TrendChart } from '@/components/app/TrendChart'
import { Progress as Bar } from '@/components/ui/progress'
import { formatPoints, type GameSummary } from '@/lib/game'
import { behavioralQuestions, getTodayVitals } from '@/lib/health'
import { crewBoard, historyRows } from '@/lib/progress'
import { loadCheckIns, type BehavioralCheckIn } from '@/lib/storage'
import { cn, utcDateTime, utcDay } from '@/lib/utils'

/*
  Progress (plano v2, 7.4): rank e pontos, tendências de 7 dias, histórico dos check-ups e as
  respostas do check-in comportamental ao longo do tempo (sem somar).
  Histórico de 7 dias, pontos iniciais e tripulação são simulados (chip "Simulated data" no cabeçalho).
*/

function RankCard({ game }: { game: GameSummary }) {
  const { rank, next, totalPoints, streakDays } = game
  const pct = next ? ((totalPoints - rank.min) / (next.min - rank.min)) * 100 : 100
  return (
    <Panel aria-labelledby="rank-title" className="gap-4">
      <PanelHeader id="rank-title" icon={<Award />} title="Rank" subtitle="Points reward what you do, not what your measures show." />
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="font-display text-3xl font-semibold">{rank.name}</p>
          <p className="font-mono text-ink-soft">
            <span className="text-ink">{formatPoints(totalPoints)}</span> points
          </p>
        </div>
        <p className="inline-flex items-center gap-2 text-ink-soft">
          <CalendarCheck className="size-5 text-interactive" aria-hidden />
          {streakDays > 0 ? (
            <span>
              <span className="font-mono text-ink">{streakDays}</span>-day streak
            </span>
          ) : (
            <span>No streak yet: do both check-ups today</span>
          )}
        </p>
      </div>
      <div className="grid gap-1.5">
        <Bar value={pct} aria-label={next ? `Progress to ${next.name}` : 'Highest rank'} />
        <p className="text-sm text-ink-soft">
          {next ? (
            <>
              <span className="font-mono text-ink">{formatPoints(next.min - totalPoints)}</span> points to {next.name}
            </>
          ) : (
            'Highest rank reached.'
          )}
        </p>
      </div>
    </Panel>
  )
}

function Achievements({ game }: { game: GameSummary }) {
  return (
    <Panel aria-labelledby="ach-title">
      <PanelHeader id="ach-title" icon={<CircleCheck />} title="Achievements" />
      <ul className="grid gap-2 sm:grid-cols-2">
        {game.achievements.map((a) => (
          <li
            key={a.id}
            className={cn('flex items-start gap-3 rounded-lg p-3', a.earned ? 'bg-surface-2' : 'border border-dashed border-hairline-strong')}
          >
            {a.earned ? (
              <Award className="mt-0.5 size-5 shrink-0 text-interactive" aria-hidden />
            ) : (
              <Lock className="mt-0.5 size-5 shrink-0 text-ink-soft" aria-hidden />
            )}
            <div>
              <p className={cn('font-semibold', !a.earned && 'text-ink-soft')}>{a.title}</p>
              <p className="text-sm text-ink-soft">
                {a.earned ? 'Earned. ' : 'Not yet. '}
                {a.description}
              </p>
            </div>
          </li>
        ))}
      </ul>
    </Panel>
  )
}

/** Meta coletiva em destaque; a lista vem depois, discreta. */
function Crew({ game }: { game: GameSummary }) {
  const { rows, done, total } = crewBoard(game)
  return (
    <Panel aria-labelledby="crew-title">
      <PanelHeader id="crew-title" icon={<Users />} title="Crew this week" subtitle="Fictional crewmates for the demo; no data is shared." />
      <div className="grid gap-1.5 rounded-lg bg-surface-2/60 p-3">
        <p className="text-[15px]">
          Crew routine: <span className="font-mono">{done}</span> of <span className="font-mono">{total}</span> done today
        </p>
        <Bar value={(done / total) * 100} aria-label={`Crew routine, ${done} of ${total} done today`} />
      </div>
      <ol className="grid">
        {rows.map((r, i) => (
          <li key={r.id} className={cn('flex items-center gap-3 border-t border-hairline py-2 first:border-t-0', r.you && 'font-semibold')}>
            <span className="w-5 font-mono text-sm text-ink-soft">{i + 1}</span>
            <span className="flex-1">
              {r.displayName}
              {r.you && <span className="ml-1.5 text-sm font-normal text-ink-soft">(you)</span>}
            </span>
            {r.routineDoneToday ? (
              <CircleCheck className="size-4 text-interactive" aria-label="Routine done today" />
            ) : (
              <CircleDashed className="size-4 text-ink-soft" aria-label="Routine not done yet" />
            )}
            <span className="w-16 text-right font-mono text-sm">{formatPoints(r.weekPoints)}</span>
          </li>
        ))}
      </ol>
    </Panel>
  )
}

function History({ game }: { game: GameSummary }) {
  // Check-ups e, nos dias de plano, uma linha com os pontos do plano.
  const planRows = game.days
    .filter((d) => d.points.plan > 0)
    .map((d) => ({ id: `plan-${d.day}`, at: `${d.day}T23:59:59.000Z`, kind: 'plan' as const, offCount: null, points: d.points.plan }))
  const rows = [...historyRows(loadCheckIns()), ...planRows].sort((a, b) => b.at.localeCompare(a.at))
  return (
    <Panel aria-labelledby="history-title">
      <PanelHeader id="history-title" icon={<CalendarCheck />} title="Check-up history" />
      {rows.length === 0 ? (
        <p className="text-ink-soft">No check-ups saved yet. Your first one will appear here.</p>
      ) : (
        <ul className="grid max-h-96 overflow-y-auto">
          {rows.map((r) => (
            <li key={r.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-hairline py-2.5 first:border-t-0">
              {r.kind === 'health' ? (
                <HeartPulse className="size-4 text-interactive" aria-hidden />
              ) : r.kind === 'plan' ? (
                <Route className="size-4 text-interactive" aria-hidden />
              ) : (
                <Smile className="size-4 text-interactive" aria-hidden />
              )}
              <span className="min-w-0 flex-1">
                <span className="block">
                  {r.kind === 'health' ? 'Health check-up' : r.kind === 'plan' ? 'Back-to-baseline plan' : 'Behavioral check-in'}
                </span>
                <span className="font-mono text-[13px] text-ink-soft">{r.kind === 'plan' ? utcDay(r.at) : utcDateTime(r.at)}</span>
              </span>
              <span className="text-sm text-ink-soft">
                {r.kind === 'plan'
                  ? 'Plan steps'
                  : r.offCount == null
                    ? 'Self-report'
                    : r.offCount === 0
                      ? 'All within baseline'
                      : `${r.offCount} differ from baseline`}
              </span>
              <span className={cn('w-20 text-right font-mono text-sm', r.points ? 'text-ink' : 'text-ink-soft')}>
                {r.points ? `+${r.points}` : 'redo · 0'}
              </span>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  )
}

/** Uma linha por pergunta, uma coluna por check-in. Sem somar e sem interpretar. */
function BehavioralOverTime() {
  const entries = loadCheckIns()
    .filter((c): c is BehavioralCheckIn => c.kind === 'behavioral')
    .slice(-7)
  return (
    <Panel aria-labelledby="beh-title">
      <PanelHeader id="beh-title" icon={<Smile />} title="Behavioral check-in over time" subtitle="Answers from 1 to 5, as you gave them. Not scored." />
      {entries.length === 0 ? (
        <p className="text-ink-soft">No behavioral check-ins yet.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[20rem] border-collapse text-left">
            <thead>
              <tr>
                <th scope="col" className="py-2 pr-3 text-sm font-semibold text-ink-soft">
                  Question
                </th>
                {entries.map((e, i) => (
                  <th key={`${e.at}-${i}`} scope="col" className="px-2 py-2 text-center font-mono text-[13px] font-normal text-ink-soft">
                    {utcDay(e.at)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {behavioralQuestions.map((q) => (
                <tr key={q.id} className="border-t border-hairline">
                  <th scope="row" className="py-2.5 pr-3 text-sm font-normal">
                    {q.question.replace(/\?$/, '')}
                    <span className="block text-xs text-ink-soft">
                      1 = {q.low}, 5 = {q.high}
                    </span>
                  </th>
                  {entries.map((e, i) => (
                    <td key={`${e.at}-${i}`} className="px-2 py-2.5 text-center font-mono text-lg">
                      {e.behavioral[q.id] ?? '—'}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Panel>
  )
}

export function ProgressScreen({ game }: { game: GameSummary }) {
  const vitals = useMemo(() => getTodayVitals(), [])
  return (
    <div className="mx-auto max-w-[1360px] px-4 pt-4 pb-8 md:px-8">
      <h1 className="mb-4 font-display text-2xl font-semibold">Progress</h1>
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] lg:items-start">
        <div className="grid gap-4">
          <RankCard game={game} />
          <section aria-labelledby="trends-title" className="grid gap-3">
            <h2 id="trends-title" className="font-display text-lg font-semibold">
              Last 7 days
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {vitals
                .filter((v) => v.input !== 'device')
                .map((v) => (
                  <TrendChart key={v.id} vital={v} />
                ))}
            </div>
            <h3 className="mt-1 text-sm font-semibold text-ink-soft">
              From devices
              <Dot />
              simulated in this demo
            </h3>
            <div className="grid gap-4 sm:grid-cols-3">
              {vitals
                .filter((v) => v.input === 'device')
                .map((v) => (
                  <TrendChart key={v.id} vital={v} compact />
                ))}
            </div>
          </section>
          <BehavioralOverTime />
        </div>
        <div className="grid gap-4">
          <Crew game={game} />
          <Achievements game={game} />
          <History game={game} />
        </div>
      </div>
    </div>
  )
}
