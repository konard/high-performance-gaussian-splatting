# Issue #8: Double Loading and No Rendering - Root Cause Analysis

## Problem Summary
1. **Double Loading**: Model is downloaded and initialized twice
2. **No Rendering**: Canvas shows black screen with FPS = 0

## Evidence from Logs

### Timeline of Events
```
1. [SplatViewer] Initializing viewer...
2. [SplatViewer] Viewer created
3. [SplatViewer] Loading models: [bonsai-7k.splat]
4. [SplatViewer] Models loaded
5. [SplatViewer] Splat count: 1157138 Load time: 6896ms
6. [SplatViewer] Viewer started
7. [SplatViewer] Cleanup: aborting and disposing...  ← PROBLEM!
8. [SplatViewer] Cleanup complete
9. [SplatViewer] Initializing viewer...  ← SECOND INIT
10. [SplatViewer] Viewer created
11. [SplatViewer] Loading models: [bonsai-7k.splat]  ← SECOND LOAD
12. [SplatViewer] Models loaded
13. [SplatViewer] Splat count: 1157138 Load time: 5530ms
14. [SplatViewer] Viewer started
```

### Network Evidence
- Two identical requests to HuggingFace at timestamps 202852Z and 202858Z (6 seconds apart)
- Each request downloads the full 23MB+ model file

## Root Cause Investigation

### Hypothesis 1: setTimeout Pattern in App.tsx
The `handleSelectModel` function uses this pattern:
```tsx
setSelectedModel(null);
setIsLoading(true);
setTimeout(() => {
  setSelectedModel(model);
}, 0);
```

**Analysis**: This causes an extra render cycle, but doesn't explain why the viewer mounts twice.

### Hypothesis 2: useEffect Dependencies
The viewer's useEffect depends on: `[models, onLoad, onProgress, onError, updateFPS]`

Looking at App.tsx callbacks:
- `handleLoad` and `handleError` are wrapped in `useCallback` with `[]` dependencies ✓
- `updateFPS` is wrapped in `useCallback` with `[]` dependencies ✓

**Analysis**: Callbacks are stable, so they shouldn't trigger re-renders.

### Hypothesis 3: Models Array Recreation
In App.tsx:98, the viewer receives:
```tsx
<GaussianSplatViewer
  models={[selectedModel]}  ← NEW ARRAY EVERY RENDER!
  onLoad={handleLoad}
  onError={handleError}
/>
```

**BINGO!** Every time App renders, a new `[selectedModel]` array is created.
Even if `selectedModel` is the same object, the array reference changes!

### Hypothesis 4: Double Render from setTimeout
When user selects a model:
1. Render 1: `setSelectedModel(null)` + `setIsLoading(true)` → viewer unmounts
2. Render 2: setTimeout fires, `setSelectedModel(model)` → viewer mounts with model X
3. Render 3: Something triggers another render → viewer remounts with model X (same model, new array)

But wait - if the array reference changes on every render, why doesn't it continuously remount?

Let me check if `onLoad` is being called and triggering more renders...

### Hypothesis 5: onLoad Triggers Re-render During Mount
From App.tsx:22-24:
```tsx
const handleLoad = useCallback(() => {
  setIsLoading(false);  ← CAUSES RE-RENDER!
}, []);
```

**EUREKA! This is the smoking gun!**

Timeline with this understanding:
1. User selects model
2. `setSelectedModel(model)` → Render with model
3. GaussianSplatViewer mounts and starts loading
4. Model finishes loading, calls `onLoad()`
5. `onLoad()` calls `setIsLoading(false)` → **CAUSES RE-RENDER**
6. App re-renders with `isLoading=false`
7. Creates new `[selectedModel]` array ← **NEW REFERENCE**
8. GaussianSplatViewer's useEffect sees `models` changed → **CLEANUP + REMOUNT**
9. Second mount loads the model again!

## Root Causes Identified

### Primary Cause: Models Array Recreation + onLoad Re-render
- `models={[selectedModel]}` creates new array on every render
- `onLoad()` triggers `setIsLoading(false)`, causing re-render
- Re-render creates new models array → triggers useEffect cleanup + remount

### Secondary Cause: No Rendering (FPS = 0)
Need to investigate why the second mount doesn't render. Possible causes:
- Viewer disposed during first mount left stale resources
- WebGL context lost/not properly initialized
- Canvas element in wrong state
- Render loop not starting properly on second mount

## Proposed Solutions

### Solution 1: Memoize the models array
```tsx
const modelArray = useMemo(() => 
  selectedModel ? [selectedModel] : [], 
  [selectedModel]
);
```

### Solution 2: Remove unnecessary setTimeout
The setTimeout doesn't actually prevent double-loading, it may even contribute to it.

### Solution 3: Investigate rendering issue
Need to understand why FPS = 0 after the second mount.
