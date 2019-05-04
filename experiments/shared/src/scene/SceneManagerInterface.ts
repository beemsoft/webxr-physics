import {Scene} from 'three';
import PhysicsHandler from '../physics/physicsHandler';

export interface SceneManagerInterface {
  build(scene: Scene, maxAnisotropy: number, physicsHandler: PhysicsHandler);
  update();
}