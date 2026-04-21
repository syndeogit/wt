export default defineEventHandler(async (event) => {
  const slug = getRouterParam(event, 'slug')
  if (!slug) {
    throw createError({ statusCode: 400, statusMessage: 'slug is required' })
  }
  const centre = await fetchCentreBySlug(event, slug)
  if (!centre) {
    throw createError({ statusCode: 404, statusMessage: 'Centre not found' })
  }
  const data = await fetchHotelsByCentreId(event, centre.id)
  return { data }
})
