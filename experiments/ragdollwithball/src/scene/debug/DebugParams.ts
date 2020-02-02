import SceneManager from '../sceneManager';
import {GUI} from 'dat.gui';
import BodyManager from '../../../../shared/src/scene/human/bodyManager';

export default class DebugParams {
  headX: number;
  headY: number;
  headZ: number;
  leftHandX: number;
  leftHandY: number;
  leftHandZ: number;
  rightHandX: number;
  rightHandY: number;
  rightHandZ: number;

  private sceneManager: SceneManager;
  private bodyManager: BodyManager;

  constructor(sceneManager: SceneManager,
              bodyManager: BodyManager) {
    this.sceneManager = sceneManager;
    this.bodyManager = bodyManager;
  }

  pressLeftHand() {
    this.sceneManager.moveTowardsTheBall();
  }

  pressRightHand() {
    this.sceneManager.rotateBody();
  }

  buildGui(bodyManager: BodyManager): Promise<GUI> {
    return new Promise(resolve => {
      let gui = new GUI();
      this.headX = bodyManager.headBody.position.x;
      this.headY = bodyManager.headBody.position.y;
      this.headZ = bodyManager.headBody.position.z;
      this.leftHandX = bodyManager.leftHand.position.x;
      this.leftHandY = bodyManager.leftHand.position.y;
      this.leftHandZ = bodyManager.leftHand.position.z;
      this.rightHandX = bodyManager.rightHand.position.x;
      this.rightHandY = bodyManager.rightHand.position.y;
      this.rightHandZ = bodyManager.rightHand.position.z;
      gui.add(this, 'headX', -4, 4, 0.1);
      gui.add(this, 'headY', 0, 2, 0.1);
      gui.add(this, 'headZ', -4, 4, 0.1);
      gui.add(this, 'leftHandX', -4, 4, 0.1);
      gui.add(this, 'leftHandY', -2, 2, 0.1);
      gui.add(this, 'leftHandZ', -4, 4, 0.1);
      gui.add(this, 'rightHandX', -4, 4, 0.1);
      gui.add(this, 'rightHandY', -2, 2, 0.1);
      gui.add(this, 'rightHandZ', -4, 4, 0.1);
      gui.add(this, 'pressLeftHand');
      gui.add(this, 'pressRightHand');
      return resolve(gui);
    });
  }
}
