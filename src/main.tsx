import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// Note: StrictMode is disabled because it causes double-mounting which interferes
// with the GaussianSplats3D library's lifecycle management. The library creates
// WebGL resources that don't handle rapid mount/unmount cycles well.
// TODO: Re-enable StrictMode once the library supports it or we implement a workaround.
createRoot(document.getElementById('root')!).render(
  <App />,
)
