// Windguru-style wind-strength colour bands. Saturated, not pastel — matches
// the canonical Windguru reference palette so a glance tells you "green/yellow
// /orange/red" the same way it does on windguru.cz.
//
// Boundaries: 4-knot bands from 0 to 44+. Each band returns a hex.

export interface WindBand {
  /** Lower bound of the band (inclusive), in knots. */
  from: number
  /** Upper bound (exclusive). Last band has Infinity. */
  to: number
  /** Saturated tint for the day card / chart band. */
  hex: string
}

export const WIND_BANDS: WindBand[] = [
  { from: 0, to: 4, hex: '#e5e7eb' }, // 0–3   calm grey
  { from: 4, to: 8, hex: '#7dd3fc' }, // 4–7   sky-300
  { from: 8, to: 12, hex: '#38bdf8' }, // 8–11  sky-400
  { from: 12, to: 16, hex: '#34d399' }, // 12–15 emerald-400
  { from: 16, to: 20, hex: '#22c55e' }, // 16–19 green-500
  { from: 20, to: 24, hex: '#84cc16' }, // 20–23 lime-500
  { from: 24, to: 28, hex: '#eab308' }, // 24–27 yellow-500
  { from: 28, to: 32, hex: '#facc15' }, // 28–31 yellow-400
  { from: 32, to: 36, hex: '#f97316' }, // 32–35 orange-500
  { from: 36, to: 40, hex: '#ef4444' }, // 36–39 red-500
  { from: 40, to: 44, hex: '#dc2626' }, // 40–43 red-600
  { from: 44, to: 48, hex: '#ec4899' }, // 44–47 pink-500
  { from: 48, to: Infinity, hex: '#d946ef' }, // 48+   fuchsia-500
]

export function windguruTint(kn: number): string {
  for (const b of WIND_BANDS) {
    if (kn >= b.from && kn < b.to) return b.hex
  }
  return WIND_BANDS[0]!.hex
}

// Wing-pick rule of thumb (intermediate ~75kg). Bigger wing for lighter wind —
// the joke and the physics. Returns m² label + render scale (px) inverse to
// wind strength. Sub-6 kn shows a faded "too light" placeholder.
export interface WingPick {
  size: string
  scalePx: number
  usable: boolean
}

export function wingPick(kn: number): WingPick {
  if (kn < 6) return { size: '—', scalePx: 28, usable: false }
  if (kn < 9) return { size: '7m', scalePx: 72, usable: true }
  if (kn < 12) return { size: '6m', scalePx: 64, usable: true }
  if (kn < 15) return { size: '5m', scalePx: 56, usable: true }
  if (kn < 19) return { size: '4.5m', scalePx: 50, usable: true }
  if (kn < 23) return { size: '4m', scalePx: 44, usable: true }
  if (kn < 27) return { size: '3.5m', scalePx: 38, usable: true }
  if (kn < 32) return { size: '3m', scalePx: 32, usable: true }
  if (kn < 37) return { size: '2.8m', scalePx: 28, usable: true }
  if (kn < 42) return { size: '2.5m', scalePx: 24, usable: true }
  return { size: '2.2m', scalePx: 22, usable: true }
}
