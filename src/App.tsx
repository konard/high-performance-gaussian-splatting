import { useState, useCallback, useMemo } from 'react';
import { GaussianSplatViewer, type SplatModel } from './components/GaussianSplatViewer';
import { ModelSelector } from './components/ModelSelector';
import { AVAILABLE_MODELS } from './data/models';
import './App.css';

// Get initial model (Garden is first in the list)
const getInitialModel = (): SplatModel | null => {
  return AVAILABLE_MODELS.length > 0 ? AVAILABLE_MODELS[0] : null;
};

function App() {
  // Auto-select the first model (Garden) on startup
  const [selectedModel, setSelectedModel] = useState<SplatModel | null>(getInitialModel);
  const [isLoading, setIsLoading] = useState(true);

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
              <div className="loading-spinner" />
              <p>Loading...</p>
            </div>
          </div>
        )}
      </div>

      <div className="overlay-model-selector">
        <ModelSelector
          models={AVAILABLE_MODELS}
          selectedModel={selectedModel}
          onSelectModel={handleSelectModel}
          disabled={isLoading}
        />
      </div>
    </div>
  );
}

export default App;
