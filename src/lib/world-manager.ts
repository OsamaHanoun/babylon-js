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
import { AggregateGenerator } from "./aggregate-generator";
import { shuffle } from "lodash-es";
import { CuboidContainer } from "./parts/cuboid-container";
import { Light } from "./parts/light";
import { AxisHelper } from "./parts/axis-helper";
import { Camera } from "./parts/camera";
import { CylinderContainer } from "./parts/cylinder-container";
import { BaseAggregate } from "./parts/base-aggregate";

export class WorldManager {
  private canvas?: HTMLCanvasElement;
  private engine: Engine | NullEngine;
  private isNullEngine: boolean;
  private scene?: Scene;
  private physicsEngine?: HavokPlugin;
  private width: number;
  private height: number;
  private depth: number;
  private baseAggregateArray: BaseAggregate[];
  private aggregatesTracker: string[] = [];
  // private aggregatesTracker: { id: string; count: number }[] = [];
  private maxDimension = 0;
  private grid = { x: 0, y: 0, z: 0 };
  private currentLocation = { x: 0, y: 0, z: 0 };
  private totalCount = 0;
  private totalAggregates = 0;
  private canAddAggregates = true;
  private meshToPhysicsBodyMap = new Map<PhysicsBody, Mesh>();
  private totalVolumeFraction = 0;
  private totalAggregatesVolume = 0;

  constructor(
    canvas: HTMLCanvasElement | undefined,
    isNullEngine: boolean,
    width: number,
    height: number,
    depth: number,
    aggregatesParams: BaseAggregate[]
  ) {
    this.isNullEngine = isNullEngine;
    this.canvas = canvas;
    this.width = width;
    this.height = height;
    this.depth = depth;
    this.baseAggregateArray = aggregatesParams;
    this.engine =
      this.isNullEngine || !this.canvas
        ? new NullEngine()
        : new Engine(this.canvas, true, {
            preserveDrawingBuffer: true,
            stencil: true,
          });

    this.calculateMaxDimension();
    this.calculateGrid();
    this.addCountParam();
    this.calculateTotalCount();
  }

  async run() {
    await this.createScene();
    const container = new CuboidContainer(
      this.isNullEngine,
      this.width,
      this.height,
      this.depth
    );
    // const container = new CylinderContainer(
    //   this.isNullEngine,
    //   this.width / 2,
    //   this.height
    // );

    new Camera(container);
    this.addTrigger();

    if (!this.isNullEngine && this.canvas) {
      new Light();
      new AxisHelper();
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
          const mesh = this.addAggregate();
          mesh && this.addToVolumeFraction(mesh);
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
    this.maxDimension = this.baseAggregateArray.reduce(
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
      y: Math.ceil(this.height / this.maxDimension),
      z: Math.floor(this.depth / this.maxDimension),
    };
  }

  private calculateTotalCount() {
    this.totalCount = this.baseAggregateArray.reduce(
      (count, params) => (params.count ? count + params.count : count),
      0
    );
  }

  private addCountParam() {
    const largestAggregate = this.baseAggregateArray.reduce(
      (largestAggregate, currentAggregate) => {
        const maxVolume = largestAggregate.volume ?? 0;
        const currentVolume = currentAggregate.volume ?? 0;
        return maxVolume > currentVolume ? largestAggregate : currentAggregate;
      }
    );

    if (!largestAggregate.volume) return;

    const totalVolume =
      largestAggregate.volume / largestAggregate.maxVolumeFriction;

    this.baseAggregateArray.forEach((aggregate) => {
      const { maxVolumeFriction, volume = 1 } = aggregate;
      aggregate.count = Math.round((maxVolumeFriction * totalVolume) / volume);
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
      if (event.type === PhysicsEventType.TRIGGER_EXITED) {
        countTriggerExited++;
        const mesh = this.meshToPhysicsBodyMap.get(event.collider);
        mesh && this.addToVolumeFraction(mesh);
      }

      if (totalPerLayer === countTriggerExited) {
        for (let index = 0; index < totalPerLayer; index++) {
          this.addAggregate();
        }

        countTriggerExited = 0;
      }
    });
  }

  private addToVolumeFraction(mesh: Mesh) {
    const volume = AggregateGenerator.calculateVolume(mesh);
    this.totalAggregatesVolume += volume ?? 0;
    this.totalVolumeFraction =
      (this.totalAggregatesVolume / (this.width * this.height * this.depth)) *
      100;
    console.log(this.totalVolumeFraction);
  }

  private addAggregate(): Mesh | undefined {
    // console.log(++this.totalAggregates);
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

    this.meshToPhysicsBodyMap.set(aggregateBody, aggregateMesh);

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

  // private getRandomAggregate() {
  //   if (!this.aggregatesTracker.length) {
  //     this.aggregatesTracker = this.aggregatesParams.map(
  //       ({ id, count = 0 }) => {
  //         return { id, count };
  //       }
  //     );
  //   }

  //   const randomIndex = Math.floor(
  //     Math.random() * this.aggregatesTracker.length
  //   );
  //   const { id } = this.aggregatesTracker[randomIndex];

  //   if (--this.aggregatesTracker[randomIndex].count <= 0) {
  //     this.aggregatesTracker.splice(randomIndex, 1);
  //   }

  //   return this.aggregatesParams.find((params) => params.id === id);
  // }

  private getRandomAggregate(): BaseAggregate | undefined {
    if (!this.aggregatesTracker.length) {
      this.baseAggregateArray.forEach(({ id, count = 0 }) => {
        for (let index = 0; index < count; index++) {
          this.aggregatesTracker.push(id);
        }
      });

      this.aggregatesTracker = shuffle(this.aggregatesTracker);
    }

    const randomIndex = Math.floor(
      Math.random() * this.aggregatesTracker.length
    );
    const id = this.aggregatesTracker[randomIndex];
    this.aggregatesTracker.splice(randomIndex, 1);

    return this.baseAggregateArray.find((params) => params.id === id);
  }
}
