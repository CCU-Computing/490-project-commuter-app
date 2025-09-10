/* Main file for project
    Desc: This file is to focus on the user story of a map that shows the status of the parking lots across campus
        - "As a student I want to be able to see a visual reference of the current capacity of the parking 
        lot to easily judge the parking across campus. An example would be a map with green, yellow, or red
        overlayed over the parking lots on campus."
        
        Image courtesy of maps.google.com

        How: This uses webGL to render the boxes over the image of campus.
*/

// URL to the image
const imageUrl = "/img/campus.png";

// Array of rectangle overlays; each has x, y, width, height, color [R,G,B, Opacity]
const lotBoxes = [

  { x: 684, y: 870, w: 310, h: 170, color: [1, 0, 0, 0.4] },     // Red (KK)
  { x: 867, y: 430, w: 280, h: 250, color: [0, 0.25, 0, 0.4] },  // Dark Green (GG)
  { x: 211, y: 930, w: 220, h: 130, color: [1, 1, 0, 0.3] },     // Yellow (OO)
  { x: 160, y: 360, w: 100, h: 100, color: [1, 0, 0, 0.3] },     // Red (AA)
  { x: 1450, y: 400, w: 125, h: 100, color: [1, 0, 0, 0.3] },     // Red (BBB)
];


// Vertex/Fragment shaders (image pass)
// Draws the image as a textured quad

// Vertex shader for the textured image
const vsTex = `
attribute vec2 aPosition;    // vertex position in pixels
attribute vec2 aTexCoord;    // UV coords [0..1]
uniform vec2 uResolution;    // canvas resolution in pixels
varying vec2 vTexCoord;      // pass-through to fragment shader
void main() {
  // Convert from pixel space to clip space (-1..+1)
  vec2 zeroToOne = aPosition / uResolution;
  vec2 zeroToTwo = zeroToOne * 2.0;
  vec2 clip = zeroToTwo - 1.0;

  // Flip Y because WebGL clip space has +Y up while pixels have +Y down
  gl_Position = vec4(clip * vec2(1.0, -1.0), 0.0, 1.0);

  // Pass UVs through
  vTexCoord = aTexCoord;
}
`;

// Fragment shader for the textured image
const fsTex = `
precision mediump float;
uniform sampler2D uImage;  // image sampler
varying vec2 vTexCoord;    // interpolated UVs
void main() {
  gl_FragColor = texture2D(uImage, vTexCoord);
}
`;

// Vertex/Fragment shaders (rectangle pass)

// Vertex shader for colored rectangles
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

// Fragment shader for colored rectangles
const fsRect = `
precision mediump float;
uniform vec4 uColor; // RGBA color
void main() {
  gl_FragColor = uColor;
}
`;


// Compile shaders

function createShader(gl, type, source) {
  // Create shader object
  const shader = gl.createShader(type);
  // Attach GLSL source
  gl.shaderSource(shader, source);
  // Compile GLSL
  gl.compileShader(shader);
  // Verify compile succeeded
  if (!gl.getShaderParameter(shader, gl.COMPLETE_STATUS) && !gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    // Throw readable error on failure
    throw new Error(gl.getShaderInfoLog(shader));
  }
  // Return compiled shader
  return shader;
}


// Link a program from vertex/fragment shaders

function createProgram(gl, vertexSrc, fragmentSrc) {
  // Compile vertex shader
  const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexSrc);
  // Compile fragment shader
  const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentSrc);
  // Create program object
  const program = gl.createProgram();
  // Attach shaders
  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  // Link the program
  gl.linkProgram(program);
  // Verify link succeeded
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    // Throw readable error on failure
    throw new Error(gl.getProgramInfoLog(program));
  }
  // Return linked program
  return program;
}

// Upload an HTMLImageElement as a WebGL texture

function loadTexture(gl, imageElement) {
  // Create texture object
  const texture = gl.createTexture();
  // Bind it to TEXTURE_2D
  gl.bindTexture(gl.TEXTURE_2D, texture);
  // Configure sampling/wrap for NPOT images
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  // Upload pixels from the image
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, imageElement);
  // Return the WebGL
  return texture;
}

// Draw image and boxes

