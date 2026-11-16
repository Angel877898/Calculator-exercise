import { describe, expect, it, vi } from 'vitest'
import { ApiError, calculate } from './client'

function mockFetch(status: number, body: unknown) {
  return vi.spyOn(globalThis, 'fetch').mockResolvedValue(
    new Response(typeof body === 'string' ? body : JSON.stringify(body), { status }),
  )
}

describe('calculate', () => {
  it('posts the operation and returns the result', async () => {
    const spy = mockFetch(200, { operation: 'add', operands: [2, 3], result: 5 })

    await expect(calculate('add', [2, 3])).resolves.toBe(5)

    const [url, init] = spy.mock.calls[0]
    expect(url).toBe('/api/v1/calculate')
    expect(init?.method).toBe('POST')
    expect(JSON.parse(init?.body as string)).toEqual({ operation: 'add', operands: [2, 3] })
  })

  it('throws the API error code and message', async () => {
    mockFetch(422, { error: { code: 'division_by_zero', message: 'division by zero' } })

    const err = await calculate('divide', [1, 0]).catch((e) => e)
    expect(err).toBeInstanceOf(ApiError)
    expect(err).toMatchObject({ code: 'division_by_zero', message: 'division by zero' })
  })

  it('handles error responses without a JSON body', async () => {
    mockFetch(502, '<html>Bad gateway</html>')
    await expect(calculate('add', [1, 1])).rejects.toMatchObject({ code: 'http_error' })
  })

  it('rejects a success response without a numeric result', async () => {
    mockFetch(200, { result: 'five' })
    await expect(calculate('add', [1, 1])).rejects.toMatchObject({ code: 'bad_response' })
  })

  it('reports network failures', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new TypeError('Failed to fetch'))
    await expect(calculate('add', [1, 1])).rejects.toMatchObject({ code: 'network_error' })
  })

  it('lets aborts propagate untouched', async () => {
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new DOMException('aborted', 'AbortError'))
    await expect(calculate('add', [1, 1])).rejects.toMatchObject({ name: 'AbortError' })
  })
})
