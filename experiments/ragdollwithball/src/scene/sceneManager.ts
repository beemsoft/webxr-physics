import {
  DirectionalLight,
  HemisphereLight,
  Mesh,
  MeshBasicMaterial, MeshPhongMaterial,
  PerspectiveCamera,
  PlaneGeometry,
  Scene, SphereGeometry, TextureLoader, Vector2
} from 'three';
import {Body, Material, Plane, Sphere, Vec3} from 'cannon';
import PhysicsHandler from '../../../shared/src/physics/physicsHandler';
import {SceneManagerInterface} from '../../../shared/src/scene/SceneManagerInterface';
import ConstraintManager from '../../../shared/src/physics/ConstraintManager';
import BodyManager from './human/bodyManager';
import DebugParams from './debug/DebugParams';

const HEAD = "head";
const LEFT_HAND = "leftHand";
const RIGHT_HAND = "rightHand";
const LEFT_FOOT = "leftFoot";
const RIGHT_FOOT = "rightFoot";
const LEFT_SHOULDER = "leftShoulder";
const RIGHT_SHOULDER = "rightShoulder";
const FOOT_OFFSET = 0.25;

export default class SceneManager implements SceneManagerInterface {
  private scene: Scene;
  private camera: PerspectiveCamera;
  private physicsHandler: PhysicsHandler;
  constraintManager: ConstraintManager;
  private bodyManager1: BodyManager;
  private params: DebugParams;
  leftHandReleased: boolean;
  rightHandReleased: boolean;
  private gamepads: Gamepad[];
  private loader: TextureLoader;
  private ball: Body;
  private ballMaterial: Material;

  constructor() {
    this.loader = new TextureLoader();
  }

  build(camera: PerspectiveCamera, scene: Scene, maxAnisotropy: number, physicsHandler: PhysicsHandler, gamepads: Gamepad[]) {
    this.scene = scene;
    this.camera = camera;
    this.physicsHandler = physicsHandler;
    this.constraintManager = new ConstraintManager(physicsHandler);
    this.bodyManager1 = new BodyManager(scene, physicsHandler);
    this.physicsHandler.dt = 1/80;
    this.physicsHandler.world.gravity.set(0, -9.8,0);
    let light = new DirectionalLight(0xFFFFFF, 1);
    light.position.set(1, 10, -0.5);
    this.scene.add(light);
    this.scene.add(new HemisphereLight(0x909090, 0x404040));
    this.gamepads = gamepads;

    this.addFloor();

    this.addBall();
    if (this.physicsHandler.rightHandController) {
      this.bodyManager1.createRagdoll(new Vec3(this.camera.position.x, 0, this.camera.position.z), 0.7, 0x772277, false);
    } else {
      this.bodyManager1.createRagdoll(new Vec3(0, 0.01, 0), 1, 0x772277, false);
    }
    this.constraintManager.addPointerConstraintToBody(HEAD, this.bodyManager1.headBody, 1);
    this.constraintManager.addPointerConstraintToBody(LEFT_HAND, this.bodyManager1.leftHand, 1);
    this.constraintManager.addPointerConstraintToBody(RIGHT_HAND, this.bodyManager1.rightHand, 1);
    this.constraintManager.addPointerConstraintToBody(LEFT_FOOT, this.bodyManager1.leftFoot, 1);
    this.constraintManager.addPointerConstraintToBody(RIGHT_FOOT, this.bodyManager1.rightFoot, 1);
    this.constraintManager.addConeTwistConstraint(LEFT_SHOULDER, this.bodyManager1.upperBody, this.bodyManager1.upperLeftArm
      , this.bodyManager1.getLeftShoulderPivotA(), this.bodyManager1.getLeftShoulderPivotB());
    this.constraintManager.addConeTwistConstraint(RIGHT_SHOULDER, this.bodyManager1.upperBody, this.bodyManager1.upperRightArm
      , this.bodyManager1.getRightShoulderPivotA(), this.bodyManager1.getRightShoulderPivotB());

    this.params = new DebugParams(this, this.bodyManager1);
    this.params.buildGui();
  }

  addFloor() {
    let mesh = new Mesh(new PlaneGeometry(28, 15, 1, 1), new MeshBasicMaterial());
    let floorBody = new Body({ mass: 0});
    floorBody.quaternion.setFromAxisAngle(new Vec3(1, 0, 0), Math.PI / -2);
    floorBody.addShape(new Plane());
    this.physicsHandler.addBody(floorBody);
    this.physicsHandler.addMesh(mesh);
  }

  addBall(){
    const scale = 1;
    const ballRadius = 0.17 * scale;

    let ballSphere = new SphereGeometry( ballRadius, 16, 16 );
    let ballMaterial = new MeshPhongMaterial({
      map: this.loader.load('/textures/ball.png'),
      normalMap: this.loader.load('/textures/ball_normal.png'),
      shininess: 20,
      reflectivity: 2,
      normalScale: new Vector2(0.5, 0.5)
    });

    let ballMesh = new Mesh(ballSphere, ballMaterial);
    ballMesh.castShadow = true;

    this.physicsHandler.addMesh(ballMesh);

    let damping = 0.01;
    let mass = 0.1; // 0.6237;
    let sphereShape = new Sphere(ballRadius);
    this.ballMaterial = new Material("ball");
    let ball = new Body({
      mass: mass,
      material: this.ballMaterial
    });

    ball.addShape(sphereShape);
    ball.linearDamping = damping;

    ball.position.set(0,5,0);

    this.physicsHandler.addBody(ball);

    this.ball = ball;
    this.scene.add(ballMesh);
    this.physicsHandler.addBallHandContactMaterial(this.ballMaterial, 0.001, 0.1);
  }

  update() {
    if (this.physicsHandler.rightHandController) {
      this.moveBody1();
    } else {
      this.moveBodiesInDebugMode();
    }
    this.physicsHandler.updatePhysics();
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
      0,
      this.params.headZ);
    this.constraintManager.moveJointToPoint(RIGHT_FOOT,
      this.params.headX + FOOT_OFFSET * this.bodyManager1.scale,
      0,
      this.params.headZ);
  }

  private moveBody1() {
    this.constraintManager.moveJointToPoint(HEAD,
      (this.camera.position.x * this.bodyManager1.scale) * 2,
      ((this.camera.position.y) * this.bodyManager1.scale) * 2,
      (this.camera.position.z * this.bodyManager1.scale) * 2);
    this.constraintManager.moveJointToPoint(RIGHT_HAND,
      (this.physicsHandler.rightHandController.position.x * this.bodyManager1.scale) * 2,
      ((this.physicsHandler.rightHandController.position.y - 1) * this.bodyManager1.scale) * 2,
      (this.physicsHandler.rightHandController.position.z * this.bodyManager1.scale) * 2);

    this.constraintManager.moveJointToPoint(LEFT_HAND,
      (this.physicsHandler.leftHandController.position.x * this.bodyManager1.scale) * 2,
      ((this.physicsHandler.leftHandController.position.y - 1) * this.bodyManager1.scale) * 2,
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

}
