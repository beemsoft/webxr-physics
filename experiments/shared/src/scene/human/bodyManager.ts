import PhysicsHandler from '../../physics/physicsHandler';
import {Body, Box, ConeTwistConstraint, Sphere, Vec3} from 'cannon';
import {Camera, Material, MeshLambertMaterial, Scene} from 'three';
import Shape = CANNON.Shape;

export default class BodyManager {
  private scene: Scene;
  private physicsHandler: PhysicsHandler;
  private dollPosition: Vec3;
  headInitialPosition: Vec3;
  public bodyMaterial: MeshLambertMaterial;
  public leftHand: Body;
  public rightHand: Body;
  public headBody: Body;
  public leftFoot: Body;
  public rightFoot: Body;
  public upperLeftArm: Body;
  public upperRightArm: Body;
  upperBody: Body;
  pelvis: Body;
  public bodyParts = new Array<Body>();

  scale = 1; // 0.6;
  private color: number;
  private shouldersDistance: number;
  private upperBodyLength: number;
  private upperArmLength: number;

  constructor(scene: Scene, physicsHandler: PhysicsHandler) {
    this.scene = scene;
    this.physicsHandler = physicsHandler;
  }

  createRagdoll2(camera: Camera): Promise<boolean> {
    if (this.physicsHandler.rightHandController) {
      return this.createRagdoll(new Vec3(camera.position.x, 0, camera.position.z), 1, 0x772277, false);
    } else {
      return this.createRagdoll(new Vec3(0, 0, 0), 1, 0x772277, false);
    }
  }

  moveBody(position: Vec3) {
    for (let i = 0; i < this.bodyParts.length; i++) {
      let body = this.bodyParts[i];
      body.position.vadd(position, body.position);
    }
  }

  addToScene(body: Body, shape: Shape, material: Material, scene: Scene) {
    body.position.vadd(this.dollPosition, body.position);
    this.physicsHandler.addToScene(body, shape, null, material, scene);
    this.bodyParts.push(body);
  }

  addConeTwistConstraint(bodyA: Body, bodyB: Body, pivotA: Vec3, pivotB: Vec3) {
    let constraint = new ConeTwistConstraint(bodyA, bodyB, {
      pivotA: pivotA,
      pivotB: pivotB,
      axisA: new Vec3(1, 0, 0),
      axisB: new Vec3( 1, 0, 0),
      // @ts-ignore
      angle: Math.PI,
      twistAngle: Math.PI
    });
    this.physicsHandler.world.addConstraint(constraint);
  }

