import SceneManager from '../../../basic/src/scene/sceneManager';
import AudioHandler from '../audio/audioHandler';
import {PerspectiveCamera, Scene} from 'three';

export default class SceneWithAudioManager extends SceneManager {
  private audioHandler: AudioHandler;

  constructor(scene: Scene, camera: PerspectiveCamera) {
    super(scene, camera);
    this.audioHandler = new AudioHandler();
    this.audioHandler.initAudio();
    this.audioHandler.audioElement.play();
  }

  update() {
    super.update();
    this.audioHandler.setPosition(this.cube.position);
    this.audioHandler.setVolume(this.cube.position);
  }

}
