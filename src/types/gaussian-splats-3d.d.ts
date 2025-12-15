declare module '@mkkellogg/gaussian-splats-3d' {
  import { WebGLRenderer, PerspectiveCamera } from 'three';

  export enum SceneRevealMode {
    Default = 0,
    Gradual = 1,
    Instant = 2,
  }

  export interface ViewerOptions {
    cameraUp?: [number, number, number];
    initialCameraPosition?: [number, number, number];
    initialCameraLookAt?: [number, number, number];
    rootElement?: HTMLElement;
    sceneRevealMode?: SceneRevealMode;
    antialiased?: boolean;
    focalAdjustment?: number;
    dynamicScene?: boolean;
    sharedMemoryForWorkers?: boolean;
  }

  export interface SplatSceneConfig {
    path: string;
    position?: [number, number, number];
    rotation?: [number, number, number, string];
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
    dispose(): void;
  }
}
