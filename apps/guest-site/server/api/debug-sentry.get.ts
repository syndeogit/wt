export default defineEventHandler(() => {
  throw new Error('Sentry smoke test — guest-site server route deliberate throw')
})
