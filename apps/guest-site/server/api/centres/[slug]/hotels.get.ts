import { centres } from '~/fixtures/centres'
import { hotels } from '~/fixtures/hotels'

export default defineEventHandler((event) => {
  const slug = getRouterParam(event, 'slug')
  const centre = centres.find((c) => c.slug === slug)
  if (!centre) {
    throw createError({ statusCode: 404, statusMessage: 'Centre not found' })
  }
  const items = hotels.filter((h) => h.centreId === centre.id)
  return { data: items }
})
