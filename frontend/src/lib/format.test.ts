import { describe, expect, it } from 'vitest'
import { formatResult, groupDigits, messageFor, symbolFor } from './format'

describe('formatResult', () => {
  it.each([
    [5, '5'],
    [0, '0'],
    [-0, '0'],
    [2.5, '2.5'],
    [0.1 + 0.2, '0.3'],
    [1 / 3, '0.333333333333'],
    [-42, '-42'],
    [1e20, '1e+20'],
    [1.5e-12, '1.5e-12'],
    [123456789012, '123456789012'],
  ])('formats %s as %s', (input, expected) => {
    expect(formatResult(input)).toBe(expected)
  })

  it('returns Error for non-finite values', () => {
    expect(formatResult(Infinity)).toBe('Error')
    expect(formatResult(NaN)).toBe('Error')
  })
})

describe('groupDigits', () => {
  it.each([
    ['0', '0'],
    ['999', '999'],
    ['1000', '1,000'],
    ['-1234567', '-1,234,567'],
    ['1234.5678', '1,234.5678'],
    ['1000.', '1,000.'],
    ['1e+20', '1e+20'],
  ])('groups %s as %s', (input, expected) => {
    expect(groupDigits(input)).toBe(expected)
  })
})

describe('symbolFor / messageFor', () => {
  it('maps operations to symbols', () => {
    expect(symbolFor('multiply')).toBe('×')
    expect(symbolFor('sqrt')).toBe('√')
  })

  it('uses a friendly message when known and the fallback otherwise', () => {
    expect(messageFor('division_by_zero', 'x')).toBe("Can't divide by zero")
    expect(messageFor('weird', 'fallback')).toBe('fallback')
  })
})
