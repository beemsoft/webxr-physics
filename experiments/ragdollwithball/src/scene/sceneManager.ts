import {
  BackSide,
  BoxGeometry,
  Mesh,
  MeshBasicMaterial,
  PerspectiveCamera,
  PlaneGeometry,
  RepeatWrapping,
  Scene,
  SphereGeometry,
  TextureLoader,
  Vector3
} from 'three';
// @ts-ignore
import {Body, Box, Plane, Quaternion, Vec3} from 'cannon';
import PhysicsHandler from '../../../shared/src/physics/physicsHandler';
import ConstraintManager from '../../../shared/src/physics/ConstraintManager';
import BodyManager from '../../../shared/src/scene/human/bodyManager';
import DebugParams from './debug/DebugParams';
import {ControllerInterface} from '../../../shared/src/web-managers/ControllerInterface';
import BasketHelper, {BasketSettings} from './items/BasketHelper';
import {GUI} from 'dat.gui';
import {XRReferenceSpace, XRRigidTransform} from '../../../shared/src/WebXRDeviceAPI';
import {SceneHelper} from '../../../shared/src/scene/SceneHelper';
import {BasketballHelper} from '../../../shared/src/scene/sport/BasketballHelper';
import {SceneWithTeleporting} from '../../../shared/src/scene/SceneWithTeleporting';

const HEAD = "head";
const LEFT_HAND = "leftHand";
const RIGHT_HAND = "rightHand";
const LEFT_FOOT = "leftFoot";
const RIGHT_FOOT = "rightFoot";
const LEFT_SHOULDER = "leftShoulder";
const RIGHT_SHOULDER = "rightShoulder";
const FOOT_OFFSET = 0.25;

export default class SceneManager implements SceneWithTeleporting {
  private scene: Scene;
  private sceneHelper: SceneHelper;
  private camera: PerspectiveCamera;
  private physicsHandler: PhysicsHandler;
  constraintManager: ConstraintManager;
  private bodyManager1: BodyManager;
  private basketManager: BasketHelper;
  private basketballHelper: BasketballHelper;
  private params: DebugParams;
  leftHandReleased: boolean;
  rightHandReleased: boolean;
  private controllerL: ControllerInterface;
  private controllerR: ControllerInterface;
  private loader: TextureLoader = new TextureLoader();
  private ball: Body;
  private gui: GUI;
  public xrReferenceSpace: XRReferenceSpace;
  private currentBodyPosition = new Vec3();

  build(camera: PerspectiveCamera, scene: Scene, maxAnisotropy: number, physicsHandler: PhysicsHandler)  {
    this.scene = scene;
    this.sceneHelper = new SceneHelper(scene);
    this.camera = camera;
    this.physicsHandler = physicsHandler;
    this.constraintManager = new ConstraintManager(physicsHandler);
    this.bodyManager1 = new BodyManager(scene, physicsHandler);
    this.physicsHandler.dt = 1/80;
    this.physicsHandler.world.gravity.set(0, -9.8,0);
    this.basketManager = new BasketHelper(scene, physicsHandler);
    this.basketballHelper = new BasketballHelper(scene, physicsHandler);
    this.basketManager.loadSvg()
      .then(() => {
        this.scene.add(camera);
        this.sceneHelper.addLight();
        this.addFloor();
        this.addHall();
        this.ball = this.basketballHelper.addBall();
        let basketSettings = new BasketSettings();
        basketSettings.position = new Vec3(-13.5, 3, 0);
        basketSettings.rotation = new Quaternion();
        basketSettings.offsetRing = new Vec3( 0.8,-1.2, 0);
        this.basketManager.addBasket(basketSettings);
        let basketSettings2 = new BasketSettings();
        basketSettings2.position = new Vec3(13.5, 3, 0);
        basketSettings2.rotation = new Quaternion();
        basketSettings2.rotation.setFromAxisAngle(new Vec3(0, 1, 0), -Math.PI );
        basketSettings2.offsetRing = new Vec3( -0.8, -1.2, 0);
        this.basketManager.addBasket(basketSettings2);
        return this.bodyManager1.createRagdollWithControl(this.camera)
          .then(() => {
            this.constraintManager.addPointerConstraintToBody(HEAD, this.bodyManager1.headBody, 1);
            this.constraintManager.addPointerConstraintToBody(LEFT_HAND, this.bodyManager1.leftHand, 1);
            this.constraintManager.addPointerConstraintToBody(RIGHT_HAND, this.bodyManager1.rightHand, 1);
            this.constraintManager.addConeTwistConstraint(LEFT_SHOULDER, this.bodyManager1.upperBody, this.bodyManager1.upperLeftArm
              , this.bodyManager1.getLeftShoulderPivotA(), this.bodyManager1.getLeftShoulderPivotB());
            this.constraintManager.addConeTwistConstraint(RIGHT_SHOULDER, this.bodyManager1.upperBody, this.bodyManager1.upperRightArm
              , this.bodyManager1.getRightShoulderPivotA(), this.bodyManager1.getRightShoulderPivotB());

            this.params = new DebugParams(this, this.bodyManager1);
            this.params.buildGui(this.bodyManager1)
              .then(gui => {
                this.gui = gui;
                return true
              });
          });
      })
  };

