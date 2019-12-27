import {Object3D, Scene} from 'three';
import {XRFrameOfReference, XRReferenceSpace} from '../WebXRDeviceAPI';

export interface ControllerInterface {

  addCameraAndControllerToScene(scene: Scene, isControllerVisible: Boolean)
  addFingerTips(scene: Scene, isControllerVisible: Boolean)
  isPressed()
  wasPressed(): Boolean
  reset()

  update(frame: XRFrameOfReference, space: XRReferenceSpace);

  getMesh(): Object3D
}
