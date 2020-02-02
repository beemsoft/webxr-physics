import {
  DirectionalLight,
  HemisphereLight,
  Mesh,
  MeshBasicMaterial,
  PerspectiveCamera,
  PlaneGeometry,
  Scene
} from 'three';
import {Body, Plane, Vec3} from 'cannon';
import PhysicsHandler from '../../../shared/src/physics/physicsHandler';
import ConstraintManager from '../../../shared/src/physics/ConstraintManager';
import DebugParams from './debug/DebugParams';
import DanceManager from './dance/DanceManager';
import {ControllerInterface} from '../../../shared/src/web-managers/ControllerInterface';
import BodyManager from '../../../shared/src/scene/human/bodyManager';
import {SceneWithControllers} from '../../../shared/src/scene/SceneWithControllers';

const HEAD = "head";
const LEFT_HAND = "leftHand";
const RIGHT_HAND = "rightHand";
const LEFT_FOOT = "leftFoot";
const RIGHT_FOOT = "rightFoot";
const HEAD2 = "head2";
const LEFT_HAND2 = "leftHand2";
const RIGHT_HAND2 = "rightHand2";
const LEFT_FOOT2 = "leftFoot2";
const RIGHT_FOOT2 = "rightFoot2";
const LEFT_SHOULDER = "leftShoulder";
const RIGHT_SHOULDER = "rightShoulder";
const LEFT_SHOULDER2 = "leftShoulder2";
const RIGHT_SHOULDER2 = "rightShoulder2";
const FOOT_OFFSET = 0.25;
const HAND_AUTO_HOLD_DISTANCE = 0.3;

export default class SceneManager implements SceneWithControllers {
  private scene: Scene;
  private camera: PerspectiveCamera;
  private physicsHandler: PhysicsHandler;
  constraintManager: ConstraintManager;
  private bodyManager1: BodyManager;
  private bodyManager2: BodyManager;
  private params: DebugParams;
  leftHandReleased: boolean;
  rightHandReleased: boolean;
  private controllerL: ControllerInterface;
  private controllerR: ControllerInterface;
  private isLeftHandHoldingLeftHand: boolean;
  private isLeftHandHoldingRightHand: boolean;
  private isRightHandHoldingLeftHand: boolean;
  private isRightHandHoldingRightHand: boolean;
  private danceManager: DanceManager;

  build(camera: PerspectiveCamera, scene: Scene, maxAnisotropy: number, physicsHandler: PhysicsHandler) {
    this.scene = scene;
    this.camera = camera;
    this.physicsHandler = physicsHandler;
    this.constraintManager = new ConstraintManager(physicsHandler);
    this.bodyManager1 = new BodyManager(scene, physicsHandler);
    this.bodyManager2 = new BodyManager(scene, physicsHandler);
    this.physicsHandler.dt = 1/180;
    this.physicsHandler.world.gravity.set(0, -9.8,0);
    let light = new DirectionalLight(0xFFFFFF, 1);
    light.position.set(1, 10, -0.5);
    this.scene.add(light);
    this.scene.add(new HemisphereLight(0x909090, 0x404040));
    this.addFloor();

    if (this.physicsHandler.rightHandController) {
      this.bodyManager1.createRagdoll(new Vec3(this.camera.position.x, 0, this.camera.position.z), 0.7, 0x772277, false);
      this.bodyManager2.createRagdoll(new Vec3(0, 0.01, this.camera.position.z - 1), 0.6, 0x345522, false);
    } else {
      this.bodyManager1.createRagdoll(new Vec3(0, 0.01, 0), 1, 0x772277, false)
        .then(() => {
          this.bodyManager1.moveBody(new Vec3(0, 0, -1));
          this.constraintManager.addPointerConstraintToBody(HEAD, this.bodyManager1.headBody, 1);
          this.constraintManager.addPointerConstraintToBody(LEFT_HAND, this.bodyManager1.leftHand, 1);
          this.constraintManager.addPointerConstraintToBody(RIGHT_HAND, this.bodyManager1.rightHand, 1);
          this.constraintManager.addPointerConstraintToBody(LEFT_FOOT, this.bodyManager1.leftFoot, 1);
          this.constraintManager.addPointerConstraintToBody(RIGHT_FOOT, this.bodyManager1.rightFoot, 1);
          this.constraintManager.addConeTwistConstraint(LEFT_SHOULDER, this.bodyManager1.upperBody, this.bodyManager1.upperLeftArm
            , this.bodyManager1.getLeftShoulderPivotA(), this.bodyManager1.getLeftShoulderPivotB());
          this.constraintManager.addConeTwistConstraint(RIGHT_SHOULDER, this.bodyManager1.upperBody, this.bodyManager1.upperRightArm
            , this.bodyManager1.getRightShoulderPivotA(), this.bodyManager1.getRightShoulderPivotB());
          this.bodyManager2.createRagdoll(new Vec3(0, 0.01, 0.5), 0.8, 0x345522, false)
            .then(() => {
              this.constraintManager.addPointerConstraintToBody(LEFT_FOOT2, this.bodyManager2.leftFoot, 1);
              this.constraintManager.addPointerConstraintToBody(RIGHT_FOOT2, this.bodyManager2.rightFoot, 1);
              this.constraintManager.addPointerConstraintToBody(HEAD2, this.bodyManager2.headBody, 1);
              this.addShoulderConstraints();

              this.params = new DebugParams(this, this.bodyManager1, this.bodyManager2);
              this.params.buildGui();

              this.danceManager = new DanceManager(this.bodyManager2);
            });
        });
    }
  }