  addWall(length, height, positionX, positionZ, rotationY) {
    let wallMesh = new Mesh(
      new BoxGeometry( length, height, 0.1, 8, 8, 1 ),
      new MeshBasicMaterial( { color: 0xffffff, transparent: true, wireframe: true, opacity: 0.1 } )
    );
    wallMesh.quaternion.setFromAxisAngle(new Vector3(0, 1, 0), rotationY);
    this.scene.add(wallMesh);
    this.physicsHandler.addMesh(wallMesh);
    let wallShape = new Box(new Vec3(length, height, 0.1));
    let wall = new Body({ mass: 0 });
    wall.addShape(wallShape);
    wall.position.x = positionX;
    wall.position.z = positionZ;
    wall.quaternion.setFromAxisAngle(new Vec3(0, 1, 0), rotationY);
    this.physicsHandler.addBody(wall);
  }

  addHall() {
    let texture = this.loader.load('/textures/basketball/equirectangular_court.jpg');
    let sphere = new Mesh(
      new SphereGeometry(16, 32, 32),
      new MeshBasicMaterial({
        map: texture,
        side: BackSide,
      })
    );
    sphere.rotateY(-Math.PI/5.5);
    this.scene.add(sphere);
    this.addWall(28, 20, 0, 7.5, 0);
    this.addWall(28, 20, 0, -7.5, 0);
    this.addWall(15, 20, 14, 0, Math.PI / 2);
    this.addWall(15, 20, -14, 0, Math.PI / 2);
  }

  addFloor() {
    let geometry = new PlaneGeometry(28, 15, 1, 1);
    let texture = this.loader.load('/textures/basketball-court-tiles-396756-free-texture-wall-pine-construction-tile.jpg', function (texture) {
      texture.wrapS = texture.wrapT = RepeatWrapping;
      texture.offset.set(0, 0);
      texture.repeat.set(5, 5);
    });
    let material = new MeshBasicMaterial({ map: texture });
    let mesh = new Mesh(geometry, material);
    mesh.quaternion.setFromAxisAngle(new Vector3(1, 0, 0), -Math.PI / 2);
    mesh.receiveShadow = true;
    this.scene.add(mesh);
    let groundShape = new Plane();
    let groundBody = new Body({ mass: 0, material: this.physicsHandler.groundMaterial });
    groundBody.addShape(groundShape);
    groundBody.quaternion.setFromAxisAngle(new Vec3(1,0,0),-Math.PI/2);
    groundBody.position.y -= 2;
    this.physicsHandler.addBody(groundBody);
    this.physicsHandler.addMesh(mesh);
  }

  update() {
    if (this.physicsHandler.rightHandController) {
      this.handleMovingTowardsTheBall();
      this.moveBody1();
      this.handleHoldingTheBall();
    } else if (this.params) {
      this.moveBodiesInDebugMode();
    }
    this.physicsHandler.updatePhysics();
  }

  private handleHoldingTheBall() {
    if (this.bodyManager1.leftHand.position.distanceTo(this.ball.position) < 0.2 &&
      this.bodyManager1.rightHand.position.distanceTo(this.ball.position) < 0.2) {
      this.ball.position.y = this.bodyManager1.leftHand.position.y;
      this.ball.position.x = this.bodyManager1.leftHand.position.x + 0.18;
      this.ball.position.y = this.bodyManager1.leftHand.position.y;
    }
  }

