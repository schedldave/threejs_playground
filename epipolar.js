//import * as THREE from 'https://threejs.org//build/three.module.js';

//import Stats from 'https://threejs.org/examples/jsm/libs/stats.module.js';


// external hosting on cdn.skypack.dev
import * as THREE from 'https://cdn.skypack.dev/three@0.130.1/build/three.module.js'
import { OrbitControls } from 'https://cdn.skypack.dev/three@0.130.1/examples/jsm/controls/OrbitControls.js'
import { GUI } from 'https://cdn.skypack.dev/three@0.130.1/examples/jsm/libs/dat.gui.module.js'
//import * as THREE from 'three'

// internal (has some problems!)
  // import * as THREE from './libs/three/three.module.js'
  // import {OrbitControls} from './libs/three/examples/jsm/controls/OrbitControls.js';
import {Object3DAnnotation as Annotation} from './modules/text.js'
import {ImagePlaneHelper} from './modules/ImagePlaneHelper.js'
import {EpiPlaneHelper} from './modules/EpiPlaneHelper.js'


let stats;

let scene, renderer;
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
    left:   0,
    bottom: 0.75,
    width:  0.25,
    height: 0.25,
    background: bgColor,
    eye: [-10, 2, 10],
    up: [0, 1, 0],
    fov: 50,
  },
  'right': {
    left:   0.75,
    bottom: 0.75,
    width:  0.25,
    height: 0.25,
    background: bgColor,
    eye: [10, 2, 10],
    up: [0, 1, 0],
    fov: 50,
  }};

init();
animate();

function init() {


  scene = new THREE.Scene();

  clock = new THREE.Clock();

  for (const name in views) {
    console.log(name)
    const view = views[name];
    const camera = new THREE.PerspectiveCamera(view.fov, window.innerWidth / window.innerHeight, .5, name==='overview'?100000:100);
    camera.position.fromArray(view.eye);
    camera.up.fromArray(view.up);
    camera.lookAt(scene.position);
    view.camera = camera;
    if(name==='left' || name==='right'){
        const helper = new ImagePlaneHelper(camera);
        console.log(helper.matrix)

        view.helper = helper;
        scene.add(helper);
    }
  }




  const light = new THREE.DirectionalLight(0xffffff);
  light.position.set(0, 0, 1);
  scene.add(light);

  createScene(scene)

  const sphereGeometry = new THREE.SphereGeometry( 0.1, 32, 32 );
  const sphereMaterial = new THREE.MeshBasicMaterial( { color: 0xff0000 } );

	const sphere = new THREE.Mesh( sphereGeometry, sphereMaterial );
  sphere.geometry.position = new THREE.Vector3(0);
	scene.add( sphere );
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
  annotations= new Array(
    new Annotation(views['right'].camera, "Right", views['overview'].camera ),
    new Annotation(views['left'].camera,  "Left",  views['overview'].camera ) );


  //console.log(annotations)

  //console.log(views['overview'].camera.projectionMatrix)

  { // create the baseline between the left and right camera
    const material = new THREE.LineBasicMaterial({
      color: 0x0000ff
    });
    
    const points = [];
    points.push( views['right'].camera.position );
    points.push( views['left'].camera.position );
    const geometry = new THREE.BufferGeometry().setFromPoints( points );   
    baseline = new THREE.Line( geometry, material );
    scene.add( baseline );

    annotations.push( new Annotation(baseline, "Baseline", views['overview'].camera, true ) );
  }

  { // create epipolar plane
    const plane = new THREE.Plane().setFromCoplanarPoints( views['right'].camera.position, 
                                                        views['left'].camera.position, 
                                                        intersectionSphere.position );
    epiPlane = new EpiPlaneHelper( plane, 10, 0xffff00 );
    scene.add( epiPlane );
    //const geometry = new THREE.PlaneGeometry( 1, 1 );
    //const material = new THREE.MeshBasicMaterial( {color: 0xffff00, side: THREE.DoubleSide} );
    //const plane = new THREE.Mesh( geometry, material );
    //scene.add( plane );

    annotations.push( new Annotation(epiPlane, "Epipolar Plane", views['overview'].camera, true ) );
  }

  //stats = new Stats();
  //container.appendChild( stats.dom );

  // user interface with dat.GUI [see https://codepen.io/justgooddesign/pen/sbGLC for a deeper example]
  const gui = new GUI({name: 'Settings', autoPlace: false});
  gui.addColor({color: `#${bgColor.getHexString()}`},'color').onChange(function(color){
    bgColor.set(color);
  });
  addCameraGUI( gui, views['left'].camera, 'left camera' );
  addCameraGUI( gui, views['right'].camera, 'right camera' );
  gui.open();
  gui.domElement.id = 'gui';
  gui_container.appendChild(gui.domElement);

  // add event listener
  document.addEventListener('mousemove', onDocumentMouseMove);
  document.addEventListener('dblclick', onDocumentDoubleClick);

  // add render canvas to DOM
  document.body.appendChild(renderer.domElement);
}

