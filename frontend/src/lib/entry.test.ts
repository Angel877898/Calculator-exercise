import { describe, expect, it } from 'vitest'
import {
  MAX_DIGITS,
  backspace,
  displayValue,
  initialState,
  inputDecimal,
  inputDigit,
  toggleSign,
  type CalcState,
} from './entry'

const withDisplay = (display: string, extra: Partial<CalcState> = {}): CalcState => ({
  ...initialState,
  display,
  ...extra,
})

describe('inputDigit', () => {
  it('replaces the leading zero', () => {
    expect(inputDigit(initialState, '7').display).toBe('7')
  })

  it('appends to an existing number', () => {
    expect(inputDigit(withDisplay('12'), '3').display).toBe('123')
  })

  it('keeps the sign when replacing -0', () => {
    expect(inputDigit(withDisplay('-0'), '5').display).toBe('-5')
  })

  it('starts a new number after an operator', () => {
    const next = inputDigit(withDisplay('12', { fresh: true, stored: 12, pending: 'add' }), '4')
    expect(next).toMatchObject({ display: '4', fresh: false, stored: 12, pending: 'add' })
  })

  it('clears an error', () => {
    expect(inputDigit({ ...initialState, error: 'boom' }, '3')).toEqual({ ...initialState, display: '3' })
  })

  it('stops at the digit limit', () => {
    const full = withDisplay('9'.repeat(MAX_DIGITS))
    expect(inputDigit(full, '1')).toBe(full)
  })

  it('ignores anything that is not a single digit', () => {
    expect(inputDigit(initialState, 'a')).toBe(initialState)
    expect(inputDigit(initialState, '12')).toBe(initialState)
  })
})

describe('inputDecimal', () => {
  it('adds a single decimal point', () => {
    const once = inputDecimal(withDisplay('3'))
    expect(once.display).toBe('3.')
    expect(inputDecimal(once).display).toBe('3.')
  })

  it('starts with 0. on a fresh entry or after an error', () => {
    expect(inputDecimal(withDisplay('9', { fresh: true })).display).toBe('0.')
    expect(inputDecimal({ ...initialState, error: 'x' }).display).toBe('0.')
  })
})

describe('toggleSign', () => {
  it('flips the sign back and forth', () => {
    const neg = toggleSign(withDisplay('8'))
    expect(neg.display).toBe('-8')
    expect(toggleSign(neg).display).toBe('8')
  })

  it('does nothing while showing an error', () => {
    const s = { ...initialState, error: 'x' }
    expect(toggleSign(s)).toBe(s)
  })
})

describe('backspace', () => {
  it('removes the last character', () => {
    expect(backspace(withDisplay('123')).display).toBe('12')
  })

  it('falls back to 0', () => {
    expect(backspace(withDisplay('5')).display).toBe('0')
    expect(backspace(withDisplay('-5')).display).toBe('0')
  })

  it('does not edit a result', () => {
    const s = withDisplay('42', { fresh: true })
    expect(backspace(s)).toBe(s)
  })

  it('resets after an error', () => {
    expect(backspace({ ...initialState, error: 'x' })).toEqual(initialState)
  })
})

describe('displayValue', () => {
  it('parses what is on screen', () => {
    expect(displayValue(withDisplay('-3.5'))).toBe(-3.5)
    expect(displayValue(withDisplay('2.'))).toBe(2)
  })

  it('returns null for unusable values', () => {
    expect(displayValue(withDisplay(''))).toBeNull()
    expect(displayValue(withDisplay('abc'))).toBeNull()
  })
})
