/* parkingStatus file used for creating and updating the web page showing parking lot status.
    Desc: Map showing parking lot status with colored overlays over parking lots using webGL.
    Image courtesy of maps.google.com
*/

// URL to the image (served by Express at /data)
const imageUrl = "/data/campus.png";
var time = 0; //Placeholdeer - change this to get time from html input
// Array of rectangle overlays; each has x, y, width, height, color [R,G,B,A]  
// - Need to update to better fit parking lots areas
const lotBoxes = [
  { id: 'KK', x: 684, y: 870, w: 310, h: 170, color: setColor(getStatus("KK", time)) }, // Red (KK)
  { id: 'GG', x: 867, y: 430, w: 280, h: 250, color: setColor(getStatus("GG", time)) }, // Dark Green (GG)
  { id: 'OO', x: 211, y: 930, w: 220, h: 130, color: setColor(getStatus("OO", time)) }, // Yellow (OO)
  { id: 'AA', x: 160, y: 360, w: 100, h: 100, color: setColor(getStatus("AA", time)) }, // Red (AA)
  { id: 'BBB', x: 1450, y: 400, w: 125, h: 100, color: setColor(getStatus("BBB", time)) }, // Red (BBB)
];

// Vertex/Fragment shaders (image pass)
const vsTex = `
attribute vec2 aPosition;    // vertex position in pixels
attribute vec2 aTexCoord;    // UV coords [0..1]
uniform vec2 uResolution;    // canvas resolution in pixels
varying vec2 vTexCoord;      // pass-through to fragment shader
void main() {
  vec2 zeroToOne = aPosition / uResolution;
  vec2 zeroToTwo = zeroToOne * 2.0;
  vec2 clip = zeroToTwo - 1.0;
  gl_Position = vec4(clip * vec2(1.0, -1.0), 0.0, 1.0);
  vTexCoord = aTexCoord;
}
`;

const fsTex = `
precision mediump float;
uniform sampler2D uImage;  // image sampler
varying vec2 vTexCoord;    // interpolated UVs
void main() {
  gl_FragColor = texture2D(uImage, vTexCoord);
}
`;

// Vertex/Fragment shaders (rectangle pass)
const vsRect = `
attribute vec2 aPosition;  // vertex position in pixels
uniform vec2 uResolution;  // canvas resolution in pixels
void main() {
  vec2 zeroToOne = aPosition / uResolution;
  vec2 zeroToTwo = zeroToOne * 2.0;
  vec2 clip = zeroToTwo - 1.0;
  gl_Position = vec4(clip * vec2(1.0, -1.0), 0.0, 1.0);
}
`;

const fsRect = `
precision mediump float;
uniform vec4 uColor; // RGBA color
void main() {
  gl_FragColor = uColor;
}
`;


/*------------------------------------------------------------------------------- Functions-------------------------------------------------------------------------------------------- */


/*Set up a get status function to update the status of the parking lots
desc: This function will update the lotBoxes colors based on the time step
        It will simulate the parking lot status changing over time.
param time (type)- the time to get the status for
return: status (int) - the status of the parking lot (0 = full, 1 = half, Default: empty)

*/
function getStatus(id, time) {
  //Take time and request the status of the parking lots
  //for now just return a random status for testing)
  var status = Math.floor(Math.random() * 3); //Random number between 0 and 2 (can add more options later)
  return status;
}

/*setColor(status)
desc: This function will set the color of the parking lot based on the status
param status (int) - the status of the parking lot (0 = Red, 1 = Yellow, Default: Dark Green)
return: color (array [R, G, B, A]) - the color of the parking lot based on the status

*/
function setColor(status) {
  switch (status) {
    case 0: //Red
      var r = 1.0;
      var g = 0.0;
      var b = 0.0;
      break;
    case 1: //Yellow
      var r = 1.0;
      var g = 1.0;
      var b = 0.0;
      break;
    default: //Dark Green
      var r = 0.0;
      var g = 0.5;
      var b = 0.0;
      break;
  }
  var a = 0.38; //Alpha value (transparency)

  //return the color vector
  return [r, g, b, a];
}

/*----------------------------------------------------------------------Req. Functions--------------------------------------------------------------------------------------------- */


// Compile shaders (fixed compile status check)
function createShader(gl, type, source) {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    throw new Error(gl.getShaderInfoLog(shader));
  }
  return shader;
}

// Link a program from vertex/fragment shaders
function createProgram(gl, vertexSrc, fragmentSrc) {
  const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexSrc);
  const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentSrc);
  const program = gl.createProgram();
  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    throw new Error(gl.getProgramInfoLog(program));
  }
  return program;
}

