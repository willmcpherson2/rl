import * as THREE from "three";

export type ClientId = number;

export type Game = {
  positions: {
    [key: ClientId]: THREE.Vector3;
  };
};

export type Input = {
  direction: THREE.Vector3;
}

export type Message =
  | { type: "joinGameResponse"; id: ClientId; game: Game }
  | { type: "playerJoined"; id: ClientId; position: THREE.Vector3 }
  | { type: "playerInput"; id: ClientId; input: Input }
  | { type: "playerMoved"; id: ClientId; position: THREE.Vector3 };
