import {BackSide, BoxGeometry, Clock, Mesh, MeshNormalMaterial, PerspectiveCamera, Scene, SphereGeometry} from 'three';
import {Body, Vec3} from 'cannon';
import PhysicsHandler from '../physics/physicsHandler';

export default class SceneManager {
  private scene: Scene;
  private camera;
  private physicsHandler;
  protected cube: Mesh;
  private clock: Clock = new Clock();

  constructor(scene: Scene, camera: PerspectiveCamera, physicsHandler: PhysicsHandler) {
    this.scene = scene;
    this.camera = camera;
    this.physicsHandler = physicsHandler;
    this.build();
  }

  build() {
    const geometry = new BoxGeometry(0.5, 0.5, 0.5);
    const material = new MeshNormalMaterial();
    this.cube = new Mesh(geometry, material);
    this.cube.rotation.y = Math.PI / 4;
    this.scene.add(this.cube);
    this.physicsHandler.addMesh(this.cube);
    const cubeBody = new Body({mass: 1, position: new Vec3(0, 1, -1.5)});
    this.physicsHandler.addBody(cubeBody);
    const skyGeometry = new SphereGeometry(5);
    const skyMaterial = new MeshNormalMaterial({side: BackSide});
    const sky = new Mesh(skyGeometry, skyMaterial);
    this.scene.add(sky);
  }

  update() {
    let delta = this.clock.getDelta() * 60;
    this.cube.rotation.y += delta * 0.01;
  }
}
