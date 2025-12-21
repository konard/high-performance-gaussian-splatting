# Case Study: Issue #8 - Double Loading and No Rendering

## Executive Summary

This case study documents the investigation and resolution of Issue #8, which involved two critical problems:
1. **Double Loading**: Gaussian splat models being downloaded and initialized twice
2. **No Rendering**: Canvas displaying a black screen with FPS = 0 despite successful model loading

## Problem Description

When users selected a model from the dropdown at https://konard.github.io/high-performance-gaussian-splatting:
- The model would download twice (confirmed via network logs)
- The loading indicators would show correctly
- Stats panel would show "Splats: 1.16M" and "Load time: 5.5s"
- But the canvas remained black and FPS stayed at 0
- No 3D model was visible

## Investigation Timeline

### 1. Initial Observation (Playwright Navigation)
- Navigated to live site
- Selected "Bonsai" model
- Observed loading UI appeared and completed
- Captured screenshot showing black canvas with stats: FPS=0, Splats=1.16M, Load time=5.5s

### 2. Network Analysis
Captured network requests and found:
```
*** FIRST MODEL LOAD (timestamp: 202852Z) ***
[GET] https://huggingface.co/datasets/dylanebert/3dgs/resolve/main/bonsai/bonsai-7k.splat

*** SECOND MODEL LOAD (timestamp: 202858Z) - 6 SECONDS LATER ***
[GET] https://huggingface.co/datasets/dylanebert/3dgs/resolve/main/bonsai/bonsai-7k.splat
```

**Finding**: Model downloaded twice, 6 seconds apart

### 3. Console Log Analysis (with DEBUG_SPLAT_VIEWER=true)
```
1. [SplatViewer] Initializing viewer...
2. [SplatViewer] Viewer created
3. [SplatViewer] Loading models: [bonsai-7k.splat]
4. [SplatViewer] Models loaded
5. [SplatViewer] Splat count: 1157138 Load time: 6896ms
6. [SplatViewer] Viewer started
7. [SplatViewer] Cleanup: aborting and disposing...  ← UNEXPECTED!
8. [SplatViewer] Cleanup complete
9. [SplatViewer] Initializing viewer...  ← REMOUNT!
10. [SplatViewer] Viewer created
11. [SplatViewer] Loading models: [bonsai-7k.splat]
12. [SplatViewer] Models loaded
13. [SplatViewer] Splat count: 1157138 Load time: 5530ms
14. [SplatViewer] Viewer started
```

**Finding**: Component unmounts immediately after first successful load, then remounts

### 4. Code Analysis

#### App.tsx - handleSelectModel function (lines 11-20)
```tsx
const handleSelectModel = useCallback((model: SplatModel) => {
  setSelectedModel(null);
  setIsLoading(true);
  setTimeout(() => {
    setSelectedModel(model);
  }, 0);
}, []);
```

#### App.tsx - handleLoad callback (lines 22-24)
```tsx
const handleLoad = useCallback(() => {
  setIsLoading(false);  // ← Triggers re-render!
}, []);
```

#### App.tsx - GaussianSplatViewer usage (lines 98-102)
```tsx
<GaussianSplatViewer
  models={[selectedModel]}  // ← New array every render!
  onLoad={handleLoad}
  onError={handleError}
/>
```

#### GaussianSplatViewer.tsx - useEffect dependencies (line 65)
```tsx
useEffect(() => {
  // ... viewer initialization ...
}, [models, onLoad, onProgress, onError, updateFPS]);
```

### 5. Root Cause Analysis

**The Cascade of Events:**

