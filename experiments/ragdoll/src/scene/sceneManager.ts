import {DirectionalLight, HemisphereLight, PerspectiveCamera, Scene, WebGLRenderer} from 'three';
import PhysicsHandler from '../../../shared/src/physics/physicsHandler';
import {SceneManagerInterface} from '../../../shared/src/scene/SceneManagerInterface';
import ConstraintManager from '../../../shared/src/physics/ConstraintManager';
import BodyManager from '../../../shared/src/scene/human/bodyManager';
import {Vec3} from 'cannon';

const HEAD = "head";
const LEFT_HAND = "leftHand";
const RIGHT_HAND = "rightHand";

export default class SceneManager implements SceneManagerInterface {
  private scene: Scene;
  private camera: PerspectiveCamera;
  private physicsHandler: PhysicsHandler;
  private constraintManager: ConstraintManager;
  private bodyManager: BodyManager;

  build(camera: PerspectiveCamera, scene: Scene, renderer: WebGLRenderer, physicsHandler: PhysicsHandler) {
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

    this.bodyManager.createRagdoll(new Vec3(0, 0, 0), 1, 0x772277, true)
      .then(() => {
        this.constraintManager.addPointerConstraintToBody(HEAD, this.bodyManager.headBody, 1);
        this.constraintManager.addPointerConstraintToBody(RIGHT_HAND, this.bodyManager.rightHand, 1);
        this.constraintManager.addPointerConstraintToBody(LEFT_HAND, this.bodyManager.leftHand, 1);
      });
  }

  update() {
    if (this.physicsHandler.rightHandController) {
      this.constraintManager.moveJointToPoint(RIGHT_HAND,
        (this.physicsHandler.rightHandController.position.x * this.bodyManager.scale) * 2,
        ((this.physicsHandler.rightHandController.position.y) * this.bodyManager.scale) * 2,
        -1 - (this.physicsHandler.rightHandController.position.z * this.bodyManager.scale) * 2);

      this.constraintManager.moveJointToPoint(LEFT_HAND,
        (this.physicsHandler.leftHandController.position.x * this.bodyManager.scale) * 2,
        ((this.physicsHandler.leftHandController.position.y) * this.bodyManager.scale) * 2,
        -1 - (this.physicsHandler.leftHandController.position.z * this.bodyManager.scale) * 2);

      this.constraintManager.moveJointToPoint(HEAD,
         (this.camera.position.x * this.bodyManager.scale),
        (this.camera.position.y * this.bodyManager.scale) * 2,
        -1 - (this.camera.position.z * this.bodyManager.scale));
    }
  }
}
