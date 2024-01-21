import * as THREE from "three";

export type ClientId = number;

export type Game = {
  positions: {
    [key: ClientId]: THREE.Vector3;
  };
};

export type Input = {
  direction: THREE.Vector3;
};

export type Inputs = {
  [key: ClientId]: Input;
};

export type Message =
  | { type: "initClient"; id: ClientId; }
  | { type: "playerInput"; id: ClientId; input: Input }
  | { type: "gameUpdate"; game: Game };
