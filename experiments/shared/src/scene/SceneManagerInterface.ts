import {PerspectiveCamera, Scene, WebGLRenderer} from 'three';
import PhysicsHandler from '../physics/physicsHandler';

export interface SceneManagerInterface {
  build(camera: PerspectiveCamera, scene: Scene, renderer: WebGLRenderer, physicsHandler: PhysicsHandler);
  update();
}
