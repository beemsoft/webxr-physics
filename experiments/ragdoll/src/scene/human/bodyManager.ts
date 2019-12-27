import PhysicsHandler from '../../../../shared/src/physics/physicsHandler';
import {Body, Box, ConeTwistConstraint, PointToPointConstraint, Sphere, Vec3} from 'cannon';
import {MeshLambertMaterial, Scene} from 'three';

export default class BodyManager {
  private scene: Scene;
  private physicsHandler: PhysicsHandler;
  private dollPosition: Vec3;
  private readonly bodyMaterial: MeshLambertMaterial;
  public leftHand: Body;
  public rightHand: Body;
  public headBody: Body;
  upperBody: Body;
  scale = 1; //  0.6;

  constructor(scene: Scene, physicsHandler: PhysicsHandler) {
    this.scene = scene;
    this.physicsHandler = physicsHandler;
    this.bodyMaterial = new MeshLambertMaterial( { color: 0x772277 } );
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

  createRagdoll(){
    let position = new Vec3(0,-2,-1);
    this.dollPosition = position;

    let numBodiesAtStart = this.physicsHandler.world.bodies.length;

    const shouldersDistance = 0.5 * this.scale,
      upperArmLength = 0.4 * this.scale,
      lowerArmLength = 0.4 * this.scale,
      upperArmSize = 0.2 * this.scale,
      lowerArmSize = 0.2 * this.scale,
      neckLength = 0.1 * this.scale,
      handRadius = 0.08 * this.scale,
      headRadius = 0.18 * this.scale,
      upperBodyLength = 0.6 * this.scale,
      pelvisLength = 0.4 * this.scale,
      upperLegLength = 0.5 * this.scale,
      upperLegSize = 0.2 * this.scale,
      lowerLegSize = 0.2 * this.scale,
      lowerLegLength = 0.5 * this.scale;

    let headShape =      new Sphere(headRadius),
      handShape  =      new Sphere(handRadius),
      upperArmShape =  new Box(new Vec3(upperArmLength * 0.5, upperArmSize * 0.5, upperArmSize * 0.5)),
      lowerArmShape =  new Box(new Vec3(lowerArmLength * 0.5, lowerArmSize * 0.5, lowerArmSize * 0.5)),
      upperBodyShape = new Box(new Vec3(shouldersDistance * 0.5, upperBodyLength * 0.5, lowerArmSize * 0.5)),
      pelvisShape =    new Box(new Vec3(shouldersDistance * 0.5, pelvisLength * 0.5, lowerArmSize * 0.5)),
      upperLegShape =  new Box(new Vec3(upperLegSize * 0.5, upperLegLength * 0.5, lowerArmSize * 0.5)),
      lowerLegShape =  new Box(new Vec3(lowerLegSize * 0.5, lowerLegLength * 0.5, lowerArmSize * 0.5));

    let positionLowerLeftLeg = new Vec3(-shouldersDistance/2,lowerLegLength / 2, 0);
    let positionLowerRightLeg = new Vec3(shouldersDistance/2,lowerLegLength / 2, 0);
    // Lower legs
    let lowerLeftLeg = new Body({
      mass: 0,
      position: positionLowerLeftLeg
    });
    let lowerRightLeg = new Body({
      mass: 0,
      position: positionLowerRightLeg
    });
    lowerLeftLeg.addShape(lowerLegShape);
    this.physicsHandler.addBody(lowerLeftLeg);
    let mesh = this.physicsHandler.addVisual(lowerLeftLeg, this.bodyMaterial);
    this.scene.add(mesh);

    lowerRightLeg.addShape(lowerLegShape);
    this.physicsHandler.addBody(lowerRightLeg);
    mesh = this.physicsHandler.addVisual(lowerRightLeg, this.bodyMaterial);
    this.scene.add(mesh);

    // Upper legs
    const positionUpperLeftLeg = new Vec3(-shouldersDistance/2,lowerLeftLeg.position.y+lowerLegLength/2+upperLegLength / 2, 0);
    const positionUpperRightLeg = new Vec3(shouldersDistance/2,lowerRightLeg.position.y+lowerLegLength/2+upperLegLength / 2, 0);
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
    const pelvis = new Body({
      mass: 1,
      position: positionPelvis,
    });
    pelvis.addShape(pelvisShape);
    this.physicsHandler.addBody(pelvis);
    mesh = this.physicsHandler.addVisual(pelvis, this.bodyMaterial);
    this.scene.add(mesh);

    // Upper body
    const positionUpperBody = new Vec3(0,pelvis.position.y+pelvisLength/2+upperBodyLength/2, 0);
    this.upperBody = new Body({
      mass: 1,
      position: positionUpperBody
    });
    this.upperBody.addShape(upperBodyShape);
    this.physicsHandler.addBody(this.upperBody);
    mesh = this.physicsHandler.addVisual(this.upperBody, this.bodyMaterial);
    this.scene.add(mesh);

    // Head
    let headPosition = new Vec3(0,this.upperBody.position.y+upperBodyLength/2+headRadius+neckLength, 0);
    let head = new Body({
      mass: 1,
      position: new Vec3(0,this.upperBody.position.y+upperBodyLength/2+headRadius+neckLength, 0),
    });
    head.addShape(headShape);
    this.physicsHandler.addBody(head);
    head.position.x = headPosition.x;
    head.position.y = headPosition.y;
    head.position.z = headPosition.z;
    mesh = this.physicsHandler.addVisual(head, this.bodyMaterial);
    mesh.position.set(headPosition.x, headPosition.y, headPosition.z);
    this.scene.add(mesh);
    this.headBody = head;

    // Upper arms
    const positionUpperLeftArm = new Vec3(-shouldersDistance/2-upperArmLength/2, this.upperBody.position.y+upperBodyLength/2, 0);
    let upperLeftArm = new Body({
      mass: 1,
      position: positionUpperLeftArm
    });
    const positionUpperRightArm = new Vec3(shouldersDistance/2+upperArmLength/2, this.upperBody.position.y+upperBodyLength/2, 0);
    let upperRightArm = new Body({
      mass: 1,
      position: positionUpperRightArm
    });
    upperLeftArm.addShape(upperArmShape);
    upperRightArm.addShape(upperArmShape);
    this.physicsHandler.addBody(upperLeftArm);
    this.physicsHandler.addBody(upperRightArm);
    mesh = this.physicsHandler.addVisual(upperLeftArm, this.bodyMaterial);
    this.scene.add(mesh);
    mesh = this.physicsHandler.addVisual(upperRightArm, this.bodyMaterial);
    this.scene.add(mesh);

    // lower arms
    const positionLowerLeftArm = new Vec3( upperLeftArm.position.x - lowerArmLength/2 - upperArmLength/2, upperLeftArm.position.y, 0);
    let lowerLeftArm = new Body({
      mass: 1,
      position: positionLowerLeftArm
    });
    const positionLowerRightArm = new Vec3( upperRightArm.position.x + lowerArmLength/2 + upperArmLength/2, upperRightArm.position.y, 0);
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
    const positionRightHand = new Vec3( lowerRightArm.position.x + lowerArmLength/2 + handRadius, upperRightArm.position.y, 0);
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

    let rightWristJoint = new PointToPointConstraint(lowerRightArm, new Vec3(lowerRightArm.position.x/4, 0, 0), rightHand, new Vec3(-handRadius/2, 0, 0));
    this.physicsHandler.world.addConstraint(rightWristJoint);

    // Left hand
    const positionLeftHand = new Vec3( (lowerLeftArm.position.x - lowerArmLength/2 - handRadius), upperLeftArm.position.y, 0);
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

    let leftWristJoint = new PointToPointConstraint(lowerLeftArm, new Vec3(lowerLeftArm.position.x/4, 0, 0), leftHand, new Vec3(handRadius/2, 0, 0));
    this.physicsHandler.world.addConstraint(leftWristJoint);

    // Neck joint
    let neckJoint = new ConeTwistConstraint(this.headBody, this.upperBody, {
      pivotA: new Vec3(0,-headRadius-neckLength/2,0),
      pivotB: new Vec3(0,upperBodyLength/2,0)
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
    let leftHipJoint = new ConeTwistConstraint(upperLeftLeg, pelvis, {
      pivotA: new Vec3(0, upperLegLength/2,0),
      pivotB: new Vec3(-shouldersDistance/2,-pelvisLength/2,0)
    });
    let rightHipJoint = new ConeTwistConstraint(upperRightLeg, pelvis, {
      pivotA: new Vec3(0, upperLegLength/2,0),
      pivotB: new Vec3(shouldersDistance/2,-pelvisLength/2,0)
    });
    this.physicsHandler.world.addConstraint(leftHipJoint);
    this.physicsHandler.world.addConstraint(rightHipJoint);

    // Spine
    let spineJoint = new ConeTwistConstraint(pelvis, this.upperBody, {
      pivotA: new Vec3(0,pelvisLength/2,0),
      pivotB: new Vec3(0,-upperBodyLength/2,0),
      axisA: new Vec3(0, 1, 0),
      axisB: new Vec3(0, 1, 0),
      // @ts-ignore
      angle: Math.PI,
      twistAngle: Math.PI/3
    });
    this.physicsHandler.world.addConstraint(spineJoint);

    // Shoulders
    let pivotA = new Vec3(-shouldersDistance/2, upperBodyLength/2,0);
    let pivotB = new Vec3(upperArmLength/2, 0,0);
    this.addConeTwistConstraint(this.upperBody, upperLeftArm, pivotA, pivotB);
    pivotA = new Vec3(shouldersDistance/2, upperBodyLength/2,0);
    pivotB = new Vec3(-upperArmLength/2, 0,0);
    this.addConeTwistConstraint(this.upperBody, upperRightArm, pivotA, pivotB);

    // Elbow joint
    let leftElbowJoint= new ConeTwistConstraint(lowerLeftArm, upperLeftArm, {
      pivotA: new Vec3(lowerArmLength/2,0,0),
      pivotB: new Vec3(-upperArmLength/2,0,0)
    });
    let rightElbowJoint= new ConeTwistConstraint(lowerRightArm, upperRightArm, {
      pivotA: new Vec3(-lowerArmLength/2,0,0),
      pivotB: new Vec3(upperArmLength/2,0,0)
    });
    this.physicsHandler.world.addConstraint(leftElbowJoint);
    this.physicsHandler.world.addConstraint(rightElbowJoint);

    // Move all body parts
    for (let i = numBodiesAtStart; i < this.physicsHandler.world.bodies.length; i++) {
      let body = this.physicsHandler.world.bodies[i];
      body.position.vadd(position, body.position);
    }
  }

}