  createRagdoll(position: Vec3, scale: number, color: number, fixedPosition: boolean): Promise<boolean> {
    this.dollPosition = position;
    return new Promise(resolve => {
      this.scale = scale;
      this.color = color;
      this.bodyMaterial = new MeshLambertMaterial({color: this.color});
      this.shouldersDistance = 0.5 * this.scale;
      this.upperArmLength = 0.45 * this.scale;
      this.upperBodyLength = 0.6 * this.scale;
      const lowerArmLength = 0.45 * this.scale,
        upperArmSize = 0.14 * this.scale,
        lowerArmSize = 0.12 * this.scale,
        neckLength = 0.1 * this.scale,
        handRadius = 0.08 * this.scale,
        headRadius = 0.15 * this.scale,
        pelvisLength = 0.4 * this.scale,
        upperLegLength = 0.5 * this.scale,
        upperLegSize = 0.15 * this.scale,
        lowerLegSize = 0.15 * this.scale,
        lowerLegLength = 0.5 * this.scale;

      let headShape = new Sphere(headRadius),
        upperBodyShape = new Box(new Vec3(this.shouldersDistance * 0.5, this.upperBodyLength * 0.5, lowerArmSize * 0.5)),
        pelvisShape = new Box(new Vec3(this.shouldersDistance * 0.5, pelvisLength * 0.5, lowerArmSize * 0.5)),
        upperLegShape = new Box(new Vec3(upperLegSize * 0.5, upperLegLength * 0.5, lowerArmSize * 0.5)),
        lowerLegShape = new Box(new Vec3(lowerLegSize * 0.5, lowerLegLength * 0.5, lowerArmSize * 0.5));

      let positionLowerLeftLeg = new Vec3(-this.shouldersDistance / 2, lowerLegLength / 2 - 2, 0);
      let positionLowerRightLeg = new Vec3(this.shouldersDistance / 2, lowerLegLength / 2 - 2, 0);
      let lowerLeftLeg = new Body({mass: fixedPosition ? 0 : 1, position: positionLowerLeftLeg});
      this.leftFoot = lowerLeftLeg;
      let lowerRightLeg = new Body({mass: fixedPosition ? 0 : 1, position: positionLowerRightLeg});
      this.rightFoot = lowerRightLeg;
      this.addToScene(lowerLeftLeg, lowerLegShape, this.bodyMaterial, this.scene);
      this.addToScene(lowerRightLeg, lowerLegShape, this.bodyMaterial, this.scene);

      const positionUpperLeftLeg = new Vec3(-this.shouldersDistance / 2, lowerLeftLeg.position.y + lowerLegLength / 2 + upperLegLength / 2, 0);
      const positionUpperRightLeg = new Vec3(this.shouldersDistance / 2, lowerRightLeg.position.y + lowerLegLength / 2 + upperLegLength / 2, 0);
      let upperLeftLeg = new Body({mass: 1, position: positionUpperLeftLeg});
      let upperRightLeg = new Body({mass: 1, position: positionUpperRightLeg});
      this.addToScene(upperLeftLeg, upperLegShape, this.bodyMaterial, this.scene);
      this.addToScene(upperRightLeg, upperLegShape, this.bodyMaterial, this.scene);

      const positionPelvis = new Vec3(0, upperLeftLeg.position.y + upperLegLength / 2 + pelvisLength / 2, 0);
      this.pelvis = new Body({mass: 1, position: positionPelvis});
      this.addToScene(this.pelvis, pelvisShape, this.bodyMaterial, this.scene);

      const positionUpperBody = new Vec3(0, this.pelvis.position.y + pelvisLength / 2 + this.upperBodyLength / 2, 0);
      this.upperBody = new Body({mass: 1, position: positionUpperBody});
      this.addToScene(this.upperBody, upperBodyShape, this.bodyMaterial, this.scene);

      let headPosition = new Vec3(this.upperBody.position.x, this.upperBody.position.y + this.upperBodyLength / 2 + headRadius + neckLength, 0);
      let head = new Body({mass: 1, position: headPosition});
      this.addToScene(head, headShape, this.bodyMaterial, this.scene);
      this.headBody = head;
      return this.addArms().then(() => {
        let neckJoint = new ConeTwistConstraint(this.headBody, this.upperBody, {
          pivotA: new Vec3(0, -headRadius - neckLength / 2, 0),
          pivotB: new Vec3(0, this.upperBodyLength / 2, 0)
        });
        this.physicsHandler.world.addConstraint(neckJoint);

        let leftKneeJoint = new ConeTwistConstraint(lowerLeftLeg, upperLeftLeg, {
          pivotA: new Vec3(0, lowerLegLength / 2, 0),
          pivotB: new Vec3(0, -upperLegLength / 2, 0)
        });
        let rightKneeJoint = new ConeTwistConstraint(lowerRightLeg, upperRightLeg, {
          pivotA: new Vec3(0, lowerLegLength / 2, 0),
          pivotB: new Vec3(0, -upperLegLength / 2, 0)
        });
        this.physicsHandler.world.addConstraint(leftKneeJoint);
        this.physicsHandler.world.addConstraint(rightKneeJoint);

        let leftHipJoint = new ConeTwistConstraint(upperLeftLeg, this.pelvis, {
          pivotA: new Vec3(0, upperLegLength / 2, 0),
          pivotB: new Vec3(-this.shouldersDistance / 2, -pelvisLength / 2, 0)
        });
        let rightHipJoint = new ConeTwistConstraint(upperRightLeg, this.pelvis, {
          pivotA: new Vec3(0, upperLegLength / 2, 0),
          pivotB: new Vec3(this.shouldersDistance / 2, -pelvisLength / 2, 0)
        });
        this.physicsHandler.world.addConstraint(leftHipJoint);
        this.physicsHandler.world.addConstraint(rightHipJoint);

        let spineJoint = new ConeTwistConstraint(this.pelvis, this.upperBody, {
          pivotA: new Vec3(0, pelvisLength / 2, 0),
          pivotB: new Vec3(0, -this.upperBodyLength / 2, 0),
          axisA: new Vec3(0, 1, 0),
          axisB: new Vec3(0, 1, 0),
          // @ts-ignore
          angle: Math.PI,
          twistAngle: Math.PI / 3
        });
        this.physicsHandler.world.addConstraint(spineJoint);

        let pivotA = new Vec3(-this.shouldersDistance/2, this.upperBodyLength/2,0);
        let pivotB = new Vec3(this.upperArmLength/2, 0,0);
        this.addConeTwistConstraint(this.upperBody, this.upperLeftArm, pivotA, pivotB);
        pivotA = new Vec3(this.shouldersDistance/2, this.upperBodyLength/2,0);
        pivotB = new Vec3(-this.upperArmLength/2, 0,0);
        this.addConeTwistConstraint(this.upperBody, this.upperRightArm, pivotA, pivotB);

        this.headInitialPosition = new Vec3().copy(headPosition);
        resolve(true);
      });
    });
  }

