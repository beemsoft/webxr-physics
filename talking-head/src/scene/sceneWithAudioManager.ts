import SceneManager from './sceneManager';
import AudioHandler from '../audio/audioHandler';
import {PerspectiveCamera, Scene} from 'three';
import PhysicsHandler from '../physics/physicsHandler';

export default class SceneWithAudioManager extends SceneManager {
  private audioHandler: AudioHandler;

  constructor(scene: Scene, camera: PerspectiveCamera, physicsHandler: PhysicsHandler) {
    super(scene, camera, physicsHandler);
    this.audioHandler = new AudioHandler();
    this.audioHandler.initAudio();
    this.audioHandler.audioElement.play();
  }

  sayWelcome = () => {
    setTimeout(() => {
      this.audioHandler.audioElement.play();
      super.sayWelcome();
    }, 5000)
  };

  update() {
    super.update();
    if (this.cube) {
      this.audioHandler.setPosition(this.cube.position);
      this.audioHandler.setVolume(this.cube.position);
    }
  }

}
