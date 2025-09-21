/* parkingStatus file used for creating and updating the web page showing parking lot status.
  Desc: Map showing parking lot status with colored overlays over parking lots using webGL.
  
  User Story: As a student I want to be able to see a visual reference of the current capacity 
  of the parking lot to easily judge the parking across campus. An example would be a map with 
  green, yellow, or red overlayed over the parking lots on campus.

  Image courtesy of maps.google.com
*/

// URL to the image (served by Express at /data)
const imageUrl = "/data/campus.png";

(function ParkingStatusApp() {
  "use strict";

  let time = 0; //Placeholder - change this to get time from html input
  // Array of rectangle overlays; each has x, y, width, height, color [R,G,B,A]  
  // - Need to update to better fit parking lots areas
  let lotBoxes = [];
  let canvas, gl, dpr;
  let programTexture, programRect;
  let positionBufferImage, texCoordBuffer, positionBufferRect;
  let aPositionTex, aTexCoord, aPositionRect;
  let uResolutionTex, uImage, uResolutionRect, uColor;
  let timeSlider, timeValue, imageTexture;

  /* -------------------------------- Shaders ------------------------------------ */

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

  // Initialize the lotBoxes array with parking lot locations and initial colors
  setUpLotBoxes();

  /*------------------------------------------------------------------------------- Functions-------------------------------------------------------------------------------------------- */

  /* setUpLotBoxes()
  desc: This function will set up the lotBoxes array with the parking lot locations and initial colors
  param: none
  return: none
  */
  function setUpLotBoxes() {
    const GREEN = [0, .5, 0, .38]; //Dark Green
    // mock data
    lotBoxes = [
      { id: 'KK', x: 684, y: 870, w: 310, h: 170, color: GREEN },
      { id: 'GG', x: 867, y: 430, w: 280, h: 250, color: GREEN },
      { id: 'OO', x: 211, y: 930, w: 220, h: 130, color: GREEN },
      { id: 'AA', x: 160, y: 360, w: 100, h: 100, color: GREEN },
      { id: 'BBB', x: 1450, y: 400, w: 125, h: 100, color: GREEN },
    ];
    for (let i = 0; i < lotBoxes.length; i++) {
      let status = getStatus(lotBoxes[i].id, time); //Get the status of the parking lot
      lotBoxes[i].color = setColor(status); //Set the color of the parking lot based on the status
    }
  }

  /*Set up a get status function to update the status of the parking lots
  desc: This function will update the lotBoxes colors based on the time step
          It will simulate the parking lot status changing over time.
  param time (type)- the time to get the status for
  param id (string) - the id of the parking lot to get the status for
  return: status (int) - the status of the parking lot (0 = Red, 1 = Yellow, Default: Dark Green)
  */
  function getStatus(id, time) {
    //Take time and request the status of the parking lots
    //for now just return a random status for testing)
    var status = Math.floor(Math.random() * 3); //Random number between 0 and 2
    var box = lotBoxes.find(lot => lot.id === id) //Find the parking lot with the given id
    //check for valid box
    if (box) {
      box.color = setColor(status); //Set the color of the parking lot based on the status
    }
    return status;
  }

  /*setColor(status)
  desc: This function will set the color of the parking lot based on the status
  param status (int) - the status of the parking lot (0 = Red, 1 = Yellow, Default: Dark Green)
  return: color (array [R, G, B, A]) - the color of the parking lot based on the status
  */
  function setColor(status) {
    let r, g, b;
    switch (status) {
      case 0: //Red
        r = 1.0; g = 0.0; b = 0.0;
        break;
      case 1: //Yellow
        r = 1.0; g = 1.0; b = 0.0;
        break;
      default: //Dark Green
        r = 0.0; g = 0.5; b = 0.0;
        break;
    }
    var a = 0.38; //Alpha value (transparency)
    return [r, g, b, a];
  }

  /* --------------------------------- Helpers --------------------------------- */

  // Compile shaders (fixed compile status check and helpful logs)
  function createShader(gl, type, source) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      const info = gl.getShaderInfoLog(shader) || "unknown shader error";
      console.error("Shader compile failed:", info, "\nSource:\n", source);
      gl.deleteShader(shader);
      throw new Error(info);
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
      const info = gl.getProgramInfoLog(program) || "unknown link error";
      console.error("Program link failed:", info);
      gl.deleteProgram(program);
      gl.deleteShader(vertexShader);
      gl.deleteShader(fragmentShader);
      throw new Error(info);
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

  // Format time value (12-hour hh:mm, from quarter-hour slider)
  function formatTime12h(val) {
    const v = Number(val);
    let hours24 = Math.floor(v);
    const minutes = Math.round((v * 60) % 60);
    let hours12 = hours24 % 12;
    if (hours12 === 0) hours12 = 12;
    return `${hours12}:${minutes.toString().padStart(2, '0')}`;
  }

  /* ------------------------------- Setup steps ------------------------------- */

  function initDomAndGL() {
    canvas = document.getElementById("glcanvas");
    gl = canvas.getContext("webgl");
    timeSlider = document.getElementById("time");
    timeValue = document.getElementById("timeValue");
    if (!gl) throw new Error("WebGL not available");
  }

  async function loadBackgroundImage() {
    const imageElement = await new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = "anonymous"; // harmless for same-origin
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = imageUrl;
    });
    return imageElement;
  }

  function setupCanvasForImage(imageElement) {
    // Device-pixel-ratio aware sizing (crisper rendering)
    dpr = window.devicePixelRatio || 1;
    canvas.width = Math.round(imageElement.naturalWidth * dpr);
    canvas.height = Math.round(imageElement.naturalHeight * dpr);
    canvas.style.width = imageElement.naturalWidth + "px";
    canvas.style.height = imageElement.naturalHeight + "px";
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
  }

  function buildPrograms() {
    programTexture = createProgram(gl, vsTex, fsTex);
    programRect = createProgram(gl, vsRect, fsRect);
  }

  function buildImageBuffersAndUniforms(imageElement) {
    // ----- Image quad -----
    const xStartImg = 0, yStartImg = 0;
    const xEndImg = canvas.width, yEndImg = canvas.height;

    positionBufferImage = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBufferImage);
    const imagePositions = new Float32Array([
      xStartImg, yStartImg, xEndImg, yStartImg, xStartImg, yEndImg,
      xStartImg, yEndImg, xEndImg, yStartImg, xEndImg, yEndImg,
    ]);
    gl.bufferData(gl.ARRAY_BUFFER, imagePositions, gl.STATIC_DRAW);

    texCoordBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer);
    const texCoords = new Float32Array([
      0, 0, 1, 0, 0, 1,
      0, 1, 1, 0, 1, 1,
    ]);
    gl.bufferData(gl.ARRAY_BUFFER, texCoords, gl.STATIC_DRAW);

    imageTexture = loadTexture(gl, imageElement);

    gl.useProgram(programTexture);
    aPositionTex = gl.getAttribLocation(programTexture, "aPosition");
    aTexCoord = gl.getAttribLocation(programTexture, "aTexCoord");
    uResolutionTex = gl.getUniformLocation(programTexture, "uResolution");
    uImage = gl.getUniformLocation(programTexture, "uImage");

    gl.uniform2f(uResolutionTex, canvas.width, canvas.height);

    // initial binds for first draw
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBufferImage);
    gl.enableVertexAttribArray(aPositionTex);
    gl.vertexAttribPointer(aPositionTex, 2, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer);
    gl.enableVertexAttribArray(aTexCoord);
    gl.vertexAttribPointer(aTexCoord, 2, gl.FLOAT, false, 0, 0);

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, imageTexture);
    gl.uniform1i(uImage, 0);
  }

  function buildRectBuffersAndUniforms() {
    // ----- Boxes -----
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    gl.useProgram(programRect);
    aPositionRect = gl.getAttribLocation(programRect, "aPosition");
    uResolutionRect = gl.getUniformLocation(programRect, "uResolution");
    uColor = gl.getUniformLocation(programRect, "uColor");
    gl.uniform2f(uResolutionRect, canvas.width, canvas.height);

    positionBufferRect = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBufferRect);
    gl.enableVertexAttribArray(aPositionRect);
    gl.vertexAttribPointer(aPositionRect, 2, gl.FLOAT, false, 0, 0);
  }

  function attachEvents() {
    // Time slider event listener
    timeSlider.addEventListener("input", function () {
      // preserve .25 steps from the range by reading the numeric value
      const v = this.valueAsNumber ?? parseFloat(this.value);
      if (!Number.isFinite(v)) return;

      time = v;

      // format time for display (12-hour hh:mm like you had in HTML before)
      timeValue.textContent = formatTime12h(time);

      render();  // re-render image + boxes on time change
    });
  }

  /* ------------------------------- Rendering --------------------------------- */

  function drawImage() {
    gl.useProgram(programTexture);

    // rebind image buffers/attribs to avoid stale pointers
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBufferImage);
    gl.enableVertexAttribArray(aPositionTex);
    gl.vertexAttribPointer(aPositionTex, 2, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer);
    gl.enableVertexAttribArray(aTexCoord);
    gl.vertexAttribPointer(aTexCoord, 2, gl.FLOAT, false, 0, 0);

    gl.uniform2f(uResolutionTex, canvas.width, canvas.height);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, imageTexture);
    gl.uniform1i(uImage, 0);

    gl.drawArrays(gl.TRIANGLES, 0, 6);
  }

  /* renderBoxes()
  desc: This function will render the parking lot boxes on the canvas 
  param: none
  return: none
  */
  function renderBoxes() {
    gl.useProgram(programRect);
    gl.uniform2f(uResolutionRect, canvas.width, canvas.height);

    // ensure the rect buffer/attrib is bound before each draw
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBufferRect);
    gl.enableVertexAttribArray(aPositionRect);
    gl.vertexAttribPointer(aPositionRect, 2, gl.FLOAT, false, 0, 0);

    lotBoxes.forEach((box) => {
      let status = getStatus(box.id, time);   // recompute per current time
      box.color = setColor(status);

      const x0 = Math.round(box.x * dpr), y0 = Math.round(box.y * dpr);
      const x1 = Math.round((box.x + box.w) * dpr), y1 = Math.round((box.y + box.h) * dpr);

      const rectVerts = new Float32Array([
        x0, y0, x1, y0, x0, y1,
        x0, y1, x1, y0, x1, y1,
      ]);
      gl.bufferData(gl.ARRAY_BUFFER, rectVerts, gl.DYNAMIC_DRAW);
      gl.uniform4fv(uColor, box.color);
      gl.drawArrays(gl.TRIANGLES, 0, 6);
    });
  }

  function render() {
    gl.clear(gl.COLOR_BUFFER_BIT);
    drawImage();
    renderBoxes();
  }

  /* --------------------------------- main ------------------------------------ */

  async function main() {
    initDomAndGL();
    attachEvents();

    const img = await loadBackgroundImage();
    setupCanvasForImage(img);
    buildPrograms();
    buildImageBuffersAndUniforms(img);
    buildRectBuffersAndUniforms();

    // Initial UI + first paint
    const initial = timeSlider.valueAsNumber ?? parseFloat(timeSlider.value);
    time = Number.isFinite(initial) ? initial : 0;
    timeValue.textContent = formatTime12h(time);
    render();
  }

  // Kick off
  main().catch(err => {
    console.error(err);
    alert(err.message || String(err));
  });

})();
