import {
  BackSide,
  Clock,
  DirectionalLight,
  Mesh,
  MeshNormalMaterial,
  PerspectiveCamera,
  Scene,
  SphereGeometry
} from 'three';
import {Body, Vec3} from 'cannon';
import PhysicsHandler from '../physics/physicsHandler';
import {MTLLoader, OBJLoader} from 'three-obj-mtl-loader'
import HumanFaceManager from './human/humanFaceManager';

export default class SceneManager {
  private scene: Scene;
  private camera;
  private physicsHandler;
  protected cube: Mesh;
  private clock = new Clock();
  private humanFaceManager = new HumanFaceManager();

  constructor(scene: Scene, camera: PerspectiveCamera, physicsHandler: PhysicsHandler) {
    this.scene = scene;
    this.camera = camera;
    this.physicsHandler = physicsHandler;
    this.humanFaceManager.loadFaceModels()
      .then(this.build);
  }

  replaceHead = (faceModelName: string) => {
    let object = this.humanFaceManager.faceModels.get(faceModelName);
    object.position.copy(this.cube.position);
    object.quaternion.copy(this.cube.quaternion);
    object.rotation.copy(this.cube.rotation);
    this.scene.remove(this.cube);
    this.physicsHandler.replaceMesh(this.cube, object);
    this.scene.add(object);
    this.cube = object;
  };


  build = () => {
    let light = new DirectionalLight(0xFFFFFF, 1);
    light.position.set(0, 1, 1).normalize();
    this.scene.add(light);
    // const geometry = new BoxGeometry(0.5, 0.5, 0.5);
    // const material = new MeshNormalMaterial();
    // this.cube = new Mesh(geometry, material);
    // this.cube.rotation.y = Math.PI / 4;
    // this.scene.add(this.cube);
    // this.physicsHandler.addMesh(this.cube);
    // const cubeBody = new Body({mass: 1, position: new Vec3(0, 1, -1.5)});
    // this.physicsHandler.addBody(cubeBody);
    let object = this.humanFaceManager.faceModels.get('main');
    this.scene.add(object);
    this.cube = object;
    this.physicsHandler.addMesh(this.cube);
    const cubeBody = new Body({mass: 1, position: new Vec3(0, 0, -1.5)});
    this.physicsHandler.addBody(cubeBody);

    const skyGeometry = new SphereGeometry(5);
    const skyMaterial = new MeshNormalMaterial({side: BackSide});
    const sky = new Mesh(skyGeometry, skyMaterial);
    this.scene.add(sky);

    this.sayWelcome();
  };

  update() {
    let delta = this.clock.getDelta() * 60;
    if (this.cube) {
      this.cube.rotation.y += delta * 0.01;
    }
  }

  sayPhoneme(phoneme)  {
    return new Promise(resolve => {
      setTimeout(() => {
        if (this.humanFaceManager.faceModels.has('Phoneme'+phoneme)) {
          console.log('Say: ' + phoneme);
          this.replaceHead('Phoneme' + phoneme);
        }
        resolve();
      }, 105)
    })
  };

  sayWelcome() {
    this.sayPhoneme('W')
      .then(() => this.sayPhoneme('eh'))
      .then(() => this.sayPhoneme('K'))
      .then(() => this.sayPhoneme('aah'))
      .then(() => this.sayPhoneme('B,M,P'))
      .then(() => this.sayPhoneme('D,S,T'))
      .then(() => this.sayPhoneme('ooh,Q'))
      .then(() => this.sayPhoneme('W'))
      .then(() => this.sayPhoneme('eh'))
      .then(() => this.sayPhoneme('B,M,P'))
      .then(() => this.sayPhoneme('eh'))
      .then(() => this.sayPhoneme('K'))
      .then(() => this.sayPhoneme('D,S,T'))
      .then(() => this.sayPhoneme('aah'))
      .then(() => this.sayPhoneme('F,V'))
      .then(() => this.sayPhoneme('i'))
      .then(() => this.sayPhoneme('D,S,T'))
      .then(() => this.sayPhoneme('i'))
      .then(() => this.sayPhoneme('K'))
      .then(() => this.sayPhoneme('D,S,T'))
      .then(() => this.replaceHead('main'))
      .then(() => this.sayWelcome());
  }
}
