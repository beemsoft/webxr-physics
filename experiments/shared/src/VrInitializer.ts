import {PerspectiveCamera, Scene, WebGLRenderer} from 'three';
import WebXRManager from './web-managers/WebXRManager';
import WebPageManager from './web-managers/WebPageManager';
import {SceneManagerInterface} from './scene/SceneManagerInterface';

let element: HTMLElement;
let renderer: WebGLRenderer;
let scene: Scene;
let camera: PerspectiveCamera;

export class VrInitializer {
  private readonly sceneBuilder: SceneManagerInterface;

  constructor(sceneManager: SceneManagerInterface) {
    this.sceneBuilder = sceneManager;
  }

  addVrButton() {
    const button = document.createElement('button');
    button.style.display = 'inline-block';
    button.style.margin = '5px';
    button.style.width = '120px';
    button.style.border = '0';
    button.style.padding = '8px';
    button.style.cursor = 'pointer';
    button.style.backgroundColor = '#000';
    button.style.color = '#fff';
    button.style.fontFamily = 'sans-serif';
    button.style.fontSize = '13px';
    button.style.fontStyle = 'normal';
    button.style.textAlign = 'center';
    button.textContent = 'ENTER VR';

    button.addEventListener('click', () => {
      new WebXRManager(renderer, camera, scene, this.sceneBuilder, true);
    });

    element.appendChild(button);
    console.log('3) Display VR button');
    return button;
  }

  initRenderer() {
    scene = new Scene();
    camera = new PerspectiveCamera();
    renderer = new WebGLRenderer({alpha: true});
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.autoClear = false;
    console.log('2) Initialized WebGL renderer')
  }

  public init() {
    // @ts-ignore
    navigator.xr.isSessionSupported('immersive-vr')
      .then(isSupported => {
        if (isSupported) {
          this.initRenderer();
          this.addVrButton();
        } else {
          new WebPageManager(this.sceneBuilder);
        }
      });
    // Add div for button
    element = document.createElement('div');
    document.body.appendChild(element);
  }
}


