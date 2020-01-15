import {Vec3} from 'cannon';
import {Math as Math2} from 'three';
import BodyManager from '../../../../shared/src/scene/human/bodyManager';

enum DanceStates {
    BASIS,
    RIGHT_TURN,
    RIGHT_TURN2,
    LEFT_TURN,
    LEFT_TURN2
}

export default class DanceManager {
  bodyManager: BodyManager;
  pelvisDegreeOnTurnStart: number;
  leftFootPosition: Vec3;
  rightFootPosition: Vec3;
  private previousAngleDegree1: number;
  private upperBodyTurnDegree: number;
  private previousDanceState = DanceStates.BASIS;
  private state = DanceStates.BASIS;
  private footOffset;

  constructor(bodyManager: BodyManager) {
    this.bodyManager = bodyManager;
    this.footOffset = bodyManager.scale * 0.2;
    let angleRadian1 = this.bodyManager.upperBody.quaternion.toAxisAngle(new Vec3(0,1,0))[1];
    this.previousAngleDegree1 = Math2.radToDeg(angleRadian1);
    this.leftFootPosition = new Vec3(this.bodyManager.pelvis.position.x - this.footOffset, 0, this.bodyManager.pelvis.position.z);
    this.rightFootPosition = new Vec3(this.bodyManager.pelvis.position.x + this.footOffset, 0, this.bodyManager.pelvis.position.z);
  }

