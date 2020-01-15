import SceneManager from '../sceneManager';
import {GUI} from 'dat.gui';
import {Vec3} from 'cannon';
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
  rotationPelvis2: number;

  private sceneManager: SceneManager;
  private bodyManager: BodyManager;
  private bodyManager2: BodyManager;

  constructor(sceneManager: SceneManager,
              bodyManager: BodyManager,
              bodyManager2: BodyManager) {
    this.sceneManager = sceneManager;
    this.bodyManager = bodyManager;
    this.bodyManager2 = bodyManager2;
  }

  releaseRightHand() {
    this.sceneManager.releaseRightHand();
  }

  releaseLeftHand() {
    this.sceneManager.releaseLeftHand();
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
    this.rotationPelvis2 = this.bodyManager2.upperBody.quaternion.toAxisAngle(new Vec3(0,1,0))[1];
    gui.add(this, 'headX', -4, 4, 0.1);
    gui.add(this, 'headY', 0, 2, 0.1);
    gui.add(this, 'headZ', -4, 4, 0.1);
    gui.add(this, 'leftHandX', -4, 4, 0.1);
    gui.add(this, 'leftHandY', 0, 2, 0.1);
    gui.add(this, 'leftHandZ', -4, 4, 0.1);
    gui.add(this, 'rightHandX', -4, 4, 0.1);
    gui.add(this, 'rightHandY', 0, 2, 0.1);
    gui.add(this, 'rightHandZ', -4, 4, 0.1);
    gui.add(this, 'rotationPelvis2', -2 * Math.PI, 2 * Math.PI, 0.01);
    gui.add(this, 'releaseRightHand');
    gui.add(this, 'releaseLeftHand');
    return gui;
  }
}
