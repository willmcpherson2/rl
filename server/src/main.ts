import { createServer, IncomingMessage, ServerResponse } from "node:http";
import { readFile } from "node:fs";
import { WebSocketServer } from "ws";
import * as path from "node:path";
import { log, unwrap } from "../../shared/util";
import { Message, ServerState } from "../../shared/state";

const state: ServerState = {
  idCounter: 0,
  game: {
    positions: {},
  },
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

function main(): void {
  const port = unwrap(process.argv[2], "no port number supplied: `node SCRIPT PORT DIR`");
  const root = path.join(
    process.cwd(),
    unwrap(process.argv[3], "no root directory supplied: `node SCRIPT PORT DIR`"),
  );
  log({ port, root });

  const server = createServer((req: IncomingMessage, res: ServerResponse<IncomingMessage>) => {
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

  const wss = new WebSocketServer({ server });
  wss.on("connection", ws => {
    ws.on("message", data => {
      const msg: Message = JSON.parse(data.toString());
      log({ "got message": msg });
    });

    state.idCounter += 1;
    state.game.positions[state.idCounter] = { x: state.idCounter, y: 0, z: 0 };

    const reply: Message = {
      type: "joinGameResponse",
      id: state.idCounter,
      game: state.game,
    };
    log({ "sent reply": reply });
    ws.send(JSON.stringify(reply));

    wss.clients.forEach(ws => {
      const reply: Message = {
        type: "playerJoined",
        id: state.idCounter,
        game: state.game,
      };
      log({ "sent reply": reply });
      ws.send(JSON.stringify(reply));
    });
  });

  server.listen(port);
}

main();
