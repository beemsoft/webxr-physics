import {DirectionalLight, HemisphereLight, Scene} from 'three';
import {TextMesh} from '../text/TextMesh';

export class SceneHelper {
  private scene: Scene;

  constructor(scene: Scene) {
    this.scene = scene;
  }

  addLight() {
    let light = new DirectionalLight(0xFFFFFF, 1);
    light.position.set(1, 10, -0.5);
    this.scene.add(light);
    this.scene.add(new HemisphereLight(0x909090, 0x404040));
  }

  addMessage(message: string, maxAnisotropy: number) {
    let text = new TextMesh(maxAnisotropy, 1024, 512);
    this.scene.add(text.mesh);
    text.mesh.position.set(0, 1, -2);
    text.set(message);
  }
}
