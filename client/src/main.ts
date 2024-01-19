import { log, unwrap } from "../../shared/util";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls"
import models from "./models/models.gltf";
import { ClientId, Game, Message } from "../../shared/state";

type ClientState = {
  id: ClientId;
  game: Game;
  player: THREE.Object3D;
  scene: THREE.Scene;
  models: {
    [key: ClientId]: THREE.Object3D;
  };
};

const state: ClientState = {
  id: 0,
  game: {
    positions: {},
  },
  scene: new THREE.Scene(),
  player: await loadModel(),
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
        state.models = Object.fromEntries(
          Object.entries(state.game.positions).map(([id, pos]) => {
            const player = state.player.clone();
            player.position.x = pos.x;
            player.position.y = pos.y;
            player.position.z = pos.z;
            state.scene.add(player);
            return [id, player];
          }),
        );
        break;
      }
      case "playerJoined": {
        if (msg.id === state.id) {
          break;
        }
        state.game = msg.game;
        const player = state.player.clone();
        const pos = unwrap(state.game.positions[msg.id], `no player with id ${msg.id}`);
        player.position.x = pos.x;
        player.position.y = pos.y;
        player.position.z = pos.z;
        state.scene.add(player);
        state.models = { ...state.models, [msg.id]: player };
        break;
      }
    }
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

function initRenderer(): void {
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

function main() {
  initSocket();
  initRenderer();
}

main();
