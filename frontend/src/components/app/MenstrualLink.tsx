import { CalendarDays, ArrowRight } from 'lucide-react'
import type { Profile } from '@/lib/api'

export function MenstrualLink({ profile }: { profile: Profile }) {
  if (profile.bodyModel !== 'female') return null
  return <a href="#/menstrual" className="flex items-center gap-4 rounded-xl border border-hairline bg-surface-1 p-5 text-ink transition-colors hover:bg-surface-2">
    <CalendarDays className="size-6 shrink-0 text-interactive" aria-hidden />
    <span className="min-w-0 flex-1"><span className="block font-display text-lg font-semibold">Menstrual calendar</span>
      <span className="block text-sm text-ink-soft">Record period dates, flow and symptoms for your account.</span></span>
    <ArrowRight className="size-5 shrink-0" aria-hidden />
  </a>
}
