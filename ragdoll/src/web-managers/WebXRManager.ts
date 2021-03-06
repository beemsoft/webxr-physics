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

import {Group, PerspectiveCamera, Scene, WebGLRenderer} from 'three';
import WebXRPolyfill from 'webxr-polyfill';
import PhysicsHandler from '../physics/physicsHandler';
import SceneManager from '../scene/sceneManager';
import RayHandler from '../ray-input/rayHandler';
import RayInput from '../ray-input/ray-input';
import SceneWithAudioManager from '../scene/sceneWithAudioManager';
import PhysicsWithRayInputHandler from '../physics/physicsWithRayInputHandler';

export default class WebXRManager {
  private readonly camera: PerspectiveCamera;
  private display: VRDisplay;
  private renderer: WebGLRenderer;
  private readonly scene: Scene;

  sessionActive = false;
  private session = null;
  private gamepad: Gamepad;
  private rayInput: RayInput;
  private physicsHandler: PhysicsHandler;
  private sceneBuilder: SceneManager;
  private rayHandler: RayHandler;

  constructor(display: VRDisplay, renderer: WebGLRenderer, camera: PerspectiveCamera, scene: Scene) {
    this.display = display;
    this.renderer = renderer;
    this.camera = camera;
    this.scene = scene;
    this.renderer.vr.setDevice(display);
    new WebXRPolyfill();
      // @ts-ignore
    if (navigator.xr) {
      document.body.appendChild( renderer.domElement );
      // @ts-ignore
      navigator.xr.requestDevice()
        .then((device) => {
          device.requestSession({ immersive: true })
            .then(session => {
              this.session = session;
              this.startPresenting();
            });
        });
    }
  }

  getVRGamepad = () => {
    let gamepads = navigator.getGamepads && navigator.getGamepads();
    for (let i = 0; i < gamepads.length; i++) {
      let gamepad = gamepads[i];
      if (gamepad && gamepad.pose) {
        console.log('gamepad: ' + gamepad.id);
        return gamepad;
      }
    }
    console.log('no gamepad found');
    return null;
  };

  initController() {
    this.gamepad = this.getVRGamepad();
    if (this.gamepad) {
      this.rayInput = new RayInput(this.camera, this.gamepad);
      this.addCameraAndControllerToScene();
      this.physicsHandler = new PhysicsWithRayInputHandler(this.rayInput);
      this.rayHandler = new RayHandler(this.scene, this.rayInput, this.physicsHandler);
      this.rayInput.rayInputEventEmitter.on('raydown', (opt_mesh) => {
        this.rayHandler.handleRayDown_(opt_mesh);
      });
      this.rayInput.rayInputEventEmitter.on('rayup', () => {
        this.rayHandler.handleRayUp_();
      });
      this.rayInput.rayInputEventEmitter.on('raydrag', () => {
        this.rayHandler.handleRayDrag_()
      });
      this.sceneBuilder = new SceneWithAudioManager(this.scene, this.camera, this.physicsHandler);
    }
  }

  private addCameraAndControllerToScene() {
    let cameraGroup = new Group();
    cameraGroup.position.set(0, 0, 0);
    cameraGroup.add(this.camera);
    cameraGroup.add(this.rayInput.getMesh());
    this.scene.add(cameraGroup);
  }

  onXRFrame = () => {
    if (this.gamepad != null) {
      this.rayInput.update();
      this.sceneBuilder.update();
      this.physicsHandler.updatePhysics();
    } else {
      this.initController();
    }
    this.renderer.render(this.scene, this.camera);
    this.session.requestAnimationFrame(this.onXRFrame);
  };

  startPresenting() {
    console.log('Start presenting');
    this.renderer.vr.enabled = true;
    this.sessionActive = true;
    console.log('Renderer - enable VR');
    this.renderer.setClearColor( 0xCCCCCC );
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    console.log('Request present VR display');
    this.display.requestPresent([{source: this.renderer.domElement}])
    .then(() => {
      this.session.requestAnimationFrame(this.onXRFrame);
    });
  };

  endSession() {
    this.session.end();
    this.sessionActive = false;
    this.renderer.vr.enabled = false;
  };
}

