import { useCallback, useEffect, useRef, useState } from 'react'
import { ApiError, calculate, type Operation } from '../api/client'
import {
  backspace,
  displayValue,
  initialState,
  inputDecimal,
  inputDigit,
  toggleSign,
  type CalcState,
  type PendingOperation,
} from '../lib/entry'
import { formatResult, messageFor, symbolFor } from '../lib/format'

export interface HistoryEntry {
  id: number
  expression: string
  result: string
}

const HISTORY_LIMIT = 20

export function useCalculator() {
  const [state, setState] = useState<CalcState>(initialState)
  const [busy, setBusy] = useState(false)
  const [history, setHistory] = useState<HistoryEntry[]>([])

  // Async handlers read the latest state through the ref, not a stale closure.
  const stateRef = useRef(state)
  stateRef.current = state
  const controller = useRef<AbortController | null>(null)
  const nextId = useRef(1)

  useEffect(() => () => controller.current?.abort(), [])

  const edit = useCallback((fn: (s: CalcState) => CalcState) => {
    if (!controller.current) setState(fn)
  }, [])

  const run = useCallback(async (op: Operation, operands: number[]): Promise<number | null> => {
    controller.current = new AbortController()
    setBusy(true)
    try {
      return await calculate(op, operands, controller.current.signal)
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') return null
      const message =
        err instanceof ApiError ? messageFor(err.code, err.message) : 'Something went wrong'
      setState({ ...initialState, error: message })
      return null
    } finally {
      controller.current = null
      setBusy(false)
    }
  }, [])

  const record = useCallback((expression: string, result: string) => {
    const entry = { id: nextId.current++, expression, result }
    setHistory((h) => [entry, ...h].slice(0, HISTORY_LIMIT))
  }, [])

  const chooseOperator = useCallback(
    async (op: PendingOperation) => {
      const s = stateRef.current
      const value = displayValue(s)
      if (s.error || busy || value === null) return

      // Pressing another operator right after one just swaps it.
      if (s.pending && s.fresh) {
        setState({ ...s, pending: op })
        return
      }

      if (s.pending && s.stored !== null) {
        const result = await run(s.pending, [s.stored, value])
        if (result === null) return
        setState({ display: formatResult(result), stored: result, pending: op, fresh: true, error: null })
        return
      }

      setState({ ...s, stored: value, pending: op, fresh: true })
    },
    [busy, run],
  )

  const equals = useCallback(async () => {
    const s = stateRef.current
    const value = displayValue(s)
    if (s.error || busy || !s.pending || s.stored === null || value === null) return

    const result = await run(s.pending, [s.stored, value])
    if (result === null) return

    const text = formatResult(result)
    record(`${formatResult(s.stored)} ${symbolFor(s.pending)} ${formatResult(value)}`, text)
    setState({ ...initialState, display: text, fresh: true })
  }, [busy, run, record])

  const squareRoot = useCallback(async () => {
    const s = stateRef.current
    const value = displayValue(s)
    if (s.error || busy || value === null) return

    const result = await run('sqrt', [value])
    if (result === null) return

    const text = formatResult(result)
    record(`√${formatResult(value)}`, text)
    setState({ ...s, display: text, fresh: true })
  }, [busy, run, record])

  // Like a desk calculator: "200 + 10 %" turns 10 into 20 (10% of 200).
  // With nothing pending it just divides by 100.
  const percent = useCallback(async () => {
    const s = stateRef.current
    const value = displayValue(s)
    if (s.error || busy || value === null) return

    const base = s.pending && s.stored !== null ? s.stored : 1
    const result = await run('percentage', [value, base])
    if (result === null) return

    setState({ ...s, display: formatResult(result), fresh: true })
  }, [busy, run])

  const clear = useCallback(() => {
    controller.current?.abort()
    setState(initialState)
  }, [])

  const recall = useCallback((result: string) => {
    if (controller.current) return
    setState((s) => ({ ...s, display: result, fresh: true, error: null }))
  }, [])

  const expression =
    state.pending && state.stored !== null
      ? `${formatResult(state.stored)} ${symbolFor(state.pending)}`
      : ''

  return {
    display: state.display,
    expression,
    error: state.error,
    pending: state.pending,
    busy,
    history,
    digit: (d: string) => edit((s) => inputDigit(s, d)),
    decimal: () => edit(inputDecimal),
    negate: () => edit(toggleSign),
    erase: () => edit(backspace),
    clear,
    chooseOperator,
    equals,
    squareRoot,
    percent,
    recall,
    clearHistory: () => setHistory([]),
  }
}

export type Calculator = ReturnType<typeof useCalculator>
