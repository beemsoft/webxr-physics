/**
 * Copyright 2019 Hans Beemsterboer
 *
 * This file has been modified by Hans Beemsterboer to be used in
 * the webxr-physics project.
 *
 * Copyright 2015 Google Inc. All rights reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express
 * or implied. See the License for the specific language governing
 * permissions and limitations under the License.
 */

import {
    CanvasTexture,
    DoubleSide,
    LinearFilter,
    LinearMipMapLinearFilter,
    Mesh,
    PlaneBufferGeometry,
    RawShaderMaterial
} from 'three';

/**
 * A wrapper of THREE.CanvasTexture to easily draw text,
 * used for setting up UIs in VR quickly.
 */
export class TextMesh {

    private multiplier: number;
    private width: number;
    private height: number;
    private canvas: HTMLCanvasElement;
    private ctx: CanvasRenderingContext2D;
    private texture: CanvasTexture;
    private material: RawShaderMaterial;
    mesh: Mesh;

    constructor( maxAnisotropy: number, width: number, height: number ) {

        this.multiplier = 1;
        this.width = width * this.multiplier;
        this.height = height * this.multiplier;

        this.canvas = document.createElement( 'canvas' );
        this.ctx = this.canvas.getContext( '2d' );

        this.canvas.width = this.width;
        this.canvas.height = this.height;

        this.texture = new CanvasTexture( this.canvas );
        // @ts-ignore
        this.texture.generateMipMaps = false;
        this.texture.anisotropy = maxAnisotropy;
        this.texture.minFilter = LinearMipMapLinearFilter;
        this.texture.magFilter = LinearFilter;
        this.material = new RawShaderMaterial( {
            uniforms:{
                opacity: { value: 1 },
                map: { value: this.texture }
            },
            side: DoubleSide,
            transparent: true,
            vertexShader: `attribute vec3 position;
attribute vec2 uv;

uniform mat4 modelViewMatrix;
uniform mat4 projectionMatrix;

varying vec2 vUv;

void main() {

	vec4 mVPos = modelViewMatrix * vec4( position, 1.0 );

	vUv = uv;
	gl_Position = projectionMatrix * mVPos;

}`,
            fragmentShader: `precision highp float;

uniform sampler2D map;
uniform float opacity;

varying vec2 vUv;

void main() {

	vec4 c = texture2D( map, vUv );
	c.a *= opacity;
	if( c.a == 0. ) discard;

	gl_FragColor = c;

}`,
            wireframe: false
        } );
        let w = width / 512;
        let h = height / 512;
        this.mesh = new Mesh( new PlaneBufferGeometry( w, h ), this.material );

    }

    /**
     * Internal method to split sentences
     *
     * @param {string} str	String to fit
     */

    fitSplit ( str ) {

        const maxLength = 40;
        const regex = /(\S+)[\W]*/gmi;
        let m;
        let partial = '';
        let res = [];

        while ((m = regex.exec(str)) !== null) {

            if (m.index === regex.lastIndex) {
                regex.lastIndex++;
            }

            let p = m[ 0 ];
            if( partial.length + p.length < maxLength ) {
                partial += p;
            } else {
                res.push( partial );
                partial = p;
            }

        }

        res.push( partial );

        return res;

    }

    /**
     * Update text with canvas
     *
     * @param {Object} sentences		sentences to draw
     */

    set ( sentences ) {

        if( typeof sentences !== 'object' ) sentences = [ sentences ];
        let splitSentences = [];
        sentences.forEach( s => {
            splitSentences = splitSentences.concat( this.fitSplit( s ) );
        });

        const border = 4;
        const h = 50 * this.multiplier;

        const fw = this.width;
        const fh = this.height;

        this.ctx.clearRect( 0, 0, this.canvas.width, this.canvas.height );

        this.ctx.textBaseline = 'middle';
        this.ctx.font = `${h}px Roboto`;

        this.ctx.shadowColor = '#000000';
        this.ctx.shadowBlur = border;
        this.ctx.shadowOffsetX = 0;
        this.ctx.shadowOffsetY = 0;

        const sy = .5 * ( fh - ( splitSentences.length - 1 ) * h );
        this.ctx.textAlign = 'center';
        this.ctx.fillStyle = '#ffffff';
        splitSentences.forEach( ( s, i ) => {
            this.ctx.strokeText( s, .5 * fw - border, sy + h * i );
            this.ctx.fillText( s, .5 * fw - border, sy + h * i );
            this.ctx.fillText( s, .5 * fw - border, sy + h * i );
        });

        this.texture.needsUpdate = true;

    }
}
