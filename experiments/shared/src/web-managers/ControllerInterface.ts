import {Object3D, Scene} from 'three';

export interface ControllerInterface {

  addCameraAndControllerToScene(scene: Scene)

  update();

  getMesh(): Object3D
}