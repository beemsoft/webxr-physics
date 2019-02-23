import {
  AmbientLight,
  BoxGeometry,
  Clock,
  CylinderGeometry,
  DirectionalLight,
  Face3,
  Geometry,
  Matrix4,
  Mesh,
  MeshLambertMaterial,
  Object3D,
  PlaneGeometry,
  Scene,
  SphereGeometry,
  Vector3
} from 'three';
import {Body, Box, ConeTwistConstraint, Shape, Sphere, Vec3} from 'cannon';
import PhysicsHandler from '../physics/physicsHandler';
import {MTLLoader, OBJLoader} from 'three-obj-mtl-loader'
import HumanFaceManager from './human/humanFaceManager';
import HumanArmManager from './human/humanArmManager';

export default class SceneManager {
  private scene: Scene;
  private physicsHandler: PhysicsHandler;
  protected cube: Mesh;
  private clock = new Clock();
  private humanFaceManager = new HumanFaceManager();
  private humanArmManager = new HumanArmManager();

  constructor(scene: Scene, physicsHandler: PhysicsHandler) {
    this.scene = scene;
    this.physicsHandler = physicsHandler;
    this.build();
    this.humanFaceManager.loadFaceModels()
      .then(this.addFace);
    this.humanArmManager.loadArmModels()
      .then(this.addArm);
  }

  replaceHead = (faceModelName: string) => {
    let object = this.humanFaceManager.faceModels.get(faceModelName);
    object.position.copy(this.cube.position);
    object.quaternion.copy(this.cube.quaternion);
    object.rotation.copy(this.cube.rotation);
    this.scene.remove(this.cube);
    this.physicsHandler.replaceMesh(this.cube, object);
    this.scene.add(object);
    this.cube = object;
  };

  addArm = () => {
    let rightArm = this.humanArmManager.armModels.get('main');
    rightArm.children[0].position.set(-0.7, 0.3, -2);
    rightArm.children[0].rotateX(-Math.PI/2);
    let leftArm = rightArm.clone();
    leftArm.position.set(0.7, 0.3, -2);
    leftArm.applyMatrix(new Matrix4().makeScale(-1, 1, 1));
    this.scene.add(rightArm);
    this.scene.add(leftArm);
    let leftArmGeometry = new CylinderGeometry(0.1, 0.1, 1.7);
    let material = new MeshLambertMaterial( { color: 0x777777 } );

    // Moet Cannon body worden
    let mesh = new Mesh( leftArmGeometry, material );
    mesh.position.set(-0.7, 0.3, -2);
    mesh.rotateZ(-Math.PI/8);
    // mesh.rotateY(Math.PI/4);
    mesh.rotateX(-Math.PI/10);
    this.scene.add(mesh);
    this.physicsHandler.addMesh(rightArm);
    const cubeBody = new Body({mass: 1, position: new Vec3(0, 0, -1.5)});
    this.physicsHandler.addBody(cubeBody);
  };

  addFace = () => {
    let object = this.humanFaceManager.faceModels.get('main');
    this.scene.add(object);
    this.cube = object;
    this.physicsHandler.addMesh(this.cube);
    const faceGeometry = new BoxGeometry(0.2, 0.2);
    let material = new MeshLambertMaterial( { color: 0x777777 } );
    let mesh = new Mesh( faceGeometry, material );
    mesh.position.set(0, 0, -1.5);
    this.scene.add(mesh);
    const cubeBody = new Body({mass: 1, position: new Vec3(0, 0, -1.5)});
    this.physicsHandler.addBody(cubeBody);
    this.sayWelcome();
  };

