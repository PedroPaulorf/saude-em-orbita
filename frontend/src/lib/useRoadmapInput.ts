import { useMemo } from 'react'
import { indicators, useSpaceWeather } from '@/lib/donki'
import { roadmapInput, type RoadmapInput } from '@/lib/roadmap'
import { usePatterns } from '@/lib/usePrevention'
import { useWaterLog, utcDayKey, WATER_GOAL } from '@/lib/water'
import type { Profile } from '@/lib/api'
import type { CheckIn } from '@/lib/storage'

/** Entrada do roteiro a partir do que está salvo agora (check-ups, água, padrões e clima espacial). */
export function useRoadmapInput(profile: Profile, checkins: CheckIn[]): RoadmapInput {
  const patterns = usePatterns()
  const water = useWaterLog()
  const weather = useSpaceWeather()
  const sep = weather.mode === 'live' ? indicators(weather.state.snapshot).sep.count > 0 : false
  const waterToday = water[utcDayKey()] ?? 0
  return useMemo(
    () => roadmapInput({ profile, checkins, patterns, sepThisWeek: sep, water: { today: waterToday, goal: WATER_GOAL } }),
    [profile, checkins, patterns, sep, waterToday],
  )
}
