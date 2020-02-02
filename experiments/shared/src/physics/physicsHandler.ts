import {
  Body,
  ContactMaterial,
  Material,
  NaiveBroadphase,
  PointToPointConstraint,
  Quaternion,
  Shape,
  Sphere,
  Vec3,
  World
} from "cannon";
import {Material as Material2, Mesh, Object3D, Scene} from "three";
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
  public groundMaterial = new Material("floor");
  public rightHandController: Body;
  public leftHandController: Body;
  private bodyConverter = new BodyConverter();

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
      if (this.meshes[i] && this.bodies[i]) {
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
    if (isRightHand) {
      this.rightHandController = body;
    } else {
      this.leftHandController = body;
    }
  }

  addVisual(body, material): Promise<Object3D> {
    if(body instanceof Body){
      return this.bodyConverter.shape2mesh(body, null, material)
        .then(mesh => {
          mesh.position.x = body.position.x;
          mesh.position.y = body.position.y;
          mesh.position.z = body.position.z;
          this.meshes.push(mesh);
          return mesh;
        });
    }
  }

  addToScene(body: Body, shape: Shape, shapeOrientation: Quaternion, material: Material2, scene: Scene) {
    if (shape != null) {
      body.addShape(shape);
    }
    this.world.addBody(body);
    this.bodyConverter.shape2mesh(body, shape, material)
      .then(mesh => {
        this.bodies.push(body);
        this.meshes.push(mesh);
        scene.add(mesh);
      });
  }

  addPointerConstraintToBody(x: number, y: number, z: number, body: Body) {
    // The cannon body constrained by the pointer joint
    this.constrainedBody = body;

    // Vector to the clicked point, relative to the body
    let v1 = new Vec3(x,y,z).vsub(this.constrainedBody.position);

    // Apply anti-quaternion to vector to transform it into the local body coordinate system
    let antiRot = this.constrainedBody.quaternion.inverse();
    let pivot = new Quaternion(antiRot.x, antiRot.y, antiRot.z, antiRot.w).vmult(v1); // pivot is not in local body coordinates
    this.jointBody.position.set(x,y,z);
    this.pointerConstraint = new PointToPointConstraint(this.constrainedBody, pivot, this.jointBody, new Vec3(0,0,0));
    this.world.addConstraint(this.pointerConstraint);
  }

  moveJointToPoint(x: number, y: number, z: number) {
    this.jointBody.position.set(x,y,z);
    this.pointerConstraint.update();
  }
}
