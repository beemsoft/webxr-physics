import PhysicsHandler from './physicsHandler';
import RayInput from '../ray-input/ray-input';
import {Mesh} from 'three';

export default class PhysicsWithRayInputHandler extends PhysicsHandler {
  private readonly rayInput: RayInput;

  constructor(rayInput: RayInput) {
    super();
    this.rayInput = rayInput;
  }

  addMesh(mesh: Mesh) {
    super.addMesh(mesh);
    this.rayInput.add(mesh);
  }
}