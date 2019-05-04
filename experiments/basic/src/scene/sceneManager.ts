import {BackSide, BoxGeometry, Clock, Mesh, MeshNormalMaterial, Scene, SphereGeometry} from 'three';
import {Body, Vec3} from 'cannon';
import PhysicsHandler from '../../../shared/src/physics/physicsHandler';
import {SceneManagerInterface} from '../../../shared/src/scene/SceneManagerInterface';
import AudioHandler from '../audio/audioHandler';

export default class SceneManager implements SceneManagerInterface {
  private scene: Scene;
  private physicsHandler: PhysicsHandler;
  protected cube: Mesh;
  private clock: Clock = new Clock();
  private audioHandler: AudioHandler;

  constructor(scene: Scene) {
    this.scene = scene;
    this.audioHandler = new AudioHandler();
    this.audioHandler.initAudio();
    this.audioHandler.audioElement.play();
  }

  build(scene: Scene, maxAnisotropy: number, physicsHandler: PhysicsHandler) {
    this.scene = scene;
    this.physicsHandler = physicsHandler;
    console.log('Building Basic scene...');

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
    this.audioHandler.setPosition(this.cube.position);
    this.audioHandler.setVolume(this.cube.position);
  }
}
