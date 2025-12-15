import { useEffect, useRef, useState, useCallback } from 'react';
import * as GaussianSplats3D from '@mkkellogg/gaussian-splats-3d';
import * as THREE from 'three';

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

    const initViewer = async () => {
      try {
        setIsLoading(true);
        setError(null);
        setLoadProgress(0);

        // Create the viewer
        const viewer = new GaussianSplats3D.Viewer({
          cameraUp: [0, -1, 0],
          initialCameraPosition: [0, -5, 15],
          initialCameraLookAt: [0, 0, 0],
          rootElement: container,
          sceneRevealMode: GaussianSplats3D.SceneRevealMode.Gradual,
          antialiased: true,
          focalAdjustment: 1.0,
          dynamicScene: false,
          sharedMemoryForWorkers: false,
        });

        viewerRef.current = viewer;

        // Prepare model configurations
        const modelConfigs = models.map((model) => ({
          path: model.url,
          position: model.position,
          rotation: model.rotation,
          scale: model.scale,
        }));

        // Add the splat scene(s)
        await viewer.addSplatScenes(modelConfigs, true, (percentComplete: number) => {
          setLoadProgress(Math.round(percentComplete));
          onProgress?.(percentComplete);
        });

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

        setStats({
          fps: 0,
          splatCount,
          loadTime,
        });

        setIsLoading(false);
        onLoad?.();

        // Start the viewer
        viewer.start();

        // Add FPS monitoring via animation frame
        const animate = () => {
          if (viewerRef.current) {
            updateFPS();
            requestAnimationFrame(animate);
          }
        };
        requestAnimationFrame(animate);

      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to load model';
        setError(errorMessage);
        setIsLoading(false);
        onError?.(err instanceof Error ? err : new Error(errorMessage));
      }
    };

    initViewer();

    // Cleanup function
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
