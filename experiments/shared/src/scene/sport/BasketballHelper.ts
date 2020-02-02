import {Mesh, MeshPhongMaterial, Scene, SphereGeometry, TextureLoader, Vector2} from 'three';
import {Body, Material, Sphere} from 'cannon';
import PhysicsHandler from '../../physics/physicsHandler';

export class BasketballHelper {
  private scene: Scene;
  private physicsHandler: PhysicsHandler;
  private loader: TextureLoader = new TextureLoader();
  private ballMaterial = new Material("ball");

  constructor(scene: Scene, physicsHandler: PhysicsHandler) {
    this.scene = scene;
    this.physicsHandler = physicsHandler;
  }

  addBall(): Body {
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
    let ball = new Body({ mass: mass, material: this.ballMaterial });
    ball.addShape(sphereShape);
    ball.linearDamping = damping;
    ball.position.set(0,5,0);
    this.physicsHandler.addBody(ball);
    this.scene.add(ballMesh);
    this.physicsHandler.addContactMaterial(this.ballMaterial, this.physicsHandler.handMaterial, 0.001, 0.1);
    this.physicsHandler.addContactMaterial(this.ballMaterial, this.physicsHandler.groundMaterial, 0.001, 0.1);
    return ball;
  }

}
