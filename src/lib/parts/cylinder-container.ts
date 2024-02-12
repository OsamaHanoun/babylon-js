import {
  Color3,
  MeshBuilder,
  PhysicsAggregate,
  PhysicsShapeType,
  StandardMaterial,
  Vector3,
} from "babylonjs";

export class CylinderContainer {
  private isNullEngine: boolean;
  readonly radius: number;
  readonly height: number;

  constructor(isNullEngine: boolean, radius: number, height: number) {
    this.isNullEngine = isNullEngine;
    this.radius = radius;
    this.height = height;

    this.addContainer();
  }

  private addContainer() {
    const radius = this.radius;
    const diameter = 2 * this.radius;
    const height = this.height * 1.25;
    const thickness = 1;
    const horizontalShift = thickness / 2 + radius;
    const verticalShift = height / 2;
    const center = new Vector3(horizontalShift, verticalShift, horizontalShift);
    const cuboidWidth = radius / 2;
    const circumference = 2 * Math.PI * radius;
    const numberOfCuboids = Math.ceil(circumference / cuboidWidth);

    const groundMesh = MeshBuilder.CreateBox("ground", {
      width: diameter + thickness,
      height: thickness,
      depth: diameter + thickness,
    });
    groundMesh.position = new Vector3(
      horizontalShift,
      -thickness,
      horizontalShift
    );
    new PhysicsAggregate(groundMesh, PhysicsShapeType.BOX, {
      mass: 0,
    });

    const cuboidMesh = MeshBuilder.CreateBox("cuboid", {
      width: cuboidWidth,
      height,
      depth: thickness,
    });

    if (!this.isNullEngine) {
      const material = new StandardMaterial("boxMaterial");
      material.alpha = 0.2;
      material.diffuseColor = Color3.Green();
      cuboidMesh.material = material;
      groundMesh.material = material;
    }

    for (let i = 0; i < numberOfCuboids; i++) {
      const wall = cuboidMesh.clone("cuboid");
      const angle = ((Math.PI * 2) / numberOfCuboids) * i;

      wall.position.x = Math.cos(angle) * radius + horizontalShift;
      wall.position.y = verticalShift; // Set y position to 0
      wall.position.z = Math.sin(angle) * radius + horizontalShift;
      wall.lookAt(center);

      new PhysicsAggregate(wall, PhysicsShapeType.BOX, {
        mass: 0,
      }).body;
    }

    cuboidMesh.dispose();
  }
}
