import {Mesh} from 'three';
import {MTLLoader, OBJLoader} from 'three-obj-mtl-loader'

export default class ControllerHandManager {

  private loadHandModel2(objLoader: OBJLoader): Promise<Mesh> {
    return new Promise(resolve => {
      objLoader.load('../assets/hand/hand.obj', (object) => {
        object.children[0].geometry.scale(0.003, 0.003, 0.003);
        object.children[0].position.set(0, 1.75, -2);
        object.children[1].geometry.scale(0.003, 0.003, 0.003);
        object.children[1].position.set(0, 1.75, -2);
        resolve(object);
      })
    })
  }

  loadHandModel(): Promise<boolean> {
    let mtlLoader = new MTLLoader();
    let objLoader = new OBJLoader();

    return new Promise(resolve => {
      mtlLoader.load('../assets/hand/hand.mtl', (materials) => {
        materials.preload();
        for (let key in materials.materials) {
          if (materials.materials[key].map != null) {
            // materials.materials[key].color.r = 1;
            // materials.materials[key].color.g = 1;
            // materials.materials[key].color.b = 1;
          }
        }
        objLoader.setMaterials(materials);
        this.loadHandModel2(objLoader)
          .then(() => {
            resolve(true);
          });
      })
    });
  }
}
