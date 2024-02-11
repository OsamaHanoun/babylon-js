import QuickHull from "quickhull3d/dist/QuickHull";
import { Point, Aggregate } from "./types.js";
import { Mesh, MeshBuilder, Vector3, VertexBuffer } from "babylonjs";

export class AggregateGenerator {
  static generate(aggregate: Aggregate): Mesh {
    const { a, b, c, numCuts } = aggregate;
    const points: any = [];

    for (let i = 0; i < numCuts; i++) {
      points.push(this.getRandomPointOnEllipsoid(a, b, c));
    }

    const quickHull = new QuickHull(points);
    quickHull.build();
    const vertices = quickHull.vertices.map((vertex: any) => vertex.point);
    const faces = quickHull.collectFaces();
    const heptagonalPrism = {
      name: crypto.randomUUID(),
      category: ["Prism"],
      vertex: vertices,
      face: faces,
    };
    const Mesh = MeshBuilder.CreatePolyhedron(crypto.randomUUID(), {
      custom: heptagonalPrism,
    });
    Mesh.rotation = this.getRandomRotation();

    return Mesh;
  }

  static calculateVolume(mesh: Mesh) {
    let vertices = mesh.getVerticesData(VertexBuffer.PositionKind);
    let indices = mesh.getIndices();
    let volume = 0;

    if (!vertices || !indices) return undefined;

    let referencePoint = Vector3.FromArray(vertices, 0);

    for (let i = 0; i < indices.length; i += 3) {
      let p1 = Vector3.FromArray(vertices, indices[i] * 3);
      let p2 = Vector3.FromArray(vertices, indices[i + 1] * 3);
      let p3 = Vector3.FromArray(vertices, indices[i + 2] * 3);

      volume += this.calculateTetrahedronVolume(referencePoint, p1, p2, p3);
    }

    return Math.abs(volume);
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

  private static getRandomRotation() {
    const degreesToRadians = (degrees: number) => degrees * (Math.PI / 180);

    return new Vector3(
      degreesToRadians(Math.random() * 360),
      degreesToRadians(Math.random() * 360),
      degreesToRadians(Math.random() * 360)
    );
  }

  private static calculateTetrahedronVolume(
    p0: Vector3,
    p1: Vector3,
    p2: Vector3,
    p3: Vector3
  ) {
    let a = p1.subtract(p0);
    let b = p2.subtract(p0);
    let c = p3.subtract(p0);

    return a.dot(b.cross(c)) / 6;
  }
}
