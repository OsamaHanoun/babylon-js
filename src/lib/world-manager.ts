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
  PhysicsBody,
  PhysicsMotionType,
  PhysicsShapeConvexHull,
  PhysicsShapeBox,
  Quaternion,
  TransformNode,
  PhysicsEventType,
  Mesh,
} from "babylonjs";
import { Aggregate } from "./types";
import { AggregateGenerator } from "./aggregate-generator";

export class WorldManager {
  private canvas?: HTMLCanvasElement;
  private engine: Engine | NullEngine;
  private isNullEngine: boolean;
  private scene?: Scene;
  private physicsEngine?: HavokPlugin;
  private width: number;
  private height: number;
  private depth: number;
  private aggregatesParams: Aggregate[];
  private aggregatesTracker: { id: string; count: number }[] = [];
  private maxDimension = 0;
  private grid = { x: 0, y: 0, z: 0 };
  private currentLocation = { x: 0, y: 0, z: 0 };
  private totalCount = 0;
  private totalAggregates = 0;
  private canAddAggregates = true;

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

    this.calculateMaxDimension();
    this.calculateGrid();
    this.addVolumeParam();
    this.addCountParam();
    this.calculateTotalCount();
  }

  async run() {
    await this.createScene();
    this.addCamera();
    this.addContainer();
    this.addTrigger();

    if (!this.isNullEngine && this.canvas) {
      this.addLighting();
      this.addAxisHelper();
    }

    let frame = 1;
    this.engine.runRenderLoop(() => {
      this.scene?.render();

      if (
        this.currentLocation.y !== this.grid.y &&
        this.canAddAggregates &&
        --frame === 0
      ) {
        for (let index = 0; index < this.grid.x * this.grid.z; index++) {
          this.addAggregate();
        }
        frame = 1;
      }
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

  stopAddingAggregates() {
    this.canAddAggregates = false;
  }

  presumeAddingAggregates() {
    this.canAddAggregates = true;
  }

  private async createScene() {
    this.scene = new Scene(this.engine);
    const havokInstance = await HavokPhysics();
    this.physicsEngine = new HavokPlugin(true, havokInstance);
    this.scene.enablePhysics(new Vector3(0, -9.8, 0), this.physicsEngine);
  }

  private calculateMaxDimension() {
    this.maxDimension = this.aggregatesParams.reduce(
      (previousValue, currentValue) => {
        return Math.max(
          previousValue,
          currentValue.a,
          currentValue.b,
          currentValue.c
        );
      },
      0
    );
  }

  private calculateGrid() {
    this.grid = {
      x: Math.floor(this.width / this.maxDimension),
      y: Math.ceil(this.height / this.maxDimension) + 1,
      z: Math.floor(this.depth / this.maxDimension),
    };
  }

  private calculateTotalCount() {
    this.totalCount = this.aggregatesParams.reduce(
      (count, params) => (params.count ? count + params.count : count),
      0
    );
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

  private addTrigger() {
    if (!this.scene) return;

    const thickness = 1;
    const position = new Vector3(
      this.width / 2,
      this.height + thickness / 2,
      this.depth / 2
    );
    const dimensions = new Vector3(this.width, thickness, this.depth);

    if (!this.isNullEngine) {
      const triggerRepresentation = MeshBuilder.CreateBox("triggerMesh", {
        width: dimensions.x,
        height: dimensions.y,
        depth: dimensions.z,
      });
      triggerRepresentation.position = position;
      triggerRepresentation.material = new StandardMaterial("mat");
      triggerRepresentation.material.alpha = 0.7;
      (triggerRepresentation.material as StandardMaterial).diffuseColor =
        Color3.Red();
    }

    const triggerShape = new PhysicsShapeBox(
      position,
      new Quaternion(0, 0, 0, 1),
      dimensions,
      this.scene
    );
    triggerShape.isTrigger = true;

    const triggerTransform = new TransformNode("triggerTransform");
    const triggerBody = new PhysicsBody(
      triggerTransform,
      PhysicsMotionType.STATIC,
      false,
      this.scene
    );
    triggerBody.shape = triggerShape;
    const totalPerLayer = this.grid.x * this.grid.z;

    let countTriggerExited = 0;
    this.physicsEngine?.onTriggerCollisionObservable.add((event) => {
      let aggregateMesh: Mesh | undefined;
      if (event.type === PhysicsEventType.TRIGGER_EXITED) {
        countTriggerExited++;
      }

      if (totalPerLayer === countTriggerExited) {
        aggregateMesh === this.addAggregate();
        for (let index = 0; index < totalPerLayer; index++) {
          this.addAggregate();
        }
        countTriggerExited = 0;
      }

      // if (aggregateMesh) {
      //   aggregateMesh.position.x = event.collider.transformNode.position.x;
      //   aggregateMesh.position.z = event.collider.transformNode.position.z;
      // }
    });
  }

  private addAggregate(): Mesh | undefined {
    console.log(++this.totalAggregates);
    const aggregate = this.getRandomAggregate();

    if (!this.scene || !aggregate) return;

    const aggregateMesh = AggregateGenerator.generate(aggregate);
    aggregateMesh.position = this.getAggregatePosition();

    const aggregateBody = new PhysicsBody(
      aggregateMesh,
      PhysicsMotionType.DYNAMIC,
      false,
      this.scene
    );
    aggregateBody.shape = new PhysicsShapeConvexHull(aggregateMesh, this.scene);
    aggregateBody.shape.material = { friction: 10, restitution: 0 };

    return aggregateMesh;
  }

  private getAggregatePosition(): Vector3 {
    if (
      this.currentLocation.x >= this.grid.x - 1 &&
      this.currentLocation.z >= this.grid.z - 1
    ) {
      this.currentLocation.x = 0;
      this.currentLocation.z = 0;
      this.currentLocation.y =
        this.currentLocation.y !== this.grid.y
          ? this.currentLocation.y + 1
          : this.grid.y;
    } else if (this.currentLocation.x >= this.grid.x - 1) {
      this.currentLocation.x = 0;
      this.currentLocation.z += 1;
    } else {
      this.currentLocation.x++;
    }

    const x =
      this.currentLocation.x * this.maxDimension + 0.5 * this.maxDimension;
    const y =
      this.currentLocation.y * this.maxDimension + 0.5 * this.maxDimension;
    const z =
      this.currentLocation.z * this.maxDimension + 0.5 * this.maxDimension;

    return new Vector3(x, y, z);
  }

  private getRandomAggregate() {
    if (!this.aggregatesTracker.length) {
      this.aggregatesTracker = this.aggregatesParams.map(
        ({ id, count = 0 }) => {
          return { id, count };
        }
      );
    }

    const randomIndex = Math.floor(
      Math.random() * this.aggregatesTracker.length
    );
    const { id, count } = this.aggregatesTracker[randomIndex];

    if (--this.aggregatesTracker[randomIndex].count <= 0) {
      this.aggregatesTracker.splice(randomIndex, 1);
    }

    return this.aggregatesParams.find((params) => params.id === id);
  }
}
