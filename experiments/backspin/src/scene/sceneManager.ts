import {
  DirectionalLight,
  HemisphereLight,
  Mesh,
  MeshBasicMaterial,
  MeshPhongMaterial,
  PerspectiveCamera,
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
  private loader: TextureLoader;
  private ball: Body;
  private ballMaterial: Material;
  private hand: Body;
  private handSettings = {
    handRadius: .15,
  };

  constructor() {
    this.loader = new TextureLoader();
  }

  build(camera: PerspectiveCamera, scene: Scene, maxAnisotropy: number, physicsHandler: PhysicsHandler) {
    this.scene = scene;
    this.physicsHandler = physicsHandler;
    this.physicsHandler.dt = 1/180;
    this.physicsHandler.world.gravity.set(0, -9.8,0);
    this.addLight();
    this.addBall();
    this.addFingerTips();
    let text = new TextMesh( maxAnisotropy, 1024, 512 );
    scene.add( text.mesh );
    text.mesh.position.set(0, 1, -2);
    text.set('Catch the ball and throw it!');
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
    this.physicsHandler.addContactMaterial(this.ballMaterial, this.physicsHandler.handMaterial, 0.001, 0.1);
  }

  addFingerTips() {
    let hand_material = new MeshBasicMaterial({
      color: 0xFF3333,
    });
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

    let mesh = this.physicsHandler.addVisual(body, hand_material);
    this.scene.add(mesh);
    mesh.receiveShadow = false;
    this.physicsHandler.addBody(body);

    this.hand = body;
  }

  toRadians(angle) {
    return angle * (Math.PI / 180);
  }

  update() {
    this.physicsHandler.updatePhysics();
    if (this.ball.position.y < 0) {
      this.ball.velocity = new Vec3(0,0,0);
      this.ball.angularVelocity = new Vec3(0,0,0);
      this.ball.position.set(0,5,0);
    }
  }
}
