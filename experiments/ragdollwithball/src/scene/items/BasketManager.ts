import {
  BoxGeometry,
  FrontSide,
  Mesh,
  MeshBasicMaterial,
  MeshLambertMaterial,
  Scene,
  SphereGeometry,
  Texture
} from 'three';
import PhysicsHandler from '../../../../shared/src/physics/physicsHandler';
import {Canvg, RenderingContext2D} from 'canvg';
// @ts-ignore
import {Body, Box, DistanceConstraint, Particle, Quaternion, Trimesh, Vec3} from 'cannon';

export class BasketSettings {
  position: Vec3;
  rotation: Quaternion;
  offsetRing: number;
}

export default class BasketManager {
  private scene: Scene;
  private physicsHandler: PhysicsHandler;
  private APP = {
    ballRadius: 6,
    basketColor: 0xc84b28,
    getBasketRadius: () => this.APP.ballRadius + 2,
    basketTubeRadius: 0.5,
    basketY: 20,
    basketDistance: 80,
    getBasketZ: () => this.APP.getBasketRadius() + this.APP.basketTubeRadius * 2 - this.APP.basketDistance
  };

  private netConstraints = [];
  private netCenter: any;
  private settings = {
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
  private particleGeo = new SphereGeometry( 0.5, 16, 8 );
  private particleMaterial = new MeshLambertMaterial( { color: 0xffffff } );
  private basketTexture: Texture;

  constructor(scene: Scene, physicsHandler: PhysicsHandler) {
    this.scene = scene;
    this.physicsHandler = physicsHandler;
  }

  public loadSvg(): Promise<boolean> {
    // @ts-ignore
    let imageCanvas2: HTMLCanvasElement = document.getElementById('svgCanvas');
    let imageContext: RenderingContext2D = imageCanvas2.getContext('2d');
    return Canvg.from(imageContext, '/img/NBA_Logo.svg')
      .then(svg => {
        svg.start();
        this.basketTexture = new Texture(imageCanvas2);
        this.basketTexture.needsUpdate = true;
        return true;
      });
  }

  addBasket(basketSettings: BasketSettings): Promise<boolean> {
    let geometry = new BoxGeometry(4, 3, 0.2);
    let material2 = new MeshBasicMaterial({
      color: 0xffffff,
      map: this.basketTexture,
      transparent: true,
      opacity: 0.3,
      side: FrontSide
    });

    let basketMesh = new Mesh(geometry, material2);
    this.physicsHandler.addMesh(basketMesh);
    let basketShape = new Box(new Vec3(4, 3, 0.2));
    let basket = new Body({
      mass: 0,
      position: basketSettings.position,
      quaternion: basketSettings.rotation
    });
    basket.addShape(basketShape, new Vec3(), basketSettings.rotation);
    this.physicsHandler.addBody(basket);
    this.scene.add(basketMesh);
    return this.addBasketRing(basketSettings);
  }

  addBasketRing(basketSettings: BasketSettings): Promise<boolean> {
    // ring.addShape(ringShape, ring.position, ring.quaternion);
    // ring.position = position;


    // // mesh.position.x = position.x;
    // // mesh.position.y = position.y;
    // // mesh.position.z = position.z;
    // for (let l = 0; l < mesh.children.length; l++) {
    //   // @ts-ignore
    //   mesh.children[l].material = this.ringMaterial;
    //   // this.physicsHandler.addBallRingContactMaterial(this.ballMaterial, mesh.children[l].material);
    // }
    // ring.position = position;
    //
    // this.ring = ring;
    let promise: Promise<boolean> = new Promise(resolve => {
      let ring_material = new MeshBasicMaterial({
        color: this.APP.basketColor,
      });

      let ringShape = new Trimesh.createTorus(0.6, 0.06, 16, 32);

      let position = new Vec3();
      position.x = basketSettings.position.x + 0.8;
      position.y = basketSettings.position.y - 1.2; //  + basketSettings.offsetRing;
      position.z = basketSettings.position.z; // + 1;
      let ring = new Body({
        mass: 0,
        position: position
      });
      // ring.quaternion.setFromAxisAngle(new Vec3(1, 0, 0), -Math.PI / 2);
      ring.addShape(ringShape, new Vec3(0,0,0), ring.quaternion);
      ring.position = position;
      this.physicsHandler.addToScene(ring, null, ring.quaternion, ring_material, this.scene);
      // this.addNet(ring.position);
    });
    return promise;
  }

  connect(bodies, i1, j1, i2, j2) {
    let distance = bodies[i1 + " " + j1].position.distanceTo(bodies[i2 + " " + j2].position);
    let constraint = new DistanceConstraint(bodies[i1 + " " + j1], bodies[i2 + " " + j2], distance);
    this.netConstraints.push(constraint);
    this.physicsHandler.world.addConstraint(constraint);
  }

  addNet(center) {
    this.netCenter = center;
    this.physicsHandler.world.solver.iterations = 18;
    const mass = 0.5;
    const Nrows = 4, Ncols = 12;
    const angle = 360 / (Ncols);
    let bodies = {};
    for (let j = 0; j < Nrows; j++) {
      let angleOffset = 0;
      if (j % 2 === 1) {
        angleOffset = angle / 2;
      }
      for (let i = 0; i < Ncols; i++) {
        let body = new Body({
          mass: j === 0 ? 0 : mass,
          linearDamping: 0.8,
          angularDamping: 0.8
        });
        let radians = this.toRadians(angle * (i + 1) + angleOffset);
        let rowRadius = this.settings.netRadius - j * this.settings.netRadiusDiff;
        body.position.set(
          this.netCenter.x + rowRadius * Math.cos(radians),
          this.netCenter.y - j * this.settings.netHeightDiff,
          this.netCenter.z + rowRadius * Math.sin(radians)
        );
        bodies[i + " " + j] = body;
        this.physicsHandler.addToScene(body, new Particle(), null, this.particleMaterial, this.scene);
      }
    }
    for (let j = 1; j < Nrows; j++) {
      for (let i = 0; i < Ncols; i++) {
        if (i < Ncols - 1) {
          this.connect(bodies, i, j, i, j - 1);
          if (j === 1) {
            // this.connect(bodies, i, j, i + 1, j - 1);
          }
          this.connect(bodies, i, j, i + 1, j);
        } else {
          this.connect(bodies, i, j, i, j - 1);
          if (j === 1) {
            // this.connect(bodies, i, j, 0, j - 1);
          }
          this.connect(bodies, i, j, 0, j);
        }
      }
    }
  }

  toRadians(angle) {
    return angle * (Math.PI / 180);
  }
}
