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

import {
  ArrowHelper,
  CylinderGeometry,
  Group,
  Mesh,
  MeshBasicMaterial,
  Object3D,
  PerspectiveCamera,
  Quaternion,
  Raycaster,
  SphereGeometry,
  Vector3
} from "three";
import OrientationArmModel from "./orientation-arm-model";

const RETICLE_DISTANCE = 3;
const INNER_RADIUS = 0.02;
const OUTER_RADIUS = 0.04;
const RAY_RADIUS = 0.02;

export default class RayRenderer {
  private armModel: OrientationArmModel;
  private cameraGroup: Group;
  private raycaster: Raycaster;
  private selected = [];
  private meshes = [];
  private position: Vector3;
  private orientation: Quaternion;
  private root: Object3D;
  reticle: Group;
  private ray: Mesh;
  private reticleDistance: number;
  private isActive: boolean;
  private isDragging: boolean;

  constructor(cameraGroup: Group, armModel: OrientationArmModel) {
    this.cameraGroup = cameraGroup;
    this.armModel = armModel;
    this.raycaster = new Raycaster();
    this.position = new Vector3();
    this.orientation = new Quaternion();
    this.root = new Object3D();
    this.reticle = this.createReticle_();
    this.root.add(this.reticle);
    this.ray = this.createRay_();
    this.root.add(this.ray);
    this.reticleDistance = RETICLE_DISTANCE;
  }

  add(object: Mesh) {
    this.meshes[object.id] = object;
  }

  remove(object) {
    const id = object.id;
    if (this.meshes[id]) {
      delete this.meshes[id];
    }
    if (this.selected[id]) {
      delete this.selected[object.id];
    }
  }

  update() {
    let pos = this.armModel.getPose().position;
    let posGroup = this.cameraGroup.position;
    let pos2 = new Vector3(pos.x + posGroup.x, pos.y + posGroup.y, pos.z + posGroup.z);
    this.raycaster.set(pos2, this.raycaster.ray.direction);
    for (let id in this.meshes) {
      let mesh = this.meshes[id];
      let intersects = this.raycaster.intersectObject(mesh, true);
      if (intersects.length > 1) {
        console.warn('Unexpected: multiple meshes intersected.');
      }
      let isIntersected = (intersects.length > 0);
      let isSelected = this.selected[id];

      if (isIntersected && !isSelected) {
        this.selected[id] = true;
        if (this.isActive) {
          // super.emit('rayover', mesh);
        }
      }

      if (!isIntersected && isSelected && !this.isDragging) {
        delete this.selected[id];
        this.moveReticle_(null);
        if (this.isActive) {
          // super.emit('rayout', mesh);
        }
      }

      if (isIntersected) {
        this.moveReticle_(intersects);
      }
    }
  }

  setPosition(vector) {
    // vector.x += 2;
    // vector.y += 2;
    this.position.copy(vector);
    this.raycaster.ray.origin.copy(vector);
    this.updateRaycaster_();
  }

  getOrigin() {
    return this.raycaster.ray.origin;
  }

  setOrientation(quaternion) {
    this.orientation.copy(quaternion);
    const pointAt = new Vector3(0, 0, -1).applyQuaternion(quaternion);
    this.raycaster.ray.direction.copy(pointAt);
    this.updateRaycaster_();
  }

  getDirection() {
    return this.raycaster.ray.direction;
  }

  /**
   * Gets the mesh, which includes reticle and/or ray. This mesh is then added
   * to the scene.
   */
  getReticleRayMesh() {
    return this.root;
  }

  getSelectedMesh() {
    let count = 0;
    let mesh;
    for (let id in this.selected) {
      count += 1;
      mesh = this.meshes[id];
    }
    if (count > 1) {
      console.warn('More than one mesh selected.');
    }
    return mesh;
  }

  /**
   * Hides and shows the reticle.
   */
  setReticleVisibility(isVisible) {
    this.reticle.visible = isVisible;
  }

  /**
   * Enables or disables the raycasting ray which gradually fades out from
   * the origin.
   */
  setRayVisibility(isVisible) {
    this.ray.visible = isVisible;
  }

  /**
   * Enables and disables the raycaster. For touch, where finger up means we
   * shouldn't be raycasting.
   */
  setActive(isActive) {
    // If nothing changed, do nothing.
    if (this.isActive === isActive) {
      return;
    }
    // TODO(smus): Show the ray or reticle adjust in response.
    this.isActive = isActive;

    if (!isActive) {
      this.moveReticle_(null);
      for (let id in this.selected) {
        let mesh = this.meshes[id];
        delete this.selected[id];
        // super.emit('rayout', mesh);
      }
    }
  }

  setDragging(isDragging) {
    this.isDragging = isDragging;
  }

  updateRaycaster_() {
      const ray = this.raycaster.ray;

      // Position the reticle at a distance, as calculated from the origin and
    // direction.
      const position = this.reticle.position;
      position.copy(ray.direction);
    position.multiplyScalar(this.reticleDistance);
      position.add(ray.origin);

    // Set position and orientation of the ray so that it goes from origin to
    // reticle.
      const delta = new Vector3().copy(ray.direction);
      delta.multiplyScalar(this.reticleDistance);
    this.ray.scale.y = delta.length();
      const arrow = new ArrowHelper(ray.direction, ray.origin);
      this.ray.rotation.copy(arrow.rotation);
    this.ray.position.addVectors(ray.origin, delta.multiplyScalar(0.5));
  }

  createReticle_() {
    let innerGeometry = new SphereGeometry(INNER_RADIUS, 32, 32);
    let innerMaterial = new MeshBasicMaterial({
      precision: "mediump",
      color: 0xffffff,
      transparent: true,
      opacity: 0.9
    });
    let inner = new Mesh(innerGeometry, innerMaterial);

    let outerGeometry = new SphereGeometry(OUTER_RADIUS, 32, 32);
    let outerMaterial = new MeshBasicMaterial({
      precision: "mediump",
      color: 0x333333,
      transparent: true,
      opacity: 0.3
    });
    let outer = new Mesh(outerGeometry, outerMaterial);

    let reticle = new Group();
    reticle.add(inner);
    reticle.add(outer);
    return reticle;
  }

  /**
   * Moves the reticle to a position so that it's just in front of the mesh that
   * it intersected with.
   */
  moveReticle_(intersections) {
    // If no intersection, return the reticle to the default position.
    let distance = RETICLE_DISTANCE;
    if (intersections) {
      // Otherwise, determine the correct distance.
      let inter = intersections[0];
      distance = inter.distance;
    }

    this.reticleDistance = distance;
    // this.updateRaycaster_();
  }

  createRay_() {
    const geometry = new CylinderGeometry(RAY_RADIUS, RAY_RADIUS, 1, 32);
    const material = new MeshBasicMaterial({
      precision: "mediump",
      color: 0xffffff,
      transparent: true,
      opacity: 0.3
    });
    return new Mesh(geometry, material);
  }
}
