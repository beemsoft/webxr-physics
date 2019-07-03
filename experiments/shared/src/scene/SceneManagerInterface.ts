import {PerspectiveCamera, Scene} from 'three';
import PhysicsHandler from '../physics/physicsHandler';

export interface SceneManagerInterface {
  build(camera: PerspectiveCamera, scene: Scene, maxAnisotropy: number, physicsHandler: PhysicsHandler);
  update();
}