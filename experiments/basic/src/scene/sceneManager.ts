import {
  BoxGeometry,
  DirectionalLight,
  HemisphereLight,
  Mesh,
  MeshNormalMaterial,
  PerspectiveCamera,
  Scene, Vector3
} from 'three';
import {Body, Box, Material, Vec3} from 'cannon';
import PhysicsHandler from '../../../shared/src/physics/physicsHandler';
import {SceneManagerInterface} from '../../../shared/src/scene/SceneManagerInterface';
import AudioHandler from '../audio/audioHandler';
import {TextMesh} from '../../../shared/src/text/TextMesh';
import {ControllerInterface} from '../../../shared/src/web-managers/ControllerInterface';
import {XRReferenceSpace} from '../../../shared/src/WebXRDeviceAPI';

export default class SceneManager implements SceneManagerInterface {
  private scene: Scene;
  private physicsHandler: PhysicsHandler;
  protected cube: Mesh;
  private cubeBody: Body;
  private audioHandler: AudioHandler;
  private cubeMaterial: Material;
  private rotation = 0;

  constructor() {
    this.audioHandler = new AudioHandler();
    this.audioHandler.initAudio();
  }

  build(camera: PerspectiveCamera, scene: Scene, maxAnisotropy: number, physicsHandler: PhysicsHandler) {
    this.scene = scene;
    this.physicsHandler = physicsHandler;
    let light = new DirectionalLight(0xFFFFFF, 1);
    light.position.set(1, 10, -0.5);
    this.scene.add(light);
    this.scene.add(new HemisphereLight(0x909090, 0x404040));

    const geometry = new BoxGeometry(0.3, 0.3, 0.3);
    const material = new MeshNormalMaterial();
    this.cube = new Mesh(geometry, material);
    this.physicsHandler.addMesh(this.cube);
    this.cubeMaterial = new Material("cube");
    this.cubeBody = new Body({
      mass: 0.1,
      material: this.cubeMaterial,
      position: new Vec3(0, 0.5, -0.5),
      linearDamping: 0.01
    });
    let cubeShape = new Box(new Vec3(0.2, 0.2, 0.2));
    this.cubeBody.addShape(cubeShape);
    this.physicsHandler.addBody(this.cubeBody);
    this.scene.add(this.cube);
    this.physicsHandler.addContactMaterial(this.cubeMaterial, this.physicsHandler.handMaterial, 0.001, 0.1);

    this.audioHandler.audioElement.play();

    let text = new TextMesh( maxAnisotropy, 1024, 512 );
    scene.add( text.mesh );
    text.mesh.position.set(0, 1, -2);
    text.set('Push the box and listen to the sound!');
  }

  update() {
    this.rotation += 0.005;
    this.cubeBody.quaternion.setFromAxisAngle(new Vec3(0,1,0), this.rotation);
    this.cubeBody.quaternion.normalize();
    this.audioHandler.setPosition(this.cube.position);
    this.audioHandler.setVolume(this.cube.position);
  }

  addLeftController(controller: ControllerInterface) {
    controller.makeVisible(this.scene);
  }

  addRightController(controller: ControllerInterface) {
    controller.makeVisible(this.scene);
  }

  setXrReferenceSpace(space: XRReferenceSpace): Vector3 {
    throw new Error("Method not implemented.");
  }

  getXrReferenceSpace(): XRReferenceSpace {
    return null;
  }
}
