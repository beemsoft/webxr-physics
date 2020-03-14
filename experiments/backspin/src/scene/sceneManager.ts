import {
  Mesh,
  MeshBasicMaterial,
  MeshPhongMaterial,
  PerspectiveCamera,
  Scene,
  SphereGeometry,
  TextureLoader,
  Vector2, WebGLRenderer
} from 'three';
import {Body, Material, Sphere, Vec3} from 'cannon';
import PhysicsHandler from '../../../shared/src/physics/physicsHandler';
import {ControllerInterface} from '../../../shared/src/web-managers/ControllerInterface';
import {SceneHelper} from '../../../shared/src/scene/SceneHelper';
import {SceneWithControllers} from '../../../shared/src/scene/SceneWithControllers';

export default class SceneManager implements SceneWithControllers {
  private scene: Scene;
  private sceneHelper: SceneHelper;
  private physicsHandler: PhysicsHandler;
  private loader: TextureLoader = new TextureLoader();
  private ball: Body;
  private ballMaterial: Material;
  private hand: Body;
  private handSettings = { handRadius: .15 };

  build(camera: PerspectiveCamera, scene: Scene, renderer: WebGLRenderer, physicsHandler: PhysicsHandler) {
    this.scene = scene;
    this.sceneHelper = new SceneHelper(scene);
    this.physicsHandler = physicsHandler;
    this.physicsHandler.dt = 1/180;
    this.physicsHandler.world.gravity.set(0, -9.8,0);
    this.sceneHelper.addLight();
    this.addBall();
    this.sceneHelper.addMessage('Catch the ball and throw it!', renderer.capabilities.getMaxAnisotropy());
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
    let mass = 0.6237;
    let sphereShape = new Sphere(ballRadius);
    this.ballMaterial = new Material("ball");
    let ball = new Body({ mass: mass, material: this.ballMaterial });
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
    this.physicsHandler.addToScene(body, null, null, hand_material, this.scene);
    this.hand = body;
  }

  toRadians(angle) {
    return angle * (Math.PI / 180);
  }

  update() {
    if (this.ball.position.y < 0) {
      this.ball.velocity = new Vec3(0,0,0);
      this.ball.angularVelocity = new Vec3(0,0,0);
      this.ball.position.set(0,5,0);
    }
  }

  addLeftController(controller: ControllerInterface) {
    controller.makeVisible(this.scene);
  }

  addRightController(controller: ControllerInterface) {
    controller.makeVisible(this.scene);
  }
}
