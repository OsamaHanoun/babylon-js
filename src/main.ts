import "./style.css";

// Get the canvas DOM element
const canvas = document.getElementById("renderCanvas") as HTMLCanvasElement;
canvas.width = canvas.clientWidth;
canvas.height = canvas.clientHeight;
const offscreen = canvas.transferControlToOffscreen();

// web worker
const worker = new Worker(new URL("./worker.ts", import.meta.url), {
  type: "module",
});

worker.postMessage({ canvas: offscreen }, [offscreen]);

// resize
window.addEventListener("resize", () => {
  worker.postMessage({
    width: canvas.clientWidth,
    height: canvas.clientHeight,
  });
});

// document.getElementById("createSample")?.addEventListener("click", (e) => {
//   (e.target as HTMLButtonElement).disabled = true;
//   createSample();
// });
// document.getElementById("applyVortex")?.addEventListener("click", () => {
//   applyVortex();
// });

// document.getElementById("addNotch")?.addEventListener("click", () => {
//   createNotch();
// });

// document.getElementById("download")?.addEventListener("click", () => {
//   exportModel();
// });
