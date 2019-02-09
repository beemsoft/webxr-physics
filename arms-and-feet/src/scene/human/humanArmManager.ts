import {Mesh} from 'three';
import {MTLLoader, OBJLoader} from 'three-obj-mtl-loader'

export default class HumanArmManager {
  armModels = new Map<string, Mesh>();

  private loadArmModel(objLoader: OBJLoader): Promise<Mesh> {
    return new Promise(resolve => {
      objLoader.load('../assets/arm/11535_arm_V3_.obj', (object) => {
        object.children[0].geometry.scale(0.025, 0.025, 0.03);
        // object.children[1].geometry.scale(0.0, 0.3, 0.3);
        // object.children[1].position.set(0, 1.75, -2);
        resolve(object);
      })
    })
  }

  loadArmModels(): Promise<boolean> {
    let mtlLoader = new MTLLoader();
    let objLoader = new OBJLoader();

    return new Promise(resolve => {
      mtlLoader.load('../assets/arm/Blank.mtl', (materials) => {
        materials.preload();
        for (let key in materials.materials) {
          if (materials.materials[key].map != null) {
            materials.materials[key].color.r = 1;
            materials.materials[key].color.g = 1;
            materials.materials[key].color.b = 1;
          }
        }
        objLoader.setMaterials(materials);
        this.loadArmModel(objLoader)
          .then(object => {
            this.armModels.set('main', object);
            resolve(true);
          });
      })
    });
  }
}
