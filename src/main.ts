import { Mesh, SceneLoader } from "@babylonjs/core";
import "./style.css";
import { STLExport } from "@babylonjs/serializers";

// Get the canvas DOM element
const canvas = document.getElementById("renderCanvas") as HTMLCanvasElement;
canvas.width = canvas.clientWidth;
canvas.height = canvas.clientHeight;
const offscreen = canvas.transferControlToOffscreen();
let meshes: any;

// web worker
const worker = new Worker(new URL("./worker.ts", import.meta.url), {
  type: "module",
});

worker.postMessage(
  {
    messageName: "init",
    canvas: offscreen,
    height: canvas.clientHeight,
  },
  [offscreen]
);

document.getElementById("init")?.addEventListener("click", (e) => {
  disableButton(e);

  worker.postMessage(
    {
      messageName: "init",
      canvas: offscreen,
      height: canvas.clientHeight,
    },
    [offscreen]
  );
});

worker.onmessage = (e: MessageEvent<Message>) => {
  const { messageName } = e.data;

  switch (messageName) {
    case "stlFile":
      downloadSTL(e.data.stlFile);
      break;

    default:
      break;
  }
};

window.addEventListener("resize", () => {
  worker.postMessage({
    messageName: "resize",
    width: canvas.clientWidth,
    height: canvas.clientHeight,
  });
});

document.getElementById("pauseSimulation")?.addEventListener("click", () => {
  worker.postMessage({
    messageName: "pauseSimulation",
  });
});

document
  .getElementById("stopAddingAggregates")
  ?.addEventListener("click", () => {
    worker.postMessage({
      messageName: "stopAddingAggregates",
    });
  });

document
  .getElementById("presumeAddingAggregates")
  ?.addEventListener("click", () => {
    worker.postMessage({
      messageName: "presumeAddingAggregates",
    });
  });

document
  .getElementById("activatePhysicsViewer")
  ?.addEventListener("click", () => {
    worker.postMessage({
      messageName: "activatePhysicsViewer",
    });
  });

document.getElementById("download")?.addEventListener("click", () => {
  worker.postMessage({
    messageName: "pauseSimulation",
  });

  worker.postMessage({
    messageName: "getMeshes",
  });
});

function disableButton(event: Event) {
  (event.target as HTMLButtonElement).disabled = true;
}

function downloadSTL(stlFile: any) {
  const blob = new Blob([stlFile], { type: "application/octet-stream" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "sample.stl";
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(link.href), 7000);
}
