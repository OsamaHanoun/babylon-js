import {
  Color3,
  MeshBuilder,
  PhysicsAggregate,
  PhysicsShapeType,
  StandardMaterial,
  Vector3,
} from "babylonjs";

export class CuboidContainer {
  private isNullEngine: boolean;
  readonly width: number;
  readonly height: number;
  readonly depth: number;

  constructor(
    isNullEngine: boolean,
    width: number,
    height: number,
    depth: number
  ) {
    this.isNullEngine = isNullEngine;
    this.width = width;
    this.height = height;
    this.depth = depth;

    this.addContainer();
  }

  private addContainer() {
    const width = this.width;
    const height = this.height * 1.25;
    const depth = this.depth;
    const thickness = 1;

    const wallsData = [
      {
        id: "x-",
        position: new Vector3(-thickness / 2, height / 2, depth / 2),
        dimX: thickness,
        dimY: height,
        dimZ: depth,
      },
      {
        id: "x+",
        position: new Vector3(width + thickness / 2, height / 2, depth / 2),
        dimX: thickness,
        dimY: height,
        dimZ: depth,
      },
      {
        id: "y-",
        position: new Vector3(width / 2, -thickness / 2, depth / 2),
        dimX: width,
        dimY: thickness,
        dimZ: depth,
      },
      {
        id: "z-",
        position: new Vector3(width / 2, height / 2, -thickness / 2),
        dimX: width,
        dimY: height,
        dimZ: thickness,
      },
      {
        id: "z+",
        position: new Vector3(width / 2, height / 2, depth + thickness / 2),
        dimX: width,
        dimY: height,
        dimZ: thickness,
      },
    ];

    const box = MeshBuilder.CreateBox("box", {
      height: 1,
      width: 1,
      depth: 1,
      updatable: true,
    });

    if (!this.isNullEngine) {
      const material = new StandardMaterial("boxMaterial");
      material.alpha = 0.2;
      material.diffuseColor = Color3.Green();

      box.material = material;
    }

    wallsData.forEach(({ dimX, dimY, dimZ, position }) => {
      const boxClone = box.clone("box");
      boxClone.scaling = new Vector3(dimX, dimY, dimZ);
      boxClone.position = position;
      new PhysicsAggregate(boxClone, PhysicsShapeType.BOX, { mass: 0 });
    });

    box.dispose();
  }
}
