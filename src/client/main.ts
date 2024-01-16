import { log } from "../shared/log";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls"
import monkey from "./models/monkey.gltf";

function initSocket(): void {
  const port = 3000;
  log({ port });
  const ws = new WebSocket(`ws://localhost:${port}`);

  ws.addEventListener("message", event => {
    log({ "got socket message:": event.data });
  });

  ws.addEventListener("open", () => {
    const msg = "hello from client";
    ws.send(msg);
    log({ "sent socket message": msg });
  });
}

function draw() {
  const scene = new THREE.Scene();
  scene.add(new THREE.AxesHelper(5));

  const camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000,
  );
  camera.position.z = 4;

  const light = new THREE.AmbientLight(0xaaaaaa);
  scene.add(light);

  const spotLight = new THREE.SpotLight(0xffffff);
  spotLight.position.set(1, 1, 1);
  scene.add(spotLight);

  const renderer = new THREE.WebGLRenderer();
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);

  window.addEventListener("resize", () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.render(scene, camera);
  });

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;

  const loader = new GLTFLoader();
  loader.parse(
    monkey,
    "",
    gltf => {
      gltf.scene.traverse(child => {
        if (child instanceof THREE.Mesh) {
          child.material.metalness = 0;
        }
      });
      scene.add(gltf.scene);
    },
  );

  const animate = () => {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
  };

  animate();
}

function main() {
  initSocket();
  draw();
}

main();
