import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ApiError, calculate, type Operation } from '../api/client'
import { Calculator } from './Calculator'

vi.mock('../api/client', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../api/client')>()
  return { ...actual, calculate: vi.fn() }
})

// Stand-in for the backend so the UI flow can be tested without a server.
function fakeBackend(op: Operation, [a, b]: number[]): Promise<number> {
  switch (op) {
    case 'add': return Promise.resolve(a + b)
    case 'subtract': return Promise.resolve(a - b)
    case 'multiply': return Promise.resolve(a * b)
    case 'power': return Promise.resolve(a ** b)
    case 'percentage': return Promise.resolve((a * b) / 100)
    case 'sqrt':
      return a < 0
        ? Promise.reject(new ApiError('negative_sqrt', 'square root of a negative number'))
        : Promise.resolve(Math.sqrt(a))
    case 'divide':
      return b === 0
        ? Promise.reject(new ApiError('division_by_zero', 'division by zero'))
        : Promise.resolve(a / b)
  }
}

const mockedCalculate = vi.mocked(calculate)
const display = () => screen.getByTestId('display')

async function press(...labels: string[]) {
  const user = userEvent.setup()
  for (const label of labels) {
    await user.click(screen.getByRole('button', { name: label }))
  }
}

describe('Calculator', () => {
  beforeEach(() => {
    mockedCalculate.mockReset()
    mockedCalculate.mockImplementation((op, operands) => fakeBackend(op, operands))
  })

  it('starts at zero with empty history', () => {
    render(<Calculator />)
    expect(display()).toHaveTextContent('0')
    expect(screen.getByText(/will show up here/i)).toBeInTheDocument()
  })

  it('adds two numbers through the API', async () => {
    render(<Calculator />)
    await press('1', '2', 'add', '3', 'equals')

    await waitFor(() => expect(display()).toHaveTextContent('15'))
    expect(mockedCalculate).toHaveBeenCalledWith('add', [12, 3], expect.any(AbortSignal))
    expect(screen.getByText('12 + 3')).toBeInTheDocument()
  })

  it('chains operations left to right', async () => {
    render(<Calculator />)
    await press('2', 'add', '3', 'multiply')
    await waitFor(() => expect(display()).toHaveTextContent('5'))
    await press('4', 'equals')
    await waitFor(() => expect(display()).toHaveTextContent('20'))
  })

  it('swaps the operator when two are pressed in a row', async () => {
    render(<Calculator />)
    await press('9', 'add', 'subtract', '4', 'equals')
    await waitFor(() => expect(display()).toHaveTextContent('5'))
    expect(mockedCalculate).toHaveBeenCalledTimes(1)
  })

  it('shows a friendly error on division by zero and recovers', async () => {
    render(<Calculator />)
    await press('8', 'divide', '0', 'equals')

    expect(await screen.findByText("Can't divide by zero")).toBeInTheDocument()
    expect(display()).toHaveTextContent('Error')

    await press('7')
    expect(display()).toHaveTextContent('7')
    expect(screen.queryByText("Can't divide by zero")).not.toBeInTheDocument()
  })

  it('computes square roots and percentages', async () => {
    render(<Calculator />)
    await press('8', '1', 'square root')
    await waitFor(() => expect(display()).toHaveTextContent('9'))

    await press('clear', '2', '0', '0', 'add', '1', '0', 'percent')
    await waitFor(() => expect(display()).toHaveTextContent('20'))
    await press('equals')
    await waitFor(() => expect(display()).toHaveTextContent('220'))
  })

  it('reports a negative square root', async () => {
    render(<Calculator />)
    await press('4', 'toggle sign', 'square root')
    expect(await screen.findByText('No real root for negatives')).toBeInTheDocument()
  })

  it('edits input locally without calling the API', async () => {
    render(<Calculator />)
    await press('1', '2', '3', 'backspace', 'decimal point', '5', 'toggle sign')
    expect(display()).toHaveTextContent('-12.5')
    expect(mockedCalculate).not.toHaveBeenCalled()
  })

  it('groups large numbers with separators', async () => {
    render(<Calculator />)
    await press('1', '2', '3', '4', '5', '6', '7')
    expect(display()).toHaveTextContent('1,234,567')
  })

  it('supports the keyboard', async () => {
    const user = userEvent.setup()
    render(<Calculator />)
    await user.keyboard('6*7{Enter}')
    await waitFor(() => expect(display()).toHaveTextContent('42'))

    await user.keyboard('{Escape}')
    expect(display()).toHaveTextContent('0')
  })

  it('reuses a result from history and can clear it', async () => {
    render(<Calculator />)
    await press('2', 'power', '1', '0', 'equals')
    await waitFor(() => expect(display()).toHaveTextContent('1,024'))

    await press('clear')
    await userEvent.setup().click(screen.getByRole('button', { name: /^2 \^ 10/ }))
    expect(display()).toHaveTextContent('1,024')

    await press('Clear')
    expect(screen.getByText(/will show up here/i)).toBeInTheDocument()
  })

  it('disables keys while a request is in flight', async () => {
    let resolve!: (n: number) => void
    mockedCalculate.mockImplementationOnce(() => new Promise((r) => (resolve = r)))

    render(<Calculator />)
    await press('1', 'add', '1', 'equals')

    expect(screen.getByRole('button', { name: '5' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'clear' })).toBeEnabled()

    resolve(2)
    await waitFor(() => expect(display()).toHaveTextContent('2'))
    expect(screen.getByRole('button', { name: '5' })).toBeEnabled()
  })

  it('shows the server message for unexpected errors', async () => {
    mockedCalculate.mockRejectedValueOnce(new ApiError('internal_error', 'internal error'))
    render(<Calculator />)
    await press('1', 'add', '1', 'equals')
    expect(await screen.findByText('internal error')).toBeInTheDocument()
  })
})
