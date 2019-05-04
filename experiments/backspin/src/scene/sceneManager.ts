import {
  Clock,
  DirectionalLight,
  HemisphereLight,
  Mesh,
  MeshBasicMaterial,
  MeshPhongMaterial,
  Scene,
  SphereGeometry,
  TextureLoader,
  Vector2
} from 'three';
import {Body, ContactMaterial, Material, Quaternion, Sphere, Vec3} from 'cannon';
import {SceneManagerInterface} from '../../../shared/src/scene/SceneManagerInterface';
import {TextMesh} from '../../../shared/src/text/TextMesh';
import PhysicsHandler from '../../../shared/src/physics/physicsHandler';

export default class SceneManager implements SceneManagerInterface {
  private scene: Scene;
  private physicsHandler: PhysicsHandler;
  private clock = new Clock();
  protected cube: Mesh;
  private loader: TextureLoader;
  private stickToCamera: boolean;
  private fixBallPosition: boolean;
  private handRotationStep: number;
  private currentMaterial: MeshBasicMaterial;
  private ball: Body;
  private rotationHandStep: number;
  private handMaterial: Material;
  private isThrowing = false;
  private APP = {
    ballRadius: 6,
    basketColor: 0xc84b28,
    getBasketRadius: () => this.APP.ballRadius + 2,
    basketTubeRadius: 0.5,
    basketY: 20,
    basketDistance: 80,
    getBasketZ: () => this.APP.getBasketRadius() + this.APP.basketTubeRadius * 2 - this.APP.basketDistance
  };
  private ballMaterial: Material;
  private hand: Body;
  private handSettings = {
    throwAngleStep: (Math.PI/16)/1, // Math.PI/4,
    throwAngleStart: 0.221, // Math.PI/2 + Math.PI/4,
    throwAngleStop: -(Math.PI+Math.PI/4), // -2.423, // -Math.PI,
    handRadius: .15, // 0.15,
    fingerTips: 7, // 4,
    fingerTipSize: 0.019 // 0.01
  };
  private totalRotation = -Math.PI/20; // Math.PI/2;

  constructor() {
    this.loader = new TextureLoader();
    this.stickToCamera = false;
    this.fixBallPosition = false;
    this.handRotationStep = -0.005;
  }

  build(scene: Scene, maxAnisotropy: number, physicsHandler: PhysicsHandler) {
    this.scene = scene;
    this.physicsHandler = physicsHandler;
    this.physicsHandler.world.gravity.set(0, -9.8,0);
    this.physicsHandler.dt = 1/60;
    console.log('Building Backspin scene...');
    this.addLight();
    this.addBall();
    this.addFingerTips();
    this.addBallHandContactMaterial(this.ballMaterial, this.handMaterial);
    let text = new TextMesh( maxAnisotropy, 1024, 512 );
    scene.add( text.mesh );
    text.mesh.position.set(0, 1, -2);
    text.set('Hello world');
  }

  addBallHandContactMaterial(ballMaterial: Material, handMaterial: Material) {
    let contactMaterial = new ContactMaterial(ballMaterial, handMaterial, { friction: 0.4, restitution: 0.1 });
    this.physicsHandler.world.addContactMaterial(contactMaterial);
  }

  addLight() {
    let light = new DirectionalLight(0xFFFFFF, 1);
    light.position.set(1, 10, -0.5);
    this.scene.add(light);
    this.scene.add(new HemisphereLight(0x909090, 0x404040));
  }

  addBall(){
    const scale = 1;
    const ballRadius = 0.25 * scale;

    let ballSphere = new SphereGeometry( ballRadius, 16, 16 );
    let ballMaterial = new MeshPhongMaterial({
      map: this.loader.load('/textures/ball.png'),
      normalMap: this.loader.load('/textures/ball_normal.png'),
      shininess: 20,
      reflectivity: 2,
      normalScale: new Vector2(0.5, 0.5)
    });

    let ballMesh = new Mesh(ballSphere, ballMaterial);
    ballMesh.castShadow = true;

    this.physicsHandler.addMesh(ballMesh);

    let size = 1;
    let damping = 0.01;
    let mass = 0.1; // 0.6237;
    let sphereShape = new Sphere(ballRadius);
    this.ballMaterial = new Material("ball");
    let ball = new Body({
      mass: mass,
      material: this.ballMaterial
    });

    ball.addShape(sphereShape);
    ball.linearDamping = damping;

    ball.position.set(0,5,0);

    this.physicsHandler.addBody(ball);

    this.ball = ball;
    this.scene.add(ballMesh);
  }

