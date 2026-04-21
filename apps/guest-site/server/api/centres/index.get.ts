export default defineEventHandler(async (event) => {
  const data = await fetchCentres(event)
  return { data }
})
