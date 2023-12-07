import "./style.css";
import HavokPhysics from "@babylonjs/havok";
import { shuffle } from "lodash-es";
import { Debug } from "babylonjs";

import { STLExport } from "@babylonjs/serializers";
import {
  Mesh,
  MeshBuilder,
  Scene,
  Engine,
  Vector3,
  HemisphericLight,
  HavokPlugin,
  PhysicsAggregate,
  PhysicsShapeType,
  Axis,
  Color3,
  StandardMaterial,
  ArcRotateCamera,
  PhysicsHelper,
} from "@babylonjs/core";

start();
async function start() {
  let meshes: Mesh[] = [];
  // Get the canvas DOM element
  const canvas = document.getElementById("renderCanvas") as HTMLCanvasElement;
  // Load the 3D engine
  const engine = new Engine(canvas, true, {
    preserveDrawingBuffer: true,
    stencil: true,
  });
  // CreateScene function that creates and return the scene
  // call the createScene function
  const scene = await createScene();

  // run the render loop
  engine.runRenderLoop(function () {
    scene.render();
  });

  // the canvas/window resize event handler
  window.addEventListener("resize", function () {
    engine.resize();
  });

  const physicsViewer = new Debug.PhysicsViewer();
  for (const mesh of scene.rootNodes) {
    //@ts-ignore
    if (mesh.physicsBody) {
      //@ts-ignore
      const debugMesh = physicsViewer.showBody(mesh.physicsBody);
    }
  }

  createCamera();
  createContainer();
  createAxisHelper();

  async function createScene() {
    // This creates a basic Babylon Scene object (non-mesh)
    const scene = new Scene(engine);

    // This creates a light, aiming 0,1,0 - to the sky (non-mesh)
    const light = new HemisphericLight("light", new Vector3(0, 1, 0), scene);

    // Default intensity is 1. Let's dim the light a small amount
    light.intensity = 0.7;

    // initialize the plugin using the HavokPlugin constructor
    const havokInstance = await HavokPhysics();
    const havokPlugin = new HavokPlugin(true, havokInstance);

    // enable physics in the scene with a gravity
    scene.enablePhysics(new Vector3(0, -9.8, 0), havokPlugin);

    return scene;
  }

  function createContainer() {
    const width = 50;
    const height = 500;
    const depth = 50;

    const ground = MeshBuilder.CreateBox(
      "ground",
      { width, height: 10, depth },
      scene
    );
    ground.position.x = width / 2;
    ground.position.z = depth / 2;
    ground.position.y = -10 / 2;

    const groundAggregate = new PhysicsAggregate(
      ground,
      PhysicsShapeType.BOX,
      { mass: 0 },
      scene
    );

    const planesData = [
      {
        id: "x-",
        position: [0, height / 2, depth / 2],
        eulerRotation: [Math.PI / 2, 0, -Math.PI / 2],
      },
      {
        id: "x+",
        position: [width, height / 2, depth / 2],
        eulerRotation: [Math.PI / 2, 0, Math.PI / 2],
      },
      // {
      //   id: "y-",
      //   position: [width / 2, 0, depth / 2],
      //   eulerRotation: [0, 0, 0],
      // },
      // {
      //   id: "y+",
      //   position: [width / 2, height, depth / 2],
      //   eulerRotation: [0, 0, 0],
      // },
      {
        id: "z-",
        position: [width / 2, height / 2, 0],
        eulerRotation: [Math.PI / 2, 0, 0],
      },
      {
        id: "z+",
        position: [width / 2, height / 2, depth],
        eulerRotation: [-Math.PI / 2, 0, 0],
      },
    ];

    // Create a material for the plane
    const material = new StandardMaterial("planeMaterial", scene);
    material.alpha = 0.2; // Set the alpha value for transparency (0 = fully transparent, 1 = fully opaque)
    material.diffuseColor = new BABYLON.Color3(0, 1, 0);
    // material.backFaceCulling = false;

    planesData.forEach(({ id, position, eulerRotation }) => {
      const plane = MeshBuilder.CreateBox(
        id,
        { width, height: 1, depth: height },
        scene
      );
      plane.material = material;
      plane.setAbsolutePosition(new Vector3(...position));
      plane.rotation.x = eulerRotation[0];
      plane.rotation.y = eulerRotation[1];
      plane.rotation.z = eulerRotation[2];
      // Create a static box shape.
      const planeAggregate = new PhysicsAggregate(
        plane,
        PhysicsShapeType.BOX,
        { mass: 0 },
        scene
      );
    });
  }

  function createNotch() {
    const ground = MeshBuilder.CreateBox(
      "ground",
      { width: 5, height: 15, depth: 50 },
      scene
    );
    ground.position.x = 25;
    ground.position.z = 25;
    ground.position.y = 5;

    const groundAggregate = new PhysicsAggregate(
      ground,
      PhysicsShapeType.BOX,
      { mass: 0 },
      scene
    );
  }

  function createCamera(): ArcRotateCamera {
    const camera = new ArcRotateCamera(
      "camera1",
      Math.PI / 4,
      Math.PI / 4,
      20,
      new Vector3(250, 300, 250),
      scene
    );

    camera.setTarget(Vector3.Zero());

    camera.wheelPrecision = 0.4;
    // Create a FreeCameraMouseWheelInput and adjust wheelPrecision
    // const mouseWheelInput = new FreeCameraMouseWheelInput();
    // mouseWheelInput.wheelPrecisionX = 1000; // Adjust this value to control zoom sensitivity
    // mouseWheelInput.wheelPrecisionY = 1000; // Adjust this value to control zoom sensitivity
    // mouseWheelInput.wheelPrecisionZ = 1000; // Adjust this value to control zoom sensitivity

    // Enable keyboard input for the camera
    camera.keysLeft = [65]; // A key
    camera.keysRight = [68]; // D key

    document.addEventListener("keydown", (event) => {
      switch (event.key) {
        case "w":
          // Move forward
          camera.position.addInPlace(
            camera.getDirection(Axis.Y).scaleInPlace(0.5)
          );
          break;
        case "s":
          // Move backward
          camera.position.subtractInPlace(
            camera.getDirection(Axis.Y).scaleInPlace(0.5)
          );
          break;
      }
    });

    // This attaches the camera to the canvas
    camera.attachControl(canvas, true);

    return camera;
  }

  function createAxisHelper() {
    // Create XYZ axis helpers
    const axisX = MeshBuilder.CreateLines(
      "axisX",
      { points: [Vector3.Zero(), new Vector3(5, 0, 0)], updatable: true },
      scene
    );
    axisX.color = new Color3(1, 0, 0); // Red

    const axisY = MeshBuilder.CreateLines(
      "axisY",
      { points: [Vector3.Zero(), new Vector3(0, 5, 0)], updatable: true },
      scene
    );
    axisY.color = new Color3(0, 1, 0); // Green

    const axisZ = MeshBuilder.CreateLines(
      "axisZ",
      { points: [Vector3.Zero(), new Vector3(0, 0, 5)], updatable: true },
      scene
    );
    axisZ.color = new Color3(0, 0, 1); // Blue
  }

  function createSample(width: number = 50, depth: number = 50) {
    const element = document.getElementById(
      "numberOfObjects"
    ) as HTMLInputElement;
    const numOfSpheres = +element.value ?? 200;
    const spheresList: Mesh[] = [];

    // Aggregate size distribution based on the provided table
    const aggregateSizes: any[] = [
      { size: 9.5, percentage: 100 },
      { size: 4.75, percentage: 90 },
      { size: 2.36, percentage: 70 },
      { size: 1.18, percentage: 30 },
      { size: 0.6, percentage: 0 },
    ];

    for (let i = 1; i < aggregateSizes.length; i++) {
      const n =
        ((aggregateSizes[i - 1].percentage - aggregateSizes[i].percentage) /
          100) *
        numOfSpheres;

      const minDiameter = aggregateSizes[i].size * 100;
      const maxDiameter = aggregateSizes[i - 1].size * 100;

      for (let j = 0; j < n; j++) {
        const diameter =
          Math.floor(
            Math.random() * (maxDiameter - minDiameter) + minDiameter
          ) / 100;
        const sphere = MeshBuilder.CreateSphere("sphere", { diameter }, scene);
        spheresList.push(sphere);
      }
    }

    const shuffledSpheres = shuffle(spheresList);
    // const shuffledSpheres = spheresList;
    meshes = spheresList;

    // Create a material for the spheres
    const material = new StandardMaterial("material", scene);
    material.diffuseColor = new Color3(0.5, 0.5, 0.5);

    let currentX = 0;
    let currentZ = 0;
    let currentY = 100;

    let counterX = 0;
    let counterZ = 0;
    let counter = 0;

    // const maxSize = Math.ceil(maxBy(aggregateSizes, "size"));
    const maxSize = Math.ceil(9.5);
    const maxPerX = Math.floor(width / maxSize);
    const maxPerZ = Math.floor(depth / maxSize);
    const maxPerLayer = maxPerX * maxPerZ;
    const numberOfLayers = Math.ceil(numOfSpheres / maxPerLayer);

    shuffledSpheres.forEach((sphere) => {
      if (counter === maxPerLayer) {
        counter = 0;
        currentY += maxSize;
        currentX = 0;
        currentZ = 0;

        counterX = 0;
        counterZ = 0;
      } else if (counterX === maxPerX) {
        currentX = 0;
        counterX = 0;
        currentZ += maxSize;
        counterZ = 0;
      }

      const radius = sphere.getBoundingInfo().boundingBox.extendSize.x;

      sphere.material = material;
      sphere.position.x = currentX + maxSize / 2;
      sphere.position.y = currentY;
      sphere.position.z = currentZ + maxSize / 2;

      new PhysicsAggregate(
        sphere,
        PhysicsShapeType.SPHERE,
        { mass: 10 * radius },
        scene
      );

      currentX += maxSize;

      counterX++;
      counter++;
    });
  }

  function applyVortex() {
    const element = document.getElementById(
      "numberOfObjects"
    ) as HTMLInputElement;
    const power = +element.value ?? 1000;

    const physicsHelper = new PhysicsHelper(scene);

    const vortexEvent = physicsHelper.vortex(new Vector3(25, 0, 25), {
      radius: 25,
      strength: power,
      height: 30,
      centripetalForceThreshold: 0.7,
      centripetalForceMultiplier: 5,
      centrifugalForceMultiplier: 0.5,
      updraftForceMultiplier: 0.02,
    });

    vortexEvent?.enable();
    setTimeout(() => vortexEvent?.disable(), 5000);
  }

  function exportModel() {
    STLExport.CreateSTL(
      [...meshes],
      true,
      "models",
      undefined,
      undefined,
      undefined,
      undefined,
      true
    );
  }
  document.getElementById("createSample")?.addEventListener("click", (e) => {
    (e.target as HTMLButtonElement).disabled = true;
    createSample();
  });
  document.getElementById("applyVortex")?.addEventListener("click", () => {
    applyVortex();
  });

  document.getElementById("addNotch")?.addEventListener("click", () => {
    createNotch();
  });

  document.getElementById("download")?.addEventListener("click", () => {
    exportModel();
  });
}
