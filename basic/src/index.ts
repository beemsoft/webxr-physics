import {PerspectiveCamera, Scene, WebGLRenderer} from 'three';
import * as _ from 'lodash';
import RayInput from './ray-input/ray-input';
import PhysicsHandler from './physicsHandler';
import SceneBuilder from './sceneBuilder';
import WebXRManager from './three-xr/WebXRManager';
import WebPageManager from './three-xr/WebPageManager';

let element: HTMLElement;
let renderer: VrRenderer;
let scene: Scene;
let camera: PerspectiveCamera;
let display: VRDisplay;
let gamepad: Gamepad;
let rayInput: RayInput;
// let rayHandler: RayHandler;
let sceneBuilder: SceneBuilder;
let physicsHandler: PhysicsHandler;
// let audioHandler: AudioHandler;
const dummyDisplay = 'Emulated HTC Vive DVT';

class VrRenderer extends WebGLRenderer {
    xr: WebXRManager;
}

function createElement() {
    element = document.createElement('div');
    element.innerHTML = _.join(['Hello', 'WebXR!'], ' ');
    return element;
}

function getVrDisplay(allDisplays: VRDisplay[]) {
    let displays = allDisplays;
    for (let i = 0; i < displays.length; i++) {
        display = displays[i];
        if (display.capabilities.canPresent) {
            return display;
        }
    }
}

// function getVRGamepad() {
//     let gamepads = navigator.getGamepads && navigator.getGamepads();
//     for (let i = 0; i < gamepads.length; i++) {
//         let gamepad = gamepads[i];
//         if (gamepad && gamepad.pose) {
//             console.log('gamepad: ' + gamepad.id);
//             return gamepad;
//         }
//     }
//     console.log('no gamepad found');
//     return null;
// }

// function initController() {
//     gamepad = getVRGamepad();
//     if (gamepad) {
//         rayInput = new RayInput(camera, gamepad);
//         // rayInput.setSize(renderer.getSize());
//         let cameraGroup = new Group();
//         cameraGroup.position.set(0, 0, 0);
//         cameraGroup.add(camera);
//         // cameraGroup.add(rayInput.getMesh());
//         scene.add(cameraGroup);
//         physicsHandler = new PhysicsHandler(scene, rayInput);
//         rayHandler = new RayHandler(scene, rayInput, physicsHandler);
//
//         // rayInput.on('raydown', (opt_mesh) => {
//         //     handleRayDown_();
//         //     // if (isDatGuiVisible && guiInputHelper !== null) {
//         //     //     guiInputHelper.pressed(true);
//         //     // }
//         //     rayHandler.handleRayDown_(opt_mesh);
//         // });
//         // rayInput.on('rayup', () => {
//         //     handleRayUp_();
//         //     rayHandler.handleRayUp_();
//         //     // if (isDatGuiVisible && guiInputHelper !== null) {
//         //     //     guiInputHelper.pressed(false);
//         //     // }
//         //     rayHandler.handleRayUp_();
//         // });
//         // rayInput.on('raydrag', () => { rayHandler.handleRayDrag_() });
//         // rayInput.on('raycancel', (opt_mesh) => { rayHandler.handleRayCancel_(opt_mesh) });
//         sceneBuilder = new SceneBuilder(scene, camera, physicsHandler, audioHandler);
//         sceneBuilder.build();
//     }
// }

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
        renderer.xr = new WebXRManager(display, renderer, camera, scene);
    });

    element.appendChild(button);
    console.log('3) Display VR button');
        window.addEventListener('vrdisplaypresentchange', (evt: CustomEvent) => {
            // @ts-ignore
            const display = evt.display;
            if (!display.isPresenting) {
                renderer.xr.endSession();
                document.getElementById('buttonsContainer').style.display = 'block';
            }
        });

    return button;
}

function initRenderer() {
    scene = new Scene();
    camera = new PerspectiveCamera();
    scene.add(camera);
    camera.position.set(0, 1, 0);

    renderer = new VrRenderer({alpha: true});
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.autoClear = false;

    function addOutputToPage() {
        const container = document.createElement('div');
        document.body.appendChild(container);
        container.appendChild(renderer.domElement);

    }

    addOutputToPage();

    console.log('2) Initialized WebGL renderer')
}

navigator.getVRDisplays()
    .then(function(displays) {
        let display: VRDisplay = getVrDisplay(displays);
        console.log('1) Detected VR display: ' + display.displayName);

        if (display.displayName !== dummyDisplay) {
            initRenderer();
            addVrButton();
        } else {
            new WebPageManager();
        }
    });

element = createElement();
document.body.appendChild(element);