import { centres } from '~/fixtures/centres'

export default defineEventHandler((event) => {
  const slug = getRouterParam(event, 'slug')
  const centre = centres.find((c) => c.slug === slug)
  if (!centre) {
    throw createError({ statusCode: 404, statusMessage: 'Centre not found' })
  }
  return { data: centre }
})
