import { log } from "../../shared/log";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls"
import monkey from "./models/monkey.gltf";
import { ClientState, Message } from "../../shared/state";

let state: ClientState | null = null;

function initSocket(): void {
  const port = 3000;
  log({ port });
  const ws = new WebSocket(`ws://localhost:${port}`);

  ws.addEventListener("message", event => {
    const msg: Message = JSON.parse(event.data);
    log({ "got message": msg });

    switch (msg.type) {
      case "joinGameResponse": {
        state = msg.clientState;
        break;
      }
    }
  });

  ws.addEventListener("open", () => {
    const msg: Message = { type: "joinGameRequest" };
    ws.send(JSON.stringify(msg));
    log({ "sent message": msg });
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

  const light = new THREE.AmbientLight(0x888888, 0.5);
  scene.add(light);

  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
  scene.add(directionalLight);

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

  let player: THREE.Object3D | null = null;
  const loader = new GLTFLoader();
  loader.parse(
    monkey,
    "",
    gltf => {
      const child = gltf.scene.children[0];
      if (!child) {
        throw new Error("no children in gltf scene");
      }
      player = child;
      if (player instanceof THREE.Mesh) {
        player.material.metalness = 0;
      }
      scene.add(player);
    },
  );

  const animate = () => {
    requestAnimationFrame(animate);
    if (player && state) {
      const pos = state.game.positions[state.id];
      if (!pos) {
        throw new Error(`no position for id ${state.id}`);
      }
      player.position.x = pos.x;
      player.position.y = pos.y;
      player.position.z = pos.z;
    }
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
