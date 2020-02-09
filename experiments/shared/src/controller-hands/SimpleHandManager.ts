import {Body, Sphere, Vec3} from 'cannon';
import {Camera, Material, MeshLambertMaterial, Scene} from 'three';
import Shape = CANNON.Shape;
import PhysicsHandler from '../physics/physicsHandler';

export default class BodyManager {
  private scene: Scene;
  private physicsHandler: PhysicsHandler;
  private dollPosition: Vec3;
  headInitialPosition: Vec3;
  public bodyMaterial: MeshLambertMaterial;
  public leftHand: Body;
  public rightHand: Body;
  public bodyParts = new Array<Body>();
  scale = 1;
  private color: number;

  constructor(scene: Scene, physicsHandler: PhysicsHandler) {
    this.scene = scene;
    this.physicsHandler = physicsHandler;
  }

  createSimpleHands(camera: Camera): Promise<boolean> {
    if (this.physicsHandler.rightHandController) {
      return this.createHands(new Vec3(camera.position.x, 0, camera.position.z), 1.95/2.18, 0x772277, false);
    } else {
      return this.createHands(new Vec3(0, 0, 0), 1, 0x772277, false);
    }
  }

  moveBody(position: Vec3) {
    for (let i = 0; i < this.bodyParts.length; i++) {
      let body = this.bodyParts[i];
      body.position.vadd(position, body.position);
    }
  }

  addToScene(body: Body, shape: Shape, material: Material, scene: Scene) {
    this.physicsHandler.addToScene(body, shape, null, material, scene);
    this.bodyParts.push(body);
  }

  createHands(position: Vec3, scale: number, color: number, fixedPosition: boolean): Promise<boolean> {
    this.dollPosition = position;
    return new Promise(resolve => {
      this.scale = scale;
      this.color = color;
      this.bodyMaterial = new MeshLambertMaterial({color: this.color});
      const lowerArmLength = 0.45 * this.scale,
        upperArmSize = 0.14 * this.scale,
        lowerArmSize = 0.12 * this.scale,
        neckLength = 0.1 * this.scale,
        handRadius = 0.08 * this.scale,
        headRadius = 0.15 * this.scale,
        pelvisLength = 0.4 * this.scale,
        upperLegLength = 0.5 * this.scale,
        upperLegSize = 0.15 * this.scale,
        lowerLegSize = 0.15 * this.scale,
        lowerLegLength = 0.5 * this.scale;

      return this.addArms().then(() => {
        resolve(true);
      });
    });
  }

  private addArms(): Promise<boolean> {
    return new Promise(resolve => {
      const shouldersDistance = 0.5 * this.scale,
        upperArmLength = 0.45 * this.scale,
        lowerArmLength = 0.45 * this.scale,
        upperArmSize = 0.14 * this.scale,
        lowerArmSize = 0.12 * this.scale,
        handRadius = 0.08 * this.scale,
        upperBodyLength = 0.6 * this.scale;

      let handShape = new Sphere(handRadius);

      const positionRightHand = new Vec3(handRadius, 1, 0);
      let rightHand = new Body({mass: 1, position: positionRightHand,});
      this.addToScene(rightHand, handShape, this.bodyMaterial, this.scene);
      this.rightHand = rightHand;

      const positionLeftHand = new Vec3( handRadius, 1, 0);
      let leftHand = new Body({mass: 1, position: positionLeftHand,});
      this.addToScene(leftHand, handShape, this.bodyMaterial, this.scene);
      this.leftHand = leftHand;

      resolve(true);
    })
  }
}
