import { max, maxBy, shuffle } from "lodash-es";
import { STLExport } from "@babylonjs/serializers";
import HavokPhysics from "@babylonjs/havok";
import { Debug, PhysicsShapeConvexHull, PhysicsViewer } from "babylonjs";
import { STLFileLoader } from "babylonjs-loaders";
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
  Color3,
  StandardMaterial,
  ArcRotateCamera,
  PhysicsHelper,
  NullEngine,
  SceneLoader,
  AbstractMesh,
  PhysicsBody,
  PhysicsShapeMesh,
  PhysicsMotionType,
} from "babylonjs";

let engine: Engine;
let canvas: HTMLCanvasElement;
let scene: Scene;
let isNullEngine = false;
let sample: AbstractMesh[];
let physicsViewer: PhysicsViewer;

onmessage = function (evt: MessageEvent<Message>) {
  const { messageName } = evt.data;

  switch (messageName) {
    case "init":
      init(evt.data);
      break;

    case "resize":
      resize(evt.data);
      break;

    case "createSample":
      createSample(evt.data.nBodies);
      break;

    case "applyVortex":
      applyVortex(evt.data.power);
      break;

    case "addNotch":
      createNotch();
      break;

    case "getMeshes":
      getMeshes();
      break;

    case "pauseSimulation":
      pauseSimulation();
      break;

    case "destroySceneAndEngine":
      destroySceneAndEngine();
      break;

    case "activatePhysicsViewer":
      activatePhysicsViewer();
      break;

    default:
      break;
  }
};

async function init(msg: Message) {
  if (msg.canvas) {
    canvas = msg.canvas;
    isNullEngine = msg.engineType === "nullEngine";
    engine = isNullEngine
      ? new NullEngine()
      : new Engine(canvas, true, {
          preserveDrawingBuffer: true,
          stencil: true,
        });
  }

  scene = await createScene();
  physicsViewer = new Debug.PhysicsViewer(scene);

  engine.runRenderLoop(function () {
    scene.render();
  });

  createContainer();
  createCamera();
  createAxisHelper();
}

function resize(msg: Message) {
  if (canvas) {
    const { width, height } = msg;
    canvas.width = width;
    canvas.height = height;
  }
}

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
  const height = 2000;
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
  material.diffuseColor = new Color3(0, 1, 0);
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
  new Vector3(250, 300, 250), camera.setTarget(Vector3.Zero());

  camera.wheelPrecision = 0.4;
  // Create a FreeCameraMouseWheelInput and adjust wheelPrecision
  // const mouseWheelInput = new FreeCameraMouseWheelInput();
  // mouseWheelInput.wheelPrecisionX = 1000; // Adjust this value to control zoom sensitivity
  // mouseWheelInput.wheelPrecisionY = 1000; // Adjust this value to control zoom sensitivity
  // mouseWheelInput.wheelPrecisionZ = 1000; // Adjust this value to control zoom sensitivity

  // Enable keyboard input for the camera
  camera.keysLeft = [65]; // A key
  camera.keysRight = [68]; // D key
  /*
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

   */

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

