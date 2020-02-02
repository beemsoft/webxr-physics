import {XRReferenceSpace} from '../WebXRDeviceAPI';
import {SceneWithControllers} from './SceneWithControllers';

export interface SceneWithTeleporting extends SceneWithControllers {
  setXrReferenceSpace(space: XRReferenceSpace);
  getXrReferenceSpace(): XRReferenceSpace;
}
