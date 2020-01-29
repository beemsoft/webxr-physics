import {ArrayCamera, PerspectiveCamera, Vector4} from 'three';
import {XRDevicePose, XRView, XRViewport} from '../WebXRDeviceAPI';

const FIELD_OF_VIEW_DEGREES = 75;

export default class CameraManager {
  private cameraL = new PerspectiveCamera(FIELD_OF_VIEW_DEGREES, 1, 0.1, 100);
  private cameraR = new PerspectiveCamera(FIELD_OF_VIEW_DEGREES, 1, 0.1, 100);
  public cameraVR = new ArrayCamera([this.cameraL, this.cameraR]);

  public createVrCamera() {
    this.cameraL.layers.enable(1);
    // @ts-ignore
    this.cameraL.viewport = new Vector4();
    this.cameraR.layers.enable(2);
    // @ts-ignore
    this.cameraR.viewport = new Vector4();
    this.cameraVR.layers.enable(1);
    this.cameraVR.layers.enable(2);
    this.cameraVR.fov = FIELD_OF_VIEW_DEGREES;
  }

  public updateArrayCamera(index: number, view: XRView, viewport: XRViewport) {
    let viewMatrix = view.transform.inverse.matrix;
    let camera = this.cameraVR.cameras[index];
    camera.projectionMatrix.fromArray(view.projectionMatrix);
    camera.matrixWorldInverse.fromArray(viewMatrix);
    // @ts-ignore
    camera.viewport.set(viewport.x, viewport.y, viewport.width, viewport.height);
  }

  public update(pose: XRDevicePose) {
    this.cameraVR.position.x = pose.transform.position.x;
    this.cameraVR.position.y = pose.transform.position.y;
    this.cameraVR.position.z = pose.transform.position.z;
    this.cameraVR.quaternion.x = pose.transform.orientation.x;
    this.cameraVR.quaternion.y = pose.transform.orientation.y;
    this.cameraVR.quaternion.z = pose.transform.orientation.z;
    this.cameraVR.quaternion.w = pose.transform.orientation.w;
    this.cameraVR.updateProjectionMatrix();
  }

}