  private handleMovingTowardsTheBall() {
    if (this.controllerL.wasPressed()) {
      this.controllerL.reset();
      this.moveTowardsTheBall();
    }
    if (this.controllerR.wasPressed()) {
      this.controllerR.reset();
      this.rotateBody();
    }
  }

  public rotateBody() {
    let currentRotation = this.bodyManager1.upperBody.quaternion.toAxisAngle(new Vec3(0, 1, 0))[1];
    let newRotation = currentRotation + Math.PI / 2;
    this.bodyManager1.upperBody.quaternion.setFromAxisAngle(new Vec3(0, 1, 0), currentRotation + newRotation);
    this.bodyManager1.pelvis.quaternion.setFromAxisAngle(new Vec3(0, 1, 0), currentRotation + newRotation);
  }

  public moveTowardsTheBall() {
    console.log('move towards the ball!');
    let direction = this.ball.position.vsub(this.bodyManager1.headBody.position).mult(0.2);
    this.currentBodyPosition.vadd(direction, this.currentBodyPosition);
    console.log("Body position: " + JSON.stringify(this.currentBodyPosition));
    if (this.physicsHandler.rightHandController) {
      // @ts-ignore
      this.xrReferenceSpace = this.xrReferenceSpace.getOffsetReferenceSpace(new XRRigidTransform({x: -direction.x, y: 0, z: -direction.z}));
    } else {
      this.params.headX += direction.x;
      this.params.headZ += direction.z;
      this.params.leftHandX += direction.x;
      this.params.leftHandZ += direction.z;
      this.params.rightHandX += direction.x;
      this.params.rightHandZ += direction.z;
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
  }

  private moveBody1() {
    this.constraintManager.moveJointToPoint(HEAD,
      this.currentBodyPosition.x + (this.camera.position.x * this.bodyManager1.scale) * 2,
      ((this.camera.position.y) * this.bodyManager1.scale) * 2,
      this.currentBodyPosition.z + (this.camera.position.z * this.bodyManager1.scale) * 2);
    this.constraintManager.moveJointToPoint(RIGHT_HAND,
      this.currentBodyPosition.x + (this.physicsHandler.rightHandController.position.x * this.bodyManager1.scale) * 2,
      ((this.physicsHandler.rightHandController.position.y) * this.bodyManager1.scale) * 2,
      this.currentBodyPosition.z + (this.physicsHandler.rightHandController.position.z * this.bodyManager1.scale) * 2);

    this.constraintManager.moveJointToPoint(LEFT_HAND,
      this.currentBodyPosition.x + (this.physicsHandler.leftHandController.position.x * this.bodyManager1.scale) * 2,
      ((this.physicsHandler.leftHandController.position.y) * this.bodyManager1.scale) * 2,
      this.currentBodyPosition.z + (this.physicsHandler.leftHandController.position.z * this.bodyManager1.scale) * 2);
    this.constraintManager.moveJointToPoint(LEFT_FOOT,
      // (this.camera.position.x - FOOT_OFFSET) * this.bodyManager1.scale,
      this.bodyManager1.upperLeftArm.position.x,
      this.camera.position.y -1.5,
      this.bodyManager1.upperLeftArm.position.z
      // this.camera.position.z * this.bodyManager1.scale
    );
    this.constraintManager.moveJointToPoint(RIGHT_FOOT,
      // (this.camera.position.x + FOOT_OFFSET) * this.bodyManager1.scale,
      this.bodyManager1.upperRightArm.position.x,
      this.camera.position.y -1.5,
      this.bodyManager1.upperRightArm.position.z
      // this.camera.position.z * this.bodyManager1.scale
    );
  }

  addLeftController(controller: ControllerInterface) {
    this.controllerL = controller;
  }

  addRightController(controller: ControllerInterface) {
    this.controllerR = controller;
  }

  setXrReferenceSpace(space: XRReferenceSpace) {
    this.xrReferenceSpace = space;
  }

  getXrReferenceSpace(): XRReferenceSpace {
    return this.xrReferenceSpace;
  }

}
