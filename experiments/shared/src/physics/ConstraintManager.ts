import {
  Body,
  PointToPointConstraint,
  Quaternion,
  Sphere,
  Vec3
} from "cannon";
import PhysicsHandler from './physicsHandler';

export default class ConstraintManager {
  constructor(physicsHandler: PhysicsHandler) {
    this.physicsHandler = physicsHandler;
  }

  private physicsHandler: PhysicsHandler;
  private jointBodies: Body[] = [];
  private constrainedBodies: Body[] = [];
  private targets: Vec3[] = [];
  private pointerConstraints: PointToPointConstraint[] = [];
  private numberOfConstraints = 0;

  addPointerConstraintToBody(index: number, body: Body, maxForce: number) {
    this.constrainedBodies[this.numberOfConstraints] = body;

    // Vector to the clicked point, relative to the body
    let v1 = body.position.vsub(this.constrainedBodies[this.numberOfConstraints].position);

    // Apply anti-quaternion to vector to transform it into the local body coordinate system
    let antiRot = this.constrainedBodies[this.numberOfConstraints].quaternion.inverse();
    let pivot = new Quaternion(antiRot.x, antiRot.y, antiRot.z, antiRot.w).vmult(v1); // pivot is not in local body coordinates

    this.jointBodies[this.numberOfConstraints] = this.createJointBody();
    // Move the cannon click marker particle to the click position
    this.targets[this.numberOfConstraints] = body.position;
    // this.jointBodies[this.numberOfConstraints].position.set(x,y,z);

    // Create a new constraint
    // The pivot for the jointBody is zero
    this.pointerConstraints[this.numberOfConstraints] = new PointToPointConstraint(body, pivot, this.jointBodies[this.numberOfConstraints], new Vec3(0, 0, 0), maxForce);

    // Add the constraint to world
    this.physicsHandler.world.addConstraint(this.pointerConstraints[this.numberOfConstraints]);
    this.numberOfConstraints = this.numberOfConstraints + 1;
  }

  moveJointToPoint(index: number, x: number, y: number, z: number) {
    if (index < this.jointBodies.length) {
      this.jointBodies[index].position.set(x, y, z);
      this.pointerConstraints[index].update();
    }
  }

  private createJointBody(): Body {
    let shape = new Sphere(0.1);
    let jointBody = new Body({ mass: 0 });
    jointBody.addShape(shape);
    jointBody.collisionFilterGroup = 0;
    jointBody.collisionFilterMask = 0;
    this.physicsHandler.world.addBody(jointBody);
    return jointBody;
  }

  update() {
    for (let i = 0; i !== this.pointerConstraints.length; i++) {
      // this.moveJointToPoint(i, this.targets[i].x, this.targets[i].y, this.targets[i].z);
    }
  }

}