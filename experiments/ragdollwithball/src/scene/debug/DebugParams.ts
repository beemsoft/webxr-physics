import SceneManager from '../sceneManager';
import {GUI} from 'dat.gui';
import BodyManager from '../human/bodyManager';

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
  rotationPelvis2: number;

  private sceneManager: SceneManager;
  private bodyManager: BodyManager;

  constructor(sceneManager: SceneManager,
              bodyManager: BodyManager) {
    this.sceneManager = sceneManager;
    this.bodyManager = bodyManager;
  }

  buildGui(): GUI {
    let gui = new GUI();
    this.headX = this.bodyManager.headBody.position.x;
    this.headY = this.bodyManager.headBody.position.y;
    this.headZ = this.bodyManager.headBody.position.z;
    this.leftHandX = this.bodyManager.leftHand.position.x;
    this.leftHandY = this.bodyManager.leftHand.position.y;
    this.leftHandZ = this.bodyManager.leftHand.position.z;
    this.rightHandX = this.bodyManager.rightHand.position.x;
    this.rightHandY = this.bodyManager.rightHand.position.y;
    this.rightHandZ = this.bodyManager.rightHand.position.z;
    gui.add(this, 'headX', -4, 4, 0.1);
    gui.add(this, 'headY', 0, 2, 0.1);
    gui.add(this, 'headZ', -4, 4, 0.1);
    gui.add(this, 'leftHandX', -4, 4, 0.1);
    gui.add(this, 'leftHandY', 0, 2, 0.1);
    gui.add(this, 'leftHandZ', -4, 4, 0.1);
    gui.add(this, 'rightHandX', -4, 4, 0.1);
    gui.add(this, 'rightHandY', 0, 2, 0.1);
    gui.add(this, 'rightHandZ', -4, 4, 0.1);
    return gui;
  }
}