function addCameraGUI( gui, camera, name ){
  const lgui = gui.addFolder(name);
  for(const sub of ['position','rotation']){
    const subgui = lgui.addFolder(sub);
    for(const s of ['x','y','z']){
      subgui.add(camera[sub], s).listen();
  } }
}

function createScene(scene){

  // shadow

  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;

  const context = canvas.getContext('2d');
  const gradient = context.createRadialGradient(canvas.width / 2, canvas.height / 2, 0, canvas.width / 2, canvas.height / 2, canvas.width / 2);
  gradient.addColorStop(0.1, 'rgba(0,0,0,0.5)');
  gradient.addColorStop(1, 'rgba(0,0,0,0)');

  context.fillStyle = gradient;
  context.fillRect(0, 0, canvas.width, canvas.height);

  const shadowTexture = new THREE.CanvasTexture(canvas);

  const shadowMaterial = new THREE.MeshBasicMaterial({
    map: shadowTexture,
    transparent: true
  });
  const shadowGeo = new THREE.PlaneGeometry(4, 4, 1, 1);

  let shadowMesh;

  shadowMesh = new THREE.Mesh(shadowGeo, shadowMaterial);
  shadowMesh.position.y = -2.5;
  shadowMesh.rotation.x = -Math.PI / 2;
  //scene.add(shadowMesh);
  const shadowMesh1 = shadowMesh;

  shadowMesh = shadowMesh.clone();
  //shadowMesh.position.x = -4;
  //scene.add(shadowMesh);
  const shadowMesh2 = shadowMesh;

  shadowMesh = shadowMesh.clone();
  //shadowMesh.position.x = 4.00;
  //scene.add(shadowMesh);
  const shadowMesh3 = shadowMesh;


  const radius = 2;

  const geometry1 = new THREE.IcosahedronGeometry(radius, 1);

  const count = geometry1.attributes.position.count;
  geometry1.setAttribute('color', new THREE.BufferAttribute(new Float32Array(count * 3), 3));

  const geometry2 = new THREE.BoxGeometry(2*radius,2*radius,2*radius);
  const geometry3 = new THREE.ConeGeometry(2*radius, 5*radius, 10);

  const material = new THREE.MeshPhongMaterial({
    color: 0xffffff,
    flatShading: true,
    vertexColors: false,
    shininess: 0
  });

  const wireframeMaterial = new THREE.MeshBasicMaterial({
    color: 0x000000,
    wireframe: true,
    transparent: true
  });

  let mesh = new THREE.Mesh(geometry1, material);
  let wireframe = new THREE.Mesh(geometry1, wireframeMaterial);
  mesh.add(wireframe);
  mesh.add(shadowMesh1);
  mesh.position.x = 3.0;
  //mesh.rotation.x = -1.87;
  scene.add(mesh);

  sceneGeometries.push(mesh);

  mesh = new THREE.Mesh(geometry2, material);
  wireframe = new THREE.Mesh(geometry2, wireframeMaterial);
  mesh.add(wireframe);
  mesh.add(shadowMesh2);
  mesh.position.x = -3.00;
  scene.add(mesh);
  sceneGeometries.push(mesh);


  mesh = new THREE.Mesh(geometry3, material);
  wireframe = new THREE.Mesh(geometry3, wireframeMaterial);
  mesh.add(wireframe);
  mesh.add(shadowMesh3);
  mesh.position.fromArray([0,3,-9]);
  scene.add(mesh);
  sceneGeometries.push(mesh);

}

