import { useState, type FormEvent } from 'react'
import { Award, HeartPulse, IdCard, LogOut, Pencil } from 'lucide-react'
import { Panel, PanelHeader } from '@/components/app/Panel'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { Profile as SessionProfile } from '@/lib/api'
import { formatPoints, GAME, type GameSummary } from '@/lib/game'
import { configForProfile } from '@/lib/health'
import { bmi, initials, usePerson, type Person, type PersonPatch, type Sex } from '@/lib/person'
import { navigate } from '@/lib/route'
import { session } from '@/lib/session'
import { cn } from '@/lib/utils'

/*
  Perfil do astronauta: quem é, em que rank está e os dados básicos (idade, altura, peso). Perfil simples:
  a linha de base pré-voo aparece só para consulta, porque é contra ela que o app compara cada medida.
*/
const SEX_TEXT: Record<Sex, string> = { female: 'Female', male: 'Male', intersex: 'Intersex', unspecified: 'Not stated' }

function Fact({ label, value, unit }: { label: string; value: string | number | null | undefined; unit?: string }) {
  const empty = value == null || value === ''
  return (
    <div className="rounded-lg bg-surface-2 px-4 py-3">
      <dt className="text-sm text-ink-soft">{label}</dt>
      <dd className="mt-1 font-mono text-2xl text-ink">
        {empty ? '—' : value}
        {!empty && unit && <span className="ml-1 text-sm text-ink-soft">{unit}</span>}
      </dd>
    </div>
  )
}

function EditForm({ person, saving, onSave, onCancel }: { person: Person; saving: boolean; onSave: (p: PersonPatch) => void; onCancel: () => void }) {
  const [name, setName] = useState(person.name)
  const [age, setAge] = useState(person.age?.toString() ?? '')
  const [height, setHeight] = useState(person.heightCm?.toString() ?? '')
  const [weight, setWeight] = useState(person.weightKg?.toString() ?? '')
  const [sex, setSex] = useState<Sex | ''>(person.sex ?? '')
  const num = (s: string) => (s.trim() === '' ? null : Number(s))

  function submit(e: FormEvent) {
    e.preventDefault()
    onSave({ name: name.trim() || person.name, age: num(age), heightCm: num(height), weightKg: num(weight), sex: sex || null })
  }

  const field = 'grid gap-1.5 text-sm font-semibold text-ink'
  const input = 'h-11 text-base'
  return (
    <form onSubmit={submit} className="grid gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className={cn(field, 'sm:col-span-2')}>
          Name
          <Input className={input} value={name} onChange={(e) => setName(e.target.value)} maxLength={120} required />
        </label>
        <label className={field}>
          Age
          <Input className={input} type="number" inputMode="numeric" min={18} max={90} value={age} onChange={(e) => setAge(e.target.value)} />
        </label>
        <label className={field}>
          Sex
          <select className={cn(input, 'rounded-md border border-input bg-surface-1 px-3')} value={sex} onChange={(e) => setSex(e.target.value as Sex | '')}>
            <option value="">Not stated</option>
            {(['female', 'male', 'intersex'] as Sex[]).map((s) => (
              <option key={s} value={s}>
                {SEX_TEXT[s]}
              </option>
            ))}
          </select>
        </label>
        <label className={field}>
          Height (cm)
          <Input className={input} type="number" inputMode="decimal" min={120} max={230} step="0.1" value={height} onChange={(e) => setHeight(e.target.value)} />
        </label>
        <label className={field}>
          Weight (kg)
          <Input className={input} type="number" inputMode="decimal" min={30} max={200} step="0.1" value={weight} onChange={(e) => setWeight(e.target.value)} />
        </label>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button type="submit" disabled={saving}>
          {saving ? 'Saving…' : 'Save'}
        </Button>
        <Button type="button" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  )
}

