import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router'
import { router } from './router.tsx'
import { MusicProvider } from './lib/MusicProvider.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <MusicProvider>
      <RouterProvider router={router} />
    </MusicProvider>
  </StrictMode>,
)
