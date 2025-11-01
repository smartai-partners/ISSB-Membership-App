import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Provider } from 'react-redux'
import { ErrorBoundary } from './components/ErrorBoundary.tsx'
import { Toaster } from './components/ui/sonner.tsx'
import { store } from './store'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Provider store={store}>
      <ErrorBoundary>
        <App />
        <Toaster />
      </ErrorBoundary>
    </Provider>
  </StrictMode>,
)
