import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Calculator } from './components/Calculator'
import './styles.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <main className="app">
      <h1 className="app__title">Calculator</h1>
      <Calculator />
      <footer className="app__hint">Keyboard works too: digits, + − * / ^, Enter, Esc, r for √</footer>
    </main>
  </StrictMode>,
)
