import { createServer, IncomingMessage, ServerResponse } from "node:http";
import { readFile } from "node:fs";
import { WebSocketServer } from "ws";
import * as path from "node:path";
import { log } from "../../shared/log";

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
  const port = process.argv[2];
  const root = path.join(process.cwd(), process.argv[3]);
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
      log({ "got socket message": data.toString() });
    });

    ws.send("hello from server");
  });

  server.listen(port);
}

main();