  shape2mesh(body, material) {
    let j;
    let i;
    const obj = new Object3D();

    for (let l = 0; l < body.shapes.length; l++) {
      const shape = body.shapes[l];

      let mesh;

      switch(shape.type){

        case Shape.types.SPHERE:
          const sphere_geometry = new SphereGeometry(shape.radius, 8, 8);
          mesh = new Mesh( sphere_geometry, material );
          break;

        case Shape.types.PLANE:
          let geometry = new PlaneGeometry(10, 10, 4, 4);
          mesh = new Object3D();
          const submesh = new Object3D();
          const ground = new Mesh(geometry, material);
          ground.scale.set(100, 100, 100);
          submesh.add(ground);

          ground.castShadow = true;
          ground.receiveShadow = true;

          mesh.add(submesh);
          break;

        case Shape.types.BOX:
          const box_geometry = new BoxGeometry(shape.halfExtents.x * 2,
            shape.halfExtents.y * 2,
            shape.halfExtents.z * 2);
          mesh = new Mesh( box_geometry, material );
          break;

        case Shape.types.CONVEXPOLYHEDRON:
          const geo = new Geometry();

          // Add vertices
          for (i = 0; i < shape.vertices.length; i++) {
            const v = shape.vertices[i];
            geo.vertices.push(new Vector3(v.x, v.y, v.z));
          }

          for(i = 0; i < shape.faces.length; i++){
            const face = shape.faces[i];

            // add triangles
            const a = face[0];
            for (j = 1; j < face.length - 1; j++) {
              const b = face[j];
              const c = face[j + 1];
              geo.faces.push(new Face3(a, b, c));
            }
          }
          geo.computeBoundingSphere();
          geo.computeFaceNormals();
          mesh = new Mesh( geo, material );
          break;

        case Shape.types.HEIGHTFIELD:
          geometry = new PlaneGeometry();

          const v0 = new Vec3();
          const v1 = new Vec3();
          const v2 = new Vec3();
          for (let xi = 0; xi < shape.data.length - 1; xi++) {
            for (let yi = 0; yi < shape.data[xi].length - 1; yi++) {
              for (let k = 0; k < 2; k++) {
                shape.getConvexTrianglePillar(xi, yi, k===0);
                v0.copy(shape.pillarConvex.vertices[0]);
                v1.copy(shape.pillarConvex.vertices[1]);
                v2.copy(shape.pillarConvex.vertices[2]);
                v0.vadd(shape.pillarOffset, v0);
                v1.vadd(shape.pillarOffset, v1);
                v2.vadd(shape.pillarOffset, v2);
                geometry.vertices.push(
                  new Vector3(v0.x, v0.y, v0.z),
                  new Vector3(v1.x, v1.y, v1.z),
                  new Vector3(v2.x, v2.y, v2.z)
                );
                i = geometry.vertices.length - 3;
                geometry.faces.push(new Face3(i, i+1, i+2));
              }
            }
          }
          geometry.computeBoundingSphere();
          geometry.computeFaceNormals();
          mesh = new Mesh(geometry, material);
          break;

        default:
          throw "Visual type not recognized: "+shape.type;
      }

      mesh.receiveShadow = true;
      mesh.castShadow = true;
      if(mesh.children){
        for(i = 0; i<mesh.children.length; i++){
          mesh.children[i].castShadow = true;
          mesh.children[i].receiveShadow = true;
          if(mesh.children[i]){
            for(j = 0; j<mesh.children[i].length; j++){
              mesh.children[i].children[j].castShadow = true;
              mesh.children[i].children[j].receiveShadow = true;
            }
          }
        }
      }

      const o = body.shapeOffsets[l];
      const q = body.shapeOrientations[l];
      mesh.position.set(o.x, o.y, o.z);
      mesh.quaternion.set(q.x, q.y, q.z, q.w);

      obj.add(mesh);
    }

    return obj;
  };

  addVisual(body, position) {
    // What geometry should be used?
    let mesh;
    let material = new MeshLambertMaterial( { color: 0x772277 } );
    if(body instanceof Body){
      mesh = this.shape2mesh(body, material);
    }
    if(mesh) {
      mesh.position.set(position.x, position.y, position.z);
      // mesh.castShadow = true;
      // this.physicsHandler.bodies.push(body);
      this.scene.add(mesh);
      this.physicsHandler.addMesh(mesh);
    } else {
      console.log('No mesh!');
    }
  };

