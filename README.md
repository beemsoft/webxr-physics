WebXR Physics
=============

This is a follow-up project of the [WebVR Physics project][WebVR-Physics],
with the following updates:

* Replaced the WebVR API with the new WebXR API, while still focusing on VR.
* Migrated the codebase to TypeScript and webpack.

It uses the [Cannon.js physics library][Cannon.js].
Spatial audio is added using the [Resonance Audio Web SDK][Resonance-audio].

Tested with Oculus Quest headset + 2 controllers

[WebXR-Physics]: https://github.com/beemsoft/webxr-physics
[Cannon.js]: http://www.cannonjs.org/
[Resonance-audio]: https://github.com/resonance-audio/resonance-audio-web-sdk

## Demo

https://www.techytax.nl/vr/

## Usage

    cd experiments
    npm install
    npm start 
    
## Screenshot
![alt screenshot](https://github.com/beemsoft/webxr-physics/blob/master/img/webxr-physics.png)   

Migration to WebXR API:
https://01.org/blogs/darktears/2019/rendering-immersive-web-experiences-threejs-webxr
    
