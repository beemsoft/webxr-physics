import {ControllerInterface} from '../web-managers/ControllerInterface';
import {SceneManagerInterface} from './SceneManagerInterface';

export interface SceneWithControllers extends SceneManagerInterface{
  addRightController(controller: ControllerInterface)
  addLeftController(controller: ControllerInterface)
}