  private addArms(): Promise<boolean> {
    return new Promise(resolve => {
      const shouldersDistance = 0.5 * this.scale,
        upperArmLength = 0.45 * this.scale,
        lowerArmLength = 0.45 * this.scale,
        upperArmSize = 0.14 * this.scale,
        lowerArmSize = 0.12 * this.scale,
        handRadius = 0.08 * this.scale,
        upperBodyLength = 0.6 * this.scale;

      let handShape = new Sphere(handRadius),
        upperArmShape = new Box(new Vec3(upperArmLength * 0.5, upperArmSize * 0.5, upperArmSize * 0.5)),
        lowerArmShape = new Box(new Vec3(lowerArmLength * 0.5, lowerArmSize * 0.5, lowerArmSize * 0.5));

      let positionUpperLeftArm = new Vec3(-shouldersDistance / 2 - upperArmLength / 2, this.upperBody.position.y + upperBodyLength / 2, 0);
      this.upperLeftArm = new Body({ mass: 1, position: positionUpperLeftArm });
      const positionUpperRightArm = new Vec3(shouldersDistance / 2 + upperArmLength / 2, this.upperBody.position.y + upperBodyLength / 2, 0);
      this.upperRightArm = new Body({ mass: 1, position: positionUpperRightArm });
      this.addToScene(this.upperLeftArm, upperArmShape, this.bodyMaterial, this.scene);
      this.addToScene(this.upperRightArm, upperArmShape, this.bodyMaterial, this.scene);

      const positionLowerLeftArm = new Vec3(this.upperLeftArm.position.x - lowerArmLength / 2 - upperArmLength / 2, this.upperLeftArm.position.y, 0);
      let lowerLeftArm = new Body({mass: 1, position: positionLowerLeftArm});
      const positionLowerRightArm = new Vec3(this.upperRightArm.position.x + lowerArmLength / 2 + upperArmLength / 2, this.upperRightArm.position.y, 0);
      let lowerRightArm = new Body({mass: 1, position: positionLowerRightArm});
      this.addToScene(lowerLeftArm, lowerArmShape, this.bodyMaterial, this.scene);
      this.addToScene(lowerRightArm, lowerArmShape, this.bodyMaterial, this.scene);

      const positionRightHand = new Vec3(lowerRightArm.position.x + lowerArmLength / 2 + handRadius, this.upperRightArm.position.y, 0);
      let rightHand = new Body({mass: 1, position: positionRightHand,});
      this.addToScene(rightHand, handShape, this.bodyMaterial, this.scene);
      this.rightHand = rightHand;

      let rightWristJoint = new ConeTwistConstraint(rightHand, lowerRightArm, {
        pivotA: new Vec3(-handRadius, 0, 0),
        pivotB: new Vec3(lowerArmLength / 2, 0, 0)
      });
      this.physicsHandler.world.addConstraint(rightWristJoint);

      const positionLeftHand = new Vec3((lowerLeftArm.position.x - lowerArmLength / 2 - handRadius), this.upperLeftArm.position.y, 0);
      let leftHand = new Body({mass: 1, position: positionLeftHand,});
      this.addToScene(leftHand, handShape, this.bodyMaterial, this.scene);
      this.leftHand = leftHand;

      let leftWristJoint = new ConeTwistConstraint(leftHand, lowerLeftArm, {
        pivotA: new Vec3(handRadius, 0, 0),
        pivotB: new Vec3(-lowerArmLength / 2, 0, 0)
      });
      this.physicsHandler.world.addConstraint(leftWristJoint);

      let leftElbowJoint = new ConeTwistConstraint(lowerLeftArm, this.upperLeftArm, {
        pivotA: new Vec3(lowerArmLength / 2, 0, 0),
        pivotB: new Vec3(-upperArmLength / 2, 0, 0)
      });
      let rightElbowJoint = new ConeTwistConstraint(lowerRightArm, this.upperRightArm, {
        pivotA: new Vec3(-lowerArmLength / 2, 0, 0),
        pivotB: new Vec3(upperArmLength / 2, 0, 0)
      });
      this.physicsHandler.world.addConstraint(leftElbowJoint);
      this.physicsHandler.world.addConstraint(rightElbowJoint);
      resolve(true);
    })
  }

  getLeftShoulderPivotA() {
    return new Vec3(-this.shouldersDistance / 2, this.upperBodyLength / 2, 0);
  }

  getLeftShoulderPivotB() {
    return new Vec3(this.upperArmLength / 2, 0, 0);
  }

  getRightShoulderPivotA() {
    return new Vec3(this.shouldersDistance / 2, this.upperBodyLength / 2, 0);
  }

  getRightShoulderPivotB() {
    return new Vec3(-this.upperArmLength / 2, 0, 0);
  }
}
