import {VrInitializer} from '../../shared/src/VrInitializer';
import {Scene} from 'three';
import SceneManager from './scene/sceneManager';

let scene = new Scene();
let sceneManager = new SceneManager(scene);
let initializer = new VrInitializer(sceneManager);
initializer.init();
