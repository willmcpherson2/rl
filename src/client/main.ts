import { log } from "../shared/log";
import shaderVert from "./shaders/vertex.glsl";
import shaderFrag from "./shaders/fragment.glsl";

function initSocket(): void {
  const port = 3000;
  log({ port });
  const ws = new WebSocket(`ws://localhost:${port}`);

  ws.addEventListener("message", event => {
    log({ "got socket message:": event.data });
  });

  ws.addEventListener("open", () => {
    const msg = "hello from client";
    ws.send(msg);
    log({ "sent socket message": msg });
  });
}

function initGl(): WebGLRenderingContext {
  const canvas = document.querySelector("#canvas");
  if (!(canvas instanceof HTMLCanvasElement)) {
    throw new Error("no canvas in document");
  }

  const gl = canvas.getContext("webgl");
  if (gl === null) {
    throw new Error("no webgl context in canvas");
  }

  return gl;
}

function initShader(
  gl: WebGLRenderingContext,
  type: "VERTEX_SHADER" | "FRAGMENT_SHADER",
  source: string,
): WebGLShader {
  const shader = gl.createShader(gl[type]);
  if (shader === null) {
    throw new Error("createShader returned null");
  }

  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    throw new Error(`COMPILE_STATUS false: ${gl.getShaderInfoLog(shader)}`);
  }

  return shader;
}

function initProgram(
  gl: WebGLRenderingContext,
  shaderVert: string,
  shaderFrag: string,
): WebGLProgram {
  const program = gl.createProgram();
  if (program === null) {
    throw new Error("createProgram returned null");
  }

  gl.attachShader(program, initShader(gl, "VERTEX_SHADER", shaderVert));
  gl.attachShader(program, initShader(gl, "FRAGMENT_SHADER", shaderFrag));
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    throw new Error(`LINK_STATUS false: ${gl.getProgramInfoLog(program)}`);
  }

  return program;
}

function draw(
  gl: WebGLRenderingContext,
  program: WebGLProgram,
  positions: number[],
): void {
  gl.useProgram(program);

  gl.clearColor(0, 0, 0, 0);
  gl.clear(gl.COLOR_BUFFER_BIT);

  const positionBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);
  const index = gl.getAttribLocation(program, "a_position");
  gl.vertexAttribPointer(index, 2, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(index);
  gl.drawArrays(gl.TRIANGLES, 0, positions.length / 2);
}

function drawTriangles(): void {
  const gl = initGl();
  const program = initProgram(gl, shaderVert, shaderFrag);
  draw(gl, program, [
    -1, -1,
    -1, 0.9,
    0.9, -1,
    1, 1,
    -0.9, 1,
    1, -0.9,
  ]);
}

function main() {
  initSocket();
  drawTriangles();
}

main();