  createRagdoll(){
    const scale = 2;
    let position = new Vec3(-1,1,-2);
    const angleA = Math.PI, angleB = Math.PI, twistAngle = Math.PI;

    let numBodiesAtStart = this.physicsHandler.world.bodies.length;

    const shouldersDistance = 0.5 * scale,
      upperArmLength = 0.4 * scale,
      lowerArmLength = 0.4 * scale,
      upperArmSize = 0.2 * scale,
      lowerArmSize = 0.2 * scale,
      neckLength = 0.1 * scale,
      headRadius = 0.25 * scale,
      upperBodyLength = 0.6 * scale,
      pelvisLength = 0.4 * scale,
      upperLegLength = 0.5 * scale,
      upperLegSize = 0.2 * scale,
      lowerLegSize = 0.2 * scale,
      lowerLegLength = 0.5 * scale;

    let headShape =      new Sphere(headRadius),
      upperArmShape =  new Box(new Vec3(upperArmLength * 0.5, upperArmSize * 0.5, upperArmSize * 0.5)),
      lowerArmShape =  new Box(new Vec3(lowerArmLength * 0.5, lowerArmSize * 0.5, lowerArmSize * 0.5)),
      upperBodyShape = new Box(new Vec3(shouldersDistance * 0.5, upperBodyLength * 0.5, lowerArmSize * 0.5)),
      pelvisShape =    new Box(new Vec3(shouldersDistance * 0.5, pelvisLength * 0.5, lowerArmSize * 0.5)),
      upperLegShape =  new Box(new Vec3(upperLegSize * 0.5, upperLegLength * 0.5, lowerArmSize * 0.5)),
      lowerLegShape =  new Box(new Vec3(lowerLegSize * 0.5, lowerLegLength * 0.5, lowerArmSize * 0.5));

    let positionLowerLeftLeg = new Vec3(-shouldersDistance/2,lowerLegLength / 2, 0);
    let positionLowerRightLeg = new Vec3(shouldersDistance/2,lowerLegLength / 2, 0);
    // Lower legs
    let lowerLeftLeg = new Body({
      mass: 1,
      position: positionLowerLeftLeg
    });
    let lowerRightLeg = new Body({
      mass: 1,
      position: positionLowerRightLeg
    });
    lowerLeftLeg.addShape(lowerLegShape);
    lowerRightLeg.addShape(lowerLegShape);
    this.physicsHandler.addBody(lowerLeftLeg);
    this.physicsHandler.addBody(lowerRightLeg);
    this.addVisual(lowerLeftLeg, positionLowerLeftLeg);
    this.addVisual(lowerRightLeg, positionLowerRightLeg);

    this.physicsHandler.addConstraintToBody(-1,0,0, lowerLeftLeg);
    this.physicsHandler.addConstraintToBody(0,0,0, lowerRightLeg);

    // Upper legs
    const positionUpperLeftLeg = new Vec3(-shouldersDistance/2,lowerLeftLeg.position.y+lowerLegLength/2+upperLegLength / 2, 0);
    const positionUpperRightLeg = new Vec3(shouldersDistance/2,lowerRightLeg.position.y+lowerLegLength/2+upperLegLength / 2, 0);
    let upperLeftLeg = new Body({
      mass: 1,
      position: positionUpperLeftLeg,
    });
    let upperRightLeg = new Body({
      mass: 1,
      position: positionUpperRightLeg,
    });
    upperLeftLeg.addShape(upperLegShape);
    upperRightLeg.addShape(upperLegShape);
    this.physicsHandler.addBody(upperLeftLeg);
    this.physicsHandler.addBody(upperRightLeg);
    this.addVisual(upperLeftLeg, positionUpperLeftLeg);
    this.addVisual(upperRightLeg, positionUpperRightLeg);

    // Pelvis
    const positionPelvis = new Vec3(0, upperLeftLeg.position.y+upperLegLength/2+pelvisLength/2, 0);
    const pelvis = new Body({
      mass: 1,
      position: positionPelvis,
    });
    pelvis.addShape(pelvisShape);
    this.physicsHandler.addBody(pelvis);
    this.addVisual(pelvis, positionPelvis);

    // Upper body
    const positionUpperBody = new Vec3(0,pelvis.position.y+pelvisLength/2+upperBodyLength/2, 0);
    let upperBody = new Body({
      mass: 1,
      position: positionUpperBody
    });
    upperBody.addShape(upperBodyShape);
    this.physicsHandler.addBody(upperBody);
    this.addVisual(upperBody, positionUpperBody);

    // Head
    const positionHead = new Vec3(0,upperBody.position.y+upperBodyLength/2+headRadius+neckLength, 0);
    const head = new Body({
      mass: 1,
      position: positionHead,
    });
    head.addShape(headShape);
    this.physicsHandler.addBody(head);
    this.addVisual(head, positionHead);
    this.physicsHandler.addConstraintToBody(-0.5,3,0, head);

    // Upper arms
    const positionUpperLeftArm = new Vec3(-shouldersDistance/2-upperArmLength/2, upperBody.position.y+upperBodyLength/2, 0);
    let upperLeftArm = new Body({
      mass: 1,
      position: positionUpperLeftArm
    });
    const positionUpperRightArm = new Vec3(shouldersDistance/2+upperArmLength/2, upperBody.position.y+upperBodyLength/2, 0);
    let upperRightArm = new Body({
      mass: 1,
      position: positionUpperRightArm
    });
    upperLeftArm.addShape(upperArmShape);
    upperRightArm.addShape(upperArmShape);
    this.physicsHandler.addBody(upperLeftArm);
    this.physicsHandler.addBody(upperRightArm);
    this.addVisual(upperLeftArm, positionUpperLeftArm);
    this.addVisual(upperRightArm, positionUpperRightArm);

    // lower arms
    const positionLowerLeftArm = new Vec3( upperLeftArm.position.x - lowerArmLength/2 - upperArmLength/2, upperLeftArm.position.y, 0);
    let lowerLeftArm = new Body({
      mass: 1,
      position: positionLowerLeftArm
    });
    const positionLowerRightArm = new Vec3( upperRightArm.position.x + lowerArmLength/2 + upperArmLength/2, upperRightArm.position.y, 0);
    let lowerRightArm = new Body({
      mass: 1,
      position: positionLowerRightArm
    });
    lowerLeftArm.addShape(lowerArmShape);
    lowerRightArm.addShape(lowerArmShape);
    this.physicsHandler.addBody(lowerLeftArm);
    this.physicsHandler.addBody(lowerRightArm);
    this.addVisual(lowerLeftArm, positionLowerLeftArm);
    this.addVisual(lowerRightArm, positionLowerRightArm);

    // Neck joint
    let neckJoint = new ConeTwistConstraint(head, upperBody, {
      pivotA: new Vec3(0,-headRadius-neckLength/2,0),
      pivotB: new Vec3(0,upperBodyLength/2,0)
    });
    this.physicsHandler.world.addConstraint(neckJoint);

    // Knee joints
    let leftKneeJoint = new ConeTwistConstraint(lowerLeftLeg, upperLeftLeg, {
      pivotA: new Vec3(0, lowerLegLength/2,0),
      pivotB: new Vec3(0,-upperLegLength/2,0)
    });
    let rightKneeJoint= new ConeTwistConstraint(lowerRightLeg, upperRightLeg, {
      pivotA: new Vec3(0, lowerLegLength/2,0),
      pivotB: new Vec3(0,-upperLegLength/2,0)
    });
    this.physicsHandler.world.addConstraint(leftKneeJoint);
    this.physicsHandler.world.addConstraint(rightKneeJoint);

    // Hip joints
    let leftHipJoint = new ConeTwistConstraint(upperLeftLeg, pelvis, {
      pivotA: new Vec3(0, upperLegLength/2,0),
      pivotB: new Vec3(-shouldersDistance/2,-pelvisLength/2,0)
    });
    let rightHipJoint = new ConeTwistConstraint(upperRightLeg, pelvis, {
      pivotA: new Vec3(0, upperLegLength/2,0),
      pivotB: new Vec3(shouldersDistance/2,-pelvisLength/2,0)
    });
    this.physicsHandler.world.addConstraint(leftHipJoint);
    this.physicsHandler.world.addConstraint(rightHipJoint);

    // Spine
    let spineJoint = new ConeTwistConstraint(pelvis, upperBody, {
      pivotA: new Vec3(0,pelvisLength/2,0),
      pivotB: new Vec3(0,-upperBodyLength/2,0)
    });
    this.physicsHandler.world.addConstraint(spineJoint);

    // Shoulders
    let leftShoulder = new ConeTwistConstraint(upperBody, upperLeftArm, {
      pivotA: new Vec3(-shouldersDistance/2, upperBodyLength/2,0),
      pivotB: new Vec3(upperArmLength/2,0,0)
    });
    let rightShoulder= new ConeTwistConstraint(upperBody, upperRightArm, {
      pivotA: new Vec3(shouldersDistance/2,  upperBodyLength/2,0),
      pivotB: new Vec3(-upperArmLength/2,0,0)
    });
    this.physicsHandler.world.addConstraint(leftShoulder);
    this.physicsHandler.world.addConstraint(rightShoulder);

    // Elbow joint
    let leftElbowJoint = new ConeTwistConstraint(lowerLeftArm, upperLeftArm, {
      pivotA: new Vec3(lowerArmLength/2, 0,0),
      pivotB: new Vec3(-upperArmLength/2,0,0)
    });
    let rightElbowJoint= new ConeTwistConstraint(lowerRightArm, upperRightArm, {
      pivotA: new Vec3(-lowerArmLength/2,0,0),
      pivotB: new Vec3(upperArmLength/2,0,0)
    });
    this.physicsHandler.world.addConstraint(leftElbowJoint);
    this.physicsHandler.world.addConstraint(rightElbowJoint);

    // Move all body parts
    for (let i = numBodiesAtStart; i < this.physicsHandler.world.bodies.length; i++) {
      let body = this.physicsHandler.world.bodies[i];
      body.position.vadd(position, body.position);
    }
  }

