import PhysicsHandler from '../../../../shared/src/physics/physicsHandler';
import {Body, Box, ConeTwistConstraint, Sphere, Vec3} from 'cannon';
import {MeshLambertMaterial, Scene} from 'three';

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
  scale = 1.2; // 0.6;
  private color: number;
  private shouldersDistance: number;
  private upperBodyLength: number;
  private upperArmLength: number;

  constructor(scene: Scene, physicsHandler: PhysicsHandler) {
    this.scene = scene;
    this.physicsHandler = physicsHandler;
  }

  createRagdoll(position: Vec3, scale: number, color: number, fixedPosition: boolean){
    this.dollPosition = position;
    this.scale = scale;
    this.color = color;
    this.bodyMaterial = new MeshLambertMaterial( { color: this.color} );

    let numBodiesAtStart = this.physicsHandler.world.bodies.length;

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

    let headShape =      new Sphere(headRadius),
      upperBodyShape = new Box(new Vec3(this.shouldersDistance * 0.5, this.upperBodyLength * 0.5, lowerArmSize * 0.5)),
      pelvisShape =    new Box(new Vec3(this.shouldersDistance * 0.5, pelvisLength * 0.5, lowerArmSize * 0.5)),
      upperLegShape =  new Box(new Vec3(upperLegSize * 0.5, upperLegLength * 0.5, lowerArmSize * 0.5)),
      lowerLegShape =  new Box(new Vec3(lowerLegSize * 0.5, lowerLegLength * 0.5, lowerArmSize * 0.5));

    let positionLowerLeftLeg = new Vec3(-this.shouldersDistance/2,lowerLegLength / 2, 0);
    let positionLowerRightLeg = new Vec3(this.shouldersDistance/2,lowerLegLength / 2, 0);
    // Lower legs
    let lowerLeftLeg = new Body({
      mass: fixedPosition ? 0 : 1,
      position: positionLowerLeftLeg
    });
    this.leftFoot = lowerLeftLeg;
    let lowerRightLeg = new Body({
      mass: fixedPosition ? 0 : 1,
      position: positionLowerRightLeg
    });
    this.rightFoot = lowerRightLeg;
    lowerLeftLeg.addShape(lowerLegShape);
    this.physicsHandler.addBody(lowerLeftLeg);
    let mesh = this.physicsHandler.addVisual(lowerLeftLeg, this.bodyMaterial);
    this.scene.add(mesh);

    lowerRightLeg.addShape(lowerLegShape);
    this.physicsHandler.addBody(lowerRightLeg);
    mesh = this.physicsHandler.addVisual(lowerRightLeg, this.bodyMaterial);
    this.scene.add(mesh);

    // Upper legs
    const positionUpperLeftLeg = new Vec3(-this.shouldersDistance/2,lowerLeftLeg.position.y+lowerLegLength/2+upperLegLength / 2, 0);
    const positionUpperRightLeg = new Vec3(this.shouldersDistance/2,lowerRightLeg.position.y+lowerLegLength/2+upperLegLength / 2, 0);
    let upperLeftLeg = new Body({
      mass: 1,
      position: positionUpperLeftLeg,
    });
    let upperRightLeg = new Body({
      mass: 1,
      position: positionUpperRightLeg,
    });
    upperLeftLeg.addShape(upperLegShape);
    upperRightLeg.addShape(upperLegShape);
    this.physicsHandler.addBody(upperLeftLeg);
    this.physicsHandler.addBody(upperRightLeg);
    mesh = this.physicsHandler.addVisual(upperLeftLeg, this.bodyMaterial);
    this.scene.add(mesh);
    mesh = this.physicsHandler.addVisual(upperRightLeg, this.bodyMaterial);
    this.scene.add(mesh);

    // Pelvis
    const positionPelvis = new Vec3(0, upperLeftLeg.position.y+upperLegLength/2+pelvisLength/2, 0);
    this.pelvis = new Body({
      mass: 1,
      position: positionPelvis,
    });
    this.pelvis.addShape(pelvisShape);
    this.physicsHandler.addBody(this.pelvis);
    mesh = this.physicsHandler.addVisual(this.pelvis, this.bodyMaterial);
    this.scene.add(mesh);

    // Upper body
    const positionUpperBody = new Vec3(0,this.pelvis.position.y+pelvisLength/2+this.upperBodyLength/2, 0);
    this.upperBody = new Body({
      mass: 1,
      position: positionUpperBody
    });
    this.upperBody.addShape(upperBodyShape);
    this.physicsHandler.addBody(this.upperBody);
    mesh = this.physicsHandler.addVisual(this.upperBody, this.bodyMaterial);
    this.scene.add(mesh);

    // Head
    let headPosition = new Vec3(this.upperBody.position.x,this.upperBody.position.y+this.upperBodyLength/2+headRadius+neckLength, position.z);
    let head = new Body({
      mass: 1,
      position: headPosition
    });
    this.headBody = head;
    head.addShape(headShape);
    this.physicsHandler.addBody(head);
    mesh = this.physicsHandler.addVisual(head, this.bodyMaterial);
    mesh.position.set(headPosition.x, headPosition.y, headPosition.z);
    this.scene.add(mesh);

    this.addArms();

    // Neck joint
    let neckJoint = new ConeTwistConstraint(this.headBody, this.upperBody, {
      pivotA: new Vec3(0,-headRadius-neckLength/2,0),
      pivotB: new Vec3(0,this.upperBodyLength/2,0)
    });
    this.physicsHandler.world.addConstraint(neckJoint);

    // Knee joints
    let leftKneeJoint = new ConeTwistConstraint(lowerLeftLeg, upperLeftLeg, {
      pivotA: new Vec3(0, lowerLegLength/2,0),
      pivotB: new Vec3(0,-upperLegLength/2,0)
    });
    let rightKneeJoint= new ConeTwistConstraint(lowerRightLeg, upperRightLeg, {
      pivotA: new Vec3(0, lowerLegLength/2,0),
      pivotB: new Vec3(0,-upperLegLength/2,0)
    });
    this.physicsHandler.world.addConstraint(leftKneeJoint);
    this.physicsHandler.world.addConstraint(rightKneeJoint);

    // Hip joints
    let leftHipJoint = new ConeTwistConstraint(upperLeftLeg, this.pelvis, {
      pivotA: new Vec3(0, upperLegLength/2,0),
      pivotB: new Vec3(-this.shouldersDistance/2,-pelvisLength/2,0)
    });
    let rightHipJoint = new ConeTwistConstraint(upperRightLeg, this.pelvis, {
      pivotA: new Vec3(0, upperLegLength/2,0),
      pivotB: new Vec3(this.shouldersDistance/2,-pelvisLength/2,0)
    });
    this.physicsHandler.world.addConstraint(leftHipJoint);
    this.physicsHandler.world.addConstraint(rightHipJoint);

    // Spine
    let spineJoint = new ConeTwistConstraint(this.pelvis, this.upperBody, {
      pivotA: new Vec3(0,pelvisLength/2,0),
      pivotB: new Vec3(0,-this.upperBodyLength/2,0),
      axisA: new Vec3(0, 1, 0),
      axisB: new Vec3(0, 1, 0),
      // @ts-ignore
      angle: Math.PI,
      twistAngle: Math.PI/3
    });
    this.physicsHandler.world.addConstraint(spineJoint);


    // Move all body parts
    for (let i = numBodiesAtStart; i < this.physicsHandler.world.bodies.length; i++) {
      let body = this.physicsHandler.world.bodies[i];
      body.position.vadd(position, body.position);
    }

    this.headBody.position = headPosition;
    this.headInitialPosition = new Vec3().copy(headPosition);
    this.headInitialPosition.z = this.dollPosition.z;
  }

  private addArms() {
    const shouldersDistance = 0.5 * this.scale,
      upperArmLength = 0.45 * this.scale,
      lowerArmLength = 0.45 * this.scale,
      upperArmSize = 0.14 * this.scale,
      lowerArmSize = 0.12 * this.scale,
      handRadius = 0.08 * this.scale,
      upperBodyLength = 0.6 * this.scale;

    let handShape  =      new Sphere(handRadius),
      upperArmShape =  new Box(new Vec3(upperArmLength * 0.5, upperArmSize * 0.5, upperArmSize * 0.5)),
      lowerArmShape =  new Box(new Vec3(lowerArmLength * 0.5, lowerArmSize * 0.5, lowerArmSize * 0.5));

    // Upper arms
    let positionUpperLeftArm = new Vec3(-shouldersDistance/2-upperArmLength/2, this.upperBody.position.y+upperBodyLength/2, 0);
    this.upperLeftArm = new Body({
      mass: 1,
      position: positionUpperLeftArm
    });
    const positionUpperRightArm = new Vec3(shouldersDistance/2+upperArmLength/2, this.upperBody.position.y+upperBodyLength/2, 0);
    this.upperRightArm = new Body({
      mass: 1,
      position: positionUpperRightArm
    });
    this.upperLeftArm.addShape(upperArmShape);
    this.upperRightArm.addShape(upperArmShape);
    this.physicsHandler.addBody(this.upperLeftArm);
    this.physicsHandler.addBody(this.upperRightArm);
    let mesh = this.physicsHandler.addVisual(this.upperLeftArm, this.bodyMaterial);
    this.scene.add(mesh);
    mesh = this.physicsHandler.addVisual(this.upperRightArm, this.bodyMaterial);
    this.scene.add(mesh);

    // lower arms
    const positionLowerLeftArm = new Vec3( this.upperLeftArm.position.x - lowerArmLength/2 - upperArmLength/2, this.upperLeftArm.position.y, 0);
    let lowerLeftArm = new Body({
      mass: 1,
      position: positionLowerLeftArm
    });
    const positionLowerRightArm = new Vec3( this.upperRightArm.position.x + lowerArmLength/2 + upperArmLength/2, this.upperRightArm.position.y, 0);
    let lowerRightArm = new Body({
      mass: 1,
      position: positionLowerRightArm
    });
    lowerLeftArm.addShape(lowerArmShape);
    lowerRightArm.addShape(lowerArmShape);
    this.physicsHandler.addBody(lowerLeftArm);
    this.physicsHandler.addBody(lowerRightArm);
    mesh = this.physicsHandler.addVisual(lowerLeftArm, this.bodyMaterial);
    this.scene.add(mesh);
    mesh = this.physicsHandler.addVisual(lowerRightArm, this.bodyMaterial);
    this.scene.add(mesh);

    // Right hand
    const positionRightHand = new Vec3( lowerRightArm.position.x + lowerArmLength/2 + handRadius, this.upperRightArm.position.y, 0);
    let rightHand = new Body({
      mass: 1,
      position: positionRightHand,
    });
    rightHand.addShape(handShape);
    this.physicsHandler.addBody(rightHand);
    this.rightHand = rightHand;
    mesh = this.physicsHandler.addVisual(rightHand, this.bodyMaterial);
    mesh.position.set(positionRightHand.x, positionRightHand.y, positionRightHand.z);
    this.scene.add(mesh);

    let rightWristJoint = new ConeTwistConstraint(rightHand, lowerRightArm, {
      pivotA: new Vec3(-handRadius, 0, 0),
      pivotB: new Vec3(lowerArmLength/2, 0, 0) });
    this.physicsHandler.world.addConstraint(rightWristJoint);

    // Left hand
    const positionLeftHand = new Vec3( (lowerLeftArm.position.x - lowerArmLength/2 - handRadius), this.upperLeftArm.position.y, 0);
    let leftHand = new Body({
      mass: 1,
      position: positionLeftHand,
    });
    leftHand.addShape(handShape);
    this.physicsHandler.addBody(leftHand);
    this.leftHand = leftHand;
    mesh = this.physicsHandler.addVisual(leftHand, this.bodyMaterial);
    mesh.position.set(positionLeftHand.x, positionLeftHand.y, positionLeftHand.z);
    this.scene.add(mesh);

    let leftWristJoint = new ConeTwistConstraint(leftHand, lowerLeftArm, {
      pivotA: new Vec3(handRadius, 0, 0),
      pivotB: new Vec3(-lowerArmLength/2, 0, 0) });
    this.physicsHandler.world.addConstraint(leftWristJoint);


    // Elbow joint
    let leftElbowJoint= new ConeTwistConstraint(lowerLeftArm, this.upperLeftArm, {
      pivotA: new Vec3(lowerArmLength/2,0,0),
      pivotB: new Vec3(-upperArmLength/2,0,0)
    });
    let rightElbowJoint= new ConeTwistConstraint(lowerRightArm, this.upperRightArm, {
      pivotA: new Vec3(-lowerArmLength/2,0,0),
      pivotB: new Vec3(upperArmLength/2,0,0)
    });
    this.physicsHandler.world.addConstraint(leftElbowJoint);
    this.physicsHandler.world.addConstraint(rightElbowJoint);
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
