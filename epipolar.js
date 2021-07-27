//import * as THREE from 'https://threejs.org//build/three.module.js';

//import Stats from 'https://threejs.org/examples/jsm/libs/stats.module.js';


// external hosting on cdn.skypack.dev
import * as THREE from 'https://cdn.skypack.dev/three/build/three.module.js'
import { OrbitControls } from 'https://cdn.skypack.dev/three/examples/jsm/controls/OrbitControls.js'

// internal (has some problems!)
  // import * as THREE from './libs/three/three.module.js'
  // import {OrbitControls} from './libs/three/examples/jsm/controls/OrbitControls.js';
import {Object3DAnnotation as Annotation} from './modules/text.js'

let stats;

let scene, renderer;
let text;
let annotations;

let mouseX = 0,
  mouseY = 0;

let windowWidth, windowHeight;

const views = {
    'overview': {
    left: 0,
    bottom: 0,
    width: 1.0,
    height: 1.0,
    background: new THREE.Color(0.5, 0.5, 0.7),
    eye: [0, 1800, 1800],
    up: [0, 1, 0],
    fov: 80,
    updateCamera: function(camera, scene, mouseX) {
    }
  },
  'left': {
    left: 0.75,
    bottom: 0,
    width: 0.25,
    height: 0.25,
    background: new THREE.Color(0.7, 0.5, 0.5),
    eye: [-1000, 800, 1000],
    up: [0, 1, 0],
    fov: 50,
    updateCamera: function(camera, scene, mouseX) {
    }
  },
  'right': {
    left: 0.75,
    bottom: 0.75,
    width: 0.25,
    height: 0.25,
    background: new THREE.Color(0.5, 0.7, 0.7),
    eye: [1000, 800, 1000],
    up: [0, 1, 0],
    fov: 50,
    updateCamera: function(camera, scene, mouseX) {
    }
  }};

init();
animate();

