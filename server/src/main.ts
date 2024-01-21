import { createServer, IncomingMessage, Server, ServerResponse } from "node:http";
import { readFile } from "node:fs";
import { WebSocket, WebSocketServer } from "ws";
import * as path from "node:path";
import * as THREE from "three";
import { log, unwrap } from "../../shared/util";
import { ClientId, Game, Inputs, Message } from "../../shared/state";
import { url, port, root } from "../../shared/env";

type State = {
  idCounter: ClientId;
  now: number;
  inputs: Inputs;
  game: Game;
};

function showRequest(req: IncomingMessage): object {
  return {
    method: req.method,
    url: req.url,
    version: req.httpVersion,
    headers: req.headers,
  };
}

function respondWithFile(
  res: ServerResponse<IncomingMessage>,
  code: number,
  filename: string,
  contentType: string,
): void {
  readFile(filename, (err: NodeJS.ErrnoException | null, data: Buffer) => {
    if (err) {
      log(err);
      respondPlainText(res, 500, err.message);
    } else {
      res.writeHead(code, { "Content-Type": contentType });
      res.end(data);
    }
  });
}

function respondPlainText(
  res: ServerResponse<IncomingMessage>,
  code: number,
  text: string,
): void {
  res.writeHead(code, { "Content-Type": "text/plain" });
  res.end(text);
}

function initServer(root: string): Server {
  return createServer((req: IncomingMessage, res: ServerResponse<IncomingMessage>) => {
    log(showRequest(req));

    if (req.method === "GET" && req.url === "/") {
      respondWithFile(res, 200, path.join(root, "index.html"), "text/html");
    } else if (req.method === "GET" && req.url === "/style.css") {
      respondWithFile(res, 200, path.join(root, "style.css"), "text/css");
    } else if (req.method === "GET" && req.url === "/main.js") {
      respondWithFile(res, 200, path.join(root, "main.js"), "text/javascript");
    } else {
      respondPlainText(res, 404, "not found");
    }
  });
}

function initSocket(server: Server, state: State): void {
  const wss = new WebSocketServer({ server });

  wss.on("connection", ws => {
    ws.on("message", data => {
      const msg: Message = JSON.parse(data.toString());
      // log({ "server received": msg });

      switch (msg.type) {
        case "playerInput": {
          state.inputs[msg.id] = msg.input;
          break;
        }
      }
    });

    state.idCounter += 1;
    const pos = new THREE.Vector3(state.idCounter, 0, 0);
    state.game.positions[state.idCounter] = pos;

    send(ws, {
      type: "initClient",
      id: state.idCounter,
    });
  });

  setInterval(() => updateClients(wss, state), 10);
}

function updateClients(wss: WebSocketServer, state: State): void {
  wss.clients.forEach(ws => send(ws, {
    type: "gameUpdate",
    game: state.game,
  }));
}

function send(ws: WebSocket, msg: Message): void {
  // log({ "server sent": msg });
  ws.send(JSON.stringify(msg));
}

function simulate(state: State): void {
  const now = Date.now();
  const delta = now - state.now;
  const speed = 0.001;
  state.now = now;
  Object.entries(state.inputs).forEach(([id, input]) => {
    const pos = unwrap(state.game.positions[parseInt(id)], `no position for id ${id}`);
    pos.addScaledVector(input.direction, delta * speed);
  });
}

function main(): void {
  const rootAbsolute = path.join(process.cwd(), root);
  log({
    url: `http://${url}:${port}`,
    root: rootAbsolute,
  });

  const state: State = {
    idCounter: 0,
    now: Date.now(),
    inputs: {},
    game: {
      positions: {},
    },
  };

  const server = initServer(rootAbsolute);
  initSocket(server, state);
  server.listen(port);
  setInterval(() => simulate(state), 10);
}

main();
