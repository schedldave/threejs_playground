
import {Object3D,Vector3,Camera} from 'https://cdn.skypack.dev/three'
//import * as THREE from 'https://cdn.skypack.dev/three/build/three.module.js'


const _v = /*@__PURE__*/ new Vector3();

class Object3DAnnotation{

    constructor( obj3D, text, camera  ) {
        this.type = 'Object3DAnnotation';
        console.assert(obj3D instanceof Object3D, 'Error in Object3DAnnotation: obj3D is not a ThreeJS Object!');
        this.obj3D = obj3D;
        this.text = text;
        console.assert(camera instanceof Camera, 'Error in Object3DAnnotation: camera is not a ThreeJS Camera!');
        this.camera = camera;

        // create html element
        const elem = document.createElement('div');
        elem.setAttribute('class', 'info')
        elem.textContent = this.text;
        document.body.appendChild(elem);
        this.htmlElem = elem;

    }

    // see: https://threejsfundamentals.org/threejs/lessons/threejs-align-html-elements-to-3d.html
    update() {

        // get the position of the center of the cube
        this.obj3D.updateWorldMatrix(true, false);
        this.obj3D.getWorldPosition(_v);
        
        // get the normalized screen coordinate of that position
        // x and y will be in the -1 to +1 range with x = -1 being
        // on the left and y = -1 being on the bottom
        _v.project(this.camera);
        
        // convert the normalized position to CSS coordinates
        const canvas = document.body;
        const x = (_v.x *  .5 + .5) * canvas.clientWidth;
        const y = (_v.y * -.5 + .5) * canvas.clientHeight;
        
        // move the elem to that position
        this.htmlElem.style.transform = `translate(-50%, -50%) translate(${x}px,${y}px)`;

    }

}

export{ Object3DAnnotation }