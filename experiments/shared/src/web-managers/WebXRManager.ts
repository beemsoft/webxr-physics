import {Scene, WebGLRenderer} from 'three';
import PhysicsHandler from '../physics/physicsHandler';
import {SceneManagerInterface} from '../scene/SceneManagerInterface';
import {ControllerInterface} from './ControllerInterface';
import HandController from '../controller-hands/hand-controller';
import CameraManager from '../camera/CameraManager';
import {XRDevicePose, XRFrameOfReference, XRReferenceSpace} from '../WebXRDeviceAPI';

export default class WebXRManager {
  private renderer: WebGLRenderer;
  private gl: WebGLRenderingContext;
  private readonly scene: Scene = new Scene();
  private xrReferenceSpace: XRReferenceSpace = null;
  sessionActive = false;
  private session = null;
  private controllerL: ControllerInterface;
  private controllerR: ControllerInterface;
  private physicsHandler: PhysicsHandler;
  private sceneBuilder: SceneManagerInterface;
  private cameraManager = new CameraManager();

  constructor(sceneBuilder: SceneManagerInterface) {
    this.cameraManager.createVrCamera();
    this.sceneBuilder = sceneBuilder;

    navigator.xr.requestSession('immersive-vr')
      .then(session => {
        this.session = session;
        this.session.addEventListener('select', this.onSelect);
        this.initRenderer();
        // this.session.requestReferenceSpace(XRReferenceSpaceType.local)
        this.session.requestReferenceSpace('local')
          .then(space => {
            this.xrReferenceSpace = space;
            // @ts-ignore
            this.sceneBuilder.setXrReferenceSpace(space);
          }, error => {
            console.log(error.message);
          })
          .then(() => {
            this.initControllersAndBuildScene();
            this.sessionActive = true;
            this.session.requestAnimationFrame(this.onXRFrame);
          })
      })
      .catch(error => {
        console.log(error.message);
      });
  }

  private initRenderer() {
    let glCanvas: HTMLCanvasElement = document.createElement('canvas');
    this.gl = <WebGLRenderingContext>glCanvas.getContext('webgl', {xrCompatible: true});
    this.renderer = new WebGLRenderer({canvas: glCanvas, context: this.gl});
    // @ts-ignore
    this.session.updateRenderState({baseLayer: new XRWebGLLayer(this.session, this.gl)});
  }

  private initControllersAndBuildScene() {
    let inputSources = this.session.inputSources;
    let inputSourceL = null;
    let inputSourceR = null;
    if (inputSources.length == 2) {
      if (inputSources[0].handedness === 'right') {
        inputSourceR = inputSources[0];
        inputSourceL = inputSources[1];
      } else {
        inputSourceR = inputSources[1];
        inputSourceL = inputSources[0];
      }
      this.physicsHandler = new PhysicsHandler();
      this.controllerL = new HandController(inputSourceL, this.physicsHandler);
      this.controllerR = new HandController(inputSourceR, this.physicsHandler);
      this.sceneBuilder.build(this.cameraManager.cameraVR, this.scene, this.renderer.capabilities.getMaxAnisotropy(), this.physicsHandler);
      // @ts-ignore
      this.sceneBuilder.addLeftController(this.controllerL);
      // @ts-ignore
      this.sceneBuilder.addRightController(this.controllerR);
    }
  }

  onXRFrame = (t, frame: XRFrameOfReference) => {
    this.renderer.clear();
    let session = frame.session;
    session.requestAnimationFrame(this.onXRFrame);
    if (session.inputSources.length === 0) return;
    // @ts-ignore
    let pose = frame.getViewerPose(this.sceneBuilder.getXrReferenceSpace());
    if (!pose) return;
    let layer = session.renderState.baseLayer;
    this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, layer.framebuffer);
    let index = 0;
    for (let view of pose.views) {
      let viewport = layer.getViewport(view);
      this.gl.viewport(viewport.x, viewport.y, viewport.width, viewport.height);
      this.cameraManager.updateArrayCamera(index, view, viewport);
      index++;
    }
    if (!this.controllerL) {
      this.initControllersAndBuildScene()
    } else {
      this.renderScene(frame, pose);
    }
  };

  private renderScene(frame: XRFrameOfReference, pose: XRDevicePose) {
    this.controllerL.update(frame, this.xrReferenceSpace);
    this.controllerR.update(frame, this.xrReferenceSpace);
    this.sceneBuilder.update();
    this.cameraManager.update(pose);
    this.physicsHandler.updatePhysics();
    this.renderer.render(this.scene, this.cameraManager.cameraVR);
  }

  onSelect = (event) => {
    if (event.inputSource.handedness === 'right') {
      this.controllerR.isPressed();
    } else {
      this.controllerL.isPressed();
    }
  };
}
