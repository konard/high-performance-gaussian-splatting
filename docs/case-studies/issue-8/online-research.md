# Online Research - GaussianSplats3D Issues

## Search Query 1: "GaussianSplats3D viewer remount issue WebGL black screen 2025"

### Key Findings:

**Black Screen Integration Issues** ([Issue #345](https://github.com/mkkellogg/GaussianSplats3D/issues/345)):
- Users reported black screen issues when integrating the Advanced viewer with custom Scene, Camera, Orbit Control and Renderer
- Black screen appears as soon as the viewer is loaded
- Other objects like cubes render correctly before viewer initialization
- This matches our symptoms!

**Drop-In Viewer Display Problems** ([Issue #176](https://github.com/mkkellogg/GaussianSplats3D/issues/176)):
- Scene not displaying splats at all when using drop-in viewer
- Different behavior between viewer variants

**Project Status**:
- GaussianSplats3D is no longer in active development (was a side project)
- Maintainer recommends checking Spark as alternative (World Labs)

## Search Query 2: "GaussianSplats3D dispose cleanup canvas not rendering"

### Key Findings:

**Dispose Bug Fixes** ([Releases](https://github.com/mkkellogg/GaussianSplats3D/releases)):
- There was a bug where removeSplatScene() would never complete with only one scene loaded
- Double dispose() calls in Viewer.removeSplatScene() - **fixed in recent releases**
- We should ensure we're using latest version!

**React/Next.js Cleanup** ([Issue #247](https://github.com/mkkellogg/GaussianSplats3D/issues/247)):
- Users implementing cleanup in useEffect return statements
- Special considerations for React frameworks

**Drop-in Viewer Issues** ([Issue #311](https://github.com/mkkellogg/GaussianSplats3D/issues/311), [Issue #184](https://github.com/mkkellogg/GaussianSplats3D/issues/184)):
- Weird rendering behavior with DropInViewer
- Renderer div covering up touch input
- Different rendering behaviors between viewer types

**Three.js Context Management** ([react-three-fiber #132](https://github.com/pmndrs/react-three-fiber/issues/132)):
- WebGL contexts need proper disposal when canvas unmounts
- Avoid WebGL context loss warnings

## Relevance to Our Issue:

1. **Black screen is a known issue** with GaussianSplats3D, especially related to viewer lifecycle
2. **Dispose bugs existed** in the library - need to check our version
3. **React integration requires careful cleanup** to avoid remounting issues
4. **Multiple renders can cause problems** with WebGL context

## Sources:
- [Black Screen on Integrating the Advanced Viewer](https://github.com/mkkellogg/GaussianSplats3D/issues/345)
- [Drop in viewer Issue #176](https://github.com/mkkellogg/GaussianSplats3D/issues/176)
- [GaussianSplats3D Releases](https://github.com/mkkellogg/GaussianSplats3D/releases)
- [NextJS Issue #247](https://github.com/mkkellogg/GaussianSplats3D/issues/247)
- [Rendering mishap Issue #339](https://github.com/mkkellogg/GaussianSplats3D/issues/339)
- [Weird rendering behaviour using DropInViewer #311](https://github.com/mkkellogg/GaussianSplats3D/issues/311)
- [react-three-fiber dispose context issue #132](https://github.com/pmndrs/react-three-fiber/issues/132)