export function Profile({ profile, game }: { profile: SessionProfile; game: GameSummary }) {
  const { person, error, saving, save } = usePerson(profile.id)
  const [editing, setEditing] = useState(false)
  const name = person?.name ?? profile.displayName
  const next = game.next
  const from = game.rank.min
  const pct = next ? Math.min(100, Math.round(((game.totalPoints - from) / (next.min - from)) * 100)) : 100
  const baseline = configForProfile(profile).filter((c) => Number.isFinite(c.baseline))
  const rankIndex = GAME.ranks.findIndex((r) => r.name === game.rank.name)

  return (
    <div className="mx-auto grid max-w-[1100px] gap-4 px-4 pt-4 pb-8 md:px-8">
      <h1 className="sr-only">Profile</h1>

      {/* Quem é + rank */}
      <Panel className="gap-5 md:flex-row md:items-center md:gap-8">
        <div className="flex min-w-0 items-center gap-4">
          <span aria-hidden className="grid size-20 shrink-0 place-items-center rounded-full bg-sa-rocket-600 font-display text-3xl font-black text-white">
            {initials(name)}
          </span>
          <div className="min-w-0">
            <p className="font-display text-2xl leading-tight font-semibold break-words text-ink">{name}</p>
            <p className="mt-1 flex flex-wrap gap-2 text-sm">
              <span className="rounded-full bg-surface-2 px-2.5 py-0.5 font-mono text-ink-soft">{profile.id}</span>
              <span className="rounded-full bg-sa-neon-blue px-2.5 py-0.5 font-semibold text-white">Mission day {profile.missionDay}</span>
            </p>
          </div>
        </div>

        <a href="#/progress" className="block min-w-0 flex-1 rounded-lg bg-surface-2 p-4 text-ink no-underline hover:bg-surface-3 md:max-w-md md:ml-auto">
          <span className="flex items-center justify-between gap-3">
            <span className="flex items-center gap-2">
              <span aria-hidden className="grid size-9 place-items-center rounded-lg bg-sa-yellow text-sa-deep">
                <Award className="size-5" />
              </span>
              <span>
                <span className="block text-sm text-ink-soft">Rank {rankIndex + 1} of {GAME.ranks.length}</span>
                <span className="block font-display text-xl font-semibold">{game.rank.name}</span>
              </span>
            </span>
            <span className="font-mono text-lg">{formatPoints(game.totalPoints)} pts</span>
          </span>
          <span className="mt-3 block h-2 overflow-hidden rounded-full bg-surface-3" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label="Progress to next rank">
            <span className="block h-full rounded-full bg-sa-yellow" style={{ width: `${pct}%` }} />
          </span>
          <span className="mt-1.5 block text-sm text-ink-soft">{next ? `${formatPoints(next.min - game.totalPoints)} pts to ${next.name}` : 'Top rank reached'}</span>
        </a>
      </Panel>

      <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
        {/* Dados básicos */}
        <Panel>
          <PanelHeader
            icon={<IdCard />}
            tone="orange"
            title="Basic info"
            aside={
              person &&
              !editing && (
                <Button variant="ghost" size="sm" onClick={() => setEditing(true)}>
                  <Pencil aria-hidden /> Edit
                </Button>
              )
            }
          />
          {!person && !error && <p className="text-sm text-ink-soft" role="status">Loading…</p>}
          {person && editing && (
            <EditForm
              person={person}
              saving={saving}
              onCancel={() => setEditing(false)}
              onSave={async (patch) => {
                if (await save(patch)) setEditing(false)
              }}
            />
          )}
          {person && !editing && (
            <dl className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              <Fact label="Age" value={person.age} unit="years" />
              <Fact label="Sex" value={person.sex ? SEX_TEXT[person.sex] : null} />
                            <Fact label="Height" value={person.heightCm} unit="cm" />
              <Fact label="Weight" value={person.weightKg} unit="kg" />
              <Fact label="BMI" value={bmi(person)} />
              <Fact label="Last weigh-in" value={person.weightMeasuredAt ? new Date(person.weightMeasuredAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : null} />
            </dl>
          )}
          {error && (
            <p role="alert" className="text-sm text-flag-ink">
              {error}
            </p>
          )}
        </Panel>

        {/* Linha de base pré-voo */}
        <Panel>
          <PanelHeader icon={<HeartPulse />} tone="sky" title="Pre-flight baseline" />
          <ul className="grid">
            {baseline.map((c) => (
              <li key={c.id} className="flex items-baseline justify-between gap-3 border-t border-hairline py-2.5 first:border-t-0">
                <span className="text-ink-soft">{c.label}</span>
                <span className="font-mono text-ink">
                  {c.baseline}
                  {c.baselineDiastolic != null && `/${c.baselineDiastolic}`}
                  <span className="ml-1 text-sm text-ink-soft">{c.unit}</span>
                </span>
              </li>
            ))}
          </ul>
        </Panel>
      </div>

      <div className="flex flex-wrap items-center justify-end gap-4">
        <a href="#/welcome" className="text-sm font-semibold">
          About Health7
        </a>
        <Button
          variant="outline"
          onClick={() => {
            navigate('/')
            void session.logout()
          }}
        >
          <LogOut aria-hidden /> Log out
        </Button>
      </div>
    </div>
  )
}
