const MAX_PRECISION = 12

// Turns an API result into display text, hiding float noise like 0.1 + 0.2.
export function formatResult(n: number): string {
  if (!Number.isFinite(n)) return 'Error'
  if (n === 0) return '0'

  const abs = Math.abs(n)
  if (abs >= 1e16 || abs < 1e-9) {
    // "1.23400000e+20" -> "1.234e+20"
    return n.toExponential(MAX_PRECISION - 4).replace(/\.?0+e/, 'e')
  }
  return String(Number(n.toPrecision(MAX_PRECISION)))
}

// Adds thousands separators to the integer part only, keeping what the user typed.
export function groupDigits(value: string): string {
  if (value.includes('e')) return value
  const [int, dec] = value.split('.')
  const grouped = int.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  return dec === undefined ? grouped : `${grouped}.${dec}`
}

const SYMBOLS = {
  add: '+',
  subtract: '−',
  multiply: '×',
  divide: '÷',
  power: '^',
  percentage: '%',
  sqrt: '√',
} as const

export function symbolFor(op: keyof typeof SYMBOLS): string {
  return SYMBOLS[op]
}

const MESSAGES: Record<string, string> = {
  division_by_zero: "Can't divide by zero",
  negative_sqrt: 'No real root for negatives',
  out_of_range: 'Result out of range',
  network_error: 'Server unreachable',
}

export function messageFor(code: string, fallback: string): string {
  return MESSAGES[code] ?? fallback
}
