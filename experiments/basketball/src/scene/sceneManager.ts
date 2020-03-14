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
  Vector3, WebGLRenderer
} from 'three';
// @ts-ignore
import {Body, Box, Plane, Quaternion, Vec3} from 'cannon';
import PhysicsHandler from '../../../shared/src/physics/physicsHandler';
import ConstraintManager from '../../../shared/src/physics/ConstraintManager';
import DebugParams from './debug/DebugParams';
import {ControllerInterface} from '../../../shared/src/web-managers/ControllerInterface';
import BasketHelper, {BasketSettings} from './items/BasketHelper';
import {GUI} from 'dat.gui';
import {XRReferenceSpace, XRRigidTransform} from '../../../shared/src/WebXRDeviceAPI';
import {SceneHelper} from '../../../shared/src/scene/SceneHelper';
import {BasketballHelper} from '../../../shared/src/scene/sport/BasketballHelper';
import {SceneWithTeleporting} from '../../../shared/src/scene/SceneWithTeleporting';
import SimpleHandManager from '../../../shared/src/controller-hands/SimpleHandManager';

const LEFT_HAND = "leftHand";
const RIGHT_HAND = "rightHand";

export default class SceneManager implements SceneWithTeleporting {
  private scene: Scene;
  private sceneHelper: SceneHelper;
  private camera: PerspectiveCamera;
  private physicsHandler: PhysicsHandler;
  constraintManager: ConstraintManager;
  private simpleHandManager: SimpleHandManager;
  private basketManager: BasketHelper;
  private basketballHelper: BasketballHelper;
  private params: DebugParams;
  isHoldingTheBall: boolean;
  private controllerL: ControllerInterface;
  private controllerR: ControllerInterface;
  private loader: TextureLoader = new TextureLoader();
  private ball: Body;
  private gui: GUI;
  public xrReferenceSpace: XRReferenceSpace;
  private currentBodyPosition = new Vec3();

  build(camera: PerspectiveCamera, scene: Scene, renderer: WebGLRenderer, physicsHandler: PhysicsHandler)  {
    this.scene = scene;
    this.sceneHelper = new SceneHelper(scene);
    this.camera = camera;
    this.physicsHandler = physicsHandler;
    this.constraintManager = new ConstraintManager(physicsHandler);
    this.simpleHandManager = new SimpleHandManager(scene, physicsHandler);
    this.physicsHandler.dt = 1/80;
    this.physicsHandler.world.gravity.set(0, -5,0);
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
        basketSettings.angle = 0;
        basketSettings.offsetRing = new Vec3( 0.8,-1.2, 0);
        this.basketManager.addBasket(basketSettings);
        let basketSettings2 = new BasketSettings();
        basketSettings2.position = new Vec3(13.5, 3, 0);
        basketSettings2.rotation = new Quaternion();
        basketSettings2.angle = -Math.PI;
        basketSettings2.rotation.setFromAxisAngle(new Vec3(0, 1, 0), -Math.PI );
        basketSettings2.offsetRing = new Vec3( -0.8, -1.2, 0);
        this.basketManager.addBasket(basketSettings2);
        return this.simpleHandManager.createSimpleHands(this.camera)
          .then(() => {
            this.constraintManager.addPointerConstraintToBody(LEFT_HAND, this.simpleHandManager.leftHand, 1);
            this.constraintManager.addPointerConstraintToBody(RIGHT_HAND, this.simpleHandManager.rightHand, 1);
            this.params = new DebugParams(this, this.simpleHandManager);
            this.params.buildGui(this.simpleHandManager)
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
    if (!this.controllerR.wasPressed() && this.simpleHandManager.leftHand.position.distanceTo(this.ball.position) < 1 &&
      this.simpleHandManager.rightHand.position.distanceTo(this.ball.position) < 1) {
      this.ball.velocity = new Vec3();
      this.ball.angularVelocity = new Vec3();
      this.ball.position.y = this.simpleHandManager.leftHand.position.y;
      this.ball.position.x = this.simpleHandManager.leftHand.position.x;
      this.ball.position.z = this.simpleHandManager.leftHand.position.z - 0.23;
      this.isHoldingTheBall = true;
    }
  }

  private handleMovingTowardsTheBall() {
    if (this.controllerL.wasPressed()) {
      this.controllerL.reset();
      if (!this.isHoldingTheBall) {
        this.moveTowardsTheBall();
      } else {
        this.moveToBasket();
      }
    }
    if (this.controllerR.wasPressed()) {
      if (this.simpleHandManager.leftHand.position.distanceTo(this.ball.position) > 1 &&
        this.simpleHandManager.rightHand.position.distanceTo(this.ball.position) > 1) {
        this.controllerR.reset();
        this.isHoldingTheBall = false;
      }
    }
  }

  public moveTowardsTheBall() {
    let direction = this.ball.position.vsub(new Vec3(this.camera.position.x, this.camera.position.y, this.camera.position.z)).mult(0.2);
    this.moveInDirection(direction);
  }

  public moveToBasket() {
    let direction = new Vec3(-9, 0, 0).vsub(new Vec3(this.camera.position.x, this.camera.position.y, this.camera.position.z));
    this.moveInDirection(direction);
    this.ball.position.vadd(direction, this.ball.position);
    this.ball.velocity = new Vec3();
    this.ball.angularVelocity = new Vec3();
  }

  private moveInDirection(direction: Vec3) {
    this.currentBodyPosition.vadd(direction, this.currentBodyPosition);
    if (this.physicsHandler.rightHandController) {
      // @ts-ignore
      this.xrReferenceSpace = this.xrReferenceSpace.getOffsetReferenceSpace(new XRRigidTransform({x: -direction.x, y: 0, z: -direction.z}));
    } else {
      this.params.leftHandX += direction.x;
      this.params.leftHandZ += direction.z;
      this.params.rightHandX += direction.x;
      this.params.rightHandZ += direction.z;
    }
  }

  private moveBodiesInDebugMode() {
    this.constraintManager.moveJointToPoint(LEFT_HAND,
      this.params.leftHandX,
      this.params.leftHandY,
      this.params.leftHandZ);
    this.constraintManager.moveJointToPoint(RIGHT_HAND,
      this.params.rightHandX,
      this.params.rightHandY,
      this.params.rightHandZ);
  }

  private moveBody1() {
    this.constraintManager.moveJointToPoint(RIGHT_HAND,
      this.currentBodyPosition.x + (this.physicsHandler.rightHandController.position.x * this.simpleHandManager.scale) * 3,
      ((this.physicsHandler.rightHandController.position.y) * this.simpleHandManager.scale) * 3,
      this.currentBodyPosition.z + (this.physicsHandler.rightHandController.position.z * this.simpleHandManager.scale) * 3);

    this.constraintManager.moveJointToPoint(LEFT_HAND,
      this.currentBodyPosition.x + (this.physicsHandler.leftHandController.position.x * this.simpleHandManager.scale) * 3,
      ((this.physicsHandler.leftHandController.position.y) * this.simpleHandManager.scale) * 3,
      this.currentBodyPosition.z + (this.physicsHandler.leftHandController.position.z * this.simpleHandManager.scale) * 3);
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
