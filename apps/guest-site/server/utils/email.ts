// Slice G: transactional email via Resend. Gated behind RESEND_API_KEY so the
// booking flow is fully functional before Andy creates a Resend account. When
// the key is absent, the would-be email is console-logged and the caller gets
// { sent: false, reason: 'not-configured' }; no exception is thrown so email
// failure never fails the booking.

import { Resend } from 'resend'

export interface BookingEmailInput {
  to: string
  bookingRef: string
  centreName: string
  centreRegion: string | null
  centreCountry: string | null
  productName: string
  productDurationLabel: string | null
  arrival: string // YYYY-MM-DD
  departure: string // YYYY-MM-DD
  amountCents: number
  currency: string
  firstName: string | null
  lastName: string | null
  hotelName: string | null
  hotelNightlyCents: number | null
  hotelTotalCents: number | null
}

export interface EmailSendResult {
  sent: boolean
  id?: string
  reason?: 'not-configured' | 'send-failed'
  error?: string
}

export function isEmailEnabled(): boolean {
  return Boolean(process.env.RESEND_API_KEY)
}

function envFrom(): string {
  return process.env.EMAIL_FROM_ADDRESS || 'WindTribe <onboarding@resend.dev>'
}

function envInternalBcc(): string | undefined {
  return process.env.INTERNAL_BOOKING_NOTIFICATIONS_EMAIL || undefined
}

function formatPrice(cents: number, currency: string): string {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(cents / 100)
}

