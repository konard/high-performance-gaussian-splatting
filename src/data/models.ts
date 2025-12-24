import type { SplatModel } from '../components/GaussianSplatViewer';

// Publicly available Gaussian Splatting models
// These models are hosted on various public servers and can be used for testing
//
// Sources:
// - dylanebert/3dgs: https://huggingface.co/datasets/dylanebert/3dgs (CC-BY-4.0)
// - cakewalk/splat-data: https://huggingface.co/cakewalk/splat-data
// - media.reshot.ai: Nike model
//
// Note: Using -7k variants for faster loading (7k iterations, smaller file size)

// 180° rotation around the X-axis to correct upside-down models
// Quaternion format: [x, y, z, w] where [1, 0, 0, 0] represents 180° around X-axis
// This fixes coordinate system mismatch between .splat files and the viewer
const FLIP_ROTATION: [number, number, number, number] = [1, 0, 0, 0];

export const AVAILABLE_MODELS: SplatModel[] = [
  {
    name: 'Garden',
    url: 'https://huggingface.co/datasets/dylanebert/3dgs/resolve/main/garden/garden-7k.splat',
    position: [0, 1, 0],
    rotation: FLIP_ROTATION,
    scale: [1.5, 1.5, 1.5],
  },
  {
    name: 'Bonsai',
    url: 'https://huggingface.co/datasets/dylanebert/3dgs/resolve/main/bonsai/bonsai-7k.splat',
    position: [0, 1, 0],
    rotation: FLIP_ROTATION,
    scale: [1.5, 1.5, 1.5],
  },
  {
    name: 'Train',
    url: 'https://huggingface.co/cakewalk/splat-data/resolve/main/train.splat',
    position: [0, 1, 0],
    rotation: FLIP_ROTATION,
    scale: [1.5, 1.5, 1.5],
  },
  {
    name: 'Truck',
    url: 'https://huggingface.co/cakewalk/splat-data/resolve/main/truck.splat',
    position: [0, 1, 0],
    rotation: FLIP_ROTATION,
    scale: [1.5, 1.5, 1.5],
  },
  {
    name: 'Nike',
    url: 'https://media.reshot.ai/models/nike_next/model.splat',
    position: [0, 0, 0],
    rotation: FLIP_ROTATION,
    scale: [1, 1, 1],
  },
  {
    name: 'Plush',
    url: 'https://huggingface.co/cakewalk/splat-data/resolve/main/plush.splat',
    position: [0, 0, 0],
    rotation: FLIP_ROTATION,
    scale: [1, 1, 1],
  },
];

export default AVAILABLE_MODELS;
