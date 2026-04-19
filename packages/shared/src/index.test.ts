import { describe, expect, it } from 'vitest'
import { add } from './index'

describe('add', () => {
  it('sums two numbers', () => {
    expect(add(2, 3)).toBe(5)
  })

  it('handles negatives', () => {
    expect(add(-1, 1)).toBe(0)
  })
})
