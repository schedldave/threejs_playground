//import * as THREE from 'https://threejs.org//build/three.module.js';

//import Stats from 'https://threejs.org/examples/jsm/libs/stats.module.js';


// external hosting on cdn.skypack.dev
import * as THREE from 'https://cdn.skypack.dev/three@0.130.1/build/three.module.js'
import { OrbitControls } from 'https://cdn.skypack.dev/three@0.130.1/examples/jsm/controls/OrbitControls.js'
import { GUI } from 'https://cdn.skypack.dev/three@0.130.1/examples/jsm/libs/dat.gui.module.js'
import { OBJLoader } from 'https://cdn.skypack.dev/three@0.130.1/examples/jsm/loaders/OBJLoader.js'
//import * as THREE from 'three'

// internal (has some problems!)
// import * as THREE from './libs/three/three.module.js'
// import {OrbitControls} from './libs/three/examples/jsm/controls/OrbitControls.js';
import { Object3DAnnotation as Annotation } from './modules/text.js'
import { ImagePlaneHelper } from './modules/ImagePlaneHelper.js'
import { EpiPlaneHelper } from './modules/EpiPlaneHelper.js'

/*
// # F0 Scene ##
const imgURL = "./data/F0/images_ldr/";
const poseURL = './data/F0/poses/poses.json';
const demURL = './data/F0/DEM/dem.obj';
const singleImageFov = 50; // degrees
*/


// # Debug Scene ##
const imgURL = "./data/debug_scene/";
const poseURL = './data/debug_scene/blender_poses.json';
const demURL = './data/zero_plane.obj';
const singleImageFov = 60; // degrees



function createProjectiveMaterial(projCamera, tex = null) {
  var material = new THREE.ShaderMaterial({
    uniforms: {
      baseColor: {
        value: new THREE.Color(0xcccccc)
      },
      cameraMatrix: {
        type: 'm4',
        value: projCamera.matrixWorldInverse
      },
      projMatrix: {
        type: 'm4',
        value: projCamera.projectionMatrix
      },
      myTexture: {
        value: tex
      }
    },
    vertexShader: `

      varying vec4 vWorldPos;

      void main() {

        vWorldPos = modelMatrix * vec4(position, 1.0);
        gl_Position = projectionMatrix * viewMatrix * vWorldPos;

      }

    `,
    fragmentShader: `

      uniform vec3 baseColor;
      uniform sampler2D myTexture;
      uniform mat4 cameraMatrix;
      uniform mat4 projMatrix;

      varying vec4 vWorldPos;

      void main() {

        vec4 texc = projMatrix * cameraMatrix * vWorldPos;
        vec2 uv = texc.xy / texc.w / 2.0 + 0.5;

        vec4 color = ( max( uv.x, uv.y ) <= 1. && min( uv.x, uv.y ) >= 0. ) ? vec4(texture(myTexture, uv).rgb, 1.0) : vec4(0.0);
        gl_FragColor = color;

      }
    `,
    side: THREE.DoubleSide,
    transparent: true
  })

  return material;
}




async function fetchPosesJSON(url) {
  const response = await fetch(url);
  const poses = await response.json();
  return poses;
}

// instantiate a loader
const imgLoader = new THREE.ImageLoader();

