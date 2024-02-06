import HavokPhysics from "@babylonjs/havok";
import {
  Engine,
  NullEngine,
  Scene,
  HavokPlugin,
  Vector3,
  HemisphericLight,
  MeshBuilder,
  PhysicsAggregate,
  PhysicsShapeType,
  StandardMaterial,
  Color3,
  ArcRotateCamera,
  AbstractMesh,
} from "babylonjs";
import { Aggregate } from "./types";

export class WorldManager {
  private canvas?: HTMLCanvasElement;
  private engine: Engine | NullEngine;
  private isNullEngine: boolean;
  private scene?: Scene;
  private width: number;
  private height: number;
  private depth: number;
  private aggregatesParams: Aggregate[];

  constructor(
    canvas: HTMLCanvasElement | undefined,
    isNullEngine: boolean,
    width: number,
    height: number,
    depth: number,
    aggregatesParams: Aggregate[]
  ) {
    this.isNullEngine = isNullEngine;
    this.canvas = canvas;
    this.width = width;
    this.height = height;
    this.depth = depth;
    this.aggregatesParams = aggregatesParams;
    this.engine =
      this.isNullEngine || !this.canvas
        ? new NullEngine()
        : new Engine(this.canvas, true, {
            preserveDrawingBuffer: true,
            stencil: true,
          });
  }

  async init() {
    await this.createScene();
    this.addContainer();
    this.addVolumeParam();
    this.addCountParam();

    if (!this.isNullEngine && this.canvas) {
      this.addLighting();
      this.addCamera();
      this.addAxisHelper();
    }

    this.engine.runRenderLoop(() => {
      this.scene?.render();
    });
  }

  resize(width: number, height: number) {
    if (this.canvas) {
      this.canvas.width = width;
      this.canvas.height = height;
    }
  }

  pauseSimulation() {
    // Stop the rendering loop
    this.engine.stopRenderLoop();

    // Disable the physics engine (if physics is enabled)
    if (this.scene?.isPhysicsEnabled()) {
      this.scene.disablePhysicsEngine();
    }
  }

  private async createScene() {
    this.scene = new Scene(this.engine);
    const havokInstance = await HavokPhysics();
    const havokPlugin = new HavokPlugin(true, havokInstance);
    this.scene.enablePhysics(new Vector3(0, -9.8, 0), havokPlugin);
  }

  private addLighting() {
    const light = new HemisphericLight(
      "light",
      new Vector3(0, 1, 0),
      this.scene
    );
    light.intensity = 0.7;
  }

  private addCamera() {
    const camera = new ArcRotateCamera(
      "camera1",
      Math.PI / 4,
      Math.PI / 4,
      20,
      new Vector3(this.width, this.height * 3, this.depth * 3),
      this.scene
    );
    new Vector3(this.width, this.height * 3, this.depth * 3),
      camera.setTarget(Vector3.Zero());

    camera.attachControl(this.canvas, true);
  }

  private addAxisHelper() {
    // Create XYZ axis helpers
    const axisX = MeshBuilder.CreateLines(
      "axisX",
      { points: [Vector3.Zero(), new Vector3(5, 0, 0)], updatable: true },
      this.scene
    );
    axisX.color = new Color3(1, 0, 0); // Red

    const axisY = MeshBuilder.CreateLines(
      "axisY",
      { points: [Vector3.Zero(), new Vector3(0, 5, 0)], updatable: true },
      this.scene
    );
    axisY.color = new Color3(0, 1, 0); // Green

    const axisZ = MeshBuilder.CreateLines(
      "axisZ",
      { points: [Vector3.Zero(), new Vector3(0, 0, 5)], updatable: true },
      this.scene
    );
    axisZ.color = new Color3(0, 0, 1); // Blue
  }

  private addContainer() {
    const width = this.width;
    const height = this.height * 1.5;
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
      const material = new StandardMaterial("boxMaterial", this.scene);
      material.alpha = 0.2;
      material.diffuseColor = new Color3(0, 1, 0);

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

  private addCountParam() {
    const largestAggregate = this.aggregatesParams.reduce(
      (largestAggregate, currentAggregate) => {
        const maxVolume = largestAggregate.volume ?? 0;
        const currentVolume = currentAggregate.volume ?? 0;
        return maxVolume > currentVolume ? largestAggregate : currentAggregate;
      }
    );

    if (!largestAggregate.volume) return;

    const totalVolume =
      largestAggregate.volume / largestAggregate.maxVolumeFriction;

    this.aggregatesParams.forEach((aggregate) => {
      const { maxVolumeFriction, volume = 1 } = aggregate;
      aggregate.count = Math.round((maxVolumeFriction * totalVolume) / volume);
    });
  }

  private addVolumeParam() {
    this.aggregatesParams.forEach((aggregate) => {
      const { a, b, c } = aggregate;
      aggregate.volume = (4 / 3) * Math.PI * a * b * c;
    });
  }

  private addSample() {}
}
