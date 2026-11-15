import { cn } from '@/lib/utils'

const SUIT = '#f4f6fb'
const SUIT_SHADE = '#c9d2e6'
const VISOR = '#0b1c44'
const SKIN = '#e9b995'
const HAIR = '#3a2418'
const FACE_LINE = '#2a1710'

/** Astronaut bust for the sign-in profile picker. Decorative: the button around it carries the name. */
export function AstronautIcon({ model, className }: { model: 'male' | 'female'; className?: string }) {
  return (
    <svg viewBox="0 0 96 96" className={cn('block', className)} aria-hidden="true" data-astronaut={model}>
      {/* Suit: shoulders, collar ring and mission patch */}
      <path d="M8 98c0-18 16-29 40-29s40 11 40 29z" fill={SUIT} />
      <path d="M30 66c0-4 8-7 18-7s18 3 18 7-8 8-18 8-18-4-18-8z" fill={SUIT_SHADE} />
      <rect x="62" y="80" width="12" height="8" rx="2" fill="var(--c-rocket-600)" />
      <path d="M22 82h10M22 87h7" stroke={SUIT_SHADE} strokeWidth="2.5" strokeLinecap="round" />
      {/* Helmet and visor */}
      <circle cx="48" cy="38" r="29" fill={SUIT} />
      <circle cx="48" cy="38" r="29" fill="none" stroke={SUIT_SHADE} strokeWidth="2" />
      <rect x="24" y="18" width="48" height="40" rx="19" fill={VISOR} />
      {model === 'female' ? (
        <>
          {/* Long hair behind the face, falling to the shoulders */}
          <path d="M31 42c0-11 7-19 17-19s17 8 17 19v9c0 4-3 7-7 7H38c-4 0-7-3-7-7z" fill={HAIR} />
          <circle cx="48" cy="41" r="12.5" fill={SKIN} />
          {/* Side-swept fringe */}
          <path d="M35 40c0-9 5.5-14 13-14s13 5 13 14c-6-1-11-4-14-8-2 4-6 7-12 8z" fill={HAIR} />
          {/* Lashes */}
          <path d="M40.5 40.2l-2.3-1.4M55.5 40.2l2.3-1.4" stroke={FACE_LINE} strokeWidth="1.4" strokeLinecap="round" />
          <circle cx="43" cy="41.5" r="1.7" fill={FACE_LINE} />
          <circle cx="53" cy="41.5" r="1.7" fill={FACE_LINE} />
          <circle cx="39.5" cy="45.5" r="2" fill="#e58f7c" opacity="0.55" />
          <circle cx="56.5" cy="45.5" r="2" fill="#e58f7c" opacity="0.55" />
        </>
      ) : (
        <>
          <circle cx="48" cy="41" r="12.5" fill={SKIN} />
          {/* Short hair */}
          <path d="M35.2 38c0-8 5.3-12.5 12.8-12.5S60.8 30 60.8 38c-3-3.2-7.3-4.8-12.8-4.8S38.2 34.8 35.2 38z" fill={HAIR} />
          {/* Brows */}
          <path d="M40.5 38.3h4.5M51 38.3h4.5" stroke={FACE_LINE} strokeWidth="1.5" strokeLinecap="round" />
          <circle cx="43" cy="41.8" r="1.7" fill={FACE_LINE} />
          <circle cx="53" cy="41.8" r="1.7" fill={FACE_LINE} />
        </>
      )}
      <path d="M43.5 47q4.5 3.8 9 0" fill="none" stroke={FACE_LINE} strokeWidth="1.6" strokeLinecap="round" />
      {/* Visor glint */}
      <path d="M30 31c1.5-4.5 4.5-7.5 9-9" fill="none" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" opacity="0.4" />
    </svg>
  )
}
