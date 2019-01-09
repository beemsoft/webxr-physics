import {
  BackSide,
  BoxGeometry,
  Clock,
  DirectionalLight,
  HemisphereLight,
  Mesh,
  MeshNormalMaterial,
  Scene,
  SphereGeometry,
  TextureLoader,
} from 'three';
import {Body, Vec3} from 'cannon';

export default class SceneBuilder {

  private scene: Scene;
  private camera;
  private physicsHandler;
  private audioHandler;
  private loader;
  private stickToCamera;
  private totalRotation;
  private initialRotation;
  private cube: Mesh;
  private clock: Clock;

  constructor(scene, camera, physicsHandler, audioHandler) {
    this.scene = scene;
    this.camera = camera;
    this.physicsHandler = physicsHandler;
    this.audioHandler = audioHandler;
    this.loader = new TextureLoader();
    this.stickToCamera = false;
    this.totalRotation = Math.PI/2;
    this.initialRotation = Math.PI/2;
    this.clock = new Clock();
    this.build();
   }

  build() {
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
  }
}
