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
import PhysicsHandler from '../physicsHandler';
import SceneBuilder from '../sceneBuilder';
import RayHandler from '../rayHandler';
import AudioHandler from '../audioHandler';
import RayInput from '../ray-input/ray-input';

const REALITY = 'reality';
let polyfill: WebXRPolyfill;

export default class WebXRManager {
  private camera: PerspectiveCamera;
  private display: VRDisplay;
  private renderer: WebGLRenderer;
  private scene: Scene;

  sessionActive = false;
  private session = null;
  private poseTarget: any;
  private domElementOriginal: any;
  private cameraCloned: PerspectiveCamera;
  private poseTargetCloned: any;
  private gamepad: Gamepad;
  private rayInput: RayInput;
  private physicsHandler: PhysicsHandler;
  private sceneBuilder: SceneBuilder;
  private rayHandler: RayHandler;
  private audioHandler: AudioHandler;
  private device: any;

  constructor(display: VRDisplay, renderer: WebGLRenderer, camera: PerspectiveCamera, scene: Scene) {
    this.display = display;
    this.renderer = renderer;
    this.camera = camera;
    this.scene = scene;

    console.log('renderer size: ' + JSON.stringify(this.renderer.getSize()));
    this.renderer.vr.setDevice(display);
     polyfill = new WebXRPolyfill();
      console.log(navigator);
      // @ts-ignore
    if (navigator.xr) {
        // @ts-ignore
      navigator.xr.requestDevice().then((device) => {
          this.device = device;
         device.requestSession({
          immersive: true
        })
             .then(session => {
               console.log('XR session requested');
              this.session = session;
              this.startPresenting();
             });
        });
      }
  }

  startSession(display) {
   const  createVirtualReality = true;
    const sessionInitParameters = {
      exclusive : createVirtualReality,
      type: REALITY
    };
    if (this.sessionActive) {
      return;
    }
    if (this.session !== null) {
      this.session.end();
      this.session = null;
    }

    display.requestSession(sessionInitParameters).then(session => {
      this.session = session;
      this.session.realityType = 'vr';
      this.session.depthNear = 0.05;
      this.session.depthFar = 1000.0;
      this.domElementOriginal = this.renderer.domElement.parentNode;
      this.cameraCloned = this.camera.clone();
      if (this.camera.parent && this.camera.parent.type !== 'Scene') {
        this.poseTarget = this.camera.parent;
      } else {
        this.poseTarget = this.camera;
      }
      this.poseTargetCloned = this.poseTarget.clone();
      // Handle session lifecycle events

      this.renderer.domElement.style.width = '100%';
      this.renderer.domElement.style.height = '100%';
    }).catch(err => {
      console.error('Error requesting session', err);
    });
  };

  initController() {
    function getVRGamepad() {
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
    }
    this.gamepad = getVRGamepad();
    if (this.gamepad) {
      this.rayInput = new RayInput(this.camera, this.gamepad);
      // rayInput.setSize(renderer.getSize());
      let cameraGroup = new Group();
      cameraGroup.position.set(0, 0, 0);
      cameraGroup.add(this.camera);
      console.log('Add ray input');
      cameraGroup.add(this.rayInput.getMesh());
      this.scene.add(cameraGroup);
      this.physicsHandler = new PhysicsHandler(this.scene, this.rayInput);
      this.rayHandler = new RayHandler(this.scene, this.rayInput, this.physicsHandler);

      this.rayInput.rayInputEventEmitter.on('raydown', (opt_mesh) => {
          // handleRayDown_();
          // if (isDatGuiVisible && guiInputHelper !== null) {
      //     //     guiInputHelper.pressed(true);
      //     // }
          this.rayHandler.handleRayDown_(opt_mesh);
      });
      this.rayInput.rayInputEventEmitter.on('rayup', () => {
      //     // handleRayUp_();
      //     this.rayHandler.handleRayUp_();
      //     // if (isDatGuiVisible && guiInputHelper !== null) {
      //     //     guiInputHelper.pressed(false);
      //     // }
          this.rayHandler.handleRayUp_();
      });
      this.rayInput.rayInputEventEmitter.on('raydrag', () => { this.rayHandler.handleRayDrag_() });
      // this.rayInput.rayInputEventEmitter.on('raycancel', (opt_mesh) => { this.rayHandler.handleRayCancel_(opt_mesh) });

      this.sceneBuilder = new SceneBuilder(this.scene, this.camera, this.physicsHandler, this.audioHandler);
    }
  }

  render() {
    if (this.gamepad != null) {
      this.rayInput.update();
      this.sceneBuilder.update();
      this.physicsHandler.updatePhysics(this.gamepad);
    } else {
      this.initController();
    }
  }

  onXRFrame = (time, frame) => {
    this.render();
    let session = frame.session;
    this.renderer.render(this.scene, this.camera);
    session.requestAnimationFrame(this.onXRFrame);
  };

  startPresenting() {
      console.log('Start presenting');
    this.renderer.vr.enabled = true;
    // @ts-ignore
    this.renderer.xr.sessionActive = true;
    console.log('Renderer - enable VR');
    this.renderer.setClearColor( 0xCCCCCC );
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    console.log('Request present VR display');
    this.display.requestPresent([{source: this.renderer.domElement}])
        .then(() => {
          // let event: CustomEvent = new CustomEvent('sessionStarted', { detail: { session: this.session }});
          // dispatchEvent(event);
          this.audioHandler = new AudioHandler(this.scene);
            this.audioHandler.initAudio();
            this.audioHandler.audioElement.play();
          this.session.requestAnimationFrame(this.onXRFrame);
        });
  };

  endSession() {
    this.session.end();
    this.sessionActive = false;
    this.renderer.vr.enabled = false;
    this.display.exitPresent();
    this.domElementOriginal.appendChild(this.session.baseLayer._context.canvas);
    this.poseTarget.matrixAutoUpdate = false;
    this.poseTarget.matrix.copy(this.poseTargetCloned.matrix);
    this.poseTarget.updateMatrixWorld(true);
    this.camera.matrixWorldInverse.copy(this.cameraCloned.matrixWorldInverse);
    this.camera.projectionMatrix.copy(this.cameraCloned.projectionMatrix);
    this.camera.updateProjectionMatrix();
  };

  doRender() {
    this.renderer.render(this.scene, this.camera);
  };
}

