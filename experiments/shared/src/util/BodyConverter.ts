import {
  BoxGeometry,
  Face3,
  Geometry,
  Mesh,
  MeshLambertMaterial,
  Object3D,
  PlaneGeometry,
  SphereGeometry,
  Vector3
} from 'three';
import {Shape, Vec3} from 'cannon';

const particleGeo = new SphereGeometry( 0.5, 16, 8 );
const particleMaterial = new MeshLambertMaterial( { color: 0xffffff } );
const settings = {
  stepFrequency: 60,
  quatNormalizeSkip: 2,
  quatNormalizeFast: true,
  gx: 0,
  gy: 0,
  gz: 0,
  iterations: 3,
  tolerance: 0.0001,
  k: 1e6,
  d: 3,
  scene: 0,
  paused: false,
  rendermode: "solid",
  constraints: false,
  contacts: false,  // Contact points
  cm2contact: false, // center of mass to contact points
  normals: false, // contact normals
  axes: false, // "local" frame axes
  particleSize: 0.1,
  netRadius: 0.6,
  netHeightDiff: 0.12,
  netRadiusDiff: 0.11,
  shadows: false,
  aabbs: false,
  profiling: false,
  maxSubSteps: 20,
  dist: 0.5
};

export class BodyConverter {

  public static shape2mesh(body, material): Object3D {
    let i;
    let j;
    let obj = new Object3D();

    for (let l = 0; l < body.shapes.length; l++) {
      let shape = body.shapes[l];
      let mesh;
      switch(shape.type){
        case Shape.types.SPHERE:
          const sphere_geometry = new SphereGeometry(shape.radius, 8, 8);
          mesh = new Mesh( sphere_geometry, material );
          break;
        case Shape.types.PARTICLE:
          mesh = new Mesh( particleGeo, material );
          mesh.scale.set(settings.particleSize,settings.particleSize,settings.particleSize);
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
          for (let i = 0; i < shape.vertices.length; i++) {
            const v = shape.vertices[i];
            geo.vertices.push(new Vector3(v.x, v.y, v.z));
          }

          for(i=0; i < shape.faces.length; i++){
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
          let geometryHeightField = new Geometry();

          let v0 = new Vec3();
          let v1 = new Vec3();
          let v2 = new Vec3();
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
                geometryHeightField.vertices.push(
                  new Vector3(v0.x, v0.y, v0.z),
                  new Vector3(v1.x, v1.y, v1.z),
                  new Vector3(v2.x, v2.y, v2.z)
                );
                i = geometryHeightField.vertices.length - 3;
                geometry.faces.push(new Face3(i, i+1, i+2));
              }
            }
          }
          geometryHeightField.computeBoundingSphere();
          geometryHeightField.computeFaceNormals();
          mesh = new Mesh(geometryHeightField, material);
          break;

        // case CANNON.Shape.types.TRIMESH:
        //   geometry = new THREE.Geometry();
        //
        //   v0 = new CANNON.Vec3();
        //   v1 = new CANNON.Vec3();
        //   v2 = new CANNON.Vec3();
        //   for (i = 0; i < shape.indices.length / 3; i++) {
        //     shape.getTriangleVertices(i, v0, v1, v2);
        //     geometry.vertices.push(
        //       new THREE.Vector3(v0.x, v0.y, v0.z),
        //       new THREE.Vector3(v1.x, v1.y, v1.z),
        //       new THREE.Vector3(v2.x, v2.y, v2.z)
        //     );
        //     j = geometry.vertices.length - 3;
        //     geometry.faces.push(new THREE.Face3(j, j+1, j+2));
        //   }
        //   geometry.computeBoundingSphere();
        //   geometry.computeFaceNormals();
        //   mesh = new THREE.Mesh(geometry, material);
        //   break;

        case Shape.types.CYLINDER:
          console.log('Cylinder!');
          break;

        default:
          throw "Visual type not recognized: "+shape.type;
      }

      // mesh.receiveShadow = true;
      // mesh.castShadow = true;
      // if(mesh.children){
      //   for(var i=0; i<mesh.children.length; i++){
      //     mesh.children[i].castShadow = true;
      //     mesh.children[i].receiveShadow = true;
      //     if(mesh.children[i]){
      //       for(var j=0; j<mesh.children[i].length; j++){
      //         mesh.children[i].children[j].castShadow = true;
      //         mesh.children[i].children[j].receiveShadow = true;
      //       }
      //     }
      //   }
      // }

      const o = body.shapeOffsets[l];
      const q = body.shapeOrientations[l];
      mesh.position.set(o.x, o.y, o.z);
      mesh.quaternion.set(q.x, q.y, q.z, q.w);

      obj.add(mesh);
    }

    return obj;
  };
}