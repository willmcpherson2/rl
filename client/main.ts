import { log } from "../shared/log";

const port = 3000;

function makeSocket(): void {
  log({ port });

  const ws = new WebSocket("ws://localhost:3000");

  ws.addEventListener("message", event => {
    log({ "got socket message:": event.data });
  });

  ws.addEventListener("open", () => {
    const msg = "hello from client";
    ws.send(msg);
    log({ "sent socket message": msg });
  });
}

function drawTriangle(): void {
  const canvas = document.querySelector('#canvas');

  if (!(canvas instanceof HTMLCanvasElement)) {
    throw new Error('No html canvas element.');
  }

  // WebGL rendering context
  const gl = canvas.getContext('webgl');

  if (!gl) {
    throw new Error('Unable to initialize WebGL.');
  }

  // Clear color
  gl.clearColor(0, 0, 0, 0);
  gl.clear(gl.COLOR_BUFFER_BIT);

  // A user-defined function to create and compile shaders
  const initShader = (type: 'VERTEX_SHADER' | 'FRAGMENT_SHADER', source: string) => {
    const shader = gl.createShader(gl[type]);

    if (!shader) {
      throw new Error('Unable to create a shader.');
    }

    gl.shaderSource(shader, source);

    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      throw new Error(`An error occurred compiling the shaders: ${gl.getShaderInfoLog(shader)}`);
    }

    return shader;
  }

  // Vertex shader
  const vertexShader = initShader('VERTEX_SHADER', `
attribute vec4 a_position;

void main() {
  gl_Position = a_position;
}
`);

  // Fragment shader
  const fragmentShader = initShader('FRAGMENT_SHADER', `
void main() {
  gl_FragColor = vec4(1, 0, 0.5, 1);
}
`);

  // WebGL program
  const program = gl.createProgram();

  if (!program) {
    throw new Error('Unable to create the program.');
  }

  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);

  gl.linkProgram(program);

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    throw new Error(`Unable to link the shaders: ${gl.getProgramInfoLog(program)}`);
  }

  gl.useProgram(program);

  // Vertext buffer
  const positionBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

  const positions = [
    0, 1,
    0.866, -0.5,
    -0.866, -0.5,
  ];
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

  const index = gl.getAttribLocation(program, 'a_position');
  const size = 2;
  const type = gl.FLOAT;
  const normalized = false;
  const stride = 0;
  const offset = 0;
  gl.vertexAttribPointer(index, size, type, normalized, stride, offset);
  gl.enableVertexAttribArray(index);

  // Draw the scene
  gl.drawArrays(gl.TRIANGLES, 0, 3);
}

function main() {
  makeSocket();
  drawTriangle();
}

main();
