import {ResonanceAudio, Source} from "resonance-audio";
// @ts-ignore
import cubeSound from '../../../js/resources/speech.wav';

export default class AudioHandler {
  
  private audioReady: boolean;
  private readonly dimensions: { depth: number; width: number; height: number };
  private readonly materials: { left: string; back: string; right: string; front: string; up: string; down: string };
  private audioContext: AudioContext;
  audioElement: HTMLAudioElement;
  private audioElementSource: AudioNode;
  private audioScene: ResonanceAudio;
  private output: GainNode;
  private source: Source;

  constructor() {
    let dimensions = {width: 10, height: 7, depth: 10};
    let materials = {
      left: 'uniform', right: 'uniform',
      front: 'uniform', back: 'uniform',
      up: 'uniform', down: 'uniform',
    };
    this.audioReady = false;
    this.dimensions = dimensions;
    this.materials = materials;
  }

  initAudio() {
    this.audioContext = new AudioContext();
    this.audioElement = document.createElement('audio');
    this.audioElement.src = cubeSound;
    this.audioElement.load();
    this.audioElement.loop = false;
    this.audioElementSource = this.audioContext.createMediaElementSource(this.audioElement);

    this.audioScene = new ResonanceAudio(this.audioContext, {
      ambisonicOrder: 3,
      dimensions: this.dimensions,
      materials: this.materials
    });
    this.source = this.audioScene.createSource();
    this.audioElementSource.connect(this.source.input);
    this.audioScene.output.connect(this.audioContext.destination);
    this.output = this.audioContext.createGain();
    this.audioReady = true;
  }

  setPosition(v) {
    this.source.setPosition(v.x, v.y, v.z);
  }

  setVolume(v) {
    let distance = Math.sqrt(v.x * v.x + v.y * v.y + v.z * v.z);
    let gain = 1 - distance / 10;
    gain = Math.max(0, Math.min(1, gain));
    this.output.gain.value = gain;
  }
}
