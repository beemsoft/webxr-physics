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
import {SceneManagerInterface} from '../../../shared/src/scene/SceneManagerInterface';
import ConstraintManager from '../../../shared/src/physics/ConstraintManager';
import BodyManager from './human/bodyManager';

const HEAD = 0;
const LEFT_HAND = 1;
const RIGHT_HAND = 2;

export default class SceneManager implements SceneManagerInterface {
  private scene: Scene;
  private camera: PerspectiveCamera;
  private physicsHandler: PhysicsHandler;
  private constraintManager: ConstraintManager;
  private bodyManager: BodyManager;

  build(camera: PerspectiveCamera, scene: Scene, maxAnisotropy: number, physicsHandler: PhysicsHandler) {
    this.scene = scene;
    this.camera = camera;
    this.physicsHandler = physicsHandler;
    this.constraintManager = new ConstraintManager(physicsHandler);
    this.bodyManager = new BodyManager(scene, physicsHandler);
    this.physicsHandler.dt = 1/180;
    this.physicsHandler.world.gravity.set(0, -9.8,0);
    let light = new DirectionalLight(0xFFFFFF, 1);
    light.position.set(1, 10, -0.5);
    this.scene.add(light);
    this.scene.add(new HemisphereLight(0x909090, 0x404040));

    this.addFloor();
    this.bodyManager.createRagdoll();
    this.constraintManager.addPointerConstraintToBody(HEAD, this.bodyManager.headBody, 1);
    this.constraintManager.addPointerConstraintToBody(RIGHT_HAND, this.bodyManager.rightHand, 1);
    this.constraintManager.addPointerConstraintToBody(LEFT_HAND, this.bodyManager.leftHand, 1);
  }

  addFloor() {
    let mesh = new Mesh(new PlaneGeometry(28, 15, 1, 1), new MeshBasicMaterial());
    let floorBody = new Body({ mass: 0});
    floorBody.quaternion.setFromAxisAngle(new Vec3(1, 0, 0), Math.PI / -2);
    floorBody.addShape(new Plane());
    this.physicsHandler.addBody(floorBody);
    this.physicsHandler.addMesh(mesh);
  }

  update() {
    if (this.physicsHandler.rightHandController) {
      this.constraintManager.moveJointToPoint(RIGHT_HAND,
        this.bodyManager.upperBody.position.x + (this.physicsHandler.rightHandController.position.x * this.bodyManager.scale) * 2,
        ((this.physicsHandler.rightHandController.position.y - 1) * this.bodyManager.scale) * 2,
        this.bodyManager.upperBody.position.z - (this.physicsHandler.rightHandController.position.z * this.bodyManager.scale) * 2);

      this.constraintManager.moveJointToPoint(LEFT_HAND,
        (this.bodyManager.upperBody.position.x + this.physicsHandler.leftHandController.position.x * this.bodyManager.scale) * 2,
        ((this.physicsHandler.leftHandController.position.y - 1) * this.bodyManager.scale) * 2,
        this.bodyManager.upperBody.position.z - (this.physicsHandler.leftHandController.position.z * this.bodyManager.scale) * 2);

      this.constraintManager.moveJointToPoint(HEAD,
        this.bodyManager.upperBody.position.x + (this.camera.position.x * this.bodyManager.scale),
        (this.camera.position.y * this.bodyManager.scale) * 2,
        this.bodyManager.upperBody.position.z - (this.camera.position.z * this.bodyManager.scale));
    }

    this.physicsHandler.updatePhysics();
  }
}
