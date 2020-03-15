import {
  CubeCamera,
  DirectionalLight,
  LinearMipmapLinearFilter,
  PerspectiveCamera,
  PlaneBufferGeometry,
  RepeatWrapping,
  Scene,
  TextureLoader,
  WebGLRenderer
} from 'three';
import PhysicsHandler from '../../../shared/src/physics/physicsHandler';
import ConstraintManager from '../../../shared/src/physics/ConstraintManager';
import {ControllerInterface} from '../../../shared/src/web-managers/ControllerInterface';
import {XRReferenceSpace} from '../../../shared/src/WebXRDeviceAPI';
import {SceneHelper} from '../../../shared/src/scene/SceneHelper';
import {SceneWithTeleporting} from '../../../shared/src/scene/SceneWithTeleporting';
import SimpleHandManager from '../../../shared/src/controller-hands/SimpleHandManager';
import {Water} from '../../../shared/src/scene/water/Water';
import {Sky} from '../../../shared/src/scene/sky/Sky';

export default class SceneManager implements SceneWithTeleporting {
  private scene: Scene;
  private sceneHelper: SceneHelper;
  private renderer: WebGLRenderer;
  private camera: PerspectiveCamera;
  private physicsHandler: PhysicsHandler;
  constraintManager: ConstraintManager;
  private simpleHandManager: SimpleHandManager;
  private controllerL: ControllerInterface;
  private controllerR: ControllerInterface;
  private loader: TextureLoader = new TextureLoader();
  public xrReferenceSpace: XRReferenceSpace;
  private light: DirectionalLight;
  private water: any;
  private sky: any;
  private cubeCamera: CubeCamera;

  build(camera: PerspectiveCamera, scene: Scene, renderer: WebGLRenderer, physicsHandler: PhysicsHandler)  {
    this.scene = scene;
    this.sceneHelper = new SceneHelper(scene);
    this.renderer = renderer;
    this.camera = camera;
    this.physicsHandler = physicsHandler;
    this.constraintManager = new ConstraintManager(physicsHandler);
    this.simpleHandManager = new SimpleHandManager(scene, physicsHandler);
    let light = new DirectionalLight( 0xffffff, 0.8 );
    this.light = light;
    this.scene.add(light);
    this.addWater();
    this.addSky();
  };

  addWater() {
    let waterGeometry = new PlaneBufferGeometry( 10000, 10000 );
    let water = new Water(
      waterGeometry,
      {
        textureWidth: 512,
        textureHeight: 512,
        waterNormals: this.loader.load( '/textures/water/waternormals.jpg', function ( texture ) {
          texture.wrapS = texture.wrapT = RepeatWrapping;
        } ),
        alpha: 1.0,
        sunDirection: this.light.position.clone().normalize(),
        sunColor: 0xffffff,
        waterColor: 0x001e0f,
        distortionScale: 3.7,
        fog: this.scene.fog !== undefined
      }
    );
    water.rotation.x = - Math.PI / 2;
    water.position.y = -5;
    this.scene.add( water );
    this.water = water;
  }

  updateSun() {
    var parameters = {
      distance: 400,
      inclination: 0.49,
      azimuth: 0.205
    };

    var cubeCamera = new CubeCamera( 0.1, 1, 512 );
    cubeCamera.renderTarget.texture.generateMipmaps = true;
    cubeCamera.renderTarget.texture.minFilter = LinearMipmapLinearFilter;
    this.cubeCamera = cubeCamera;

    // @ts-ignore
    this.scene.background = cubeCamera.renderTarget;

    var theta = Math.PI * ( parameters.inclination - 0.5 );
    var phi = 2 * Math.PI * ( parameters.azimuth - 0.5 );

    this.light.position.x = parameters.distance * Math.cos( phi );
    this.light.position.y = parameters.distance * Math.sin( phi ) * Math.sin( theta );
    this.light.position.z = parameters.distance * Math.sin( phi ) * Math.cos( theta );

    this.sky.material.uniforms[ 'sunPosition' ].value = this.light.position.copy( this.light.position );
    this.water.material.uniforms[ 'sunDirection' ].value.copy( this.light.position ).normalize();

  }

  addSky() {
    var sky = new Sky();

    var uniforms = sky.material.uniforms;

    uniforms[ 'turbidity' ].value = 10;
    uniforms[ 'rayleigh' ].value = 2;
    uniforms[ 'luminance' ].value = 1;
    uniforms[ 'mieCoefficient' ].value = 0.005;
    uniforms[ 'mieDirectionalG' ].value = 0.8;
    this.sky = sky;
    this.updateSun();
    this.cubeCamera.update( this.renderer, this.sky );
  }

  update() {
    this.water.material.uniforms[ 'time' ].value += 1.0 / 60.0;
  }

  addLeftController(controller: ControllerInterface) {
    this.controllerL = controller;
  }

  addRightController(controller: ControllerInterface) {
    this.controllerR = controller;
  }

  setXrReferenceSpace(space: XRReferenceSpace) {
    this.xrReferenceSpace = space;
  }

  getXrReferenceSpace(): XRReferenceSpace {
    return this.xrReferenceSpace;
  }
}