  addFingerTips() {
    let hand_material = new MeshBasicMaterial({
      color: 0xFF3333,
    });
    this.currentMaterial = hand_material;
    const Ncols = 5;
    const angle = 360 / Ncols;
    this.handMaterial = new Material("hand");
    let body = new Body({
      mass: 0,
      material: this.handMaterial
    });
    let position = new Vec3(0,0,0);
    for(let i=0; i<Ncols; i++){
      let radians = this.toRadians(angle * i);
      let rowRadius = this.handSettings.handRadius;

      let relativePosition = new Vec3(
        rowRadius * Math.sin(radians),
        0,
        rowRadius * Math.cos(radians)
      );

      let lookAtPosition = relativePosition.vsub(position);
      let orientation = new Quaternion(lookAtPosition.x, lookAtPosition.z, lookAtPosition.y,0);
      // body.addShape(new CANNON.Cylinder(0.001, 0.0008, 0.1, 16), relativePosition, orientation);
      body.addShape(new Sphere(0.05), relativePosition);
      // body.addShape(new Box(new Vec3(0.01, 0.01, 0.01)), relativePosition, orientation);
    }

    let mesh = this.physicsHandler.addVisual(body, this.currentMaterial);
    this.scene.add(mesh);
    mesh.receiveShadow = false;
    this.physicsHandler.addBody(body);

    this.hand = body;
    this.hand.quaternion.setFromAxisAngle(new Vec3(1, 0, 0), this.totalRotation);
    // this.hand.position.set(0,1,-0.5);
  }

  toRadians(angle) {
    return angle * (Math.PI / 180);
  }

  update() {
    if (this.clock.getElapsedTime() < 10) {
      this.physicsHandler.updatePhysics();
      console.log('Rotation: ' + this.totalRotation);
      console.log('Klok: ' + this.clock.getElapsedTime());
      if (this.clock.getElapsedTime() > 5 && !this.isThrowing) {
        this.isThrowing = true;
        // this.ball.mass = 0;
        // this.physicsHandler.dt = this.physicsHandler.dt/10;
      }
      if (this.isThrowing) {

        if (this.clock.getElapsedTime() < 5.5) {
          // this.hand.position.y += 0.15;
          // this.ball.position.y += 0.15;
          // this.hand.position.z -= 0.01;
          // this.ball.position.z -= 0.01;
        }

        // Rotate
        // if (this.clock.getElapsedTime() > 5.3) {
        //   this.ball.mass = 0.1;
          // this.totalRotation -= this.handSettings.throwAngleStep;
          // this.hand.quaternion.setFromAxisAngle(new Vec3(1, 0, 0), this.totalRotation);
        // }

      } else {
        // this.totalRotation += Math.PI/180;
        // this.hand.quaternion.setFromAxisAngle(new Vec3(1,0,0),this.totalRotation);
      }
      // if (this.totalRotation > Math.PI / 2 + Math.PI / 4) { //  this.handSettings.throwAngleStart
        // this.isThrowing = true;
        // this.totalRotation = -Math.PI / 4;
      // }

      // if (this.totalRotation < -4.9) {
        // this.totalRotation = Math.PI / 2;
        // this.isThrowing = false;
        // this.hand.quaternion.setFromAxisAngle(new Vec3(1, 0, 0), this.totalRotation);
      // }
      // if (this.ball.position.y < -5) {
      //   this.ball.position.y = 0.3;
      //   this.ball.position.x = 0;
      //   this.ball.position.z = 0;
      //   this.ball.velocity.set(0, 0, 0);
      //   this.ball.angularVelocity.set(0, 0, 0);
      // }
    }
  }
}
