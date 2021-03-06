import { Mesh, MeshBasicMaterial, Scene, SphereGeometry, WebGLRenderer } from 'three';
import PhysicsHandler from '../physics/physicsHandler';
import { SceneManagerInterface } from '../scene/SceneManagerInterface';
import { ControllerInterface } from './ControllerInterface';
import HandController from '../controller-hands/hand-controller';
import CameraManager from '../camera/CameraManager';
import { XRDevicePose, XRFrameOfReference, XRHandEnum, XRReferenceSpace } from '../WebXRDeviceAPI';
import { Body, Sphere } from "cannon";

const orderedJoints = [
  [XRHandEnum.THUMB_METACARPAL, XRHandEnum.THUMB_PHALANX_PROXIMAL, XRHandEnum.THUMB_PHALANX_DISTAL, XRHandEnum.THUMB_PHALANX_TIP],
  [XRHandEnum.INDEX_METACARPAL, XRHandEnum.INDEX_PHALANX_PROXIMAL, XRHandEnum.INDEX_PHALANX_INTERMEDIATE, XRHandEnum.INDEX_PHALANX_DISTAL, XRHandEnum.INDEX_PHALANX_TIP],
  [XRHandEnum.MIDDLE_METACARPAL, XRHandEnum.MIDDLE_PHALANX_PROXIMAL, XRHandEnum.MIDDLE_PHALANX_INTERMEDIATE, XRHandEnum.MIDDLE_PHALANX_DISTAL, XRHandEnum.MIDDLE_PHALANX_TIP],
  [XRHandEnum.RING_METACARPAL, XRHandEnum.RING_PHALANX_PROXIMAL, XRHandEnum.RING_PHALANX_INTERMEDIATE, XRHandEnum.RING_PHALANX_DISTAL, XRHandEnum.RING_PHALANX_TIP],
  [XRHandEnum.LITTLE_METACARPAL, XRHandEnum.LITTLE_PHALANX_PROXIMAL, XRHandEnum.LITTLE_PHALANX_INTERMEDIATE, XRHandEnum.LITTLE_PHALANX_DISTAL, XRHandEnum.LITTLE_PHALANX_TIP]
];

const handMeshList = Array<Body>();

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

    navigator.xr.requestSession('immersive-vr', { enabledFeatures: ["hand-tracking"] })
      .then(session => {
        this.session = session;
        this.initRenderer();
        // this.session.requestReferenceSpace(XRReferenceSpaceType.local)
        this.session.requestReferenceSpace('local')
          .then(space => {
            this.xrReferenceSpace = space;
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
      this.sceneBuilder.build(this.cameraManager.cameraVR, this.scene, this.renderer, this.physicsHandler);
      this.sceneBuilder.addLeftController(this.controllerL);
      this.sceneBuilder.addRightController(this.controllerR);
    }
  }

  onXRFrame = (t, frame: XRFrameOfReference) => {
    this.renderer.clear();
    let session = frame.session;
    session.requestAnimationFrame(this.onXRFrame);
    if (session.inputSources.length === 0) return;
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
    let meshIndex = 0;
    for (let inputSource of frame.session.inputSources) {
      if (inputSource.hand) {
        let wrist = inputSource.hand[XRHandEnum.WRIST];
        if (!wrist) {
          // this code is written to assume that the wrist joint is exposed
          return;
        }
        for (let finger of orderedJoints) {
          for (let joint1 of finger) {
            let joint = inputSource.hand[joint1];
            if (joint) {
              let pose = frame.getJointPose(joint, this.xrReferenceSpace);
              if (pose) {
                let handBody: Body;
                if (handMeshList[meshIndex]) {
                  handBody = handMeshList[meshIndex];
                } else {
                  const sphere_geometry = new SphereGeometry(pose.radius, 8, 8);
                  let material = new MeshBasicMaterial({
                    color: 0xFF3333,
                  });
                  let mesh = new Mesh(sphere_geometry, material);
                  this.scene.add(mesh);

                  let handBody = new Body({ mass: 0, material: this.physicsHandler.handMaterial });
                  handBody.addShape(new Sphere(pose.radius));
                  handMeshList[meshIndex] = handBody;
                  this.physicsHandler.addBody(handBody);
                  this.physicsHandler.addMesh(mesh);
                }
                handBody.position.x = pose.transform.position.x;
                handBody.position.y = pose.transform.position.y;
                handBody.position.z = pose.transform.position.z;
              }
            }
            meshIndex++;
          }
        }
      }
    }
    this.sceneBuilder.update();
    this.cameraManager.update(pose);
    this.physicsHandler.updatePhysics();
    this.renderer.render(this.scene, this.cameraManager.cameraVR);
  }
}
