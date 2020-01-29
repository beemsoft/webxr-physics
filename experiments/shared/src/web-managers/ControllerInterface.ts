import {Object3D, Scene, Vector3} from 'three';
import {XRFrameOfReference, XRReferenceSpace} from '../WebXRDeviceAPI';

export interface ControllerInterface {

  makeVisible(scene: Scene)
  addFingerTips(scene: Scene, isControllerVisible: Boolean)
  isPressed()
  wasPressed(): Boolean
  reset()
  update(frame: XRFrameOfReference, space: XRReferenceSpace);
  getMesh(): Object3D
  move(direction: Vector3)
}
