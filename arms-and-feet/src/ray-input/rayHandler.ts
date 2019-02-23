import {Mesh, MeshBasicMaterial, Scene, SphereGeometry} from 'three';
import PhysicsHandler from '../physics/physicsHandler';
import RayInput from './ray-input';

export default class RayHandler {
  private scene: Scene;
  private rayInput: RayInput;
  private physicsHandler: PhysicsHandler;
  private clickMarker: Mesh;

  constructor(scene, rayInput: RayInput, physicsHandler) {
    this.scene = scene;
    this.rayInput = rayInput;
    this.physicsHandler = physicsHandler;
  }

  handleRayDown_(opt_mesh) {
    let pos = this.rayInput.renderer.reticle.position;
    if (pos) {
      // pos.y += 2;
      this.physicsHandler.constraintDown = true;
      this.setClickMarker(pos.x, pos.y, pos.z);
      this.physicsHandler.addPointerConstraintToMesh(pos, opt_mesh);
    }
  }

  handleRayDrag_() {
    if (this.physicsHandler.pointerConstraint) {
      let pos = this.rayInput.renderer.reticle.position;
      if (pos) {
        // pos.y += 2;
        this.setClickMarker(pos.x, pos.y, pos.z);
        this.physicsHandler.moveJointToPoint(pos.x, pos.y, pos.z);
      }
    }
  }

  handleRayUp_() {
    this.physicsHandler.constraintDown = false;
    this.removeClickMarker();
    this.physicsHandler.removeJointConstraint();
  }

  setClickMarker(x, y, z) {
    if (!this.clickMarker) {
      const shape = new SphereGeometry(0.05, 8, 8);
      const markerMaterial = new MeshBasicMaterial({color: 0xff0000});
      this.clickMarker = new Mesh(shape, markerMaterial);
      this.scene.add(this.clickMarker);
    }
    this.clickMarker.visible = true;
    this.clickMarker.position.set(x, y, z);
  }

  removeClickMarker(){
    this.clickMarker.visible = false;
  }
}