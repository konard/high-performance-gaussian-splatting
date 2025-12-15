# Issue #5: No Render After Model Finishes Loading

## Problem Statement

The Gaussian Splatting viewer shows a black screen after the model finishes loading. The issue occurs in both Safari and Chrome browsers. Stats show that the model has loaded successfully (1.03M splats, load time ~25-27s, FPS counter is working), but nothing is rendered on the canvas.

## Screenshots

### Safari
![Safari Screenshot](./screenshots/safari-screenshot.png)
- Model: Train (1.03M splats)
- Load time: 25.6s
- FPS: 118
- Issue: Black canvas, no visible rendering

### Chrome
![Chrome Screenshot](./screenshots/chrome-screenshot.png)
- Model: Train (1.03M splats)
- Load time: 27.1s
- FPS: 238
- Issue: Black canvas, console errors visible

### Console Errors (Chrome)

From the screenshot, the following errors are visible:
1. `[Violation] 'setTimeout' handler took <time>ms`
2. `[Violation] 'requestAnimationFrame' handler took 59ms`
3. **Critical**: `NotFoundError: Failed to execute 'removeChild' on 'Node': The node to be removed is not a child of this node.`

The `removeChild` error is the key indicator of the underlying issue.

## Root Cause Analysis

### Timeline of Events

1. **User selects a model** from the dropdown (e.g., "Train")
2. **React renders the GaussianSplatViewer component**
3. **In development mode with StrictMode enabled**, React intentionally:
   - Mounts the component (first render)
   - Immediately unmounts it (cleanup)
   - Remounts it (second render)
4. **During the first mount**:
   - `useEffect` triggers `initViewer()`
   - Viewer is created: `new GaussianSplats3D.Viewer(...)`
   - Model starts loading via `viewer.addSplatScenes(...)`
5. **React StrictMode triggers unmount** (between first and second render):
   - Cleanup function runs
   - Calls `viewerRef.current.dispose()`
   - GaussianSplats3D tries to remove its canvas and DOM elements
6. **But the viewer is still loading or just started**:
   - The async `addSplatScenes` promise may still be pending
   - The viewer's internal Three.js renderer may not be fully initialized
   - DOM elements may be in an inconsistent state
7. **`removeChild` error occurs**:
   - GaussianSplats3D's dispose method tries to remove DOM nodes
   - React may have already removed or modified these nodes
   - Result: `NotFoundError: Failed to execute 'removeChild' on 'Node'`
8. **Second mount occurs** but the viewer is now in a broken state:
   - The first viewer instance was partially disposed
   - Resources may be leaked or in an inconsistent state
   - The canvas renders but nothing appears (black screen)

### Code Analysis

#### src/main.tsx (Lines 6-10)
```tsx
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
```
**Issue**: React StrictMode is enabled, causing double-rendering in development.

#### src/components/GaussianSplatViewer.tsx (Lines 61-157)

The main `useEffect` has several problems:

1. **No abort mechanism for async operations** (Lines 67-142):
```tsx
const initViewer = async () => {
  // ... async operations ...
  await viewer.addSplatScenes(modelConfigs, true, ...);
  // ... more operations ...
  viewer.start();
}
```
If the component unmounts during `addSplatScenes`, the code continues to execute and eventually calls `viewer.start()` on a disposed viewer.

2. **Cleanup doesn't abort in-flight operations** (Lines 147-156):
```tsx
return () => {
  if (viewerRef.current) {
    try {
      viewerRef.current.dispose();
    } catch {
      // Ignore dispose errors
    }
    viewerRef.current = null;
  }
};
```
The cleanup silently catches and ignores errors, making debugging difficult. More importantly, it doesn't signal to the async `initViewer` function that it should abort.

3. **Problematic dependencies** (Line 157):
```tsx
}, [models, onLoad, onProgress, onError, updateFPS]);
```
Any change to these dependencies will trigger a complete viewer recreation and disposal cycle.

### Related Issues in GaussianSplats3D

Research into the GaussianSplats3D library revealed this is a known issue:

