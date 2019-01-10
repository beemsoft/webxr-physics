import {PerspectiveCamera, Scene, WebGLRenderer} from 'three';
import TrackballControls from 'three-trackballcontrols';
import PhysicsHandler from '../physicsHandler';
import SceneManager from '../sceneManager';

export default class WebPageManager {
  private camera: PerspectiveCamera;
  private renderer: WebGLRenderer;
  private scene: Scene;
  private physicsHandler: PhysicsHandler;
  private sceneBuilder: SceneManager;
  private controls: TrackballControls;

  constructor() {
    let $this = this;
    function render() {
      $this.renderer.setAnimationLoop(render);
      $this.sceneBuilder.update();
      $this.controls.update();
      $this.renderer.render($this.scene, $this.camera);
    }

    this.scene = new Scene();
    this.camera = new PerspectiveCamera();
    this.scene.add(this.camera);
    this.camera.position.set(1, 1, 1);

    this.renderer = new WebGLRenderer({alpha: false});
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.autoClear = false;
    let controls = new TrackballControls(this.camera);
    controls.rotateSpeed = 2.0;
    controls.zoomSpeed = 1.2;
    controls.panSpeed = 0.8;
    controls.noPan = false;
    controls.staticMoving = false;
    controls.dynamicDampingFactor = 0.3;
    controls.keys = [ 65, 83, 68 ];
    this.controls = controls;

    this.addOutputToPage();
    window.addEventListener( 'resize', this.onWindowResize, false );

    console.log('2) Initialized WebGL renderer');
    this.physicsHandler = new PhysicsHandler(this.scene, null);
    this.sceneBuilder = new SceneManager(this.scene, this.camera, this.physicsHandler);
    render();
  }

  addOutputToPage = () => {
    const container = document.createElement('div');
    document.body.appendChild(container);
    container.appendChild(this.renderer.domElement);
  };

  onWindowResize = () => {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize( window.innerWidth, window.innerHeight );
    this.controls.handleResize();
  }
}

