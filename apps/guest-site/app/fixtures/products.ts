import type { Product } from './types'

const KARPATHOS = '00000000-0000-4000-8000-000000000001'

export const products: Product[] = [
  {
    id: '00000000-0000-4000-8000-000000000100',
    centreId: KARPATHOS,
    kind: 'package',
    discipline: 'wingfoil',
    name: 'Wing for beginners — 5 days',
    summary:
      'Five days from "never tried it" to first independent flights. Equipment, coaching and water time included.',
    description:
      'The whole point of WindTribe. Five mornings on the gentle inside lagoon learning to handle the wing on land, then on the board, then up on the foil. Coach in the water with you. Group cap of three. By Friday afternoon, most riders have their first sustained flights.',
    priceCents: 89000,
    currency: 'EUR',
    durationMinutes: null,
    durationLabel: '5 mornings · coaching + kit',
    minLevel: 'beginner',
    image:
      'https://images.unsplash.com/photo-1530870110042-98b2cb110834?auto=format&fit=crop&w=1200&q=80',
    includes: [
      'Wing + foil board + leash',
      'Wetsuit + impact vest',
      'Coach in the water (max 3 riders)',
      'Daily video debrief',
      'Recovery dinner on day 5',
    ],
  },
  {
    id: '00000000-0000-4000-8000-000000000101',
    centreId: KARPATHOS,
    kind: 'lesson',
    discipline: 'windsurf',
    name: 'Windsurf for beginners — 3 days',
    summary: 'Three afternoons on the flats, small groups, all gear included.',
    description:
      'For complete first-timers or returning beginners. You will rig, balance, turn, and ride upwind by day three. Group cap of four riders per instructor.',
    priceCents: 28500,
    currency: 'EUR',
    durationMinutes: 3 * 180,
    durationLabel: '3 afternoons · 3 hrs each',
    minLevel: 'beginner',
    image:
      'https://images.unsplash.com/photo-1502680390469-be75c86b636f?auto=format&fit=crop&w=1200&q=80',
    includes: [
      'Board + rig',
      'Wetsuit + harness',
      'Group instruction (max 4)',
      'Progress video on day 3',
    ],
  },
  {
    id: '00000000-0000-4000-8000-000000000102',
    centreId: KARPATHOS,
    kind: 'lesson',
    discipline: 'windsurf',
    name: 'Windsurf improver clinic — 2 days',
    summary: 'Move from tacks to gybes, planing, harness lines. Two afternoons on the water.',
    description:
      'For riders who can already sail upwind and are looking for the next step. Coach sails with you, debrief with video after each session.',
    priceCents: 24000,
    currency: 'EUR',
    durationMinutes: 2 * 180,
    durationLabel: '2 afternoons · 3 hrs each',
    minLevel: 'intermediate',
    image:
      'https://images.unsplash.com/photo-1551524559-8af4e6624178?auto=format&fit=crop&w=1200&q=80',
    includes: ['Advanced rig options', 'Video coaching', '1:2 coach to rider ratio'],
  },
  {
    id: '00000000-0000-4000-8000-000000000103',
    centreId: KARPATHOS,
    kind: 'rental',
    discipline: 'windsurf',
    name: 'Daily rental — windsurf kit',
    summary: 'All-day access to board + sail. Free size changes at the centre through the day.',
    description:
      'Full range of modern kit. Swap boards or sails at any time. Daily check-in with the beach manager on conditions.',
    priceCents: 6500,
    currency: 'EUR',
    durationMinutes: null,
    durationLabel: 'Full day',
    minLevel: 'intermediate',
    image:
      'https://images.unsplash.com/photo-1520975918318-79c51c7e1664?auto=format&fit=crop&w=1200&q=80',
    includes: ['Board of choice', 'Rig of choice', 'Unlimited swaps', 'Beach briefing'],
  },
  {
    id: '00000000-0000-4000-8000-000000000104',
    centreId: KARPATHOS,
    kind: 'package',
    discipline: 'windsurf',
    name: 'Wind week — 5 days',
    summary: 'Five days on the water at your level. Coaching plus free rental between sessions.',
    description:
      'The classic windsurf week. Coaching tailored to your level every afternoon, open rental access mornings and evenings. Best value if you are coming for more than a long weekend.',
    priceCents: 58000,
    currency: 'EUR',
    durationMinutes: null,
    durationLabel: '5 days · coaching + rental',
    minLevel: 'beginner',
    image:
      'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80',
    includes: [
      '5 afternoons of coaching',
      'Unlimited rental outside coaching',
      'Group size capped',
      'Welcome + farewell dinner',
    ],
  },
]
