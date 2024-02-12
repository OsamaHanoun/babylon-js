import { ArcRotateCamera, Vector3 } from "babylonjs";
import { CuboidContainer } from "./cuboid-container";
import { CylinderContainer } from "./cylinder-container";

export class Camera {
  constructor(containerShape: CuboidContainer | CylinderContainer) {
    if (containerShape instanceof CuboidContainer) {
      const { width, height, depth } = containerShape;
      const camera = new ArcRotateCamera(
        "camera",
        Math.PI / 4,
        Math.PI / 4,
        20,
        new Vector3(width, height * 3, depth * 3)
      );
      new Vector3(width, height * 3, depth * 3),
        camera.setTarget(Vector3.Zero());

      //   camera.attachControl(canvas, true);
    } else if (containerShape instanceof CylinderContainer) {
      const { radius, height } = containerShape;
      const camera = new ArcRotateCamera(
        "camera",
        Math.PI / 4,
        Math.PI / 4,
        20,
        new Vector3(radius * 2, height * 3, radius * 6)
      );
      new Vector3(radius * 2, height * 3, radius * 6),
        camera.setTarget(Vector3.Zero());
    }
  }
}
