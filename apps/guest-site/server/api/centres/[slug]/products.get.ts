import { centres } from '~/fixtures/centres'
import { products } from '~/fixtures/products'

export default defineEventHandler((event) => {
  const slug = getRouterParam(event, 'slug')
  const centre = centres.find((c) => c.slug === slug)
  if (!centre) {
    throw createError({ statusCode: 404, statusMessage: 'Centre not found' })
  }
  const items = products.filter((p) => p.centreId === centre.id)
  return { data: items }
})
