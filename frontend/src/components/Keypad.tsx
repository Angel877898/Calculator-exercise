import type { Calculator } from '../hooks/useCalculator'
import type { PendingOperation } from '../lib/entry'

type Variant = 'digit' | 'fn' | 'op' | 'equals'

interface Key {
  label: string
  aria: string
  variant: Variant
  onPress: () => void
  className?: string
  op?: PendingOperation
}

interface Props {
  calc: Calculator
}

export function Keypad({ calc }: Props) {
  const digit = (d: string): Key => ({ label: d, aria: d, variant: 'digit', onPress: () => calc.digit(d) })
  const op = (o: PendingOperation, label: string, aria: string): Key => ({
    label,
    aria,
    variant: 'op',
    op: o,
    onPress: () => void calc.chooseOperator(o),
  })

  const keys: Key[] = [
    { label: 'AC', aria: 'clear', variant: 'fn', onPress: calc.clear },
    { label: '⌫', aria: 'backspace', variant: 'fn', onPress: calc.erase },
    { label: '%', aria: 'percent', variant: 'fn', onPress: () => void calc.percent() },
    op('divide', '÷', 'divide'),

    { label: '√', aria: 'square root', variant: 'fn', onPress: () => void calc.squareRoot() },
    op('power', 'xʸ', 'power'),
    { label: '±', aria: 'toggle sign', variant: 'fn', onPress: calc.negate },
    op('multiply', '×', 'multiply'),

    digit('7'), digit('8'), digit('9'),
    op('subtract', '−', 'subtract'),

    digit('4'), digit('5'), digit('6'),
    op('add', '+', 'add'),

    digit('1'), digit('2'), digit('3'),
    { label: '=', aria: 'equals', variant: 'equals', onPress: () => void calc.equals(), className: 'key--tall' },

    { ...digit('0'), className: 'key--wide' },
    { label: '.', aria: 'decimal point', variant: 'digit', onPress: calc.decimal },
  ]

  return (
    <div className="keypad">
      {keys.map((k) => {
        const active = k.op !== undefined && calc.pending === k.op
        return (
          <button
            key={k.aria}
            type="button"
            className={`key key--${k.variant}${active ? ' key--active' : ''} ${k.className ?? ''}`}
            aria-label={k.aria}
            aria-pressed={k.op ? active : undefined}
            disabled={calc.busy && k.label !== 'AC'}
            onClick={k.onPress}
          >
            {k.label}
          </button>
        )
      })}
    </div>
  )
}
