import { log, unwrap } from "../../shared/util";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls"
import models from "./models/models.gltf";
import { ClientId, Game, Message } from "../../shared/state";

type ClientState = {
  id: ClientId;
  game: Game;
  models: {
    [key: ClientId]: THREE.Object3D;
  };
};

const state: ClientState = {
  id: 0,
  game: {
    positions: {},
  },
  models: {},
};

function initSocket(): void {
  const port = 3000;
  log({ port });
  const ws = new WebSocket(`ws://localhost:${port}`);

  ws.addEventListener("message", event => {
    const msg: Message = JSON.parse(event.data);
    log({ "got message": msg });

    switch (msg.type) {
      case "joinGameResponse": {
        state.id = msg.id;
        state.game = msg.game;
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

async function loadModel(): Promise<THREE.Object3D> {
  const loader = new GLTFLoader();
  const gltf = await loader.parseAsync(models, "");
  const model = unwrap(gltf.scene.children[0], "no children in gltf scene");
  if (model instanceof THREE.Mesh) {
    model.material.metalness = 0;
  }
  return model;
}

async function initRenderer(): Promise<void> {
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

  const player = await loadModel();

  const draw = () => {
    requestAnimationFrame(draw);

    const loadingModels = Object.keys(state.models).length === 0;
    const loadedGame = Object.keys(state.game.positions).length !== 0;
    if (loadingModels && loadedGame) {
      state.models = Object.fromEntries(
        Object.keys(state.game.positions).map(id => [id, player.clone()]),
      );
      Object.values(state.models).forEach(model => scene.add(model));
    }

    Object.entries(state.game.positions).forEach(([id, pos]) => {
      const model = unwrap(state.models[parseInt(id)], `no model for id ${id}`);
      model.position.x = pos.x;
      model.position.y = pos.y;
      model.position.z = pos.z;
    });

    controls.update();
    renderer.render(scene, camera);
  };

  draw();
}

function main() {
  initSocket();
  initRenderer();
}

main();