- [Issue #165: Is it compatible with React?](https://github.com/mkkellogg/GaussianSplats3D/issues/165)
- [Issue #247: NextJS Issue](https://github.com/mkkellogg/GaussianSplats3D/issues/247)

**Key findings**:
1. The library maintainer acknowledges React StrictMode causes double-renders
2. The `dispose()` method can fail if called while the viewer is still initializing
3. Recommended solution: Use try-catch on `addSplatScenes()` and handle early aborts gracefully
4. The `AbortController` inside the library doesn't always receive proper abort reasons

## Proposed Solutions

### Solution 1: Add Proper Cleanup with AbortController (Recommended)

Use an `AbortController` to signal when the component unmounts, and check this signal before performing operations:

```tsx
useEffect(() => {
  if (!containerRef.current || models.length === 0) return;

  const abortController = new AbortController();
  let viewer: GaussianSplats3D.Viewer | null = null;

  const initViewer = async () => {
    try {
      // ... create viewer ...
      viewer = new GaussianSplats3D.Viewer({ ... });

      if (abortController.signal.aborted) {
        viewer.dispose();
        return;
      }

      // ... load models ...
      await viewer.addSplatScenes(...);

      if (abortController.signal.aborted) {
        viewer.dispose();
        return;
      }

      // Only start if still mounted
      viewer.start();
      viewerRef.current = viewer;

    } catch (err) {
      // Handle errors, including aborts
      if (!abortController.signal.aborted) {
        // Only report error if not intentionally aborted
        setError(...);
      }
    }
  };

  initViewer();

  return () => {
    abortController.abort();
    if (viewer) {
      try {
        viewer.dispose();
      } catch (err) {
        console.warn('Error disposing viewer:', err);
      }
    }
  };
}, [models]);
```

### Solution 2: Disable StrictMode (Quick Fix, Not Recommended)

Remove `<StrictMode>` from `src/main.tsx`:

```tsx
createRoot(document.getElementById('root')!).render(
  <App />
)
```

**Pros**: Quick fix that works immediately
**Cons**:
- Only fixes development mode
- Loses React's helpful warnings about side effects
- Doesn't fix production issues if they exist
- Masks the underlying problem

### Solution 3: Use a Ref-based Mounting Check (Alternative)

Use a ref to track if the component is still mounted:

```tsx
const isMountedRef = useRef(true);

useEffect(() => {
  isMountedRef.current = true;

  const initViewer = async () => {
    // ... create viewer ...
    if (!isMountedRef.current) return;

    // ... load models ...
    if (!isMountedRef.current) return;

    viewer.start();
  };

  initViewer();

  return () => {
    isMountedRef.current = false;
    // ... cleanup ...
  };
}, [models]);
```

## Recommended Approach

**Implement Solution 1** with the following additional improvements:

1. **Add proper error logging** instead of silent try-catch
2. **Remove callbacks from dependency array** - use refs for callbacks that shouldn't trigger re-initialization
3. **Add defensive checks** before calling viewer methods
4. **Improve error handling** to distinguish between user errors and cleanup artifacts

This approach:
- ✅ Fixes the black screen issue
- ✅ Works with React StrictMode (better development experience)
- ✅ Prevents memory leaks
- ✅ Provides better error messages for debugging
- ✅ Follows React best practices

## References

- [Black Screen on Integrating the Advanced Viewer with Threejs Code · Issue #345](https://github.com/mkkellogg/GaussianSplats3D/issues/345)
- [NextJS Issue · Issue #247](https://github.com/mkkellogg/GaussianSplats3D/issues/247)
- [Is it compatible with React? · Issue #165](https://github.com/mkkellogg/GaussianSplats3D/issues/165)
- [Fixing the Next.js 15 + React 19 "removeChild" DOM Error](https://medium.com/@fabrizio.azzarri/fixing-the-next-js-15-react-19-removechild-dom-error-a33b57cbc3b1)
- [React Issue #17256: removeChild error with Chrome extensions](https://github.com/facebook/react/issues/17256)

## Testing Plan

1. Test with StrictMode enabled in development
2. Test model switching (rapid model changes)
3. Test in both Chrome and Safari
4. Test production build
5. Monitor for memory leaks during repeated model loads
6. Verify FPS counter works correctly
7. Verify error messages are helpful when actual errors occur
