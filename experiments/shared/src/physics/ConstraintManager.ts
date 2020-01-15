import {
  Body, ConeTwistConstraint,
  PointToPointConstraint,
  Sphere,
  Vec3
} from "cannon";
import PhysicsHandler from './physicsHandler';

interface IDictionary {
  [key: string]: PointToPointConstraint;
}

const ZERO_POINT = new Vec3(0, 0, 0);

export default class ConstraintManager {
  constructor(physicsHandler: PhysicsHandler) {
    this.physicsHandler = physicsHandler;
  }

  private physicsHandler: PhysicsHandler;
  namedConstraints: IDictionary = {};

  addPointerConstraintToBody(constraintName: string, body: Body, maxForce: number) {
      let jointBody = this.createJointBody();
      let constraint = new PointToPointConstraint(body, ZERO_POINT, jointBody, ZERO_POINT, maxForce);
      this.namedConstraints[constraintName] = constraint;
      this.physicsHandler.world.addConstraint(constraint);
  }

  addConstraintToBody(constraintName: string, constrainedBody: Body, jointBody: Body, maxForce: number) {
    this.namedConstraints[constraintName] = new PointToPointConstraint(constrainedBody, ZERO_POINT, jointBody, ZERO_POINT, maxForce);
    this.physicsHandler.world.addConstraint(this.namedConstraints[constraintName]);
  }

  addConeTwistConstraint(constraintName: string, bodyA: Body, bodyB: Body, pivotA: Vec3, pivotB: Vec3) {
    this.namedConstraints[constraintName] = new ConeTwistConstraint(bodyA, bodyB, {
      pivotA: pivotA,
      pivotB: pivotB,
      // axisA: new Vec3(1, 0, 0),
      // axisB: new Vec3( 1, 0, 0),
      // @ts-ignore
      angle: Math.PI,
      twistAngle: Math.PI
    });
    this.physicsHandler.world.addConstraint(this.namedConstraints[constraintName]);
  }

  removeJointConstraint(namedConstraint: string){
    this.physicsHandler.world.removeConstraint(this.namedConstraints[namedConstraint]);
    this.namedConstraints[namedConstraint] = null;
  }

  moveJointToPoint(constraintName: string, x: number, y: number, z: number) {
    if (this.namedConstraints[constraintName]) {
      this.namedConstraints[constraintName].bodyB.position.set(x, y, z);
      this.namedConstraints[constraintName].update();
    }
  }

  private createJointBody(): Body {
    let shape = new Sphere(0.01);
    let jointBody = new Body({ mass: 0 });
    jointBody.addShape(shape);
    jointBody.collisionFilterGroup = 0;
    jointBody.collisionFilterMask = 0;
    this.physicsHandler.world.addBody(jointBody);
    return jointBody;
  }

}
