import type { SplatModel } from '../components/GaussianSplatViewer';

// Publicly available Gaussian Splatting models
// These models are hosted on various public servers and can be used for testing

export const AVAILABLE_MODELS: SplatModel[] = [
  {
    name: 'Bonsai',
    url: 'https://huggingface.co/cakewalk/splat-data/resolve/main/bonsai.splat',
    position: [0, 1, 0],
    rotation: [0, 0, 0, 'XYZ'],
    scale: [1.5, 1.5, 1.5],
  },
  {
    name: 'Guitar',
    url: 'https://huggingface.co/cakewalk/splat-data/resolve/main/guitar.splat',
    position: [0, 1, 0],
    rotation: [0, 0, 0, 'XYZ'],
    scale: [1.5, 1.5, 1.5],
  },
  {
    name: 'Train',
    url: 'https://huggingface.co/cakewalk/splat-data/resolve/main/train.splat',
    position: [0, 1, 0],
    rotation: [0, 0, 0, 'XYZ'],
    scale: [1.5, 1.5, 1.5],
  },
  {
    name: 'Truck',
    url: 'https://huggingface.co/cakewalk/splat-data/resolve/main/truck.splat',
    position: [0, 1, 0],
    rotation: [0, 0, 0, 'XYZ'],
    scale: [1.5, 1.5, 1.5],
  },
  {
    name: 'Nike (Antimatter15)',
    url: 'https://antimatter15.com/splat/nike.splat',
    position: [0, 0, 0],
    rotation: [0, 0, 0, 'XYZ'],
    scale: [1, 1, 1],
  },
  {
    name: 'Plush (Antimatter15)',
    url: 'https://antimatter15.com/splat/plush.splat',
    position: [0, 0, 0],
    rotation: [0, 0, 0, 'XYZ'],
    scale: [1, 1, 1],
  },
];

export default AVAILABLE_MODELS;
