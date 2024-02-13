export class BaseAggregate {
  private _id: string;
  private _a: number;
  private _b: number;
  private _c: number;
  private _maxVolumeFriction: number;
  private _numCuts: number;
  private _volume: number;
  public count?: number;

  public get id() {
    return this._id;
  }
  public get a() {
    return this._a;
  }
  public get b() {
    return this._b;
  }
  public get c() {
    return this._c;
  }
  public get maxVolumeFriction() {
    return this._maxVolumeFriction;
  }
  public get numCuts() {
    return this._numCuts;
  }
  public get volume() {
    return this._volume;
  }

  constructor(
    id: string,
    a: number,
    b: number,
    c: number,
    maxVolumeFriction: number,
    numCuts: number
  ) {
    this._id = id;
    this._a = a;
    this._b = b;
    this._c = c;
    this._maxVolumeFriction = maxVolumeFriction;
    this._numCuts = numCuts;
    this._volume = this.calculateVolume();
  }

  private calculateVolume(): number {
    return (4 / 3) * Math.PI * this._a * this._b * this._c;
  }
}
