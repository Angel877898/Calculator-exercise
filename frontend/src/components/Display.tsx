import { groupDigits } from '../lib/format'

interface Props {
  value: string
  expression: string
  error: string | null
  busy: boolean
}

// Shrink the font as the number grows so it never overflows.
function sizeFor(length: number): string {
  if (length > 16) return 'display__value--xs'
  if (length > 12) return 'display__value--sm'
  if (length > 9) return 'display__value--md'
  return ''
}

export function Display({ value, expression, error, busy }: Props) {
  const text = error ? 'Error' : groupDigits(value)

  return (
    <div className={`display${busy ? ' display--busy' : ''}`}>
      <div className={`display__expression${error ? ' display__expression--error' : ''}`}>
        {error ?? expression}
        {busy && <span className="display__spinner" aria-label="Calculating" />}
      </div>
      <output className={`display__value ${sizeFor(text.length)}`} aria-live="polite" data-testid="display">
        {text}
      </output>
    </div>
  )
}
