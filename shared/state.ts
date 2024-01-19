export type ClientId = number;

export type Pos = {
  x: number;
  y: number;
  z: number;
};

export type Game = {
  positions: {
    [key: ClientId]: Pos;
  };
};

export type ServerState = {
  idCounter: ClientId;
  game: Game;
};

export type Input = Pos;

export type Message =
  | { type: "joinGameRequest" }
  | { type: "joinGameResponse"; id: ClientId, game: Game };