fetchPosesJSON(poseURL).then(poses => {
  //poses; // fetched poses
  //console.log(poses);
  if (!('images' in poses)) { console.log(`An error happened when loading JSON poses. Property images is not present.`); }
  const positions = new Array();
  for (const pose of poses.images) {

    const useLegacy = !(pose.hasOwnProperty('location') && pose.hasOwnProperty('rotation'));
    let pos = new THREE.Vector3(); let quat = new THREE.Quaternion(); let scale = new THREE.Vector3();

    if (useLegacy) {

      // matrix
      const M = pose.M3x4
      let matrix = new THREE.Matrix4();
      matrix.set(
        M[0][0], M[0][1], M[0][2], M[0][3],
        M[1][0], M[1][1], M[1][2], M[1][3],
        M[2][0], M[2][1], M[2][2], M[2][3],
        0, 0, 0, 1
      );
      //matrix = matrix.invert();
      matrix.decompose(pos, quat, scale);
      //console.log( `matrix for image ${pose.imagefile} has p: ${pos.x},${pos.y},${pos.z}, rot: ${quat}, scale: ${scale.x},${scale.y},${scale.z}.`)
      // console.table(pos)
      pos.x = -pos.x; // flip x coordinate
    } else {
      pos.fromArray(pose.location); // location stores as x,y,z coordinates
      // rotation stored as quaternion (x,y,z,w)
      quat.x = pose.rotation[0];
      quat.y = pose.rotation[1];
      quat.z = pose.rotation[2];
      quat.w = pose.rotation[3];
    }

    positions.push(pos);
    // create cameras with the settings
    const camera = new THREE.PerspectiveCamera(singleImageFov, 1.0, .5, 10000);
    camera.position.copy(pos);
    camera.applyQuaternion(quat); // Apply Quaternion

    // rotation matrix
    const R = new THREE.Matrix4().makeRotationFromQuaternion(quat);
    console.log(R);

    // full camera matrix
    const cameraMatrix = new THREE.Matrix4().compose(pos, quat, new THREE.Vector3(1, 1, 1));
    console.log(cameraMatrix);

    //loadImage(imgURL + pose.imagefile);

    // load the image and assign the texture to the material
    let url = imgURL + pose.imagefile;
    url = url.replace('.tiff', '.png');
    const tex = textureLoader.load(url);
    const singleImageMaterial = createProjectiveMaterial(camera, tex);
    singleImageMaterials.push(singleImageMaterial);
    if (dem) {
      dem.material = singleImageMaterial;
    }


    //console.log(camera.matrix)
    //camera.quaternion.set( quat );
    const helper = new ImagePlaneHelper(camera);
    scene.add(helper);
    //console.log(helper.matrix);
    singleImages.push(camera);
    scene.add(camera);
  }
  console.table(positions);
});

// instantiate a texture loader
const textureLoader = new THREE.TextureLoader();

function loadImage(url) {
  // load a image resource
  imgLoader.load(
    // resource URL
    url.replace('.tiff', '.png'),
    // onLoad callback
    function (image) {
      // use the image, e.g. draw part of it on a canvas
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      context.drawImage(image, 0, 0);
      //document.body.append(canvas);
      //console.count(`Image loaded!`);
    },
    // onProgress callback currently not supported
    undefined,
    // onError callback
    function () {
      console.log(`An error happened when loading ${url}`);
    }
  );
}

// instantiate a loader
const loader = new OBJLoader();

// load a resource
loader.load(
  // resource URL
  demURL,
  // called when resource is loaded
  function (object) {
    dem = object.children[0];
    dem.scale.fromArray([1, 1, -1]);
    //console.log(dem)
    const material = new THREE.MeshPhongMaterial({
      color: 0xffffff,
      flatShading: true,
      vertexColors: false,
      shininess: 0,
      side: THREE.DoubleSide
    });

    const wireframeMaterial = new THREE.MeshBasicMaterial({
      color: 0x000000,
      wireframe: true,
      transparent: true
    });

    //dem
    //console.log(dem.geometry);
    let wireframe = new THREE.Mesh(dem.geometry, wireframeMaterial);
    dem.add(wireframe);
    scene.add(dem); // */
    dem.position.z = settings.focus;
    sceneGeometries.push(dem);
  },
  // called when loading is in progresses
  function (xhr) { },
  // called when loading has errors
  function (error) {
    console.log(`An error happened when loading ${demURL}`);
    //console.log(error);
  }
);

//let json = require('./data/F0/poses/poses.json');
//console.log(json, 'the json obj');


let stats;

let scene, renderer, dem;
let singleImages = new Array();
let singleImageMaterials = new Array();
let settings = { view: 0, focus: -9 };
let annotations;
let toggle = 0.0;
let clock;

const mouse = new THREE.Vector2();
const raycaster = new THREE.Raycaster();

let sceneGeometries = [];
let intersectionSphere;
let epiPlane; // epipolar plane

let persistentIntersectionSphere;
let persistentEpiPlane; // epipolar plane

let baseline;

let windowWidth, windowHeight;
const bgColor = new THREE.Color(0.5, 0.5, 0.7);

const views = {
  'overview': {
    left: 0,
    bottom: 0,
    width: 1.0,
    height: 1.0,
    background: bgColor,
    eye: [0, 18, 18],
    up: [0, 1, 0],
    fov: 80,
  },
  'left': {
    left: 0,
    bottom: 0.75,
    width: 0.25,
    height: 0.25,
    background: bgColor,
    eye: [-10, 2, 10],
    up: [0, 1, 0],
    fov: 50,
  },
  'right': {
    left: 0.75,
    bottom: 0.75,
    width: 0.25,
    height: 0.25,
    background: bgColor,
    eye: [10, 2, 10],
    up: [0, 1, 0],
    fov: 50,
  }
};

init();
animate();

