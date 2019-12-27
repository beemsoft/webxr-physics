import {PerspectiveCamera, Scene} from 'three';
import PhysicsHandler from '../physics/physicsHandler';
import {ControllerInterface} from '../web-managers/ControllerInterface';

export interface SceneManagerInterface {
  build(camera: PerspectiveCamera, scene: Scene, maxAnisotropy: number, physicsHandler: PhysicsHandler);
  addRightController(controller: ControllerInterface)
  addLeftController(controller: ControllerInterface)
  update();
}
