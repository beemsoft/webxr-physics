import {PerspectiveCamera, Scene, WebGLRenderer} from 'three';
import WebXRManager from './web-managers/WebXRManager';
import WebPageManager from './web-managers/WebPageManager';

let element: HTMLElement;
let renderer: WebGLRenderer;
let webManager: WebXRManager;
let scene: Scene;
let camera: PerspectiveCamera;
let display: VRDisplay;
const dummyDisplay = 'Emulated HTC Vive DVT';

function detectVrDisplay(allDisplays: VRDisplay[]) {
  let displays = allDisplays;
  for (let i = 0; i < displays.length; i++) {
    display = displays[i];
    if (display.capabilities.canPresent) {
      return display;
    }
  }
}

function addVrButton() {
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
    webManager = new WebXRManager(display, renderer, camera, scene);
  });

  element.appendChild(button);
  console.log('3) Display VR button');
  return button;
}

function initRenderer() {
  scene = new Scene();
  camera = new PerspectiveCamera();
  scene.add(camera);
  camera.position.set(0, 1, 0);
  renderer = new WebGLRenderer({alpha: true});
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.autoClear = false;
  console.log('2) Initialized WebGL renderer')
}

navigator.getVRDisplays()
  .then(displays => {
    let display: VRDisplay = detectVrDisplay(displays);
    console.log('1) Detected VR display: ' + display.displayName);

    if (display.displayName !== dummyDisplay) {
      initRenderer();
      addVrButton();
    } else {
      new WebPageManager();
    }
  });

element = document.createElement('div');
document.body.appendChild(element);