async function createSample(
  numOfSpheres = 500,
  width: number = 50,
  depth: number = 50
) {
  const spheresList: AbstractMesh[] = [];

  // Aggregate size distribution based on the provided table
  const aggregateSizes: any[] = [
    { size: 9.5, percentage: 100 },
    { size: 4.75, percentage: 90 },
    { size: 2.36, percentage: 70 },
    { size: 1.18, percentage: 30 },
    { size: 0.6, percentage: 0 },
  ];

  const modelUrl = new URL("/", import.meta.url).href;
  SceneLoader.RegisterPlugin(new STLFileLoader());

  const loader = SceneLoader.ImportMeshAsync(
    "",
    modelUrl,
    "Bodacious Bombul.stl",
    scene,
    undefined,
    undefined,
    ".stl"
  );

  const results = await loader;
  let baseMesh;

  if (results.meshes[0]) {
    baseMesh = results.meshes[0];
    baseMesh.position.set(0, 0, 0);
    const scale = 0.04 * 3 * 10;
    baseMesh.normalizeToUnitCube();
  } else return;

  for (let i = 1; i < aggregateSizes.length; i++) {
    const n =
      ((aggregateSizes[i - 1].percentage - aggregateSizes[i].percentage) /
        100) *
      numOfSpheres;

    for (let j = 0; j < n; j++) {
      const mesh = (baseMesh as Mesh).createInstance(
        aggregateSizes[i].size + "-" + j
      );

      if (mesh) {
        mesh.clone(aggregateSizes[i] + "-" + j);
        const scale = aggregateSizes[i].size * 0.04;
        mesh.scaling = new Vector3(scale, scale, scale);
        spheresList.push(mesh);
      }
    }
  }

  baseMesh.isVisible = false;

  const shuffledSpheres = shuffle(spheresList);
  // const shuffledSpheres = spheresList;
  sample = [...spheresList];

  const boundingInfo = spheresList[0].getBoundingInfo();
  const dim = boundingInfo.maximum.subtract(boundingInfo.minimum).asArray();
  const maxSize = (max(dim) ?? 10) * 0.04 * 3;

  let currentX = 0;
  let currentZ = 0;
  let currentY = 100;

  let counterX = 0;
  let counterZ = 0;
  let counter = 0;

  // const maxSize = Math.ceil(maxBy(aggregateSizes, "size").size);
  const maxPerX = Math.floor(width / maxSize);
  const maxPerZ = Math.floor(depth / maxSize);
  const maxPerLayer = maxPerX * maxPerZ;

  shuffledSpheres.forEach((mesh) => {
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

    mesh.position.x = currentX + maxSize / 2;
    mesh.position.y = currentY;
    mesh.position.z = currentZ + maxSize / 2;

    const body = new PhysicsBody(mesh, PhysicsMotionType.DYNAMIC, false, scene);
    body.shape = new PhysicsShapeConvexHull(mesh as Mesh, scene);
    body.shape.material = { friction: 10, restitution: 0 };

    body.setMassProperties({
      mass: 10 * mesh.getBoundingInfo().boundingBox.extendSize.x,
    });

    currentX += maxSize;

    counterX++;
    counter++;
  });
  console.log(sample.length);
}

function applyVortex(power: number) {
  const physicsHelper = new PhysicsHelper(scene);

  const vortexEvent = physicsHelper.vortex(new Vector3(25, 0, 25), {
    radius: 25,
    strength: power,
    height: 50,
    centripetalForceThreshold: 0.7,
    centripetalForceMultiplier: 5,
    centrifugalForceMultiplier: 0.5,
    updraftForceMultiplier: 0.02,
  });

  vortexEvent?.enable();
  setTimeout(() => vortexEvent?.disable(), 5000);
}

function pauseSimulation() {
  // Stop the rendering loop
  engine.stopRenderLoop();

  // Disable the physics engine (if physics is enabled)
  if (scene.isPhysicsEnabled()) {
    scene.disablePhysicsEngine();
  }
}

function destroySceneAndEngine() {
  // Dispose of the scene, which will also dispose of the meshes
  scene.dispose();

  // Stop the engine
  engine.stopRenderLoop();

  // Dispose of the engine
  // engine.dispose();
}

function activatePhysicsViewer() {
  sample.forEach((mesh) => {
    if (mesh.physicsBody) {
      physicsViewer.showBody(mesh.physicsBody);
    }
  });
}

function getMeshes() {
  const stlFile = STLExport.CreateSTL(
    //@ts-ignore
    sample,
    false,
    "models",
    false,
    false,
    true,
    true,
    true
  );
  postMessage({ messageName: "stlFile", stlFile });
}
