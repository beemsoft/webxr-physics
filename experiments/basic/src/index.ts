import {VrInitializer} from '../../shared/src/VrInitializer';
import SceneManager from './scene/sceneManager';

let sceneManager = new SceneManager();
let initializer = new VrInitializer(sceneManager);
initializer.init();
