import {MeshBasicMaterial, Object3D, Scene, Vector2} from 'three';
import {Body, Sphere, Vec3} from "cannon";
import {EventEmitter} from 'events';
import {ControllerInterface} from '../web-managers/ControllerInterface';
import PhysicsHandler from '../physics/physicsHandler';
import {XRFrameOfReference, XRInputSource, XRReferenceSpace} from '../WebXRDeviceAPI';

export default class HandController implements ControllerInterface {
  private inputSource: XRInputSource;
  private physicsHandler: PhysicsHandler;
  private pointer: Vector2;
  private lastPointer: Vector2;
  private pointerNdc: Vector2;
  private dragDistance: number;
  private isDragging: boolean;
  private size: any;
  private wasPressed2: boolean;
  public controllerEventEmitter = new EventEmitter();
  private handMesh: Object3D;
  private handBody: Body;

  private handSettings = {
    throwAngleStep: (Math.PI/16)/1, // Math.PI/4,
    throwAngleStart: 0.221, // Math.PI/2 + Math.PI/4,
    throwAngleStop: -(Math.PI+Math.PI/4), // -2.423, // -Math.PI,
    handRadius: .15, // 0.15,
    fingerTips: 7, // 4,
    fingerTipSize: 0.019 // 0.01
  };

  constructor(inputSource: XRInputSource, physicsHandler: PhysicsHandler) {
    this.inputSource = inputSource;
    this.physicsHandler = physicsHandler;
    this.pointer = new Vector2();
    this.lastPointer = new Vector2();
    // Position of pointer in Normalized Device Coordinates (NDC).
    this.pointerNdc = new Vector2();
    this.dragDistance = 0;
    this.isDragging = false;
    console.log('Construct hand controller: ' + this.inputSource.handedness);
  }

  addCameraAndControllerToScene(scene: Scene, isControllerVisible: Boolean): Promise<boolean> {
    return new Promise( resolve => {
      this.addFingerTips(scene, isControllerVisible);
      resolve(true);
    })
  }

  addFingerTips(scene: Scene, isControllerVisible: Boolean) {
    let hand_material = new MeshBasicMaterial({
      color: 0xFF3333,
    });
    const Ncols = 5;
    const angle = 360 / Ncols;
    this.handBody = new Body({
      mass: 0,
      material: this.physicsHandler.handMaterial
    });
    for(let i=0; i<Ncols; i++){
      let radians = this.toRadians(angle * i);
      let rowRadius = this.handSettings.handRadius;

      let relativePosition = new Vec3(
        rowRadius * Math.sin(radians),
        0,
        rowRadius * Math.cos(radians)
      );

      this.handBody.addShape(new Sphere(0.03), relativePosition);
    }

    this.physicsHandler.addVisual(this.handBody, hand_material)
      .then(mesh => {
        this.handMesh = mesh
        if (isControllerVisible) {
          scene.add(this.handMesh);
          this.handMesh.receiveShadow = false;
        }
      });
    let isRightHand = this.inputSource.handedness === 'right';
    this.physicsHandler.addControllerBody(this.handBody, isRightHand);
  }

  getMesh(): Object3D {
    return null;
  }

  setSize(size) {
    this.size = size;
  }

  isPressed() {
    this.wasPressed2 = true;
  }

  wasPressed(): Boolean {
    return this.wasPressed2;
  }

  reset() {
    this.wasPressed2 = false;
  }

  update(frame: XRFrameOfReference, refSpace: XRReferenceSpace) {
    // @ts-ignore
    if (this.inputSource.gripSpace) {
      // @ts-ignore
      let gripPose = frame.getPose(this.inputSource.gripSpace, refSpace);
      if (gripPose) {
        const orientation = gripPose.transform.orientation;
        const position = gripPose.transform.position;
        this.handBody.quaternion.w = orientation.w;
        this.handBody.quaternion.x = orientation.x;
        this.handBody.quaternion.y = orientation.y;
        this.handBody.quaternion.z = orientation.z;
        this.handBody.position.x = position.x;
        this.handBody.position.y = position.y;
        this.handBody.position.z = position.z;
      }
    }
  }

  toRadians(angle) {
    return angle * (Math.PI / 180);
  }
}
