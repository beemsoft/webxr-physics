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

import {PerspectiveCamera, Scene, WebGLRenderer} from 'three';
import WebXRPolyfill from 'webxr-polyfill';
import PhysicsHandler from '../physics/physicsHandler';
import RayInput from '../ray-input/ray-input';
import {SceneManagerInterface} from '../scene/SceneManagerInterface';
import {ControllerInterface} from './ControllerInterface';
import HandController from '../controller-hands/hand-controller';

export default class WebXRManager {
  private readonly camera: PerspectiveCamera;
  private display: VRDisplay;
  private renderer: WebGLRenderer;
  private readonly scene: Scene;

  sessionActive = false;
  private session = null;
  private gamepads: Gamepad[];
  private gamepadsActive = false;
  private rayInput: ControllerInterface;
  private handController1: ControllerInterface;
  private handController2: ControllerInterface;
  private physicsHandler: PhysicsHandler;
  private sceneBuilder: SceneManagerInterface;
  private isControllerVisible: Boolean;

  constructor(display: VRDisplay, renderer: WebGLRenderer, camera: PerspectiveCamera, scene: Scene, sceneBuilder: SceneManagerInterface, isControllerVisible: Boolean) {
    this.display = display;
    this.renderer = renderer;
    this.camera = camera;
    this.scene = scene;
    this.sceneBuilder = sceneBuilder;
    this.isControllerVisible = isControllerVisible;
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
        this.gamepadsActive = true;
      }
    }
    if (this.gamepadsActive) {
      this.gamepads = gamepads;
    } else {
      console.log('no gamepad found');
    }
  };

  initControllersAndBuildScene() {
    this.getVRGamepad();
    if (this.gamepadsActive) {
      if (this.gamepads.length === 1) {
        this.rayInput = new RayInput(this.camera, this.gamepads[0]);
        this.rayInput.addCameraAndControllerToScene(this.scene, this.isControllerVisible);
      } else {
        this.physicsHandler = new PhysicsHandler();
        this.handController1 = new HandController(this.gamepads[0], this.physicsHandler);
        this.handController1.addCameraAndControllerToScene(this.scene, this.isControllerVisible).then(() => {
          this.handController2 = new HandController(this.gamepads[1], this.physicsHandler);
          this.handController2.addCameraAndControllerToScene(this.scene, this.isControllerVisible).then(() => {
            this.sceneBuilder.build(this.camera, this.scene, this.renderer.capabilities.getMaxAnisotropy(), this.physicsHandler, this.gamepads);
            })
        });
      }
    }
  }

  onXRFrame = () => {
    if (this.gamepadsActive) {
      if (this.gamepads.length === 1) {
        this.rayInput.update();
      } else {
        this.handController1.update();
        this.handController2.update();
      }
      this.sceneBuilder.update();
      this.physicsHandler.updatePhysics();
    } else {
      this.initControllersAndBuildScene();
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
