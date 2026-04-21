import type { Hotel } from './types'

const KARPATHOS = '00000000-0000-4000-8000-000000000001'

export const hotels: Hotel[] = [
  {
    id: '00000000-0000-4000-8000-000000000201',
    centreId: KARPATHOS,
    name: 'Poseidon Bay Rooms',
    summary: 'Walk-to-beach studios on the south bay. Kitchenette, AC, sea-view balconies.',
    image:
      'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1200&q=80',
    nightlyFromCents: 8500,
    currency: 'EUR',
  },
  {
    id: '00000000-0000-4000-8000-000000000202',
    centreId: KARPATHOS,
    name: 'Anemos House',
    summary: 'Small family-run pension 5 min walk from the centre. Breakfast on the terrace.',
    image:
      'https://images.unsplash.com/photo-1501117716987-c8e1ecb210ce?auto=format&fit=crop&w=1200&q=80',
    nightlyFromCents: 12000,
    currency: 'EUR',
  },
]
