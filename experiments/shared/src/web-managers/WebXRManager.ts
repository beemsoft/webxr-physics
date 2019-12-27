/**
 Copyright 2019 Hans Beemsterboer

 This file has been modified by Hans Beemsterboer to be used in
 the webxr-physics project.

 MIT License

 Copyright (c) 2017 Arturo Paracuellos

 Permission is hereby granted, free of charge, to any person obtaining a copy
 of this software and associated documentation files (the "Software"), to deal
 in the Software without restriction, including without limitation the rights
 to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 copies of the Software, and to permit persons to whom the Software is
 furnished to do so, subject to the following conditions:

 The above copyright notice and this permission notice shall be included in all
 copies or substantial portions of the Software.

 THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 SOFTWARE.
 */

import {ArrayCamera, PerspectiveCamera, Scene, Vector3, Vector4, WebGLRenderer} from 'three';
import PhysicsHandler from '../physics/physicsHandler';
import {SceneManagerInterface} from '../scene/SceneManagerInterface';
import {ControllerInterface} from './ControllerInterface';
import HandController from '../controller-hands/hand-controller';

export default class WebXRManager {
  private readonly camera: PerspectiveCamera;
  private renderer: WebGLRenderer;
  private gl: WebGLRenderingContext;
  private readonly scene: Scene;
  private xrReferenceSpace = null;

  sessionActive = false;
  private session = null;
  private controllerL: ControllerInterface;
  private controllerR: ControllerInterface;
  private physicsHandler: PhysicsHandler;
  private sceneBuilder: SceneManagerInterface;
  private readonly isControllerVisible: Boolean;

  private cameraL = new PerspectiveCamera(75, 1, 0.1, 100);
  private cameraR = new PerspectiveCamera(75, 1, 0.1, 100);
  private cameraVR = new ArrayCamera( [ this.cameraL, this.cameraR ] );
  private cameraLPos = new Vector3();
  private cameraRPos = new Vector3();

  constructor(renderer: WebGLRenderer, camera: PerspectiveCamera, scene: Scene, sceneBuilder: SceneManagerInterface, isControllerVisible: Boolean) {
    this.cameraL.layers.enable(1);
    // @ts-ignore
    this.cameraL.viewport = new Vector4();
    this.cameraR.layers.enable(2);
    // @ts-ignore
    this.cameraR.viewport = new Vector4();
    this.cameraVR.layers.enable(1);
    this.cameraVR.layers.enable(2);
    this.cameraVR.fov = 75;

    this.renderer = renderer;
    this.camera = camera;
    this.scene = scene;
    this.sceneBuilder = sceneBuilder;
    this.isControllerVisible = isControllerVisible;

    // @ts-ignore
    navigator.xr.requestSession('immersive-vr')
      .then(session => {
        this.session = session;
        this.session.addEventListener('select', this.onSelect);
        let glCanvas: HTMLCanvasElement = document.createElement('canvas');
        this.gl = <WebGLRenderingContext>glCanvas.getContext('webgl', {xrCompatible: true});
        this.renderer = new WebGLRenderer({canvas: glCanvas, context: this.gl});
        // @ts-ignore
        let xrLayer = new XRWebGLLayer(this.session, this.gl);
        this.session.updateRenderState({baseLayer: xrLayer});
        this.session.requestReferenceSpace('local')
          .then(space => {
            this.xrReferenceSpace = space;
          }, error => {
            console.log(error.message);
          })
          .then(() => {
            this.initControllersAndBuildScene();
            this.startPresenting();
          })
      })
      .catch(error => {
        console.log(error.message);
      });
  }

  initControllersAndBuildScene() {
    this.physicsHandler = new PhysicsHandler();
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
      this.controllerL = new HandController(inputSourceL, this.physicsHandler);
      this.controllerL.addCameraAndControllerToScene(this.scene, this.isControllerVisible).then(() => {
        this.controllerR = new HandController(inputSourceR, this.physicsHandler);
        this.controllerR.addCameraAndControllerToScene(this.scene, this.isControllerVisible).then(() => {
          this.sceneBuilder.build(this.cameraVR, this.scene, this.renderer.capabilities.getMaxAnisotropy(), this.physicsHandler);
          this.sceneBuilder.addLeftController(this.controllerL);
          this.sceneBuilder.addRightController(this.controllerR);
        })
      });
    }
  }

  onXRFrame = (t, frame) => {
    this.renderer.clear();
    let session = frame.session;
    // Queue a request for the next frame to keep the animation loop going.
    session.requestAnimationFrame(this.onXRFrame);

    // Get the XRDevice pose relative to the Reference Space we created
    // earlier. The pose may not be available for a variety of reasons, so
    // we'll exit the callback early if it comes back as null.
    if (session.inputSources.length === 0) {
      return;
    }
    // @ts-ignore
    let pose = frame.getViewerPose(this.xrReferenceSpace);
    if (!pose) {
      return;
    }
    // Ensure we're rendering to the layer's backbuffer.
    let layer = session.renderState.baseLayer;
    this.gl.bindFramebuffer(this.gl.FRAMEBUFFER, layer.framebuffer);
    // // @ts-ignore
    // this.renderer.setFrameBuffer(layer.framebuffer);

    // Loop through each of the views reported by the viewer pose.
    let index = 0;
    for (let view of pose.views) {
      // Set the viewport required by this view.
      let viewport = layer.getViewport(view);
      this.gl.viewport(viewport.x, viewport.y, viewport.width, viewport.height);

      let viewMatrix = view.transform.inverse.matrix;
      let camera = this.cameraVR.cameras[index];
      camera.matrix.fromArray( viewMatrix ).getInverse( camera.matrix );
      camera.projectionMatrix.fromArray( view.projectionMatrix );
      camera.matrixWorldInverse.fromArray(viewMatrix);
      // @ts-ignore
      camera.viewport.set( viewport.x, viewport.y, viewport.width, viewport.height );

      if ( index === 0 ) {
        this.scene.matrix.fromArray(viewMatrix);
        this.cameraVR.matrix.copy( camera.matrix );
      }
      index++;
    }
    if (!this.controllerL) {
      this.initControllersAndBuildScene()
    } else {
      this.controllerL.update(frame, this.xrReferenceSpace);
      this.controllerR.update(frame, this.xrReferenceSpace);
      // this.scene.updateMatrixWorld(true);
      this.sceneBuilder.update();
      this.cameraVR.position.x = pose.transform.position.x;
      this.cameraVR.position.y = pose.transform.position.y;
      this.cameraVR.position.z = pose.transform.position.z;
      this.cameraVR.quaternion.x = pose.transform.orientation.x;
      this.cameraVR.quaternion.y = pose.transform.orientation.y;
      this.cameraVR.quaternion.z = pose.transform.orientation.z;
      this.cameraVR.quaternion.w = pose.transform.orientation.w;
      this.cameraVR.updateProjectionMatrix();
      this.physicsHandler.updatePhysics();
      this.renderer.render(this.scene, this.cameraVR);
    }
  };

  startPresenting() {
    console.log('Start presenting');
    this.renderer.vr.enabled = true;
    this.sessionActive = true;
    this.session.requestAnimationFrame(this.onXRFrame);
  };

  onSelect = (event) => {
    if (event.inputSource.handedness === 'right') {
      this.controllerR.isPressed();
    } else {
      this.controllerL.isPressed();
    }
  };

  endSession() {
    this.session.end();
    this.sessionActive = false;
    this.renderer.vr.enabled = false;
  };
}