  addRightController(controller: ControllerInterface) {
    this.controllerR = controller;
  }

  addLeftController(controller: ControllerInterface) {
    this.controllerL = controller;
  }

  private addShoulderConstraints() {
    this.constraintManager.addConeTwistConstraint(LEFT_SHOULDER2, this.bodyManager2.upperBody, this.bodyManager2.upperLeftArm
      , this.bodyManager2.getLeftShoulderPivotA(), this.bodyManager2.getLeftShoulderPivotB());
    this.constraintManager.addConeTwistConstraint(RIGHT_SHOULDER2, this.bodyManager2.upperBody, this.bodyManager2.upperRightArm
      , this.bodyManager2.getRightShoulderPivotA(), this.bodyManager2.getRightShoulderPivotB());
  }

  addFloor() {
    let mesh = new Mesh(new PlaneGeometry(28, 15, 1, 1), new MeshBasicMaterial());
    let floorBody = new Body({ mass: 0});
    floorBody.quaternion.setFromAxisAngle(new Vec3(1, 0, 0), Math.PI / -2);
    floorBody.addShape(new Plane());
    floorBody.position.y -= 2;
    this.physicsHandler.addBody(floorBody);
    this.physicsHandler.addMesh(mesh);
  }

  releaseLeftHand() {
    this.constraintManager.removeJointConstraint(LEFT_HAND2);
    this.leftHandReleased = true;
    this.isLeftHandHoldingLeftHand = false;
    this.isLeftHandHoldingRightHand = false;
  }

  releaseRightHand() {
    this.constraintManager.removeJointConstraint(RIGHT_HAND2);
    this.rightHandReleased = true;
    this.isRightHandHoldingRightHand = false;
    this.isRightHandHoldingLeftHand = false;
  }

  update() {
    if (this.danceManager) {
      this.danceManager.handleBasicTurn();
    }
    if (this.physicsHandler.rightHandController) {
      this.handleReleasingHands();
      this.handleHoldingHands();
      this.moveBody1();
      this.moveBody2();
    } else if (this.params) {
      this.handleHoldingHands();
      this.moveBodiesInDebugMode();
    }
  }

  private moveBodiesInDebugMode() {
    this.constraintManager.moveJointToPoint(HEAD,
      this.params.headX,
      this.params.headY,
      this.params.headZ);
    this.constraintManager.moveJointToPoint(LEFT_HAND,
      this.params.leftHandX,
      this.params.leftHandY,
      this.params.leftHandZ);
    this.constraintManager.moveJointToPoint(RIGHT_HAND,
      this.params.rightHandX,
      this.params.rightHandY,
      this.params.rightHandZ);
    this.constraintManager.moveJointToPoint(LEFT_FOOT,
      this.params.headX - FOOT_OFFSET * this.bodyManager1.scale,
      -1.9,
      this.params.headZ);
    this.constraintManager.moveJointToPoint(RIGHT_FOOT,
      this.params.headX + FOOT_OFFSET * this.bodyManager1.scale,
      -1.9,
      this.params.headZ);
    this.constraintManager.moveJointToPoint(LEFT_FOOT2,
      this.danceManager.leftFootPosition.x,
      -1.9,
      this.danceManager.leftFootPosition.z);
    this.constraintManager.moveJointToPoint(RIGHT_FOOT2,
      this.danceManager.rightFootPosition.x,
      -1.9,
      this.danceManager.rightFootPosition.z);

    this.constraintManager.moveJointToPoint(HEAD2,
      this.bodyManager2.headInitialPosition.x,
      this.bodyManager2.headInitialPosition.y,
      this.bodyManager2.headInitialPosition.z);
    this.bodyManager2.upperBody.quaternion.setFromAxisAngle(new Vec3(0, 1, 0), this.params.rotationUpperBody);
    this.constraintManager.namedConstraints[RIGHT_SHOULDER2].update();
    this.constraintManager.namedConstraints[LEFT_SHOULDER2].update();
  }

  private moveBody2() {
    this.constraintManager.moveJointToPoint(HEAD2,
      this.bodyManager2.headInitialPosition.x,
      this.bodyManager2.headInitialPosition.y,
      this.bodyManager2.headInitialPosition.z);
    this.constraintManager.moveJointToPoint(LEFT_FOOT2,
      this.danceManager.leftFootPosition.x,
      0,
      this.danceManager.leftFootPosition.z);
    this.constraintManager.moveJointToPoint(RIGHT_FOOT2,
      this.danceManager.rightFootPosition.x,
      0,
      this.danceManager.rightFootPosition.z);
  }

