/*
 * Copyright 2019 Hans Beemsterboer
 *
 * This file has been modified by Hans Beemsterboer to be used in
 * the webxr-physics project.
 *
 * Copyright (c) 2015 cannon.js Authors
 *
 * Permission is hereby granted, free of charge, to any person
 * obtaining a copy of this software and associated documentation
 * files (the "Software"), to deal in the Software without
 * restriction, including without limitation the rights to use, copy,
 * modify, merge, publish, distribute, sublicense, and/or sell copies
 * of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be
 * included in all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
 * EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
 * MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
 * NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
 * LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
 * OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
 * WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */

import {
  Body,
  ContactMaterial,
  Material,
  NaiveBroadphase,
  PointToPointConstraint,
  Quaternion,
  Sphere,
  Vec3,
  World
} from "cannon";
import {Mesh, Object3D, Vector3} from "three";
import {BodyConverter} from '../util/BodyConverter';

export default class PhysicsHandler {
  dt: number;
  protected readonly meshes: Object3D[];
  protected readonly bodies: Body[];
  private jointBody: Body;
  world: World;
  pointerConstraint: PointToPointConstraint;
  constraintDown: boolean;
  private constrainedBody: Body;
  public handMaterial = new Material("hand");
  public rightHandController: Body;
  public leftHandController: Body;

  constructor() {
    this.dt = 1 / 60;
    this.meshes = [];
    this.bodies = [];
    this.addWorld();
    this.addJointBody();
    this.pointerConstraint = null;
    this.constraintDown = false
  }

  addContactMaterial(material1: Material, material2: Material, friction, restitution) {
    let contactMaterial = new ContactMaterial(material1, material2, { friction: friction, restitution: restitution });
    this.world.addContactMaterial(contactMaterial);
  }

  private addWorld() {
    let world = new World();
    world.quatNormalizeSkip = 0;
    world.quatNormalizeFast = false;
    world.gravity.set(0, 0, 0);
    world.broadphase = new NaiveBroadphase();
    this.world = world;
  }

  private addJointBody() {
    let shape = new Sphere(0.1);
    let jointBody = new Body({mass: 0});
    jointBody.addShape(shape);
    jointBody.collisionFilterGroup = 0;
    jointBody.collisionFilterMask = 0;
    this.world.addBody(jointBody);
    this.jointBody = jointBody;
  }

  updatePhysics() {
    this.world.step(this.dt);
    for (let i = 0; i !== this.meshes.length; i++) {
      if (this.meshes[i]) {
        this.meshes[i].position.x = this.bodies[i].position.x;
        this.meshes[i].position.y = this.bodies[i].position.y;
        this.meshes[i].position.z = this.bodies[i].position.z;
        this.meshes[i].quaternion.x = this.bodies[i].quaternion.x;
        this.meshes[i].quaternion.y = this.bodies[i].quaternion.y;
        this.meshes[i].quaternion.z = this.bodies[i].quaternion.z;
        this.meshes[i].quaternion.w = this.bodies[i].quaternion.w;
      }
    }
  }

  addMesh(mesh: Mesh) {
    this.meshes.push(mesh);
  }

  addBody(body: Body) {
    this.bodies.push(body);
    this.world.addBody(body);
  }

  addControllerBody(body: Body, isRightHand: Boolean) {
    this.addBody(body);
    if (isRightHand) {
      this.rightHandController = body;
    } else {
      this.leftHandController = body;
    }
  }

  addVisual(body, material): Object3D {
    let mesh: Object3D;
    if(body instanceof Body){
      mesh = BodyConverter.shape2mesh(body, material);
    }
    if(mesh) {
      mesh.position.x = body.position.x;
      mesh.position.y = body.position.y;
      mesh.position.z = body.position.z;
      this.meshes.push(mesh);
    }
    if (!mesh.position) {
      console.log('ERROR: no position for mesh!');
    }
    return mesh;
  }

  // Used for ray handler
  addPointerConstraintToMesh(pos: Vector3, mesh: Mesh) {
    let idx = this.meshes.indexOf(mesh);
    if(idx !== -1){
      this.addPointerConstraintToBody(pos.x,pos.y,pos.z,this.bodies[idx]);
    }
  }

  addPointerConstraintToBody(x: number, y: number, z: number, body: Body) {
    // The cannon body constrained by the pointer joint
    this.constrainedBody = body;

    // Vector to the clicked point, relative to the body
    let v1 = new Vec3(x,y,z).vsub(this.constrainedBody.position);

    // Apply anti-quaternion to vector to transform it into the local body coordinate system
    let antiRot = this.constrainedBody.quaternion.inverse();
    let pivot = new Quaternion(antiRot.x, antiRot.y, antiRot.z, antiRot.w).vmult(v1); // pivot is not in local body coordinates

    // Move the cannon click marker particle to the click position
    this.jointBody.position.set(x,y,z);

    // Create a new constraint
    // The pivot for the jointBody is zero
    this.pointerConstraint = new PointToPointConstraint(this.constrainedBody, pivot, this.jointBody, new Vec3(0,0,0));

    // Add the constraint to world
    this.world.addConstraint(this.pointerConstraint);
  }

  // This function moves the transparent joint body to a new position in space
  moveJointToPoint(x: number, y: number, z: number) {
    // Move the joint body to a new position
    this.jointBody.position.set(x,y,z);
    this.pointerConstraint.update();
  }
}
