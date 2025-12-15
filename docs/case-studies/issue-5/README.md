# Case Study: Issue #5 - No Render After Model Finishes Loading

## Summary

**Issue**: Gaussian Splatting viewer shows a black screen after the model finishes loading, despite stats indicating successful load.

**Root Causes Identified**:
1. **Model URLs returning 404** - The primary cause was broken model URLs from HuggingFace (cakewalk/splat-data/bonsai.splat, guitar.splat) and Antimatter15 that were no longer accessible
2. **React StrictMode's double-rendering** - Interferes with the GaussianSplats3D library's lifecycle
3. **Double loading issue** - Models were loading twice due to unnecessary `key` prop increment
4. **GPU-accelerated sort issues** - Can cause rendering failures on some systems

**Solution**:
1. Replace broken model URLs with working alternatives from dylanebert/3dgs and cakewalk/splat-data
2. Disable React StrictMode (library doesn't support rapid mount/unmount cycles)
3. Remove unnecessary `key` prop increment that caused double-loading
4. Add `gpuAcceleratedSort: false` to fix potential rendering issues
5. Update camera settings and enable `selfDrivenMode` for proper rendering
6. Handle `dispose()` errors gracefully using Promise `.catch()`

**Status**: 🔧 In Progress (PR #7)

## Quick Links

- [Issue #5](https://github.com/konard/high-performance-gaussian-splatting/issues/5)
- [Pull Request #7](https://github.com/konard/high-performance-gaussian-splatting/pull/7)
- [Detailed Analysis](./analysis.md)

## The Problem

When users selected a model from the dropdown:
1. In Safari/Chrome: Model appeared to load successfully (stats showed splat count and load time)
2. FPS counter was working
3. **But the canvas remained completely black** - no rendering occurred
4. Console showed `removeChild` errors in Chrome
5. **Models failed to load with 404 errors** - The original model URLs were no longer accessible

### Evidence

Screenshots captured during investigation:
- Initial black screen issue in Safari and Chrome
- 404 errors from HuggingFace and Antimatter15 URLs
- Console errors showing removeChild issues

## Root Cause Analysis

### 1. Broken Model URLs (Primary Issue)

The model URLs in `src/data/models.ts` were returning 404:

```typescript
// BROKEN URLs (404)
'https://huggingface.co/cakewalk/splat-data/resolve/main/bonsai.splat'  // 404
'https://huggingface.co/cakewalk/splat-data/resolve/main/guitar.splat'  // 404
'https://antimatter15.com/splat/nike.splat'  // 404
'https://antimatter15.com/splat/plush.splat'  // 404
```

### 2. React StrictMode + Library Lifecycle

React 19's StrictMode intentionally renders components twice:
1. **First render**: Component mounts, viewer starts loading
2. **StrictMode cleanup**: Component unmounts, cleanup function calls `viewer.dispose()`
3. **Second render**: Component remounts, but the viewer is in a broken state
4. **Result**: `removeChild` errors and black screen

### 3. Double Loading from Key Prop

The original `handleSelectModel` function incremented a `key` prop unnecessarily:
```typescript
// Original code causing double-load
setSelectedModel(model);
setKey((prev) => prev + 1);  // Forces complete re-mount
```

### 4. GPU Sort Issues

The GaussianSplats3D library's GPU-accelerated sort can fail on some systems, causing black screens.

## The Solution

### 1. Updated Model URLs (`src/data/models.ts`)

Replaced broken URLs with working alternatives:

```typescript
export const AVAILABLE_MODELS: SplatModel[] = [
  {
    name: 'Bonsai',
    url: 'https://huggingface.co/datasets/dylanebert/3dgs/resolve/main/bonsai/bonsai-7k.splat',
    // ...
  },
  {
    name: 'Garden',
    url: 'https://huggingface.co/datasets/dylanebert/3dgs/resolve/main/garden/garden-7k.splat',
    // ...
  },
  {
    name: 'Nike',
    url: 'https://media.reshot.ai/models/nike_next/model.splat',
    // ...
  },
  // ... more working URLs
];
```

### 2. Viewer Configuration (`src/components/GaussianSplatViewer.tsx`)

Updated viewer options to fix rendering issues:

```typescript
viewer = new GaussianSplats3D.Viewer({
  cameraUp: [0, 1, 0],
  initialCameraPosition: [0, 2, 8],
  initialCameraLookAt: [0, 0, 0],
  rootElement: container,
  sceneRevealMode: GaussianSplats3D.SceneRevealMode.Instant,
  antialiased: true,
  focalAdjustment: 1.0,
  dynamicScene: false,
  sharedMemoryForWorkers: false,
  gpuAcceleratedSort: false,  // Fix black screen on some systems
  selfDrivenMode: true,       // Enable proper render loop
});
```

### 3. Fix Double Loading (`src/App.tsx`)

Removed unnecessary key prop and improved model switching:

```typescript
const handleSelectModel = useCallback((model: SplatModel) => {
  setSelectedModel(null);  // Clear first for proper cleanup
  setIsLoading(true);
  setTimeout(() => {
    setSelectedModel(model);  // Then set new model
  }, 0);
}, []);
```

### 4. Disabled StrictMode (`src/main.tsx`)

```typescript
createRoot(document.getElementById('root')!).render(
  <App />,  // StrictMode disabled for library compatibility
)
```

## Working Model Sources

Verified working URLs:
- **dylanebert/3dgs** (HuggingFace): `https://huggingface.co/datasets/dylanebert/3dgs/resolve/main/{scene}/{scene}-7k.splat`
  - bonsai, garden, bicycle, counter, kitchen, room, stump
- **cakewalk/splat-data** (HuggingFace): `https://huggingface.co/cakewalk/splat-data/resolve/main/{model}.splat`
  - truck, train, plush, nike, garden, stump, bicycle, treehill, room
- **media.reshot.ai**: `https://media.reshot.ai/models/nike_next/model.splat`

## Testing

The fix was verified by:
1. ✅ All model URLs return 200 (verified with curl)
2. ✅ TypeScript compilation passes
3. ✅ Vite build succeeds
4. ✅ Models load with correct splat counts
5. ⏳ Visual rendering verification pending deployment

## Files Changed

- `src/data/models.ts` - Updated model URLs to working alternatives
- `src/components/GaussianSplatViewer.tsx` - Added gpuAcceleratedSort: false, selfDrivenMode: true
- `src/App.tsx` - Fixed double-loading issue by removing key prop increment
- `src/main.tsx` - Disabled React StrictMode
- `docs/case-studies/issue-5/README.md` - Updated documentation

## References

### Related GaussianSplats3D Issues
- [Is it compatible with React? · Issue #165](https://github.com/mkkellogg/GaussianSplats3D/issues/165)
- [NextJS Issue · Issue #247](https://github.com/mkkellogg/GaussianSplats3D/issues/247)
- [Black Screen on Integrating the Advanced Viewer · Issue #345](https://github.com/mkkellogg/GaussianSplats3D/issues/345)

### Model Data Sources
- [dylanebert/3dgs Dataset](https://huggingface.co/datasets/dylanebert/3dgs)
- [cakewalk/splat-data](https://huggingface.co/cakewalk/splat-data)

## Lessons Learned

1. **Always verify external URLs** - Third-party hosted files can become unavailable
2. **React StrictMode is important** - But some libraries don't support it
3. **Async effects need cleanup** - Always check if component is still mounted
4. **GPU features can fail** - Have fallbacks for GPU-accelerated features
5. **Test with real data** - Mock data doesn't catch URL availability issues

## Timeline

- **Issue reported**: User observed black screen after model loads
- **Investigation**: Screenshots analyzed, console errors identified
- **Discovery**: Model URLs returning 404 errors
- **Research**: Found working model sources
- **Root cause identified**: Broken URLs + React lifecycle issues + GPU sort
- **Solution implemented**: Updated URLs, viewer config, and model switching logic
- **Verification**: Build successful, ready for deployment

---

**Author**: AI Issue Solver
**Date**: 2025-12-15
**Issue**: #5
**Pull Request**: #7
