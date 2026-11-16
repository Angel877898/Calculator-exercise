import type { HistoryEntry } from '../hooks/useCalculator'
import { groupDigits } from '../lib/format'

interface Props {
  entries: HistoryEntry[]
  onSelect: (result: string) => void
  onClear: () => void
}

export function History({ entries, onSelect, onClear }: Props) {
  return (
    <aside className="history" aria-label="History">
      <header className="history__header">
        <h2>History</h2>
        {entries.length > 0 && (
          <button type="button" className="history__clear" onClick={onClear}>
            Clear
          </button>
        )}
      </header>

      {entries.length === 0 ? (
        <p className="history__empty">Your calculations will show up here.</p>
      ) : (
        <ul className="history__list">
          {entries.map((e) => (
            <li key={e.id}>
              <button type="button" className="history__item" onClick={() => onSelect(e.result)}>
                <span className="history__expr">{e.expression}</span>
                <span className="history__result">= {groupDigits(e.result)}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </aside>
  )
}