  build = () => {
    this.scene.add( new AmbientLight( 0x666666 ) );
    let light = new DirectionalLight(0xFFFFFF, 1);
    light.position.set(0, 2, 1).normalize();
    this.scene.add(light);

    this.createRagdoll();
    // const skyGeometry = new SphereGeometry(5);
    // const skyMaterial = new MeshNormalMaterial({side: BackSide});
    // const sky = new Mesh(skyGeometry, skyMaterial);
    // this.scene.add(sky);
  };

  update() {
    let delta = this.clock.getDelta() * 60;
    if (this.cube) {
      // this.cube.rotation.y += delta * 0.01;
    }
  }

  sayPhoneme(phoneme)  {
    return new Promise(resolve => {
      setTimeout(() => {
        if (this.humanFaceManager.faceModels.has('Phoneme'+phoneme)) {
          // console.log('Say: ' + phoneme);
          this.replaceHead('Phoneme' + phoneme);
        }
        resolve();
      }, 105)
    })
  };

  sayWelcome() {
    this.sayPhoneme('W')
      .then(() => this.sayPhoneme('eh'))
      .then(() => this.sayPhoneme('K'))
      .then(() => this.sayPhoneme('aah'))
      .then(() => this.sayPhoneme('B,M,P'))
      .then(() => this.sayPhoneme('D,S,T'))
      .then(() => this.sayPhoneme('ooh,Q'))
      .then(() => this.sayPhoneme('W'))
      .then(() => this.sayPhoneme('eh'))
      .then(() => this.sayPhoneme('B,M,P'))
      .then(() => this.sayPhoneme('eh'))
      .then(() => this.sayPhoneme('K'))
      .then(() => this.sayPhoneme('D,S,T'))
      .then(() => this.sayPhoneme('aah'))
      .then(() => this.sayPhoneme('F,V'))
      .then(() => this.sayPhoneme('i'))
      .then(() => this.sayPhoneme('D,S,T'))
      .then(() => this.sayPhoneme('i'))
      .then(() => this.sayPhoneme('K'))
      .then(() => this.sayPhoneme('D,S,T'))
      .then(() => this.replaceHead('main'))
      .then(() => this.sayWelcome());
  }
}
