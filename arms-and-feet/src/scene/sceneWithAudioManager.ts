import SceneManager from './sceneManager';
import AudioHandler from '../audio/audioHandler';
import {Group, Scene} from 'three';
import PhysicsHandler from '../physics/physicsHandler';

export default class SceneWithAudioManager extends SceneManager {
  private audioHandler: AudioHandler;
  private cameraGroup: Group;

  constructor(scene: Scene, physicsHandler: PhysicsHandler, cameraGroup: Group) {
    super(scene, physicsHandler);
    this.audioHandler = new AudioHandler();
    this.audioHandler.initAudio();
    this.audioHandler.audioElement.play();
    this.cameraGroup = cameraGroup;
  }

  sayWelcome = () => {
    setTimeout(() => {
      this.audioHandler.audioElement.play();
      super.sayWelcome();
    }, 5000)
  };

  update() {
    super.update();
    if (this.humanHeadMesh) {
      this.audioHandler.setPosition(this.humanHeadMesh.position.sub(this.cameraGroup.position));
      this.audioHandler.setVolume(this.humanHeadMesh.position.sub(this.cameraGroup.position));
    }
  }

}
