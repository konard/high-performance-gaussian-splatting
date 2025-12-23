declare module '@mkkellogg/gaussian-splats-3d' {
  import { WebGLRenderer, PerspectiveCamera, Camera, Scene } from 'three';

  export enum SceneRevealMode {
    Default = 0,
    Gradual = 1,
    Instant = 2,
  }

  export interface ViewerOptions {
    // Camera options
    cameraUp?: [number, number, number];
    initialCameraPosition?: [number, number, number];
    initialCameraLookAt?: [number, number, number];
    camera?: Camera;

    // Renderer options - provide your own renderer to prevent DOM manipulation issues
    renderer?: WebGLRenderer;
    rootElement?: HTMLElement;

    // Scene and rendering options
    threeScene?: Scene;
    sceneRevealMode?: SceneRevealMode;
    antialiased?: boolean;
    focalAdjustment?: number;
    dynamicScene?: boolean;
    sharedMemoryForWorkers?: boolean;

    // Performance options
    ignoreDevicePixelRatio?: boolean;
    halfPrecisionCovariancesOnGPU?: boolean;
    gpuAcceleratedSort?: boolean;
    enableSIMDInSort?: boolean;
    integerBasedSort?: boolean;

    // Built-in controls
    useBuiltInControls?: boolean;

    // Self-driven mode (viewer manages its own render loop)
    selfDrivenMode?: boolean;
  }

  export interface SplatSceneConfig {
    path: string;
    position?: [number, number, number];
    // Rotation as quaternion [x, y, z, w] - identity is [0, 0, 0, 1]
    rotation?: [number, number, number, number];
    scale?: [number, number, number];
  }

  export interface SplatMesh {
    getSplatCount: () => number;
  }

  export class Viewer {
    constructor(options?: ViewerOptions);

    camera: PerspectiveCamera;
    renderer: WebGLRenderer;

    addSplatScenes(
      configs: SplatSceneConfig[],
      showLoadingUI?: boolean,
      onProgress?: (percent: number) => void
    ): Promise<void>;

    getSplatMesh(): SplatMesh | null;

    start(): void;
    stop(): void;
    dispose(): Promise<void>;

    // Force render on next frame (useful after resize)
    forceRenderNextFrame(): void;

    // Update and render methods for non-self-driven mode
    update(): void;
    render(): void;
  }
}