  handleBasicTurn() {
    let angleRadian1 = this.bodyManager.upperBody.quaternion.toAxisAngle(new Vec3(0,1,0))[1];
    let angleRadian2 = this.bodyManager.pelvis.quaternion.toAxisAngle(new Vec3(0,1,0))[1];
    let angleDegree1 = Math2.radToDeg(angleRadian1);
    let angleDegree2 = Math2.radToDeg(angleRadian2);
    this.upperBodyTurnDegree = angleDegree1;

    if (this.upperBodyTurnDegree % 180 < 10 || this.upperBodyTurnDegree % 180 > 170) {
      this.state = DanceStates.BASIS;
    }
    if (this.upperBodyTurnDegree > 10 && this.upperBodyTurnDegree < 45) {
      if (this.state === DanceStates.LEFT_TURN2) {
        this.rightFootPosition = new Vec3(this.bodyManager.headInitialPosition.x + this.footOffset, 0, this.bodyManager.headInitialPosition.z);
      }
    }
    if (this.upperBodyTurnDegree > 45 && this.upperBodyTurnDegree < 90) {
      if (angleDegree1 > this.previousAngleDegree1) {
        if (this.bodyManager.upperBody.quaternion.y < 0) {
          if (this.state === DanceStates.BASIS) {
            this.state = DanceStates.RIGHT_TURN;
            this.pelvisDegreeOnTurnStart = angleDegree2;
            this.rightFootPosition = new Vec3(this.bodyManager.headInitialPosition.x, 0, this.bodyManager.headInitialPosition.z + this.footOffset);
          }
        } else {
          if (this.state === DanceStates.BASIS) {
            this.state = DanceStates.LEFT_TURN;
            this.rightFootPosition = new Vec3(this.bodyManager.headInitialPosition.x, 0, this.bodyManager.headInitialPosition.z - this.footOffset);
          }
        }
      } else if (this.state === DanceStates.LEFT_TURN2) {
        this.leftFootPosition = new Vec3(this.bodyManager.headInitialPosition.x - this.footOffset, 0, this.bodyManager.headInitialPosition.z);
      } else if (this.state === DanceStates.RIGHT_TURN2) {
        this.rightFootPosition = new Vec3(this.bodyManager.headInitialPosition.x + this.footOffset, 0, this.bodyManager.headInitialPosition.z);
      }
    }
    if (this.upperBodyTurnDegree > 90 && this.upperBodyTurnDegree < 135) {
      if (this.state === DanceStates.RIGHT_TURN) {
        this.leftFootPosition = new Vec3(this.bodyManager.headInitialPosition.x + this.footOffset, 0, this.bodyManager.headInitialPosition.z);
      } else if (this.state === DanceStates.RIGHT_TURN2) {
        this.leftFootPosition = new Vec3(this.bodyManager.headInitialPosition.x - this.footOffset, 0, this.bodyManager.headInitialPosition.z);
      } else if (this.state === DanceStates.LEFT_TURN) {
        this.leftFootPosition = new Vec3(this.bodyManager.headInitialPosition.x + this.footOffset, 0, this.bodyManager.headInitialPosition.z);
      } else if (this.state === DanceStates.LEFT_TURN2) {
        this.rightFootPosition = new Vec3(this.bodyManager.headInitialPosition.x, 0, this.bodyManager.headInitialPosition.z + this.footOffset);
      }
    }
    if (this.upperBodyTurnDegree > 135 && this.upperBodyTurnDegree < 170) {
      if (this.bodyManager.upperBody.quaternion.y > 0) {
        if (this.state === DanceStates.BASIS) {
          this.state = DanceStates.RIGHT_TURN2;
        }
      } else {
        if (this.state === DanceStates.BASIS) {
          this.state = DanceStates.LEFT_TURN2;
        }
      }
      if (this.state === DanceStates.RIGHT_TURN) {
        this.rightFootPosition = new Vec3(this.bodyManager.headInitialPosition.x - this.footOffset, 0, this.bodyManager.headInitialPosition.z);
      } else if (this.state === DanceStates.RIGHT_TURN2) {
        this.rightFootPosition = new Vec3(this.bodyManager.headInitialPosition.x, 0, this.bodyManager.headInitialPosition.z - this.footOffset);
      } else {
        this.rightFootPosition = new Vec3(this.bodyManager.headInitialPosition.x - this.footOffset, 0, this.bodyManager.headInitialPosition.z);
      }
    }
    if (this.upperBodyTurnDegree > 190 && this.upperBodyTurnDegree < 225) {
      if (this.bodyManager.upperBody.quaternion.y > 0) {
        if (this.state === DanceStates.BASIS) {
          this.state = DanceStates.LEFT_TURN;
        }
      } else {
        if (this.state === DanceStates.BASIS) {
          this.state = DanceStates.RIGHT_TURN;
        }
      }
      if (this.state === DanceStates.RIGHT_TURN) {
        this.rightFootPosition = new Vec3(this.bodyManager.headInitialPosition.x, 0, this.bodyManager.headInitialPosition.z - this.footOffset);
      } else if (this.state === DanceStates.RIGHT_TURN2) {
        this.rightFootPosition = new Vec3(this.bodyManager.headInitialPosition.x - this.footOffset, 0, this.bodyManager.headInitialPosition.z);
      } else {
        this.leftFootPosition = new Vec3(this.bodyManager.headInitialPosition.x + this.footOffset, 0, this.bodyManager.headInitialPosition.z);
      }
    }
    if (this.upperBodyTurnDegree > 225 && this.upperBodyTurnDegree < 270) {
      if (this.state === DanceStates.RIGHT_TURN) {
        this.leftFootPosition = new Vec3(this.bodyManager.headInitialPosition.x - this.footOffset, 0, this.bodyManager.headInitialPosition.z);
      } else if (this.state === DanceStates.RIGHT_TURN2) {
        this.leftFootPosition = new Vec3(this.bodyManager.headInitialPosition.x + this.footOffset, 0, this.bodyManager.headInitialPosition.z);
      } else if (this.state === DanceStates.LEFT_TURN) {
        this.rightFootPosition = new Vec3(this.bodyManager.headInitialPosition.x, 0, this.bodyManager.headInitialPosition.z + this.footOffset);
      } else if (this.state === DanceStates.LEFT_TURN2) {
        this.rightFootPosition = new Vec3(this.bodyManager.headInitialPosition.x, 0, this.bodyManager.headInitialPosition.z - this.footOffset);
      }
  }
    if (this.upperBodyTurnDegree > 270 && this.upperBodyTurnDegree < 315) {
      if (this.state === DanceStates.RIGHT_TURN) {
        this.rightFootPosition = new Vec3(this.bodyManager.headInitialPosition.x + this.footOffset, 0, this.bodyManager.headInitialPosition.z);
      } else if (this.state === DanceStates.LEFT_TURN || this.state === DanceStates.LEFT_TURN2) {
        this.leftFootPosition = new Vec3(this.bodyManager.headInitialPosition.x - this.footOffset, 0, this.bodyManager.headInitialPosition.z);
      } else if (this.state === DanceStates.RIGHT_TURN2) {
        this.rightFootPosition = new Vec3(this.bodyManager.headInitialPosition.x, 0, this.bodyManager.headInitialPosition.z + this.footOffset);
      }
    }
    if (this.upperBodyTurnDegree > 315 && this.upperBodyTurnDegree < 350) {
      if (this.state === DanceStates.LEFT_TURN) {
        this.rightFootPosition = new Vec3(this.bodyManager.headInitialPosition.x + this.footOffset, 0, this.bodyManager.headInitialPosition.z);
      }
      if (this.bodyManager.upperBody.quaternion.y > 0) {
        if (this.state === DanceStates.BASIS) {
          this.state = DanceStates.RIGHT_TURN2;
        }
      } else {
        if (this.state === DanceStates.BASIS) {
          this.state = DanceStates.LEFT_TURN2;
        }
      }
    }
    if (this.state === DanceStates.BASIS) {
      // console.log('Upperbody degree: ' + this.upperBodyTurnDegree);
    }
    this.previousAngleDegree1 = angleDegree1;
    if (this.state !== this.previousDanceState) {
      this.previousDanceState = this.state;
      // console.log('Dance state: ' + this.state + '(upper body turn degree: ' + this.upperBodyTurnDegree + ')');
    }
  }
}
