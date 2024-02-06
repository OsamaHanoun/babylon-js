import QuickHull from "quickhull3d/dist/QuickHull";
import { Point, Aggregate } from "./types.js";
import { Mesh, MeshBuilder } from "babylonjs";

export class AggregateGenerator {
  static generate(aggregate: Aggregate): Mesh {
    const { a, b, c, numCuts } = aggregate;
    const points: any = [];

    for (let i = 0; i < numCuts; i++) {
      points.push(this.getRandomPointOnEllipsoid(a, b, c));
    }

    const hull = new QuickHull();
    hull.build(points);

    const vertices = hull.getVertices();
    const faces = hull.getFaces();

    return MeshBuilder.CreatePolyhedron(
      crypto.randomUUID(),
      {
        custom: {
          category: ["Prism"],
          vertices,
          faces,
        },
      },
      null
    );
  }

  private static getRandomPointOnEllipsoid(
    a: number,
    b: number,
    c: number
  ): Point {
    const azimuthalAngle = Math.random() * 2 * Math.PI;
    const sinPolarAngle = 2 * Math.random() - 1;
    const polarAngle = Math.asin(sinPolarAngle);
    const x = a * Math.cos(polarAngle) * Math.cos(azimuthalAngle);
    const y = b * Math.cos(polarAngle) * Math.sin(azimuthalAngle);
    const z = c * sinPolarAngle;

    return [x, y, z];
  }
}
