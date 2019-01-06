import {Vector2} from 'three';
import EventEmitter from 'events';

const DRAG_DISTANCE_PX = 10;

export default class RayController {
  private gamepad: Gamepad;
  private pointer: Vector2;
  private lastPointer: Vector2;
  private pointerNdc: Vector2;
  private dragDistance: number;
  private isDragging: boolean;
  private size: any;
  private wasGamepadPressed: boolean;
  public controllerEventEmitter = new EventEmitter();

  constructor(vrGamepad) {
    this.gamepad = vrGamepad;
    this.pointer = new Vector2();
    this.lastPointer = new Vector2();
    // Position of pointer in Normalized Device Coordinates (NDC).
    this.pointerNdc = new Vector2();
    this.dragDistance = 0;
    this.isDragging = false;
  }

  setSize(size) {
    this.size = size;
  }

  update() {
      let isGamepadPressed = this.getGamepadButtonPressed_();
      if (isGamepadPressed && !this.wasGamepadPressed) {
        this.isDragging = true;
        this.controllerEventEmitter.emit('raydown');
      }
      if (!isGamepadPressed && this.wasGamepadPressed) {
        this.isDragging = false;
        this.controllerEventEmitter.emit('rayup');
      }
      this.wasGamepadPressed = isGamepadPressed;

      if (this.isDragging) {
        this.controllerEventEmitter.emit('raydrag');
      }
  }

  getGamepadButtonPressed_() {
    for (let j = 0; j < this.gamepad.buttons.length; ++j) {
      if (this.gamepad.buttons[j].pressed) {
        return true;
      }
    }
    return false;
  }

  updatePointer_(e) {
    this.pointer.set(e.clientX, e.clientY);
    this.pointerNdc.x = (e.clientX / this.size.width) * 2 - 1;
    this.pointerNdc.y = - (e.clientY / this.size.height) * 2 + 1;
  }

  updateDragDistance_() {
    if (this.isDragging) {
      const distance = this.lastPointer.sub(this.pointer).length();
      this.dragDistance += distance;
      this.lastPointer.copy(this.pointer);

      if (this.dragDistance > DRAG_DISTANCE_PX) {
        this.controllerEventEmitter.emit('raycancel');
        this.isDragging = false;
      }
    }
  }

  startDragging_(e) {
    this.isDragging = true;
    this.lastPointer.set(e.clientX, e.clientY);
  }

  endDragging_() {
    if (this.dragDistance < DRAG_DISTANCE_PX) {
      this.controllerEventEmitter.emit('rayup');
    }
    this.dragDistance = 0;
    this.isDragging = false;
  }
}
