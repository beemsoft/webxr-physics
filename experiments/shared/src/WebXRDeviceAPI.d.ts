export interface XR extends EventTarget {
  requestDevice(): Promise<XRDevice>;
  ondevicechange?: Function;
}
declare global  {
  interface Navigator {
    xr: XR;
  }
}
export interface XRDevice extends EventTarget {
  supportsSession(options?: XRSessionCreationOptions): Promise<void>;
  requestSession(options?: XRSessionCreationOptions): Promise<XRSession>;
}
declare global  {
  interface Window {
    XRDevice: XRDevice;
  }
}

export interface XRSessionCreationOptions {
  immersive?: boolean;
  requestAR?: boolean;
  outputContext?: XRPresentationContext;
}
export interface XRSession extends EventTarget {
  readonly device: XRDevice;
  readonly immersive: boolean;
  readonly outputContext: XRPresentationContext;

  depthNear?: number;
  depthFar?: number;
  baseLayer?: XRLayer;

  requestFrameOfReference(type: XRFrameOfReferenceType): Promise<XRFrameOfReference>;
  requestFrameOfReference(type: XRFrameOfReferenceType, options: XRFrameOfReferenceOptions): Promise<XRFrameOfReference>;
  getInputSources(): XRInputSource[];
  requestAnimationFrame(callback: XRFrameRequestCallback): number;
  cancelAniamationFrame(handle: Number): void;
  end(): Promise<void>;

  onblur?: Function;
  onfocus?: Function;
  onresetpose?: Function;
  onend?: Function;
  onselect?: Function;
  onselectstart?: Function;
  onselectennd?: Function;
}
declare global  {
  interface Window {
    XRSession: XRSession;
  }
}
export interface XRFrameRequestCallback {
  (time: number, frame: XRFrame): void;
}

export interface XRFrame {
  readonly session: XRSession;
  readonly views: XRView[];
  getDevicePose(coodinateSystem: XRCoordinateSystem): XRDevicePose | null;
  getInputPose(inputSource: XRInputSource, coodinateSystem: XRCoordinateSystem): XRInputPose | null;
}
declare global  {
  interface Window {
    XRFrame: XRFrame;
  }
}

export interface XRCoordinateSystem extends EventTarget {
  getTransformTo(othre: XRCoordinateSystem): Float32Array;
}
declare global {
  interface Window {
    XRCoordinateSystem: XRCoordinateSystem;
  }
}
export type XRFrameOfReferenceType = 'head-model' | 'eye-level' | 'stage';

export interface XRFrameOfReferenceOptions {
  disableStageEmulation?: boolean;
  stageEmulationHeight: number;
}
export interface XRFrameOfReference extends XRCoordinateSystem {
  readonly bounds?: XRStageBounds;
  readonly emulatedHeight: number;
  onboundschange?: Function;

  getInputPose(inputSource: XRInputSource, frame: XRFrameOfReference);
}
declare enum XRReferenceSpaceType {
  "viewer",
  "local",
  "local-floor",
  "bounded-floor",
  "unbounded"
}

export interface XRReferenceSpace {
}
declare global  {
  interface Window {
    XRFrameOfReference: XRFrameOfReference;
  }
}
export interface XRStageBounds {
  readonly geometry: XRStageBoundsPoint[];
}
declare global  {
  interface Window {
    XRStageBounds: XRStageBounds;
  }
}
export interface XRStageBoundsPoint {
  readonly x: number;
  readonly z: number;
}
declare global  {
  interface Window {
    XRStageBoundsPoint: XRStageBoundsPoint;
  }
}
export type XREye = 'left' | 'right';
export interface XRView {
  readonly eye: XREye;
  readonly projectionMatrix: Float32Array;
}
declare global  {
  interface Window {
    XRView: XRView;
  }
}
export interface XRViewport {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}
declare global  {
  interface Window {
    XRViewport: XRViewport;
  }
}
export interface XRDevicePose {
  readonly poseModelMatrix: Float32Array;
  getViewMatrix(view: XRView): Float32Array;
}
declare global  {
  interface Window {
    XRDevicePose: XRDevicePose;
  }
}
export type XRHandedness = '' | 'left' | 'right';
export type XRTargetRayMode = 'gazing' | 'pointing' | 'tapping';

export interface XRInputSource {
  readonly handedness: XRHandedness;
  readonly targetRayMode: XRTargetRayMode;
}
export interface XRInputPose {
  readonly emulatedPosition: boolean;
  readonly targetRayMatrix: Float32Array;
  readonly gripMatrix?: Float32Array;
}
export interface XRLayer {
}
declare global  {
  interface Window {
    XRLayer: XRLayer;
  }
}
export type XRWebGLRenderingContext = WebGLRenderingContext; // | WebGL2RenderingContext;
export interface XRWebGLLayerInit {
  antialias: boolean;
  depth: boolean;
  stencil: boolean;
  alpha: boolean;
  multiview: boolean;
  framebufferScaleFactor: number;
}
export interface XRWebGLLayer extends XRLayer {
  constructor(session: XRSession, context: XRWebGLRenderingContext, layerInit?: XRWebGLLayer);
  readonly context: XRWebGLRenderingContext;
  readonly antialias: boolean;
  readonly depth: boolean;
  readonly stencil: boolean;
  readonly alpha: boolean;
  readonly multiview: boolean;
  readonly framebuffer: WebGLFramebuffer;
  readonly framebufferWidth: number;
  readonly framebufferHeight: number;
  getViewport(view: XRView): XRViewport | null;
  requestViewportScaling(viewportScaleFactor: number): void;

  // static getNativeFramebufferScaleFactor(session: XRSession): number;
}
declare global  {
  interface Window {
    XRWebGLLayer: XRWebGLLayer;
  }
}

export interface WebGLContextAttributes {
  compatibleXRDevice?: XRDevice;
}

export interface WebGLRenderingContextBase {
  setCompatibleXRDevice(device: XRDevice): Promise<void>;
}

export interface XRPresentationContext {
  readonly canvas: HTMLCanvasElement;
}
declare global  {
  interface Window {
    XRPresentationContext: XRPresentationContext;
  }
}

export interface XRSessionEvent extends Event {
  readonly session: XRSession;
}
declare global  {
  interface Window {
    XRSessionEvent: XRSessionEvent;
  }
}

export interface XRSessionEventInit extends EventInit {
  session: XRSession;
}

export interface XRInputSourceEvent extends Event {
  constructor(type: string, eventInitDict: XRInputSourceEventInit): any;
  readonly frame: XRFrame;
  readonly inputSource: XRInputSource;
}
declare global  {
  interface Window {
    XRInputSourceEvent: XRInputSourceEvent;
  }
}
export interface XRInputSourceEventInit extends EventInit {
  frame: XRFrame;
  inputSource: XRInputSource;
}
export interface XRCoordinateSystemEvent extends Event {
  constructor(type: String, eventInitDict: XRCoordinateSystemEventInit): any;
  readonly coordinateSystem: XRCoordinateSystem;
}
declare global  {
  interface Window {
    XRCoordinateSystemEvent: XRCoordinateSystemEvent;
  }
}
export interface XRCoordinateSystemEventInit extends EventInit {
  coordinateSystem: XRCoordinateSystem;
}
