/*
 * Copyright 2019 Hans Beemsterboer
 *
 * This file has been modified by Hans Beemsterboer to be used in
 * the webxr-physics project.
 *
 * Copyright 2016 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import OrientationArmModel from './orientation-arm-model'
import {EventEmitter} from 'eventemitter3'
import RayController from './ray-controller'
import {Camera, PerspectiveCamera, Quaternion, Vector2, Vector3} from "three";
import RayRenderer from './ray-renderer';

export default class RayInput {
  private camera: Camera;
  private gamepad: Gamepad;
  renderer: RayRenderer;
  private controller: RayController;
  private armModel: OrientationArmModel;
  private pointerNdc: Vector2;
  private handlers: number[];
  public rayInputEventEmitter = new EventEmitter();

  constructor(camera: PerspectiveCamera, gamepad: Gamepad) {
    this.camera = camera;
    this.gamepad = gamepad;
    this.renderer = new RayRenderer(camera);
    this.controller = new RayController(gamepad);
    this.armModel = new OrientationArmModel();

      this.controller.controllerEventEmitter.on('raydown', () => {
        this.onRayDown_();
      });
    this.controller.controllerEventEmitter.on('rayup', () => {
      this.onRayUp_()
    });
    // this.controller.on('raycancel', this.onRayCancel_.bind(this));
    // this.controller.on('pointermove', this.onPointerMove_.bind(this));
    this.controller.controllerEventEmitter.on('raydrag', () => {
      this.onRayDrag_()
    });
    // this.renderer.on('rayover', (mesh) => { super.emit('rayover', mesh) });
    // this.renderer.on('rayout', (mesh) => { super.emit('rayout', mesh) });

    // By default, put the pointer offscreen.
    // this.pointerNdc = new Vector2(1, 1);

    // Event handlers.
    this.handlers = [];
  }

  add(object: Object) {
    this.renderer.add(object);
  }

  remove(object: Object) {
    // this.renderer.remove(object);
    // delete this.handlers[object.id]
  }

  update() {
    let lookAt = new Vector3(0, 0, -1);
    lookAt.applyQuaternion(this.camera.quaternion);
    let numberArray = [];
    numberArray[0] = this.gamepad.pose.orientation[0];
    numberArray[1] = this.gamepad.pose.orientation[1];
    numberArray[2] = this.gamepad.pose.orientation[2];
    numberArray[3] = this.gamepad.pose.orientation[3];
    let controllerOrientation = new Quaternion().fromArray(numberArray);

    this.armModel.setHeadOrientation(this.camera.quaternion);
    this.armModel.setHeadPosition(this.camera.position);
    this.armModel.setControllerOrientation(controllerOrientation);
    this.armModel.update();

    let modelPose = this.armModel.getPose();
    this.renderer.setPosition(modelPose.position);
    this.renderer.setOrientation(modelPose.orientation);

    this.renderer.setRayVisibility(true);
    this.renderer.setReticleVisibility(true);

    this.renderer.setActive(true);

    this.renderer.update();
    this.controller.update();
  }

  getMesh() {
    return this.renderer.getReticleRayMesh();
  }

  // getOrigin() {
  //   return this.renderer.getOrigin();
  // }
  //
  // getDirection() {
  //   return this.renderer.getDirection();
  // }
  //
  // getRightDirection() {
  //   let lookAt = new Vector3(0, 0, -1);
  //   lookAt.applyQuaternion(this.camera.quaternion);
  //   return new Vector3().crossVectors(lookAt, this.camera.up);
  // }
  //
  onRayDown_() {
    this.renderer.update();
    let mesh = this.renderer.getSelectedMesh();
    this.rayInputEventEmitter.emit('raydown', mesh);
    this.renderer.setActive(true);
  }

  onRayDrag_() {
    this.renderer.setDragging(true);
    this.rayInputEventEmitter.emit('raydrag');
  }

  onRayUp_() {
    this.renderer.setDragging(false);
    let mesh = this.renderer.getSelectedMesh();
    this.rayInputEventEmitter.emit('rayup', mesh);
    this.renderer.setActive(false);
  }
  //
  // onRayCancel_() {
  //   this.renderer.setDragging(false);
  //   let mesh = this.renderer.getSelectedMesh();
  //   super.emit('raycancel', mesh);
  // }
  //
  // onPointerMove_(ndc) {
  //   this.pointerNdc.copy(ndc);
  // }
}
