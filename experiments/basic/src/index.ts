import {VrInitializer} from '../../shared/src/VrInitializer';
import {PerspectiveCamera, Scene} from 'three';
import SceneManager from './scene/sceneManager';

let camera = new PerspectiveCamera();
let scene = new Scene();
let sceneManager = new SceneManager(scene, camera);
let initializer = new VrInitializer(sceneManager);
initializer.init();
