import { useState, useCallback, useMemo } from 'react';
import { GaussianSplatViewer, type SplatModel } from './components/GaussianSplatViewer';
import { ModelSelector } from './components/ModelSelector';
import { AVAILABLE_MODELS } from './data/models';
import './App.css';

function App() {
  const [selectedModel, setSelectedModel] = useState<SplatModel | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSelectModel = useCallback((model: SplatModel) => {
    setSelectedModel(model);
    setIsLoading(true);
  }, []);

  const handleLoad = useCallback(() => {
    setIsLoading(false);
  }, []);

  const handleError = useCallback((error: Error) => {
    console.error('Failed to load model:', error);
    setIsLoading(false);
  }, []);

  // Memoize the models array to prevent unnecessary re-renders
  // Without this, a new array is created on every render, causing the GaussianSplatViewer
  // to unmount and remount even when the selectedModel hasn't changed
  const modelArray = useMemo(() =>
    selectedModel ? [selectedModel] : [],
    [selectedModel]
  );

  return (
    <div className="app">
      <header className="app-header">
        <h1>High-Performance Gaussian Splatting Viewer</h1>
        <p className="app-subtitle">
          A proof of concept for real-time rendering of 3D Gaussian Splats in the browser
        </p>
      </header>

      <main className="app-main">
        <div className="sidebar">
          <ModelSelector
            models={AVAILABLE_MODELS}
            selectedModel={selectedModel}
            onSelectModel={handleSelectModel}
            disabled={isLoading}
          />

          <div className="info-panel">
            <h3>About</h3>
            <p>
              This viewer demonstrates real-time rendering of 3D Gaussian Splatting
              models directly in your web browser using WebGL.
            </p>
            <h3>Features</h3>
            <ul>
              <li>Real-time rendering</li>
              <li>Smooth camera controls</li>
              <li>Performance monitoring</li>
              <li>Multiple model support</li>
            </ul>
            <h3>Roadmap</h3>
            <ul>
              <li>Level of Detail (LOD) system</li>
              <li>WebGPU support</li>
              <li>Large model streaming</li>
              <li>Advanced culling</li>
            </ul>
          </div>

          <div className="links-panel">
            <h3>Resources</h3>
            <ul>
              <li>
                <a
                  href="https://github.com/konard/high-performance-gaussian-splatting"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  GitHub Repository
                </a>
              </li>
              <li>
                <a
                  href="https://repo-sam.inria.fr/fungraph/3d-gaussian-splatting/"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  3DGS Paper
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="viewer-wrapper">
          {selectedModel ? (
            <GaussianSplatViewer
              models={modelArray}
              onLoad={handleLoad}
              onError={handleError}
            />
          ) : (
            <div className="no-model-selected">
              <div className="no-model-content">
                <div className="no-model-icon">3D</div>
                <h2>Welcome to the Gaussian Splatting Viewer</h2>
                <p>Select a model from the dropdown to get started.</p>
              </div>
            </div>
          )}
        </div>
      </main>

      <footer className="app-footer">
        <p>
          Built with React, Three.js, and{' '}
          <a
            href="https://github.com/mkkellogg/GaussianSplats3D"
            target="_blank"
            rel="noopener noreferrer"
          >
            GaussianSplats3D
          </a>
        </p>
      </footer>
    </div>
  );
}

export default App;
