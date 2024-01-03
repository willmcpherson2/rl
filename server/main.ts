import { createServer } from "node:http";
import { readFile } from "node:fs";
import { WebSocketServer } from "ws";
import * as path from "node:path";

const dateFormat = new Intl.DateTimeFormat("en-AU", {
  timeZone: "Australia/Sydney",
  dateStyle: "medium",
  timeStyle: "medium",
});

function showRequest(req) {
  return `time: ${dateFormat.format(new Date())}
method: ${req.method}
url: ${req.url}
version: ${req.httpVersion}
headers: ${JSON.stringify(req.headers, null, 2)}
body: ${JSON.stringify(req.body, null, 2)}
`;
}

function respondWithFile(res, code, filename, contentType) {
  readFile(filename, (err, data) => {
    res.writeHead(code, { "Content-Type": contentType });
    res.end(data);
  });
}

function respondPlainText(res, code, text) {
  res.writeHead(code, { "Content-Type": "text/plain" });
  res.end(text);
}

function main() {
  const port = process.argv[2];
  const root = path.join(process.cwd(), process.argv[3]);
  console.log(`port: ${port}
root: ${root}
`);

  const server = createServer((req, res) => {
    console.log(showRequest(req));

    if (req.method === "GET" && req.url === "/") {
      respondWithFile(res, 200, path.join(root, "index.html"), "text/html");
    } else if (req.method === "GET" && req.url === "/style.css") {
      respondWithFile(res, 200, path.join(root, "style.css"), "text/css");
    } else if (req.method === "GET" && req.url === "/main.js") {
      respondWithFile(res, 200, path.join(root, "main.js"), "text/javascript");
    } else {
      respondPlainText(res, 404, "Not found");
    }
  });

  const wss = new WebSocketServer({ server });
  wss.on("connection", ws => {
    ws.on("message", data => {
      console.log("received on server:", data.toString());
    });

    ws.send("hello from server");
  });

  server.listen(port);
}

main();
