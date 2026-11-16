// Pure helpers for editing the number being typed. No network involved,
// so they stay synchronous and easy to test.

import type { BinaryOperation } from '../api/client'

export type PendingOperation = Exclude<BinaryOperation, 'percentage'>

export interface CalcState {
  display: string
  stored: number | null
  pending: PendingOperation | null
  // true right after an operator or result: the next digit starts a new number
  fresh: boolean
  error: string | null
}

export const MAX_DIGITS = 16

export const initialState: CalcState = {
  display: '0',
  stored: null,
  pending: null,
  fresh: false,
  error: null,
}

const digitCount = (s: string) => s.replace(/[^0-9]/g, '').length

export function inputDigit(state: CalcState, digit: string): CalcState {
  if (!/^[0-9]$/.test(digit)) return state

  if (state.error) return { ...initialState, display: digit }
  if (state.fresh) return { ...state, display: digit, fresh: false }
  if (digitCount(state.display) >= MAX_DIGITS) return state

  const display =
    state.display === '0' ? digit : state.display === '-0' ? `-${digit}` : state.display + digit
  return { ...state, display }
}

export function inputDecimal(state: CalcState): CalcState {
  if (state.error) return { ...initialState, display: '0.' }
  if (state.fresh) return { ...state, display: '0.', fresh: false }
  if (state.display.includes('.')) return state
  return { ...state, display: `${state.display}.` }
}

export function toggleSign(state: CalcState): CalcState {
  if (state.error) return state
  const { display } = state
  return { ...state, display: display.startsWith('-') ? display.slice(1) : `-${display}` }
}

export function backspace(state: CalcState): CalcState {
  if (state.error) return initialState
  if (state.fresh) return state

  const next = state.display.slice(0, -1)
  return { ...state, display: next === '' || next === '-' ? '0' : next }
}

// Value on screen as a number, or null if it's not something we can send.
export function displayValue(state: CalcState): number | null {
  const n = Number(state.display)
  return state.display.trim() !== '' && Number.isFinite(n) ? n : null
}
