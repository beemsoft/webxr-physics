import {
  BackSide,
  BoxGeometry,
  Clock,
  DirectionalLight,
  HemisphereLight,
  Mesh,
  MeshBasicMaterial,
  MeshLambertMaterial,
  MeshNormalMaterial,
  PlaneGeometry,
  Scene,
  SphereGeometry,
  TextureLoader,
  Vector3
} from 'three';
// @ts-ignore
// import ballImage from '../../textures/ball.png';
// @ts-ignore
// import ballNormalImage from '../../textures/ball_normal.png';
// @ts-ignore
// import floorImage from '../../textures/floor.jpg';
import {Body, Vec3} from 'cannon';

export default class SceneBuilder {

  private scene: Scene;
  private camera;
  private physicsHandler;
  private audioHandler;
  private loader;
  private stickToCamera;
  fixBallPosition;
  private handRotationStep;
  private totalRotation;
  private initialRotation;
  private APP;
  private handSettings;
  private basket;
  private isThrowing: any;
  private hand;
  private ball;
  private markerMaterial: MeshLambertMaterial;
  private floor: Mesh;
  private cube: Mesh;
  private clock: Clock;

  constructor(scene, camera, physicsHandler, audioHandler) {
    this.scene = scene;
    this.camera = camera;
    this.physicsHandler = physicsHandler;
    this.audioHandler = audioHandler;
    this.loader = new TextureLoader();
    this.stickToCamera = false;
    this.fixBallPosition = false;
    this.handRotationStep = 0.005;
    this.totalRotation = Math.PI/2;
    this.initialRotation = Math.PI/2;
    this.clock = new Clock();

    this.APP = {
      ballRadius: 6,
      basketColor: 0xc84b28,
      getBasketRadius: () => this.APP.ballRadius + 2,
      basketTubeRadius: 0.5,
      basketY: 20,
      basketDistance: 80,
      getBasketZ: () => this.APP.getBasketRadius() + this.APP.basketTubeRadius * 2 - this.APP.basketDistance
    };
    this.handSettings = {
      throwAngleStep: 0.738, // Math.PI/4,
      throwAngleStart: 0.221, // Math.PI/2 + Math.PI/4,
      throwAngleStop: -2.423, // -Math.PI,
      handRadius: 0.2, // 0.15,
      fingerTips: 7, // 4,
      fingerTipSize: 0.019 // 0.01
    };
    this.build();
   }

  build() {
    let floor = new Mesh(new PlaneGeometry(8, 8), new MeshBasicMaterial({color:0xffffff, transparent: true, opacity: 0.3}));
    floor.geometry.rotateX(- Math.PI / 2);
    // this.scene.add (floor);

    const geometry = new BoxGeometry(0.5,0.5,0.5);
    const material = new MeshNormalMaterial();
    this.cube = new Mesh(geometry, material);
    this.cube.rotation.y = Math.PI/4;
      this.physicsHandler.addMesh(this.cube);
      let cubeBody = new Body({
        mass: 1
      });
      cubeBody.position = new Vec3(0, 1, -1.5);
      this.physicsHandler.addBody(cubeBody);
    var skyGeometry = new SphereGeometry(5);
    var skyMaterial = new MeshNormalMaterial({
      side: BackSide
    });
    let sky = new Mesh(skyGeometry, skyMaterial);
    this.scene.add (sky);
  }

  addLight() {
    let light = new DirectionalLight(0xFFFFFF, 1);
    light.position.set(1, 10, -0.5);
    // let light = new AmbientLight( 0x404040 );
    this.scene.add(light);
    this.scene.add(new HemisphereLight(0x909090, 0x404040));
    console.log('Add light');
  }

  update() {
    let delta = this.clock.getDelta() * 60;
    this.cube.rotation.y += delta * 0.01;

    if (this.audioHandler != null) {
      this.audioHandler.setPosition(this.cube.position);
      this.audioHandler.setVolume(this.cube.position);
    }

    if (this.stickToCamera) {
      let pointAt = new Vector3(0, 0, -1).normalize();
      if (this.fixBallPosition) {
        this.ball.velocity.set(0,0,0);
        this.ball.angularVelocity.set(0,0,0);
        this.ball.position.x = this.camera.position.x + pointAt.x + 0.25;
        this.ball.position.y = this.camera.position.y + pointAt.y + 0.40;
        this.ball.position.z = this.camera.position.z + pointAt.z;

        this.totalRotation = this.initialRotation;
        this.isThrowing = false;
        // this.hand.quaternion.setFromAxisAngle(new Vec3(1,0,0),this.totalRotation);
      }

      this.hand.position.x = this.camera.position.x + pointAt.x + 0.25;
      this.hand.position.y = this.camera.position.y + pointAt.y + 0.2;
      this.hand.position.z = this.camera.position.z + pointAt.z;

      if (!this.handSettings.isAutomatic) {
        let o = this.physicsHandler.rayInput.renderer.orientation;
        this.hand.quaternion.set(o.x, o.y, o.z, o.w);
      }
    }

    if (this.handSettings.isAutomatic) {
      if (this.isThrowing) {
        if (this.totalRotation < this.handSettings.throwAngleStop) {
        } else {
          this.totalRotation -= this.handSettings.throwAngleStep;
          // this.hand.quaternion.setFromAxisAngle(new Vec3(1,0,0),this.totalRotation);
        }
      } else {
        this.totalRotation += Math.PI/180;
        // this.hand.quaternion.setFromAxisAngle(new Vec3(1,0,0),this.totalRotation);
      }
      if (this.totalRotation > Math.PI/2 + Math.PI/4) { //  this.handSettings.throwAngleStart
        this.isThrowing = true;
        this.totalRotation = -Math.PI/4;
      }
    }
  }
}