function onDocumentMouseMove(event) {
  // calculate mouse position in normalized device coordinates
	// (-1 to +1) for both components
	mouse.x = ( event.clientX / window.innerWidth ) * 2 - 1;
	mouse.y = - ( event.clientY / window.innerHeight ) * 2 + 1; 
}

function onDocumentDoubleClick(event){
  //console.count('double click')
  if(persistentEpiPlane!==undefined){
    scene.remove(persistentEpiPlane);
    persistentEpiPlane.dispose();
  }
  persistentEpiPlane = new EpiPlaneHelper(epiPlane.plane.clone(),20, 0xffffff );
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
  const points = [ views['right'].camera.position, views['left'].camera.position ];
  baseline.geometry.setFromPoints( points );   




  
  // update the picking ray with the camera and mouse position
  raycaster.setFromCamera( mouse, views['overview'].camera );

  // calculate objects intersecting the picking ray
  const intersections = raycaster.intersectObjects( sceneGeometries, false );
  // pick first intersection. should be closest
  const intersection = ( intersections.length ) > 0 ? intersections[ 0 ] : null;

  // if intersection happened
  if ( toggle > 0.02 && intersection !== null ) {

    intersectionSphere.position.copy( intersection.point );
    intersectionSphere.visible = true;

    // update epipolar plane
    epiPlane.plane.setFromCoplanarPoints( views['right'].camera.position, 
                            views['left'].camera.position, 
                            intersectionSphere.position );
    epiPlane.visible = true;
    
    toggle = 0;

  } else if (toggle > 0.02 && intersection === null ) {
    intersectionSphere.visible = false;
    epiPlane.visible = false;
  }
  toggle += clock.getDelta();

  
  // update text positions, the text is pure HTML positioned with CSS
  annotations.forEach(function(txt){ txt.update(); });

}

//matrixTests();
function matrixTests(){
  // compare to: https://colab.research.google.com/github/schedldave/cv2021/blob/main/07_Stereo.ipynb#scrollTo=W2BI9XxZIzWc

  // left K
  const lK = new THREE.Matrix3().fromArray( 
    [532.79536562,   0.,         342.45825163,
       0.,         532.91928338, 233.90060514,
       0.,           0.,           1.00       ]);
  
  // right K
  const rK = new THREE.Matrix3().fromArray(
       [537.42795336,   0.,         327.6142018, 
          0.,         536.94702962, 248.88429309,
          0.,           0.,           1.        ]);

  // relative rotation
  const R = new THREE.Matrix3().fromArray( 
    [ 0.99998578,  0.00376589,  0.00377484,
     -0.00374027,  0.99997007, -0.00677299,
     -0.00380023,  0.00675878,  0.99996994 ]);
    
  // relative translation:
  const t = new THREE.Vector3( -3.32806101, 0.03738435, 0.01469883 );

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
    tx.set(      0, -t.z,  t.y,
               t.z,    0, -t.x,
              -t.y,  t.x,    0 );
    tx.transpose(); // needs transpose

  


    // compute essential matrix:
    let E  = new THREE.Matrix3().multiplyMatrices(R,tx); // multiplication order is flipped!
    let E_ = new THREE.Matrix3().multiplyMatrices(tx.clone().transpose(),R.clone().transpose()).transpose();
    console.log({E,E_});

    // looks good! so far!

    let F = new THREE.Matrix3().multiplyMatrices(lK.clone().invert(),E).multiply(rK.clone().invert().transpose());
    console.log({F});



}
