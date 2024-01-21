import { log, unwrap } from "../../shared/util";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls"
import models from "./models/models.gltf";
import { ClientId, Input, Message } from "../../shared/state";
import { url, port } from "../../shared/env";

type State = {
  id: ClientId;
  model: THREE.Object3D;
  scene: THREE.Scene;
  models: {
    [key: ClientId]: THREE.Object3D;
  };
  lastInput: Input;
};

function initSocket(state: State): void {
  const socket = `ws://${url}:${port}`;
  log({ socket });
  const ws = new WebSocket(socket);

  ws.addEventListener("message", event => {
    const msg: Message = JSON.parse(event.data);
    // log({ "client received": msg });

    switch (msg.type) {
      case "initClient": {
        state.id = msg.id;
        break;
      }
      case "gameUpdate": {
        Object.entries(msg.game.positions).forEach(([id, pos]) => {
          const i = parseInt(id);
          if (!state.models[i]) {
            state.models[i] = state.model.clone();
            state.scene.add(unwrap(state.models[i], `no model for id ${id}`));
          }
          const model = unwrap(state.models[i], `no model for id ${id}`);
          model.position.copy(pos);
        });
        break;
      }
    }
  });

  const keys: Set<string> = new Set();
  document.addEventListener("keydown", event => {
    keys.add(event.key);
    sendInput(state, ws, keys);
  });
  document.addEventListener("keyup", event => {
    keys.delete(event.key);
    sendInput(state, ws, keys);
  });
}

function sendInput(state: State, ws: WebSocket, keys: Set<string>): void {
  const input = calculateInput(keys);
  if (inputEquals(input, state.lastInput)) {
    return;
  }
  state.lastInput = input;
  send(ws, {
    type: "playerInput",
    id: state.id,
    input,
  });
}

function send(ws: WebSocket, msg: Message): void {
  // log({ "client sent": msg });
  ws.send(JSON.stringify(msg));
}

function inputEquals(a: Input, b: Input): boolean {
  return a.direction.equals(b.direction);
}

function calculateInput(keys: Set<string>): Input {
  return {
    direction: calculateDirection(keys),
  };
}

function calculateDirection(keys: Set<string>): THREE.Vector3 {
  return new THREE.Vector3(
    Number(keys.has("ArrowRight")) - Number(keys.has("ArrowLeft")),
    0,
    Number(keys.has("ArrowDown")) - Number(keys.has("ArrowUp")),
  );
}

async function loadModel(): Promise<THREE.Object3D> {
  const loader = new GLTFLoader();
  const gltf = await loader.parseAsync(models, "");
  const model = unwrap(gltf.scene.children[0], "no children in gltf scene");
  if (model instanceof THREE.Mesh) {
    model.material.metalness = 0;
  }
  return model;
}

function initRenderer(state: State): void {
  state.scene.add(new THREE.AxesHelper(5));

  const camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000,
  );
  camera.position.z = 4;

  const light = new THREE.AmbientLight(0x888888, 0.5);
  state.scene.add(light);

  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
  state.scene.add(directionalLight);

  const renderer = new THREE.WebGLRenderer();
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);

  window.addEventListener("resize", () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.render(state.scene, camera);
  });

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;

  const draw = () => {
    requestAnimationFrame(draw);
    controls.update();
    renderer.render(state.scene, camera);
  };

  draw();
}

async function main() {
  const state: State = {
    id: 0,
    scene: new THREE.Scene(),
    model: await loadModel(),
    models: {},
    lastInput: {
      direction: new THREE.Vector3(),
    },
  };

  initSocket(state);
  initRenderer(state);
}

main();
