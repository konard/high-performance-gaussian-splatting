# High-Performance Gaussian Splatting Viewer

A web-based viewer for real-time rendering of 3D Gaussian Splatting models in the browser.

## Demo

Visit the live demo at: https://konard.github.io/high-performance-gaussian-splatting/

## Features

- Real-time rendering of 3D Gaussian Splats using WebGL
- Interactive camera controls (orbit, zoom, pan)
- Performance monitoring (FPS, splat count, load time)
- Multiple publicly available models to explore
- Responsive design for desktop and mobile

## Getting Started

### Prerequisites

- Node.js 18 or higher
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/konard/high-performance-gaussian-splatting.git
cd high-performance-gaussian-splatting

# Install dependencies
npm install

# Start the development server
npm run dev
```

### Building for Production

```bash
npm run build
```

The built files will be in the `dist` directory.

## Controls

- **Left-click + drag**: Rotate the camera
- **Scroll wheel**: Zoom in/out
- **Right-click + drag**: Pan the camera

## Project Structure

```
src/
  components/
    GaussianSplatViewer.tsx  # Main 3D viewer component
    ModelSelector.tsx        # Model dropdown selector
  data/
    models.ts                # List of available models
  App.tsx                    # Main application component
  App.css                    # Application styles
  main.tsx                   # Entry point
```

## Roadmap

See [REQUIREMENTS.md](./REQUIREMENTS.md) for the full project roadmap.

### Phase 1: Proof of Concept (Current)
- [x] Set up React.js project
- [x] Implement basic Gaussian Splatting viewer
- [x] Load and display publicly available models
- [x] Deploy to GitHub Pages

### Phase 2: Optimization (Planned)
- [ ] Implement Level of Detail (LOD) system
- [ ] Add GPU-accelerated sorting
- [ ] Implement progressive loading
- [ ] Optimize memory usage

### Phase 3: Advanced Features (Planned)
- [ ] WebGPU renderer path (with WebGL fallback)
- [ ] Rust/WASM optimization for critical paths
- [ ] Advanced culling techniques
- [ ] Streaming large scenes

## Technologies Used

- [React](https://react.dev/) - UI framework
- [Three.js](https://threejs.org/) - 3D graphics library
- [GaussianSplats3D](https://github.com/mkkellogg/GaussianSplats3D) - Gaussian Splatting renderer
- [Vite](https://vitejs.dev/) - Build tool
- [TypeScript](https://www.typescriptlang.org/) - Type safety

## References

- [Original 3D Gaussian Splatting Paper](https://repo-sam.inria.fr/fungraph/3d-gaussian-splatting/)
- [GaussianSplats3D](https://github.com/mkkellogg/GaussianSplats3D)
- [antimatter15/splat](https://github.com/antimatter15/splat)

## License

This project is released into the **public domain** under the [Unlicense](https://unlicense.org/).

See [LICENSE](./LICENSE) for the full text. You are free to use, modify, distribute, and do anything with this software without any restrictions.
