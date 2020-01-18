import {
  BoxGeometry,
  Face3,
  Geometry,
  Material,
  Mesh,
  Object3D,
  PlaneGeometry,
  SphereGeometry,
  Vector3
} from 'three';
import {Body, Shape, Vec3} from 'cannon';

const particleGeo = new SphereGeometry( 0.5, 16, 8 );
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

  private createMeshFromShape(shape: Shape, material: Material): Mesh {
    let mesh;
    switch (shape.type) {
      case Shape.types.SPHERE:
        // @ts-ignore
        const sphere_geometry = new SphereGeometry(shape.radius, 8, 8);
        mesh = new Mesh(sphere_geometry, material);
        break;
      case Shape.types.PARTICLE:
        mesh = new Mesh(particleGeo, material);
        mesh.scale.set(settings.particleSize, settings.particleSize, settings.particleSize);
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
        // @ts-ignore
        const box_geometry = new BoxGeometry(shape.halfExtents.x * 2,
          // @ts-ignore
          shape.halfExtents.y * 2,
          // @ts-ignore
          shape.halfExtents.z * 2);
        mesh = new Mesh(box_geometry, material);
        break;

      case Shape.types.CONVEXPOLYHEDRON:
        const geo = new Geometry();
        // Add vertices
        // @ts-ignore
        for (let i = 0; i < shape.vertices.length; i++) {
          // @ts-ignore
          const v = shape.vertices[i];
          geo.vertices.push(new Vector3(v.x, v.y, v.z));
        }

        // @ts-ignore
        for (let i = 0; i < shape.faces.length; i++) {
          // @ts-ignore
          const face = shape.faces[i];
          // add triangles
          const a = face[0];
          for (let j = 1; j < face.length - 1; j++) {
            const b = face[j];
            const c = face[j + 1];
            geo.faces.push(new Face3(a, b, c));
          }
        }
        geo.computeBoundingSphere();
        geo.computeFaceNormals();
        mesh = new Mesh(geo, material);
        break;

      case Shape.types.HEIGHTFIELD:
        let geometryHeightField = new Geometry();

        let v0 = new Vec3();
        let v1 = new Vec3();
        let v2 = new Vec3();
        // @ts-ignore
        for (let xi = 0; xi < shape.data.length - 1; xi++) {
          // @ts-ignore
          for (let yi = 0; yi < shape.data[xi].length - 1; yi++) {
            for (let k = 0; k < 2; k++) {
              // @ts-ignore
              shape.getConvexTrianglePillar(xi, yi, k === 0);
              // @ts-ignore
              v0.copy(shape.pillarConvex.vertices[0]);
              // @ts-ignore
              v1.copy(shape.pillarConvex.vertices[1]);
              // @ts-ignore
              v2.copy(shape.pillarConvex.vertices[2]);
              // @ts-ignore
              v0.vadd(shape.pillarOffset, v0);
              // @ts-ignore
              v1.vadd(shape.pillarOffset, v1);
              // @ts-ignore
              v2.vadd(shape.pillarOffset, v2);
              geometryHeightField.vertices.push(
                new Vector3(v0.x, v0.y, v0.z),
                new Vector3(v1.x, v1.y, v1.z),
                new Vector3(v2.x, v2.y, v2.z)
              );
              let i = geometryHeightField.vertices.length - 3;
              geometry.faces.push(new Face3(i, i + 1, i + 2));
            }
          }
        }
        geometryHeightField.computeBoundingSphere();
        geometryHeightField.computeFaceNormals();
        mesh = new Mesh(geometryHeightField, material);
        break;

      // @ts-ignore
      case Shape.types.TRIMESH:
        let geometry2 = new Geometry();

        let vv0 = new Vec3();
        let vv1 = new Vec3();
        let vv2 = new Vec3();
        // @ts-ignore
        for (let i = 0; i < shape.indices.length / 3; i++) {
          // @ts-ignore
          shape.getTriangleVertices(i, vv0, vv1, vv2);
          geometry2.vertices.push(
            new Vector3(vv0.x, vv0.y, vv0.z),
            new Vector3(vv1.x, vv1.y, vv1.z),
            new Vector3(vv2.x, vv2.y, vv2.z)
          );
          let j = geometry2.vertices.length - 3;
          geometry2.faces.push(new Face3(j, j + 1, j + 2));
        }
        geometry2.computeBoundingSphere();
        geometry2.computeFaceNormals();
        mesh = new Mesh(geometry2, material);
        break;

      case Shape.types.CYLINDER:
        console.log('Cylinder!');
        break;

      default:
        throw "Visual type not recognized: " + shape.type;
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
    return mesh;
  }

  public shape2mesh(body: Body, shape: Shape, material): Promise<Object3D> {
    return new Promise(resolve => {
      let obj = new Object3D();
      for (let l = 0; l < body.shapes.length; l++) {
        let shape = body.shapes[l];
        let mesh = this.createMeshFromShape(shape, material);
        const o = body.shapeOffsets[l];
        const q = body.shapeOrientations[l];
        mesh.position.set(o.x, o.y, o.z);
        mesh.quaternion.set(q.x, q.y, q.z, q.w);
        obj.add(mesh);
      }
      return resolve(obj);
    })
  };
}