(async function main() {
  // Get the target canvas
  const canvas = document.getElementById("glcanvas");
  // Acquire WebGL context
  const gl = canvas.getContext("webgl");

  // Abort if WebGL not available
  if (!gl) {
    alert("WebGL not available");
    return;
  }

  // Load the image as an HTMLImageElement
  const imageElement = await new Promise((resolve, reject) => {
    // Create HTML image object
    const img = new Image();
    // Allow cross-origin usage if needed (safe for same-origin)
    img.crossOrigin = "anonymous";
    // Resolve when loaded
    img.onload = () => resolve(img);
    // Reject on error
    img.onerror = reject;
    // Set source URL
    img.src = imageUrl;
  });

  // Set canvas size to the image's natural size (pixel-perfect)
  canvas.width = imageElement.naturalWidth;
  canvas.height = imageElement.naturalHeight;

  // Set the WebGL viewport to match the canvas
  gl.viewport(0, 0, canvas.width, canvas.height);

  // Create program to draw the image
  const programTexture = createProgram(gl, vsTex, fsTex);
  // Create program to draw the rectangles
  const programRect = createProgram(gl, vsRect, fsRect);


  // Build geometry buffers for the full image (two triangles covering the entire canvas)

  // Create position buffer for the image quad
  const positionBufferImage = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBufferImage);

  // Define corners in pixel space (0,0) to (canvas.width, canvas.height)
  const xStartImg = 0, yStartImg = 0;
  const xEndImg = canvas.width, yEndImg = canvas.height;

  // Two-triangle rectangle (6 verts) covering the whole image
  const imagePositions = new Float32Array([
    xStartImg, yStartImg, xEndImg, yStartImg, xStartImg, yEndImg,
    xStartImg, yEndImg, xEndImg, yStartImg, xEndImg, yEndImg,
  ]);
  // Upload vertex positions
  gl.bufferData(gl.ARRAY_BUFFER, imagePositions, gl.STATIC_DRAW);

  // Create UV buffer (0..1) for the image quad
  const texCoordBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer);

  // Standard UVs covering the texture
  const texCoords = new Float32Array([
    0, 0, 1, 0, 0, 1,
    0, 1, 1, 0, 1, 1,
  ]);
  // Upload UVs
  gl.bufferData(gl.ARRAY_BUFFER, texCoords, gl.STATIC_DRAW);

  // Upload the image
  const imageTexture = loadTexture(gl, imageElement);

  // Draw pass 1: Image

  // Clear canvas (transparent)
  gl.clearColor(0, 0, 0, 0);
  gl.clear(gl.COLOR_BUFFER_BIT);

  // Use the texture program
  gl.useProgram(programTexture);

  // Look up attribute/uniform locations for the image program
  const aPositionTex = gl.getAttribLocation(programTexture, "aPosition");
  const aTexCoord = gl.getAttribLocation(programTexture, "aTexCoord");
  const uResolutionTex = gl.getUniformLocation(programTexture, "uResolution");
  const uImage = gl.getUniformLocation(programTexture, "uImage");

  // Set canvas resolution uniform
  gl.uniform2f(uResolutionTex, canvas.width, canvas.height);

  // Enable   and point to position buffer
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBufferImage);
  gl.enableVertexAttribArray(aPositionTex);
  gl.vertexAttribPointer(aPositionTex, 2, gl.FLOAT, false, 0, 0);

  // Enable and point to texcoord buffer
  gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer);
  gl.enableVertexAttribArray(aTexCoord);
  gl.vertexAttribPointer(aTexCoord, 2, gl.FLOAT, false, 0, 0);

  // Bind texture unit and assign sampler uniform
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, imageTexture);
  gl.uniform1i(uImage, 0);

  // Draw the two triangles (6 vertices)
  gl.drawArrays(gl.TRIANGLES, 0, 6);


  // Draw pass 2: Rectangles (with alpha blend)

  // Enable alpha blending for translucent boxes
  gl.enable(gl.BLEND);
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

  // Use the rectangle color program
  gl.useProgram(programRect);

  // Look up attribute/uniform locations for rectangle program
  const aPositionRect = gl.getAttribLocation(programRect, "aPosition");
  const uResolutionRect = gl.getUniformLocation(programRect, "uResolution");
  const uColor = gl.getUniformLocation(programRect, "uColor");

  // Set canvas resolution uniform for rect program
  gl.uniform2f(uResolutionRect, canvas.width, canvas.height);

  // Create a position buffer reused for each rectangle
  const positionBufferRect = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBufferRect);
  gl.enableVertexAttribArray(aPositionRect);
  gl.vertexAttribPointer(aPositionRect, 2, gl.FLOAT, false, 0, 0);

  // For each rectangle spec in lotBoxes, upload and draw
  lotBoxes.forEach(({ x, y, w, h, color }) => {
    // Compute corners in pixel space
    const x0 = x, y0 = y;
    const x1 = x + w, y1 = y + h;

    // Two-triangle rectangle (6 verts) for this box
    const rectVerts = new Float32Array([
      x0, y0, x1, y0, x0, y1,
      x0, y1, x1, y0, x1, y1,
    ]);

    // Upload rectangle vertices (dynamic since it changes per box)
    gl.bufferData(gl.ARRAY_BUFFER, rectVerts, gl.DYNAMIC_DRAW);

    // Set rectangle RGBA color
    gl.uniform4fv(uColor, color);

    // Draw the box (6 vertices)
    gl.drawArrays(gl.TRIANGLES, 0, 6);
  });
})();