function init() {


  scene = new THREE.Scene();

  clock = new THREE.Clock();

  for (const name in views) {
    console.log(name)
    const view = views[name];
    const camera = new THREE.PerspectiveCamera(view.fov, window.innerWidth / window.innerHeight, .5, name === 'overview' ? 100000 : 100);
    camera.position.fromArray(view.eye);
    camera.up.fromArray(view.up);
    camera.lookAt(scene.position);
    view.camera = camera;
    if (name === 'left' || name === 'right') {
      const helper = new ImagePlaneHelper(camera);
      console.log(helper.matrix)

      view.helper = helper;
      scene.add(helper);
    }
  }




  const light = new THREE.DirectionalLight(0xffffff);
  light.position.set(0, 0, 1);
  scene.add(light);

  const sphereGeometry = new THREE.SphereGeometry(0.1, 32, 32);
  const sphereMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 });

  const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
  sphere.geometry.position = new THREE.Vector3(0);
  scene.add(sphere);
  intersectionSphere = sphere;

  renderer = new THREE.WebGLRenderer({
    antialias: true
  });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  //container.appendChild( renderer.domElement );

  const controls = new OrbitControls(views['overview'].camera, renderer.domElement);
  controls.target.set(0, 0, 0);
  controls.update();

  // create annotiations and add to DOM  
  annotations = new Array(
    new Annotation(views['right'].camera, "Right", views['overview'].camera),
    new Annotation(views['left'].camera, "Left", views['overview'].camera));


  //console.log(annotations)

  //console.log(views['overview'].camera.projectionMatrix)

  { // create the baseline between the left and right camera
    const material = new THREE.LineBasicMaterial({
      color: 0x0000ff
    });

    const points = [];
    points.push(views['right'].camera.position);
    points.push(views['left'].camera.position);
    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    baseline = new THREE.Line(geometry, material);
    scene.add(baseline);

    annotations.push(new Annotation(baseline, "Baseline", views['overview'].camera, true));
  }

  { // create epipolar plane
    const plane = new THREE.Plane().setFromCoplanarPoints(views['right'].camera.position,
      views['left'].camera.position,
      intersectionSphere.position);
    epiPlane = new EpiPlaneHelper(plane, 10, 0xffff00);
    scene.add(epiPlane);
    //const geometry = new THREE.PlaneGeometry( 1, 1 );
    //const material = new THREE.MeshBasicMaterial( {color: 0xffff00, side: THREE.DoubleSide} );
    //const plane = new THREE.Mesh( geometry, material );
    //scene.add( plane );

    annotations.push(new Annotation(epiPlane, "Epipolar Plane", views['overview'].camera, true));
  }

  //stats = new Stats();
  //container.appendChild( stats.dom );

  // user interface with dat.GUI [see https://codepen.io/justgooddesign/pen/sbGLC for a deeper example]
  const gui = new GUI({ name: 'Settings', autoPlace: false });
  gui.addColor({ color: `#${bgColor.getHexString()}` }, 'color').onChange(function (color) {
    bgColor.set(color);
  });
  gui.add(settings, 'view', 0, 100/*singleImageMaterials.length - 1*/).onChange(function (value) {
    if (Math.round(value) < singleImageMaterials.length) {
      dem.material = singleImageMaterials[Math.round(value)];
    }
    else {
      settings.view = singleImageMaterials.length - 1;
    }
  });
  gui.add(settings, 'focus', -100, 100).onChange(function (value) {
    dem.position.z = value;
  });
  addCameraGUI(gui, views['left'].camera, 'left camera');
  addCameraGUI(gui, views['right'].camera, 'right camera');
  gui.open();
  gui.domElement.id = 'gui';
  gui_container.appendChild(gui.domElement);

  // add event listener
  document.addEventListener('mousemove', onDocumentMouseMove);
  document.addEventListener('dblclick', onDocumentDoubleClick);

  // add render canvas to DOM
  document.body.appendChild(renderer.domElement);
}

function addCameraGUI(gui, camera, name) {
  const lgui = gui.addFolder(name);
  for (const sub of ['position', 'rotation']) {
    const subgui = lgui.addFolder(sub);
    for (const s of ['x', 'y', 'z']) {
      subgui.add(camera[sub], s).listen();
    }
  }
}

function onDocumentMouseMove(event) {
  // calculate mouse position in normalized device coordinates
  // (-1 to +1) for both components
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = - (event.clientY / window.innerHeight) * 2 + 1;
}

function onDocumentDoubleClick(event) {
  //console.count('double click')
  if (persistentEpiPlane !== undefined) {
    scene.remove(persistentEpiPlane);
    persistentEpiPlane.dispose();
  }
  persistentEpiPlane = new EpiPlaneHelper(epiPlane.plane.clone(), 20, 0xffffff);
  scene.add(persistentEpiPlane);

}