// Upload an HTMLImageElement as a WebGL texture
function loadTexture(gl, imageElement) {
  const texture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, imageElement);
  return texture;
}

// Draw image and boxes
(async function main() {
  const canvas = document.getElementById("glcanvas");
  const gl = canvas.getContext("webgl");
  if (!gl) {
    alert("WebGL not available");
    return;
  }

  // Load the image
  const imageElement = await new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous"; // harmless for same-origin
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = imageUrl;
  });

  // Device-pixel-ratio aware sizing (crisper rendering)
  const dpr = window.devicePixelRatio || 1;
  canvas.width = Math.round(imageElement.naturalWidth * dpr);
  canvas.height = Math.round(imageElement.naturalHeight * dpr);
  canvas.style.width = imageElement.naturalWidth + "px";
  canvas.style.height = imageElement.naturalHeight + "px";
  gl.viewport(0, 0, canvas.width, canvas.height);

  // Programs
  const programTexture = createProgram(gl, vsTex, fsTex);
  const programRect = createProgram(gl, vsRect, fsRect);

  // ----- Image quad -----
  // Positions in pixel space
  const xStartImg = 0, yStartImg = 0;
  const xEndImg = canvas.width, yEndImg = canvas.height;

  const positionBufferImage = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBufferImage);
  const imagePositions = new Float32Array([
    xStartImg, yStartImg, xEndImg, yStartImg, xStartImg, yEndImg,
    xStartImg, yEndImg, xEndImg, yStartImg, xEndImg, yEndImg,
  ]);
  gl.bufferData(gl.ARRAY_BUFFER, imagePositions, gl.STATIC_DRAW);

  const texCoordBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer);
  const texCoords = new Float32Array([
    0, 0, 1, 0, 0, 1,
    0, 1, 1, 0, 1, 1,
  ]);
  gl.bufferData(gl.ARRAY_BUFFER, texCoords, gl.STATIC_DRAW);

  const imageTexture = loadTexture(gl, imageElement);

  // Clear
  gl.clearColor(0, 0, 0, 0);
  gl.clear(gl.COLOR_BUFFER_BIT);

  // Draw image
  gl.useProgram(programTexture);
  const aPositionTex = gl.getAttribLocation(programTexture, "aPosition");
  const aTexCoord = gl.getAttribLocation(programTexture, "aTexCoord");
  const uResolutionTex = gl.getUniformLocation(programTexture, "uResolution");
  const uImage = gl.getUniformLocation(programTexture, "uImage");

  gl.uniform2f(uResolutionTex, canvas.width, canvas.height);

  gl.bindBuffer(gl.ARRAY_BUFFER, positionBufferImage);
  gl.enableVertexAttribArray(aPositionTex);
  gl.vertexAttribPointer(aPositionTex, 2, gl.FLOAT, false, 0, 0);

  gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer);
  gl.enableVertexAttribArray(aTexCoord);
  gl.vertexAttribPointer(aTexCoord, 2, gl.FLOAT, false, 0, 0);

  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, imageTexture);
  gl.uniform1i(uImage, 0);

  gl.drawArrays(gl.TRIANGLES, 0, 6);

  // ----- Boxes -----
  gl.enable(gl.BLEND);
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

  gl.useProgram(programRect);
  const aPositionRect = gl.getAttribLocation(programRect, "aPosition");
  const uResolutionRect = gl.getUniformLocation(programRect, "uResolution");
  const uColor = gl.getUniformLocation(programRect, "uColor");
  gl.uniform2f(uResolutionRect, canvas.width, canvas.height);

  const positionBufferRect = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBufferRect);
  gl.enableVertexAttribArray(aPositionRect);
  gl.vertexAttribPointer(aPositionRect, 2, gl.FLOAT, false, 0, 0);

  lotBoxes.forEach(({ x, y, w, h, color }) => {
    const x0 = Math.round(x * dpr), y0 = Math.round(y * dpr);
    const x1 = Math.round((x + w) * dpr), y1 = Math.round((y + h) * dpr);

    const rectVerts = new Float32Array([
      x0, y0, x1, y0, x0, y1,
      x0, y1, x1, y0, x1, y1,
    ]);
    gl.bufferData(gl.ARRAY_BUFFER, rectVerts, gl.DYNAMIC_DRAW);
    gl.uniform4fv(uColor, color);
    gl.drawArrays(gl.TRIANGLES, 0, 6);
  });
})();
