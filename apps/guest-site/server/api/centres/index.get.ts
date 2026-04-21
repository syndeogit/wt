import { centres } from '~/fixtures/centres'

export default defineEventHandler(() => {
  return { data: centres }
})
