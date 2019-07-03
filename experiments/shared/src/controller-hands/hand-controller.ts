import {MeshBasicMaterial, Object3D, Quaternion, Scene, Vector2} from 'three';
import {Body, Sphere, Vec3} from "cannon";
import EventEmitter from 'events';
import {ControllerInterface} from '../web-managers/ControllerInterface';
import PhysicsHandler from '../physics/physicsHandler';

const DRAG_DISTANCE_PX = 10;

export default class HandController implements ControllerInterface {
  private gamepad: Gamepad;
  private physicsHandler: PhysicsHandler;
  private pointer: Vector2;
  private lastPointer: Vector2;
  private pointerNdc: Vector2;
  private dragDistance: number;
  private isDragging: boolean;
  private size: any;
  private wasGamepadPressed: boolean;
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

  constructor(vrGamepad: Gamepad, physicsHandler: PhysicsHandler) {
    this.gamepad = vrGamepad;
    this.physicsHandler = physicsHandler;
    this.pointer = new Vector2();
    this.lastPointer = new Vector2();
    // Position of pointer in Normalized Device Coordinates (NDC).
    this.pointerNdc = new Vector2();
    this.dragDistance = 0;
    this.isDragging = false;
    console.log('Construct hand controller: ' + this.gamepad.id);
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

      this.handBody.addShape(new Sphere(0.05), relativePosition);
    }

    this.handMesh = this.physicsHandler.addVisual(this.handBody, hand_material);
    if (isControllerVisible) {
      scene.add(this.handMesh);
      this.handMesh.receiveShadow = false;
    }
    let isRightHand = this.gamepad.id.indexOf("Right") > -1;
    this.physicsHandler.addControllerBody(this.handBody, isRightHand);
  }

  getMesh(): Object3D {
    return null;
  }

  setSize(size) {
    this.size = size;
  }

  update() {
    let numberArray = [];
    numberArray[0] = this.gamepad.pose.orientation[0];
    numberArray[1] = this.gamepad.pose.orientation[1];
    numberArray[2] = this.gamepad.pose.orientation[2];
    numberArray[3] = this.gamepad.pose.orientation[3];
    let controllerOrientation = new Quaternion().fromArray(numberArray);
    // this.handMesh.setRotationFromQuaternion(controllerOrientation);
    this.handBody.quaternion.x = this.gamepad.pose.orientation[0];
    this.handBody.quaternion.y = this.gamepad.pose.orientation[1];
    this.handBody.quaternion.z = this.gamepad.pose.orientation[2];
    this.handBody.quaternion.w = this.gamepad.pose.orientation[3];
    // this.handMesh.position.x = this.gamepad.pose.position[0];
    // this.handMesh.position.y = this.gamepad.pose.position[1];
    // this.handMesh.position.z = this.gamepad.pose.position[2];
    this.handBody.position.x = this.gamepad.pose.position[0];
    this.handBody.position.y = this.gamepad.pose.position[1]+.5;
    this.handBody.position.z = this.gamepad.pose.position[2];
  }

  getGamepadButtonPressed_() {
    for (let j = 0; j < this.gamepad.buttons.length; ++j) {
      if (this.gamepad.buttons[j].pressed) {
        return true;
      }
    }
    return false;
  }

  updatePointer_(e) {
    this.pointer.set(e.clientX, e.clientY);
    this.pointerNdc.x = (e.clientX / this.size.width) * 2 - 1;
    this.pointerNdc.y = - (e.clientY / this.size.height) * 2 + 1;
  }

  updateDragDistance_() {
    if (this.isDragging) {
      const distance = this.lastPointer.sub(this.pointer).length();
      this.dragDistance += distance;
      this.lastPointer.copy(this.pointer);

      if (this.dragDistance > DRAG_DISTANCE_PX) {
        this.controllerEventEmitter.emit('raycancel');
        this.isDragging = false;
      }
    }
  }

  startDragging_(e) {
    this.isDragging = true;
    this.lastPointer.set(e.clientX, e.clientY);
  }

  endDragging_() {
    if (this.dragDistance < DRAG_DISTANCE_PX) {
      this.controllerEventEmitter.emit('rayup');
    }
    this.dragDistance = 0;
    this.isDragging = false;
  }

  toRadians(angle) {
    return angle * (Math.PI / 180);
  }
}
