import {Mesh} from 'three';
import {MTLLoader, OBJLoader} from 'three-obj-mtl-loader'

export default class HumanFaceManager {
  faceModels = new Map<string, Mesh>();

  private loadFaceModel(objLoader: OBJLoader, faceModel: string): Promise<Mesh> {
    return new Promise(resolve => {
      objLoader.load('../assets/head/'+faceModel+'.obj', (object) => {
        object.children[0].geometry.scale(0.003, 0.003, 0.003);
        object.children[1].geometry.scale(0.003, 0.003, 0.003);
        resolve(object);
      })
    })
  }

  loadFaceModels(): Promise<boolean> {
    let mtlLoader = new MTLLoader();
    let objLoader = new OBJLoader();

    return new Promise(resolve => {
      mtlLoader.load('../assets/head/v332_obj.mtl', (materials) => {
        materials.preload();
        for (let key in materials.materials) {
          if (materials.materials[key].map != null) {
            materials.materials[key].color.r = 1;
            materials.materials[key].color.g = 1;
            materials.materials[key].color.b = 1;
          }
        }
        objLoader.setMaterials(materials);
        this.loadFaceModel(objLoader, 'v332_obj')
          .then(object => {
            this.faceModels.set('main', object);
            resolve(true);
          });
        this.loadFaceModel(objLoader, 'v332_obj_Phonemeaah')
          .then(object => this.faceModels.set('Phonemeaah', object));
        this.loadFaceModel(objLoader, 'v332_obj_PhonemeB,M,P')
          .then(object => this.faceModels.set('PhonemeB,M,P', object));
        this.loadFaceModel(objLoader, 'v332_obj_Phonemebigaah')
          .then(object => this.faceModels.set('Phonemebigaah', object));
        this.loadFaceModel(objLoader, 'v332_obj_Phonemech,J,sh')
          .then(object => this.faceModels.set('Phonemech,J,sh', object));
        this.loadFaceModel(objLoader, 'v332_obj_PhonemeD,S,T')
          .then(object => this.faceModels.set('PhonemeD,S,T', object));
        this.loadFaceModel(objLoader, 'v332_obj_Phonemeee')
          .then(object => this.faceModels.set('Phonemeee', object));
        this.loadFaceModel(objLoader, 'v332_obj_Phonemeeh')
          .then(object => this.faceModels.set('Phonemeeh', object));
        this.loadFaceModel(objLoader, 'v332_obj_PhonemeF,V')
          .then(object => this.faceModels.set('PhonemeF,V', object));
        this.loadFaceModel(objLoader, 'v332_obj_Phonemei')
          .then(object => this.faceModels.set('Phonemei', object));
        this.loadFaceModel(objLoader, 'v332_obj_PhonemeK')
          .then(object => this.faceModels.set('PhonemeK', object));
        this.loadFaceModel(objLoader, 'v332_obj_PhonemeN')
          .then(object => this.faceModels.set('PhonemeN', object));
        this.loadFaceModel(objLoader, 'v332_obj_Phonemeoh')
          .then(object => this.faceModels.set('Phonemeoh', object));
        this.loadFaceModel(objLoader, 'v332_obj_Phonemeooh,Q')
          .then(object => this.faceModels.set('Phonemeooh,Q', object));
        this.loadFaceModel(objLoader, 'v332_obj_PhonemeR')
          .then(object => this.faceModels.set('PhonemeR', object));
        this.loadFaceModel(objLoader, 'v332_obj_Phonemeth')
          .then(object => this.faceModels.set('Phonemeth', object));
        this.loadFaceModel(objLoader, 'v332_obj_PhonemeW')
          .then(object => this.faceModels.set('PhonemeW', object));
      })
    });
  }
}