1. User selects "Bonsai" model
2. `handleSelectModel` calls `setSelectedModel(model)` (via setTimeout)
3. **Render 1**: App renders with `selectedModel="Bonsai"`, `isLoading=true`
   - Creates array `[selectedModel]` (reference #1)
   - GaussianSplatViewer mounts
   - useEffect runs, starts loading model
4. Model finishes loading
5. Viewer calls `onLoad()` callback
6. `onLoad()` calls `setIsLoading(false)` → **Triggers re-render**
7. **Render 2**: App renders with `selectedModel="Bonsai"`, `isLoading=false`
   - Creates NEW array `[selectedModel]` (reference #2) ← **Different reference!**
   - GaussianSplatViewer receives new `models` prop
8. useEffect sees `models` changed (reference #1 vs #2)
9. **Cleanup runs**: Viewer is disposed
10. **Effect runs again**: Viewer re-initializes and re-downloads model

**Root Causes Identified:**

1. **Primary Cause (Double Loading)**: Array `[selectedModel]` is recreated on every render
   - Not memoized, so reference changes even when `selectedModel` is the same
   - `onLoad()` callback triggers re-render by calling `setIsLoading(false)`
   - Re-render creates new array → useEffect cleanup + remount → re-download

2. **Secondary Cause (No Rendering)**: WebGL context or viewer state corruption
   - First viewer instance is disposed while potentially still rendering
   - Second instance may not properly initialize canvas/WebGL context
   - Disposal during active rendering may leave resources in bad state

### 6. Online Research

Searched for known issues with GaussianSplats3D:

**Relevant Issues Found:**
- [Issue #345](https://github.com/mkkellogg/GaussianSplats3D/issues/345): Black screen when integrating viewer with custom renderer
- [Issue #176](https://github.com/mkkellogg/GaussianSplats3D/issues/176): Drop-in viewer not displaying
- [Issue #311](https://github.com/mkkellogg/GaussianSplats3D/issues/311): Weird rendering behavior
- [Releases](https://github.com/mkkellogg/GaussianSplats3D/releases): Fixed bugs with double dispose() calls

**Key Insights:**
- Black screen is a known issue with viewer lifecycle management
- Library had dispose bugs (fixed in recent versions)
- React integration requires careful cleanup
- Multiple renders can corrupt WebGL context

## Solutions Proposed

### Solution 1: Memoize Models Array
```tsx
const modelArray = useMemo(() => 
  selectedModel ? [selectedModel] : [], 
  [selectedModel]
);

<GaussianSplatViewer
  models={modelArray}  // Stable reference
  onLoad={handleLoad}
  onError={handleError}
/>
```

**Benefits:**
- Prevents unnecessary re-renders
- Maintains stable array reference across renders
- useEffect only re-runs when selectedModel actually changes

### Solution 2: Remove setTimeout Pattern
```tsx
const handleSelectModel = useCallback((model: SplatModel) => {
  setSelectedModel(model);
  setIsLoading(true);
}, []);
```

**Benefits:**
- Simpler code
- Removes unnecessary render cycle
- setTimeout was meant to prevent double-loading but actually contributed to it

### Solution 3: Prevent Re-render from onLoad
Instead of updating state in onLoad, handle loading state internally or use a ref:
```tsx
// Option A: Don't update external loading state
const handleLoad = useCallback(() => {
  // Just log or do other side effects
  console.log('Model loaded');
}, []);

// Option B: Use ref to prevent render
const isLoadingRef = useRef(false);
```

However, the memoized array (Solution 1) should be sufficient to prevent the issue even with the current onLoad pattern.

## Implementation Plan

1. **Add useMemo for models array** in App.tsx
2. **Simplify handleSelectModel** (remove setTimeout)
3. **Test locally** to confirm both issues are fixed
4. **Verify** with Playwright that:
   - Model loads only once (check network)
   - Canvas renders correctly (FPS > 0)
   - No cleanup/remount in console logs

## Files to Modify

- `src/App.tsx`: Add useMemo, simplify handleSelectModel
- `docs/case-studies/issue-8/`: All documentation files (created)

## Expected Outcome

After implementing the fixes:
- ✅ Model downloads only once
- ✅ Canvas renders the 3D model
- ✅ FPS counter shows > 0 (typically 60 FPS)
- ✅ No unnecessary cleanup/remount cycles
- ✅ Better performance and user experience

## References

- [GaussianSplats3D Issue #345 - Black Screen](https://github.com/mkkellogg/GaussianSplats3D/issues/345)
- [GaussianSplats3D Releases - Dispose Fixes](https://github.com/mkkellogg/GaussianSplats3D/releases)
- [React Three Fiber Issue #132 - Dispose Context](https://github.com/pmndrs/react-three-fiber/issues/132)
- [Three.js Disposal Best Practices](https://discourse.threejs.org/t/when-to-dispose-how-to-completely-clean-up-a-three-js-scene/1549)

## Lessons Learned

1. **Array/Object References Matter**: In React, creating new arrays/objects on every render can trigger unnecessary effects
2. **Memoization is Critical**: Use `useMemo` for reference types passed as props/dependencies
3. **State Updates in Callbacks**: Be aware of state updates in callbacks triggering cascading re-renders
4. **WebGL Lifecycle**: WebGL contexts and 3D viewers don't handle rapid mount/unmount well
5. **Debug Logging**: Comprehensive logging was crucial to understanding the mount/unmount cycle
6. **Network Monitoring**: Network logs provided concrete evidence of double loading

---

*This case study was compiled on 2025-12-20 as part of solving Issue #8*
