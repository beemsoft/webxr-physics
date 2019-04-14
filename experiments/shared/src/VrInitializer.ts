import {PerspectiveCamera, Scene, WebGLRenderer} from 'three';
import WebXRManager from './web-managers/WebXRManager';
import WebPageManager from './web-managers/WebPageManager';
import {SceneManagerInterface} from './scene/SceneManagerInterface';

let element: HTMLElement;
let renderer: WebGLRenderer;
let webManager: WebXRManager;
let scene: Scene;
let camera: PerspectiveCamera;
let display: VRDisplay;
const dummyDisplay = 'Emulated HTC Vive DVT';

export class VrInitializer {
  private sceneBuilder: SceneManagerInterface;

  constructor(sceneManager: SceneManagerInterface) {
    this.sceneBuilder = sceneManager;
  }

  detectVrDisplay(allDisplays: VRDisplay[]) {
    let displays = allDisplays;
    for (let i = 0; i < displays.length; i++) {
      display = displays[i];
      if (display.capabilities.canPresent) {
        return display;
      }
    }
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
      webManager = new WebXRManager(display, renderer, camera, scene, this.sceneBuilder);
    });

    element.appendChild(button);
    console.log('3) Display VR button');
    return button;
  }

  initRenderer() {
    scene = new Scene();
    camera = new PerspectiveCamera();
    scene.add(camera);
    camera.position.set(0, 1, 0);
    renderer = new WebGLRenderer({alpha: true});
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.autoClear = false;
    console.log('2) Initialized WebGL renderer')
  }

  public init() {
    navigator.getVRDisplays()
      .then(displays => {
        let display: VRDisplay = this.detectVrDisplay(displays);
        if (!!display && display.displayName !== dummyDisplay) {
          this.initRenderer();
          this.addVrButton();
        } else {
          new WebPageManager();
        }
      });
    element = document.createElement('div');
    document.body.appendChild(element);
  }
}


