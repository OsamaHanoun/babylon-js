import { HemisphericLight, Vector3 } from "babylonjs";

export class Light {
  constructor() {
    const light = new HemisphericLight("light", new Vector3(0, 1, 0));
    light.intensity = 0.7;
  }
}
