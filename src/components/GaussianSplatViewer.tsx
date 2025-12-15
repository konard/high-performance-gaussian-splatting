import { useEffect, useRef, useState, useCallback } from 'react';
import * as GaussianSplats3D from '@mkkellogg/gaussian-splats-3d';
import * as THREE from 'three';

// Enable verbose logging for debugging (can be toggled via console: window.DEBUG_SPLAT_VIEWER = true)
const isDebugEnabled = () => typeof window !== 'undefined' && (window as unknown as { DEBUG_SPLAT_VIEWER?: boolean }).DEBUG_SPLAT_VIEWER === true;
const debugLog = (...args: unknown[]) => { if (isDebugEnabled()) console.log('[SplatViewer]', ...args); };

export interface SplatModel {
  name: string;
  url: string;
  position?: [number, number, number];
  rotation?: [number, number, number, string];
  scale?: [number, number, number];
}

interface GaussianSplatViewerProps {
  models: SplatModel[];
  onLoad?: () => void;
  onProgress?: (percent: number) => void;
  onError?: (error: Error) => void;
}

interface PerformanceStats {
  fps: number;
  splatCount: number;
  loadTime: number;
}

export function GaussianSplatViewer({
  models,
  onLoad,
  onProgress,
  onError,
}: GaussianSplatViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<GaussianSplats3D.Viewer | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadProgress, setLoadProgress] = useState(0);
  const [stats, setStats] = useState<PerformanceStats | null>(null);
  const [error, setError] = useState<string | null>(null);
  const frameCountRef = useRef(0);
  const lastTimeRef = useRef<number>(0);

  const updateFPS = useCallback(() => {
    frameCountRef.current++;
    const now = performance.now();

    // Initialize lastTimeRef on first call
    if (lastTimeRef.current === 0) {
      lastTimeRef.current = now;
      return;
    }

    const elapsed = now - lastTimeRef.current;

    if (elapsed >= 1000) {
      const fps = Math.round((frameCountRef.current * 1000) / elapsed);
      setStats((prev) => (prev ? { ...prev, fps } : null));
      frameCountRef.current = 0;
      lastTimeRef.current = now;
    }
  }, []);

  useEffect(() => {
    if (!containerRef.current || models.length === 0) return;

    const container = containerRef.current;
    const startTime = performance.now();
    const abortController = new AbortController();
    let viewer: GaussianSplats3D.Viewer | null = null;

    const initViewer = async () => {
      try {
        debugLog('Initializing viewer...');
        setIsLoading(true);
        setError(null);
        setLoadProgress(0);

        // Create the viewer with rootElement set to our container
        // The library will create its own renderer and add it to the container
        viewer = new GaussianSplats3D.Viewer({
          // Use standard Y-up camera orientation
          cameraUp: [0, 1, 0],
          initialCameraPosition: [0, 2, 8],
          initialCameraLookAt: [0, 0, 0],
          rootElement: container,
          // Use Instant reveal mode for immediate visibility
          sceneRevealMode: GaussianSplats3D.SceneRevealMode.Instant,
          antialiased: true,
          focalAdjustment: 1.0,
          dynamicScene: false,
          sharedMemoryForWorkers: false,
          // Disable GPU-accelerated sort to fix black screen issue on some systems
          // See: https://github.com/mkkellogg/GaussianSplats3D/issues/345
          gpuAcceleratedSort: false,
          // Enable self-driven mode so the viewer manages its own render loop
          selfDrivenMode: true,
        });
        debugLog('Viewer created');

        // Check if component was unmounted during viewer creation
        if (abortController.signal.aborted) {
          debugLog('Aborted during viewer creation');
          try { await viewer.dispose(); } catch { /* ignore */ }
          return;
        }

        // Prepare model configurations
        const modelConfigs = models.map((model) => ({
          path: model.url,
          position: model.position,
          rotation: model.rotation,
          scale: model.scale,
        }));
        debugLog('Loading models:', modelConfigs.map(m => m.path));

        // Add the splat scene(s)
        // showLoadingUI is set to false to prevent duplicate loading indicators
        // (we use our own custom loading UI instead of the library's built-in one)
        await viewer.addSplatScenes(modelConfigs, false, (percentComplete: number) => {
          if (!abortController.signal.aborted) {
            setLoadProgress(Math.round(percentComplete));
            onProgress?.(percentComplete);
          }
        });
        debugLog('Models loaded');

        // Check if component was unmounted during loading
        if (abortController.signal.aborted) {
          debugLog('Aborted after loading');
          try { await viewer.dispose(); } catch { /* ignore */ }
          return;
        }

        const loadTime = Math.round(performance.now() - startTime);

        // Get splat count from viewer if available
        let splatCount = 0;
        try {
          const splatMesh = viewer.getSplatMesh();
          if (splatMesh && typeof splatMesh.getSplatCount === 'function') {
            splatCount = splatMesh.getSplatCount();
          }
        } catch {
          // Splat count not available
        }
        debugLog('Splat count:', splatCount, 'Load time:', loadTime);

        setStats({
          fps: 0,
          splatCount,
          loadTime,
        });

        setIsLoading(false);
        onLoad?.();

        // Start the viewer only if component is still mounted
        if (!abortController.signal.aborted) {
          viewer.start();
          viewerRef.current = viewer;
          debugLog('Viewer started');

          // Add FPS monitoring via animation frame
          const animate = () => {
            if (viewerRef.current && !abortController.signal.aborted) {
              updateFPS();
              requestAnimationFrame(animate);
            }
          };
          requestAnimationFrame(animate);
        } else {
          debugLog('Aborted before start');
          try { await viewer.dispose(); } catch { /* ignore */ }
        }

      } catch (err) {
        debugLog('Error during initialization:', err);
        // Only report errors if the component is still mounted
        // (errors during unmount are expected and should be ignored)
        if (!abortController.signal.aborted) {
          const errorMessage = err instanceof Error ? err.message : 'Failed to load model';
          setError(errorMessage);
          setIsLoading(false);
          onError?.(err instanceof Error ? err : new Error(errorMessage));
        }
        // Dispose the viewer if it was created but loading failed
        if (viewer && viewer !== viewerRef.current) {
          try {
            await viewer.dispose();
          } catch (disposeErr) {
            // Ignore disposal errors during error handling
            debugLog('Error disposing viewer after failed initialization:', disposeErr);
          }
        }
      }
    };

    initViewer();

    // Cleanup function
    return () => {
      debugLog('Cleanup: aborting and disposing...');
      // Signal that the component is unmounting
      abortController.abort();

      // Dispose the viewer if it exists
      // Note: The library's dispose() may throw "removeChild" errors because
      // it tries to remove rootElement from document.body, but our rootElement
      // is inside React's component tree, not directly under document.body.
      // This error is harmless and can be safely ignored.
      if (viewerRef.current) {
        const viewerToDispose = viewerRef.current;
        viewerRef.current = null;
        viewerToDispose.dispose().catch((err) => {
          // Expected error: "Failed to execute 'removeChild' on 'Node'"
          // This occurs because the library assumes rootElement is a child of document.body
          // In React, our container is nested inside the component tree
          if (import.meta.env.DEV && isDebugEnabled()) {
            debugLog('Expected error during viewer disposal (safe to ignore):', err);
          }
        });
      }
      debugLog('Cleanup complete');
    };
  }, [models, onLoad, onProgress, onError, updateFPS]);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      if (viewerRef.current && containerRef.current) {
        const { clientWidth, clientHeight } = containerRef.current;
        const camera = viewerRef.current.camera as THREE.PerspectiveCamera;
        if (camera) {
          camera.aspect = clientWidth / clientHeight;
          camera.updateProjectionMatrix();
        }
        const renderer = viewerRef.current.renderer;
        if (renderer) {
          renderer.setSize(clientWidth, clientHeight);
        }
        // Force a re-render after resize
        viewerRef.current.forceRenderNextFrame?.();
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="viewer-container">
      <div ref={containerRef} className="viewer-canvas" />

      {isLoading && (
        <div className="loading-overlay">
          <div className="loading-content">
            <div className="loading-spinner" />
            <div className="loading-text">Loading model... {loadProgress}%</div>
            <div className="loading-bar">
              <div
                className="loading-bar-fill"
                style={{ width: `${loadProgress}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="error-overlay">
          <div className="error-content">
            <div className="error-icon">!</div>
            <div className="error-text">{error}</div>
          </div>
        </div>
      )}

      {stats && !isLoading && (
        <div className="stats-panel">
          <div className="stats-row">
            <span className="stats-label">FPS:</span>
            <span className="stats-value">{stats.fps}</span>
          </div>
          {stats.splatCount > 0 && (
            <div className="stats-row">
              <span className="stats-label">Splats:</span>
              <span className="stats-value">
                {(stats.splatCount / 1000000).toFixed(2)}M
              </span>
            </div>
          )}
          <div className="stats-row">
            <span className="stats-label">Load time:</span>
            <span className="stats-value">{(stats.loadTime / 1000).toFixed(1)}s</span>
          </div>
        </div>
      )}

      <div className="controls-hint">
        <span>Drag to rotate | Scroll to zoom | Right-click drag to pan</span>
      </div>
    </div>
  );
}

export default GaussianSplatViewer;
