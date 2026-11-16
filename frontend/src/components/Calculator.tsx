import { useEffect, useRef } from 'react'
import { useCalculator, type Calculator as Calc } from '../hooks/useCalculator'
import type { PendingOperation } from '../lib/entry'
import { Display } from './Display'
import { History } from './History'
import { Keypad } from './Keypad'

const OPERATOR_KEYS: Record<string, PendingOperation> = {
  '+': 'add',
  '-': 'subtract',
  '*': 'multiply',
  x: 'multiply',
  '/': 'divide',
  '^': 'power',
}

function handleKey(calc: Calc, e: KeyboardEvent) {
  if (e.ctrlKey || e.metaKey || e.altKey) return
  const { key } = e

  if (/^[0-9]$/.test(key)) calc.digit(key)
  else if (key === '.' || key === ',') calc.decimal()
  else if (key in OPERATOR_KEYS) void calc.chooseOperator(OPERATOR_KEYS[key])
  else if (key === 'Enter' || key === '=') void calc.equals()
  else if (key === 'Backspace') calc.erase()
  else if (key === 'Escape' || key === 'Delete') calc.clear()
  else if (key === '%') void calc.percent()
  else if (key === 'r') void calc.squareRoot()
  else return

  e.preventDefault()
}

export function Calculator() {
  const calc = useCalculator()
  // Subscribe once; the listener always reads the latest handlers.
  const latest = useRef(calc)
  latest.current = calc

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => handleKey(latest.current, e)
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  return (
    <div className="layout">
      <section className="calculator" aria-label="Calculator">
        <Display value={calc.display} expression={calc.expression} error={calc.error} busy={calc.busy} />
        <Keypad calc={calc} />
      </section>
      <History entries={calc.history} onSelect={calc.recall} onClear={calc.clearHistory} />
    </div>
  )
}
