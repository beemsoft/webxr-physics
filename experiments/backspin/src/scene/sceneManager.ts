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
import {Body, Material, Sphere, Vec3} from 'cannon';
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
    console.log('Building Backspin scene...');
    this.addLight();
    this.addBall();
    this.addFingerTips();
    let text = new TextMesh( maxAnisotropy, 1024, 512 );
    scene.add( text.mesh );
    text.mesh.position.set(0, 1, -2);
    text.set('Hello world');
  }

  addLight() {
    let light = new DirectionalLight(0xFFFFFF, 1);
    light.position.set(1, 10, -0.5);
    this.scene.add(light);
    this.scene.add(new HemisphereLight(0x909090, 0x404040));
  }

  addBall(){
    const scale = 1;
    const ballRadius = 0.17 * scale;

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
    this.physicsHandler.addBallHandContactMaterial(this.ballMaterial, 0.001, 0.1);
  }

  addFingerTips() {
    let hand_material = new MeshBasicMaterial({
      color: 0xFF3333,
    });
    this.currentMaterial = hand_material;
    const Ncols = 5;
    const angle = 360 / Ncols;
    let body = new Body({
      mass: 0,
      material: this.physicsHandler.handMaterial
    });
    for(let i=0; i<Ncols; i++){
      let radians = this.toRadians(angle * i);
      let rowRadius = this.handSettings.handRadius;

      let relativePosition = new Vec3(
        rowRadius * Math.sin(radians),
        0,
        rowRadius * Math.cos(radians)
      );

      body.addShape(new Sphere(0.05), relativePosition);
    }

    let mesh = this.physicsHandler.addVisual(body, this.currentMaterial);
    this.scene.add(mesh);
    mesh.receiveShadow = false;
    this.physicsHandler.addBody(body);

    this.hand = body;
    this.hand.quaternion.setFromAxisAngle(new Vec3(1, 0, 0), this.totalRotation);
  }

  toRadians(angle) {
    return angle * (Math.PI / 180);
  }

  update() {
    this.physicsHandler.updatePhysics();
    if (this.ball.position.y < -1) {
      this.ball.velocity = new Vec3(0,0,0);
      this.ball.angularVelocity = new Vec3(0,0,0);
      this.ball.position.set(0,5,0);
    }
  }
}
