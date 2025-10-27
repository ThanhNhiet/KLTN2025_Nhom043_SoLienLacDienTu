import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import Router from './routes/Router'
import { SocketProvider } from './contexts/SocketContext'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <SocketProvider>
      <Router />
    </SocketProvider>
  </StrictMode>,
)