function formatHumanDate(iso: string): string {
  return new Intl.DateTimeFormat('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(iso))
}

function nightCount(arrival: string, departure: string): number {
  const ms = new Date(departure).getTime() - new Date(arrival).getTime()
  return Math.max(0, Math.round(ms / (1000 * 60 * 60 * 24)))
}

function location(input: BookingEmailInput): string {
  return [input.centreName, input.centreRegion, input.centreCountry].filter(Boolean).join(', ')
}

function grandTotalCents(input: BookingEmailInput): number {
  return input.amountCents + (input.hotelTotalCents ?? 0)
}

export function renderTextBody(input: BookingEmailInput): string {
  const nights = nightCount(input.arrival, input.departure)
  const greeting = input.firstName ? `Hi ${input.firstName},` : 'Hi,'
  const lines = [
    greeting,
    '',
    `We've received your booking for ${input.productName} at ${input.centreName}.`,
    '',
    `Booking ref: ${input.bookingRef}`,
    `Destination: ${location(input)}`,
    `Programme:   ${input.productName}${input.productDurationLabel ? ' (' + input.productDurationLabel + ')' : ''}`,
    `Arrival:     ${formatHumanDate(input.arrival)}`,
    `Departure:   ${formatHumanDate(input.departure)}  (${nights} night${nights === 1 ? '' : 's'})`,
    `Programme:   ${formatPrice(input.amountCents, input.currency)}`,
  ]
  if (input.hotelName && input.hotelTotalCents !== null && input.hotelNightlyCents !== null) {
    lines.push(
      `Hotel:       ${input.hotelName} — ${formatPrice(input.hotelNightlyCents, input.currency)}/night x ${nights} = ${formatPrice(input.hotelTotalCents, input.currency)}`,
    )
    lines.push(`Total:       ${formatPrice(grandTotalCents(input), input.currency)}`)
  }
  lines.push(
    '',
    'Real online payment is coming soon. For now we\'ll reply within the day to',
    'confirm availability and take payment by card.',
    '',
    'The attached calendar invite blocks out the week on your calendar.',
    '',
    'Thanks for riding with us.',
    'WindTribe',
  )
  return lines.join('\n')
}

export function renderHtmlBody(input: BookingEmailInput): string {
  const nights = nightCount(input.arrival, input.departure)
  const greeting = input.firstName ? `Hi ${input.firstName},` : 'Hi,'
  const esc = (s: string) =>
    s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  const row = (label: string, value: string) =>
    `<tr><td style="padding:6px 16px 6px 0;color:#0e7490;font-size:12px;text-transform:uppercase;letter-spacing:0.12em;white-space:nowrap;vertical-align:top;">${esc(label)}</td><td style="padding:6px 0;color:#164e63;font-size:15px;vertical-align:top;">${esc(value)}</td></tr>`
  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#f0fbff;font-family:-apple-system,BlinkMacSystemFont,Segoe UI,sans-serif;color:#164e63;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f0fbff;padding:32px 16px;">
  <tr><td align="center">
    <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border:1px solid #a5f3fc;border-radius:16px;padding:32px;">
      <tr><td>
        <p style="margin:0 0 8px;color:#ef5a3e;font-size:11px;letter-spacing:0.22em;text-transform:uppercase;font-weight:600;">Booking received</p>
        <h1 style="margin:0 0 24px;color:#164e63;font-size:28px;line-height:1.2;font-family:-apple-system,BlinkMacSystemFont,Segoe UI,sans-serif;">We've got it.</h1>
        <p style="margin:0 0 20px;color:#164e63;font-size:15px;line-height:1.6;">${esc(greeting)}</p>
        <p style="margin:0 0 20px;color:#164e63;font-size:15px;line-height:1.6;">We've received your booking for <strong>${esc(input.productName)}</strong> at <strong translate="no">${esc(input.centreName)}</strong>.</p>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:24px 0;border-top:1px solid #a5f3fc;border-bottom:1px solid #a5f3fc;padding:16px 0;">
          ${row('Booking ref', input.bookingRef)}
          ${row('Destination', location(input))}
          ${row('Programme', input.productName + (input.productDurationLabel ? ' (' + input.productDurationLabel + ')' : ''))}
          ${row('Arrival', formatHumanDate(input.arrival))}
          ${row('Departure', formatHumanDate(input.departure) + '  (' + nights + ' night' + (nights === 1 ? '' : 's') + ')')}
          ${row('Programme', formatPrice(input.amountCents, input.currency))}
          ${
            input.hotelName && input.hotelTotalCents !== null && input.hotelNightlyCents !== null
              ? row(
                  'Hotel',
                  esc(input.hotelName) +
                    ' — ' +
                    formatPrice(input.hotelNightlyCents, input.currency) +
                    '/night × ' +
                    nights +
                    ' = ' +
                    formatPrice(input.hotelTotalCents, input.currency),
                ) + row('Total', formatPrice(grandTotalCents(input), input.currency))
              : ''
          }
        </table>
        <p style="margin:0 0 16px;color:#164e63;font-size:15px;line-height:1.6;">Real online payment is coming soon. For now we'll reply within the day to confirm availability and take payment by card.</p>
        <p style="margin:0 0 16px;color:#0e7490;font-size:13px;line-height:1.6;">The attached calendar invite blocks out the week on your calendar.</p>
        <p style="margin:24px 0 0;color:#164e63;font-size:15px;line-height:1.6;">Thanks for riding with us.<br/>WindTribe</p>
      </td></tr>
    </table>
  </td></tr>
</table>
</body></html>`
}

export function renderICS(input: BookingEmailInput): string {
  // iCal all-day event. DTEND is exclusive for DATE values — our departure
  // date IS the checkout/leaving day, so it maps directly to DTEND.
  const cleanDate = (iso: string) => iso.replace(/-/g, '')
  const now = new Date()
  const stamp =
    now.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z')
  const summary = `${input.productName} — ${input.centreName}`
  const description = `WindTribe booking ${input.bookingRef}`
  const loc = location(input)
  const uid = `${input.bookingRef}@windtribe.com`
  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//WindTribe//Booking//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${stamp}`,
    `DTSTART;VALUE=DATE:${cleanDate(input.arrival)}`,
    `DTEND;VALUE=DATE:${cleanDate(input.departure)}`,
    `SUMMARY:${summary}`,
    `DESCRIPTION:${description}`,
    `LOCATION:${loc}`,
    'STATUS:TENTATIVE',
    'TRANSP:OPAQUE',
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n')
}

export async function sendBookingConfirmation(
  input: BookingEmailInput,
): Promise<EmailSendResult> {
  const key = process.env.RESEND_API_KEY
  const subject = `Booking received — ${input.productName} at ${input.centreName} (${input.bookingRef})`

  if (!key) {
    // Scaffold mode: log the would-be email and return gracefully.
    console.log('[email:stub] sendBookingConfirmation not configured (no RESEND_API_KEY)')
    console.log('[email:stub] to:', input.to, 'subject:', subject)
    return { sent: false, reason: 'not-configured' }
  }

  const resend = new Resend(key)
  try {
    const ics = renderICS(input)
    const result = await resend.emails.send({
      from: envFrom(),
      to: [input.to],
      ...(envInternalBcc() ? { bcc: [envInternalBcc()!] } : {}),
      subject,
      text: renderTextBody(input),
      html: renderHtmlBody(input),
      attachments: [
        {
          filename: `${input.bookingRef}.ics`,
          content: Buffer.from(ics).toString('base64'),
          contentType: 'text/calendar',
        },
      ],
    })
    if (result.error) {
      console.error('[email] Resend error', result.error)
      return { sent: false, reason: 'send-failed', error: String(result.error.message ?? result.error) }
    }
    return { sent: true, id: result.data?.id }
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e)
    console.error('[email] Resend threw', msg)
    return { sent: false, reason: 'send-failed', error: msg }
  }
}