  private moveBody1() {
    this.constraintManager.moveJointToPoint(HEAD,
      (this.camera.position.x * this.bodyManager1.scale) * 2,
      ((this.camera.position.y) * this.bodyManager1.scale) * 2,
      (this.camera.position.z * this.bodyManager1.scale) * 2);
    this.constraintManager.moveJointToPoint(RIGHT_HAND,
      (this.physicsHandler.rightHandController.position.x * this.bodyManager1.scale) * 2,
      ((this.physicsHandler.rightHandController.position.y) * this.bodyManager1.scale) * 2,
      (this.physicsHandler.rightHandController.position.z * this.bodyManager1.scale) * 2);

    this.constraintManager.moveJointToPoint(LEFT_HAND,
      (this.physicsHandler.leftHandController.position.x * this.bodyManager1.scale) * 2,
      ((this.physicsHandler.leftHandController.position.y) * this.bodyManager1.scale) * 2,
      (this.physicsHandler.leftHandController.position.z * this.bodyManager1.scale) * 2);
    this.constraintManager.moveJointToPoint(LEFT_FOOT,
      this.camera.position.x - FOOT_OFFSET * this.bodyManager1.scale,
      0,
      this.camera.position.z * this.bodyManager1.scale);
    this.constraintManager.moveJointToPoint(RIGHT_FOOT,
      this.camera.position.x + FOOT_OFFSET * this.bodyManager1.scale,
      0,
      this.camera.position.z * this.bodyManager1.scale);
  }

  private handleReleasingHands() {
    let isRightHand = this.controllerR.wasPressed();
    let isLeftHand = this.controllerL.wasPressed();
    if (!this.rightHandReleased) {
      if (isRightHand && this.isRightHandHoldingRightHand) {
        this.releaseRightHand();
        this.controllerR.reset();
      }
      if (isLeftHand && this.isRightHandHoldingLeftHand) {
        this.releaseRightHand();
        this.controllerL.reset();
      }
    }
    if (!this.leftHandReleased) {
      if (isRightHand && this.isLeftHandHoldingRightHand) {
        this.releaseLeftHand();
        this.controllerR.reset();
      }
      if (isLeftHand && this.isLeftHandHoldingLeftHand) {
        this.releaseLeftHand();
        this.controllerL.reset();
      }
    }
  }

  private handleHoldingHands() {
    if (this.leftHandReleased == true && this.bodyManager1.leftHand.position.distanceTo(this.bodyManager2.leftHand.position) > HAND_AUTO_HOLD_DISTANCE &&
      (this.bodyManager1.rightHand.position.distanceTo(this.bodyManager2.leftHand.position) > HAND_AUTO_HOLD_DISTANCE)) {
      this.leftHandReleased = false;
    }
    if (!this.leftHandReleased && this.constraintManager.namedConstraints[LEFT_HAND2] == null) {
      if (this.bodyManager1.leftHand.position.distanceTo(this.bodyManager2.leftHand.position) < HAND_AUTO_HOLD_DISTANCE) {
        this.constraintManager.addConstraintToBody(LEFT_HAND2, this.bodyManager2.leftHand, this.bodyManager1.leftHand, 1);
        this.isLeftHandHoldingLeftHand = true;
      } else if (this.bodyManager1.rightHand.position.distanceTo(this.bodyManager2.leftHand.position) < HAND_AUTO_HOLD_DISTANCE) {
        this.constraintManager.addConstraintToBody(LEFT_HAND2, this.bodyManager2.leftHand, this.bodyManager1.rightHand, 1);
        this.isLeftHandHoldingRightHand = true;
      }
    }

    if (this.rightHandReleased == true && this.bodyManager1.rightHand.position.distanceTo(this.bodyManager2.rightHand.position) > HAND_AUTO_HOLD_DISTANCE &&
      (this.bodyManager1.leftHand.position.distanceTo(this.bodyManager2.rightHand.position) > HAND_AUTO_HOLD_DISTANCE)) {
      this.rightHandReleased = false;
    }
    if (!this.rightHandReleased && this.constraintManager.namedConstraints[RIGHT_HAND2] == null) {
      if (this.bodyManager1.leftHand.position.distanceTo(this.bodyManager2.rightHand.position) < HAND_AUTO_HOLD_DISTANCE) {
        this.constraintManager.addConstraintToBody(RIGHT_HAND2, this.bodyManager2.rightHand, this.bodyManager1.leftHand, 1);
        this.isRightHandHoldingLeftHand = true;
      } else if (this.bodyManager1.rightHand.position.distanceTo(this.bodyManager2.rightHand.position) < HAND_AUTO_HOLD_DISTANCE) {
        this.constraintManager.addConstraintToBody(RIGHT_HAND2, this.bodyManager2.rightHand, this.bodyManager1.rightHand, 1);
        this.isRightHandHoldingRightHand = true;
      }
    }
  }
}
