declare module "quickhull3d/dist/QuickHull" {
  export default class QuickHull3D {
    // Declare the methods and properties you use
    constructor();
    build(points: { x: number; y: number; z: number }[]): void;
    getVertices(): { x: number; y: number; z: number }[];
    getFaces(): number[][];
  }
}
