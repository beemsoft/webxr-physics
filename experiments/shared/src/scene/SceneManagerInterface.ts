import {PerspectiveCamera, Scene, WebGLRenderer} from 'three';
import PhysicsHandler from '../physics/physicsHandler';
import {ControllerInterface} from '../web-managers/ControllerInterface';
import {XRReferenceSpace} from '../WebXRDeviceAPI';

export interface SceneManagerInterface {
  build(camera: PerspectiveCamera, scene: Scene, renderer: WebGLRenderer, physicsHandler: PhysicsHandler);
  update();
  addLeftController(controllerL: ControllerInterface): void;
  addRightController(controllerR: ControllerInterface): void;
  setXrReferenceSpace(space: XRReferenceSpace): void;
  getXrReferenceSpace(): XRReferenceSpace;
}
