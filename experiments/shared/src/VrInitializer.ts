import WebXRManager from './web-managers/WebXRManager';
import WebPageManager from './web-managers/WebPageManager';
import {SceneManagerInterface} from './scene/SceneManagerInterface';

let element: HTMLElement;

export class VrInitializer {
  private readonly sceneBuilder: SceneManagerInterface;

  constructor(sceneManager: SceneManagerInterface) {
    this.sceneBuilder = sceneManager;
  }

  addVrButton() {
    element = document.createElement('div');
    document.body.appendChild(element);
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
      new WebXRManager(this.sceneBuilder);
    });
    element.appendChild(button);
    return button;
  }

  public init() {
    if (!navigator.xr) {
      new WebPageManager(this.sceneBuilder);
    } else {
      // @ts-ignore
      navigator.xr.isSessionSupported('immersive-vr')
        .then(isSupported => {
          if (isSupported) {
            this.addVrButton();
          } else {
            new WebPageManager(this.sceneBuilder);
          }
        });
    }
  }
}