function init() {


  scene = new THREE.Scene();

  for (const name in views) {
    console.log(name)
    const view = views[name];
    const camera = new THREE.PerspectiveCamera(view.fov, window.innerWidth / window.innerHeight, 1, name==='overview'?100000:100);
    camera.position.fromArray(view.eye);
    camera.up.fromArray(view.up);
    camera.lookAt(scene.position);
    view.camera = camera;
    if(name==='left' || name==='right'){
        const helper = new THREE.CameraHelper(camera);
        console.log(helper.matrix)

        view.helper = helper;
        scene.add(helper);
    }
  }




  const light = new THREE.DirectionalLight(0xffffff);
  light.position.set(0, 0, 1);
  scene.add(light);

  // shadow

  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;

  const context = canvas.getContext('2d');
  const gradient = context.createRadialGradient(canvas.width / 2, canvas.height / 2, 0, canvas.width / 2, canvas.height / 2, canvas.width / 2);
  gradient.addColorStop(0.1, 'rgba(0,0,0,0.15)');
  gradient.addColorStop(1, 'rgba(0,0,0,0)');

  context.fillStyle = gradient;
  context.fillRect(0, 0, canvas.width, canvas.height);

  const shadowTexture = new THREE.CanvasTexture(canvas);

  const shadowMaterial = new THREE.MeshBasicMaterial({
    map: shadowTexture,
    transparent: true
  });
  const shadowGeo = new THREE.PlaneGeometry(300, 300, 1, 1);

  let shadowMesh;

  shadowMesh = new THREE.Mesh(shadowGeo, shadowMaterial);
  shadowMesh.position.y = -250;
  shadowMesh.rotation.x = -Math.PI / 2;
  //scene.add(shadowMesh);

  shadowMesh = new THREE.Mesh(shadowGeo, shadowMaterial);
  shadowMesh.position.x = -400;
  shadowMesh.position.y = -250;
  shadowMesh.rotation.x = -Math.PI / 2;
  //scene.add(shadowMesh);

  shadowMesh = new THREE.Mesh(shadowGeo, shadowMaterial);
  shadowMesh.position.x = 400;
  shadowMesh.position.y = -250;
  shadowMesh.rotation.x = -Math.PI / 2;
  //scene.add(shadowMesh);

  const radius = 200;

  const geometry1 = new THREE.IcosahedronGeometry(radius, 1);

  const count = geometry1.attributes.position.count;
  geometry1.setAttribute('color', new THREE.BufferAttribute(new Float32Array(count * 3), 3));

  const geometry2 = geometry1.clone();
  const geometry3 = geometry1.clone();

  const elem = document.createElement('div');
  elem.setAttribute('class', 'info')
  elem.textContent = 'Text';
  document.body.appendChild(elem);
  text = elem;

  annotations= new Array(
    new Annotation(views['right'].camera, "Right", views['overview'].camera ),
    new Annotation(views['left'].camera,  "Left",  views['overview'].camera ) );

  console.log(annotations)

  const color = new THREE.Color();
  const positions1 = geometry1.attributes.position;
  const positions2 = geometry2.attributes.position;
  const positions3 = geometry3.attributes.position;
  const colors1 = geometry1.attributes.color;
  const colors2 = geometry2.attributes.color;
  const colors3 = geometry3.attributes.color;

  for (let i = 0; i < count; i++) {

    color.setHSL((positions1.getY(i) / radius + 1) / 2, 1.0, 0.5);
    colors1.setXYZ(i, color.r, color.g, color.b);

    color.setHSL(0, (positions2.getY(i) / radius + 1) / 2, 0.5);
    colors2.setXYZ(i, color.r, color.g, color.b);

    color.setRGB(1, 0.8 - (positions3.getY(i) / radius + 1) / 2, 0);
    colors3.setXYZ(i, color.r, color.g, color.b);

  }

  const material = new THREE.MeshPhongMaterial({
    color: 0xffffff,
    flatShading: true,
    vertexColors: true,
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
  mesh.position.x = -400;
  mesh.rotation.x = -1.87;
  scene.add(mesh);

  mesh = new THREE.Mesh(geometry2, material);
  wireframe = new THREE.Mesh(geometry2, wireframeMaterial);
  mesh.add(wireframe);
  mesh.position.x = 400;
  scene.add(mesh);

  mesh = new THREE.Mesh(geometry3, material);
  wireframe = new THREE.Mesh(geometry3, wireframeMaterial);
  mesh.add(wireframe);
  scene.add(mesh);

  renderer = new THREE.WebGLRenderer({
    antialias: true
  });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  //container.appendChild( renderer.domElement );
  const new_canvas = document.body.appendChild(renderer.domElement);

  const controls = new OrbitControls(views['overview'].camera, new_canvas);
  controls.target.set(0, 0, 0);
  controls.update();


  //stats = new Stats();
  //container.appendChild( stats.dom );

  document.addEventListener('mousemove', onDocumentMouseMove);

}

function onDocumentMouseMove(event) {

  mouseX = (event.clientX - windowWidth / 2);
  mouseY = (event.clientY - windowHeight / 2);

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

    view.updateCamera(camera, scene, mouseX, mouseY);

    const left = Math.floor(windowWidth * view.left);
    const bottom = Math.floor(windowHeight * view.bottom);
    const width = Math.floor(windowWidth * view.width);
    const height = Math.floor(windowHeight * view.height);

    renderer.setViewport(left, bottom, width, height);
    renderer.setScissor(left, bottom, width, height);
    renderer.setScissorTest(true);
    renderer.setClearColor(view.background);

    camera.aspect = width / height;
    camera.updateProjectionMatrix();

    // render camera helper only when we render the overview view
    views['left'].helper.visible = views['right'].helper.visible = name === 'overview';

      // get the position of the center of the cube
    const _camera = views['left'].camera;
    _camera.updateWorldMatrix(true, false);
    const tempV = new THREE.Vector3();
    _camera.getWorldPosition(tempV);
    
    // get the normalized screen coordinate of that position
    // x and y will be in the -1 to +1 range with x = -1 being
    // on the left and y = -1 being on the bottom
    tempV.project(views['overview'].camera);
    
    // convert the normalized position to CSS coordinates
    const canvas = renderer.domElement;
    const x = (tempV.x *  .5 + .5) * canvas.clientWidth;
    const y = (tempV.y * -.5 + .5) * canvas.clientHeight;
    
    // move the elem to that position
    text.style.transform = `translate(-50%, -50%) translate(${x}px,${y}px)`;

    // update text positions, the text is pure HTML positioned with CSS
    annotations.forEach(function(txt){ txt.update(); });

    renderer.render(scene, camera);

  }

}
