export type Aggregate = {
  a: number;
  b: number;
  c: number;
  maxVolumeFriction: number;
  numCuts: number;
  count?: number;
  volume?: number;
  stl?: DataView | string;
};

export type Point = [x: number, y: number, z: number];

export type Options = {
  isNullEngine?: boolean;
  preserveDrawingBuffer: boolean;
  stencil: boolean;
  antialias: boolean;
};
