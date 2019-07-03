import {Object3D, Scene} from 'three';

export interface ControllerInterface {

  addCameraAndControllerToScene(scene: Scene, isControllerVisible: Boolean)

  update();

  getMesh(): Object3D
}