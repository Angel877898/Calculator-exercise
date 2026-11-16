export type BinaryOperation = 'add' | 'subtract' | 'multiply' | 'divide' | 'power' | 'percentage'
export type UnaryOperation = 'sqrt'
export type Operation = BinaryOperation | UnaryOperation

export class ApiError extends Error {
  readonly code: string

  constructor(code: string, message: string) {
    super(message)
    this.name = 'ApiError'
    this.code = code
  }
}

const BASE_URL = import.meta.env.VITE_API_URL ?? ''

interface CalculateResponse {
  result: number
}

interface ErrorResponse {
  error?: { code?: string; message?: string }
}

export async function calculate(
  operation: Operation,
  operands: number[],
  signal?: AbortSignal,
): Promise<number> {
  let res: Response
  try {
    res = await fetch(`${BASE_URL}/api/v1/calculate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ operation, operands }),
      signal,
    })
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') throw err
    throw new ApiError('network_error', 'Could not reach the server')
  }

  // Body may be empty or non-JSON (e.g. a proxy error page).
  const body: unknown = await res.json().catch(() => null)

  if (!res.ok) {
    const { error } = (body ?? {}) as ErrorResponse
    throw new ApiError(error?.code ?? 'http_error', error?.message ?? `Request failed (${res.status})`)
  }

  const result = (body as CalculateResponse | null)?.result
  if (typeof result !== 'number') {
    throw new ApiError('bad_response', 'Unexpected response from server')
  }
  return result
}
