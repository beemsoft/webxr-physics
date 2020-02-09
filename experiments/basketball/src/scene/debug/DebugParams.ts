import SceneManager from '../sceneManager';
import {GUI} from 'dat.gui';
import BodyManager from '../../../../shared/src/scene/human/bodyManager';
import SimpleHandManager from '../../../../shared/src/controller-hands/SimpleHandManager';

export default class DebugParams {
  leftHandX: number;
  leftHandY: number;
  leftHandZ: number;
  rightHandX: number;
  rightHandY: number;
  rightHandZ: number;

  private sceneManager: SceneManager;
  private bodyManager: SimpleHandManager;

  constructor(sceneManager: SceneManager,
              bodyManager: SimpleHandManager) {
    this.sceneManager = sceneManager;
    this.bodyManager = bodyManager;
  }

  pressLeftHand() {
    this.sceneManager.moveTowardsTheBall();
  }

  buildGui(bodyManager: SimpleHandManager): Promise<GUI> {
    return new Promise(resolve => {
      let gui = new GUI();
      this.leftHandX = bodyManager.leftHand.position.x;
      this.leftHandY = bodyManager.leftHand.position.y;
      this.leftHandZ = bodyManager.leftHand.position.z;
      this.rightHandX = bodyManager.rightHand.position.x;
      this.rightHandY = bodyManager.rightHand.position.y;
      this.rightHandZ = bodyManager.rightHand.position.z;
      gui.add(this, 'leftHandX', -4, 4, 0.1);
      gui.add(this, 'leftHandY', -2, 2, 0.1);
      gui.add(this, 'leftHandZ', -4, 4, 0.1);
      gui.add(this, 'rightHandX', -4, 4, 0.1);
      gui.add(this, 'rightHandY', -2, 2, 0.1);
      gui.add(this, 'rightHandZ', -4, 4, 0.1);
      gui.add(this, 'pressLeftHand');
      return resolve(gui);
    });
  }
}
