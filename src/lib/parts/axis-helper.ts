import { Color3, MeshBuilder, Vector3 } from "babylonjs";

export class AxisHelper {
  constructor() {
    const axisX = MeshBuilder.CreateLines("axisX", {
      points: [Vector3.Zero(), new Vector3(5, 0, 0)],
    });
    axisX.color = Color3.Red();

    const axisY = MeshBuilder.CreateLines("axisY", {
      points: [Vector3.Zero(), new Vector3(0, 5, 0)],
    });
    axisY.color = Color3.Black();

    const axisZ = MeshBuilder.CreateLines("axisZ", {
      points: [Vector3.Zero(), new Vector3(0, 0, 5)],
    });
    axisZ.color = Color3.Blue();
  }
}
