import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { applyEnvironment } from './common/envConfig'

// Automatically apply dynamic manifest, title, and favicon based on environment (dev/qa/prod)
applyEnvironment()

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