function updateSize() {

  if (windowWidth != window.innerWidth || windowHeight != window.innerHeight) {

    windowWidth = window.innerWidth;
    windowHeight = window.innerHeight;

    renderer.setSize(windowWidth, windowHeight);
  }

}

function animate() {

  render();
  //stats.update();

  requestAnimationFrame(animate);

}

function render() {

  updateSize();




  for (const name in views) {
    //console.log(name)
    const view = views[name];
    const camera = view.camera;

    const left = Math.floor(windowWidth * view.left);
    const bottom = Math.floor(windowHeight * view.bottom);
    const width = Math.floor(windowWidth * view.width);
    const height = Math.floor(windowHeight * view.height);

    renderer.setViewport(left, bottom, width, height);
    renderer.setScissor(left, bottom, width, height);
    renderer.setScissorTest(true);
    renderer.setClearColor(bgColor);

    camera.aspect = width / height;
    camera.updateProjectionMatrix();

    // render camera helper only when we render the overview view
    views['left'].helper.visible = views['right'].helper.visible = name === 'overview';

    renderer.render(scene, camera);
  }

  // update baseline
  const points = [views['right'].camera.position, views['left'].camera.position];
  baseline.geometry.setFromPoints(points);





  // update the picking ray with the camera and mouse position
  raycaster.setFromCamera(mouse, views['overview'].camera);

  let intersection = null;

  if (sceneGeometries.length > 0) {
    // calculate objects intersecting the picking ray
    const intersections = raycaster.intersectObjects(sceneGeometries, false);
    // pick first intersection. should be closest
    intersection = (intersections.length) > 0 ? intersections[0] : null;
  }

  // if intersection happened
  if (toggle > 0.02 && intersection !== null) {

    intersectionSphere.position.copy(intersection.point);
    intersectionSphere.visible = true;

    // update epipolar plane
    epiPlane.plane.setFromCoplanarPoints(views['right'].camera.position,
      views['left'].camera.position,
      intersectionSphere.position);
    epiPlane.visible = true;

    toggle = 0;

  } else if (toggle > 0.02 && intersection === null) {
    intersectionSphere.visible = false;
    epiPlane.visible = false;
  }
  toggle += clock.getDelta();


  // update text positions, the text is pure HTML positioned with CSS
  annotations.forEach(function (txt) { txt.update(); });

}

//matrixTests();
function matrixTests() {
  // compare to: https://colab.research.google.com/github/schedldave/cv2021/blob/main/07_Stereo.ipynb#scrollTo=W2BI9XxZIzWc

  // left K
  const lK = new THREE.Matrix3().fromArray(
    [532.79536562, 0., 342.45825163,
      0., 532.91928338, 233.90060514,
      0., 0., 1.00]);

  // right K
  const rK = new THREE.Matrix3().fromArray(
    [537.42795336, 0., 327.6142018,
      0., 536.94702962, 248.88429309,
      0., 0., 1.]);

  // relative rotation
  const R = new THREE.Matrix3().fromArray(
    [0.99998578, 0.00376589, 0.00377484,
      -0.00374027, 0.99997007, -0.00677299,
      -0.00380023, 0.00675878, 0.99996994]);

  // relative translation:
  const t = new THREE.Vector3(-3.32806101, 0.03738435, 0.01469883);

  /*
  essential matrix:   [[-8.70916395e-05 -1.44457207e-02  3.74827819e-02]
    [ 2.05122175e-03  2.25489852e-02  3.32801645e+00]
    [-2.49359848e-02 -3.32810218e+00  2.23998201e-02]]

 fundamental matrix:  [[ 4.67950670e-09  7.76000185e-07 -1.25614932e-03]
    [-1.10312576e-07 -1.21237904e-06 -9.50369062e-02]
    [ 7.45984809e-04  9.61289558e-02  1.00000000e+00]]
  */

  // matrix representation of cross product:
  let tx = new THREE.Matrix3();
  tx.set(0, -t.z, t.y,
    t.z, 0, -t.x,
    -t.y, t.x, 0);
  tx.transpose(); // needs transpose




  // compute essential matrix:
  let E = new THREE.Matrix3().multiplyMatrices(R, tx); // multiplication order is flipped!
  let E_ = new THREE.Matrix3().multiplyMatrices(tx.clone().transpose(), R.clone().transpose()).transpose();
  console.log({ E, E_ });

  // looks good! so far!

  let F = new THREE.Matrix3().multiplyMatrices(lK.clone().invert(), E).multiply(rK.clone().invert().transpose());
  console.log({ F });



}
