import type { SplatModel } from './GaussianSplatViewer';

interface ModelSelectorProps {
  models: SplatModel[];
  selectedModel: SplatModel | null;
  onSelectModel: (model: SplatModel) => void;
  disabled?: boolean;
}

export function ModelSelector({
  models,
  selectedModel,
  onSelectModel,
  disabled = false,
}: ModelSelectorProps) {
  return (
    <div className="model-selector">
      <label htmlFor="model-select" className="model-selector-label">
        Select a model:
      </label>
      <select
        id="model-select"
        className="model-selector-dropdown"
        value={selectedModel?.name || ''}
        onChange={(e) => {
          const model = models.find((m) => m.name === e.target.value);
          if (model) {
            onSelectModel(model);
          }
        }}
        disabled={disabled}
      >
        <option value="" disabled>
          Choose a model...
        </option>
        {models.map((model) => (
          <option key={model.name} value={model.name}>
            {model.name}
          </option>
        ))}
      </select>
    </div>
  );
}

export default ModelSelector;
