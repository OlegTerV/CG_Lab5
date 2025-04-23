import {
  vsSourceCubeGouraud,
  fsSourceCubeGouraud,
} from "./cubeShadersGouraud.js";
import { vsSourceCubePhong, fsSourceCubePhong } from "./cubeShadersPhong.js";

import { mat3, mat4 } from "gl-matrix";
import { OBJLoader } from 'three/addons/loaders/OBJLoader.js';

import gorundText from "./ground.jpg"; //0
import treeText from "./figures/tree.jpg"; //1
import lampText from "./figures/lamp.jpg"; //2
import houseText from "./figures/house/house1.jpg"; //3

import house1 from "./figures/house/house.obj?url";

// Добавляем переменные для модели
let objModel = null;
let objVerticesBuffer;
let objNormalsBuffer;
let objTextureCoordsBuffer;
let objIndicesBuffer;

let lampModel = null;
let lampVerticesBuffer;
let lampNormalsBuffer;
let lampTextureCoordsBuffer;
let lampIndicesBuffer;

let houseModel = null;
let houseVerticesBuffer;
let houseNormalsBuffer;
let houseTextureCoordsBuffer;
let houseIndicesBuffer;

let textures = [gorundText, treeText, lampText, houseText];

let texturesScene = [];

let gl;
let vertexPositionAttribute;
let colorPositionAttribute;
let normPositionAttribute;
let vertexTextureAttribute;
let cubeVerticesBuffer;
let cubeIndicesBuffer;
let cubeColorsBuffer;
let cubeNormalsBuffer;
let textureCoordsBuffer;
let mvMatrix = mat4.create();
let pMatrix = mat4.create();
var nMatrix = mat3.create();
var rotationAngle = 0;
var rotationAngle2 = 0;
var rotationAngle3 = 0;

let attenuationConstant = 1.0;
let attenuationLinear = 0.009;
let attenuationQuadratic = 0.0032;
let ambientControl = 1;
let contributionControl = 1.0;

var cameraPosition = [0, 15.3, 15.0]; // Позиция камеры над кубом
var target = [0, 15.3, 0]; // Направление взгляда
var up = [0, 1, 0]; // Вектор "вверх" камеры
const moveSpeed = 0.1;
let cameraYaw = 0;
let treeIndicesCount = 0;
let lampIndicesCount = 0;
let houseIndicesCount = 0;

let treePositions = [];
let lampPositions = [];
let housePositions = [];

document
  .getElementById("typeShadingSelect")
  .addEventListener("change", changeShading);
document
  .getElementById("typeLightingSelect")
  .addEventListener("change", changeShading);

function start(canvas) {
  gl = initWebGL(canvas);
  if (gl) {
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    // включает использование буфера глубины
    gl.enable(gl.DEPTH_TEST);
    // определяет работу буфера глубины: более ближние объекты перекрывают дальние
    gl.depthFunc(gl.LEQUAL);
    // очистить буфер цвета и буфер глубины
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  }
}

function initWebGL(canvas) {
  gl = null;
  try {
    gl =
      canvas.getContext("webgl2") ||
      canvas.getContext("webgl") ||
      canvas.getContext("experimentalwebgl");
  } catch (e) {}
  if (!gl) {
    alert("Unable to initialize WebGL. Your browser may not support it.");
    gl = null;
  }
  return gl;
}

function main(vsSourceCube, fsSourceCube, typeLighting) {
  mat4.perspective(pMatrix, 1.04, 700 / 700, 0.1, 100.0);
  mat4.identity(mvMatrix);
  mat4.lookAt(mvMatrix, cameraPosition, target, up);

  mat3.normalFromMat4(nMatrix, mvMatrix);
  /* -------------------------------------------------------------- */

  let canvas = document.getElementById("glcanvasFigure");
  start(canvas);
  let shaderProgram = initShaderProgram(gl, vsSourceCube, fsSourceCube);
  gl.useProgram(shaderProgram);

  setTextures(shaderProgram);

  vertexPositionAttribute = gl.getAttribLocation(
    shaderProgram,
    "aVertexPosition"
  );
  gl.enableVertexAttribArray(vertexPositionAttribute);
  colorPositionAttribute = gl.getAttribLocation(shaderProgram, "aVertexColor");
  gl.enableVertexAttribArray(colorPositionAttribute);
  normPositionAttribute = gl.getAttribLocation(shaderProgram, "aVertexNormal");
  gl.enableVertexAttribArray(normPositionAttribute);
  vertexTextureAttribute = gl.getAttribLocation(
    shaderProgram,
    "aVertexTextureCoords"
  );
  gl.enableVertexAttribArray(vertexTextureAttribute);

  shaderProgram.MVMatrix = gl.getUniformLocation(
    shaderProgram,
    "uModelViewMatrix"
  );
  shaderProgram.ProjMatrix = gl.getUniformLocation(
    shaderProgram,
    "uProjectionMatrix"
  );
  shaderProgram.NormMatrix = gl.getUniformLocation(shaderProgram, "uNMatrix");

  shaderProgram.uniformLightPosition = gl.getUniformLocation(
    shaderProgram,
    "uLightPosition"
  );
  shaderProgram.uniformAmbientLightColor = gl.getUniformLocation(
    shaderProgram,
    "uAmbientLightColor"
  );
  shaderProgram.uniformDiffuseLightColor = gl.getUniformLocation(
    shaderProgram,
    "uDiffuseLightColor"
  );
  shaderProgram.uniformSpecularLightColor = gl.getUniformLocation(
    shaderProgram,
    "uSpecularLightColor"
  );

  shaderProgram.uniformAttenuationConstant = gl.getUniformLocation(
    shaderProgram,
    "uAttenuationConstant"
  );
  shaderProgram.uniformAttenuationLinear = gl.getUniformLocation(
    shaderProgram,
    "uAttenuationLinear"
  );
  shaderProgram.uniformAttenuationQuadratic = gl.getUniformLocation(
    shaderProgram,
    "uAttenuationQuadratic"
  );
  shaderProgram.uniformAmbientControl = gl.getUniformLocation(
    shaderProgram,
    "uAmbientControl"
  );

  shaderProgram.uniformTypeLighting = gl.getUniformLocation(
    shaderProgram,
    "typeLighting"
  );

  shaderProgram.uniformContribution = gl.getUniformLocation(
    shaderProgram,
    "contribution"
  );

  shaderProgram.samplerNumberUniform = gl.getUniformLocation(
    shaderProgram,
    "uSamplerNumber"
  );
  shaderProgram.samplerMaterialUniform = gl.getUniformLocation(
    shaderProgram,
    "uSamplerMaterial"
  );

  switch (typeLighting) {
    case 1:
      gl.uniform1i(shaderProgram.uniformTypeLighting, 1);
      break;
    case 2:
      gl.uniform1i(shaderProgram.uniformTypeLighting, 2);
      break;
    case 3:
      gl.uniform1i(shaderProgram.uniformTypeLighting, 3);
      break;
  }

  //drawPedestal(shaderProgram);

  document.onkeydown = function (e) {
    const lookDistance = 5;

    const dirX = target[0] - cameraPosition[0];
    const dirZ = target[2] - cameraPosition[2];

    const normalizedDirX = dirX / lookDistance;
    const normalizedDirZ = dirZ / lookDistance;

    const perpendicularVectorX = -normalizedDirZ;
    const perpendicularVectorZ = normalizedDirX;

    switch (e.key) {
      case "w":
        cameraPosition[0] += moveSpeed * normalizedDirX;
        cameraPosition[2] += moveSpeed * normalizedDirZ;
        break;
      case "a":
        cameraPosition[0] -= moveSpeed * perpendicularVectorX;
        cameraPosition[2] -= moveSpeed * perpendicularVectorZ;
        break;
      case "s":
        cameraPosition[0] -= moveSpeed * normalizedDirX;
        cameraPosition[2] -= moveSpeed * normalizedDirZ;
        break;
      case "d":
        cameraPosition[0] += moveSpeed * perpendicularVectorX;
        cameraPosition[2] += moveSpeed * perpendicularVectorZ;
        break;
      case "q": // Поворот влево
        cameraYaw -= 0.1;
        break;
      case "e": // Поворот вправо
        cameraYaw += 0.1;
        break;
    }
    target = [
      cameraPosition[0] + Math.sin(cameraYaw) * lookDistance, // X
      cameraPosition[1], // Y (не меняется)
      cameraPosition[2] - Math.cos(cameraYaw) * lookDistance, // Z
    ];
    mat4.lookAt(mvMatrix, cameraPosition, target, up);
    drawPedestal(shaderProgram);
  };

  document.getElementById("linear").oninput = function (e) {
    changeAttenuation(shaderProgram);
  };
  document.getElementById("quadratic").oninput = function (e) {
    changeAttenuation(shaderProgram);
  };
  document.getElementById("ambient").oninput = function (e) {
    changeAttenuation(shaderProgram);
  };
  document.getElementById("contribution").oninput = function (e) {
    changeAttenuation(shaderProgram);
  };

  let colorsCube = [1.0, 1.0, 1.0, 1.0];
  initBuffersCube(colorsCube);
  //loadModel(tree1);
  //loadModelamp(lamp1);
  //loadModeHouse(house1);
  loadObjModels();
  countData(100, 10, 3);
}

function setMatrixUniforms(shaderProgram, pMatrix, mvMatrix, nMatrix) {
  gl.uniformMatrix4fv(shaderProgram.ProjMatrix, false, pMatrix);
  gl.uniformMatrix4fv(shaderProgram.MVMatrix, false, mvMatrix);
  gl.uniformMatrix3fv(shaderProgram.NormMatrix, false, nMatrix);
}

function setupLights(shaderProgram) {
  //позиция источника света
  gl.uniform3fv(shaderProgram.uniformLightPosition, [0.0, 50.0, 0.0]);
  //соствавляющие цвета
  gl.uniform3fv(shaderProgram.uniformAmbientLightColor, [0.1, 0.1, 0.1]);
  gl.uniform3fv(shaderProgram.uniformDiffuseLightColor, [0.7, 0.7, 0.7]);
  gl.uniform3fv(shaderProgram.uniformSpecularLightColor, [1.0, 1.0, 1.0]);

  gl.uniform1f(shaderProgram.uniformAttenuationConstant, attenuationConstant);
  gl.uniform1f(shaderProgram.uniformAttenuationLinear, attenuationLinear);
  gl.uniform1f(shaderProgram.uniformAttenuationQuadratic, attenuationQuadratic);
  gl.uniform1f(shaderProgram.uniformAmbientControl, ambientControl);
}

function setupContributionOfTextures(shaderProgram) {
  gl.uniform1f(shaderProgram.uniformContribution, contributionControl);
}

function initShaderProgram(gl, vsSource, fsSource) {
  let vertexShader = loadShader(gl, gl.VERTEX_SHADER, vsSource);
  let fragmentShader = loadShader(gl, gl.FRAGMENT_SHADER, fsSource);
  // Create the shader program
  let shaderProgram = gl.createProgram();
  gl.attachShader(shaderProgram, vertexShader);
  gl.attachShader(shaderProgram, fragmentShader);
  gl.linkProgram(shaderProgram);
  // If creating the shader program failed, alert
  if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)) {
    alert(
      "Unable to initialize the shader program: " +
        gl.getProgramInfoLog(shaderProgram)
    );
    return null;
  }
  return shaderProgram;
}

function loadShader(gl, type, source) {
  let shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    alert(
      "An error occurred compiling the shaders: " + gl.getShaderInfoLog(shader)
    );
    gl.deleteShader(shader);
    return null;
  }
  return shader;
}

function initBuffersCube(colorsCube) {
  var vertices = [];
  var indices = [];
  var colors = [];
  var normals = [];

  // Функция для добавления грани с нормалями
  function addFace(faceVertices, normal) {
    const baseIndex = vertices.length / 3;
    // Добавляем вершины
    vertices.push(...faceVertices);
    // Добавляем нормали для каждой вершины грани
    for (let i = 0; i < 4; i++) {
      normals.push(...normal);
    }
    // Добавляем индексы для двух треугольников
    indices.push(
      baseIndex,
      baseIndex + 1,
      baseIndex + 2,
      baseIndex + 2,
      baseIndex + 3,
      baseIndex
    );
    // Добавляем цвета для каждой вершины грани
    for (let i = 0; i < 4; i++) {
      colors.push(...colorsCube);
    }
  }

  // Лицевая грань (Z+)
  addFace(
    [
      -15.0, -15.0, 15.0, 15.0, -15.0, 15.0, 15.0, 15.0, 15.0, -15.0, 15.0,
      15.0,
    ],
    [0, 0, 1]
  );

  // Задняя грань (Z-)
  addFace(
    [
      -15.0, -15.0, -15.0, -15.0, 15.0, -15.0, 15.0, 15.0, -15.0, 15.0, -15.0,
      -15.0,
    ],
    [0, 0, -1]
  );

  // Нижняя грань (Y-)
  addFace(
    [
      -15.0, -15.0, -15.0, 15.0, -15.0, -15.0, 15.0, -15.0, 15.0, -15.0, -15.0,
      15.0,
    ],
    [0, -1, 0]
  );

  // Верхняя грань (Y+)
  addFace(
    [
      -15.0, 15.0, 15.0, 15.0, 15.0, 15.0, 15.0, 15.0, -15.0, -15.0, 15.0,
      -15.0,
    ],
    [0, 1, 0]
  );

  // Левая грань (X-)
  addFace(
    [
      -15.0, -15.0, -15.0, -15.0, -15.0, 15.0, -15.0, 15.0, 15.0, -15.0, 15.0,
      -15.0,
    ],
    [-1, 0, 0]
  );

  // Правая грань (X+)
  addFace(
    [
      15.0, -15.0, 15.0, 15.0, -15.0, -15.0, 15.0, 15.0, -15.0, 15.0, 15.0,
      15.0,
    ],
    [1, 0, 0]
  );

  var textureCoords = [
    // Front
    0.0, 0.0, 1.0, 0.0, 1.0, 1.0, 0.0, 1.0,
    // Back
    1.0, 0.0, 1.0, 1.0, 0.0, 1.0, 0.0, 0.0,
    // Top
    0.0, 0.0, 1.0, 0.0, 1.0, 1.0, 0.0, 1.0,
    // Bottom
    0.0, 0.0, 1.0, 0.0, 1.0, 1.0, 0.0, 1.0,
    // Right
    0.0, 0.0, 1.0, 0.0, 1.0, 1.0, 0.0, 1.0,
    // Left
    0.0, 0.0, 1.0, 0.0, 1.0, 1.0, 0.0, 1.0,
  ];

  cubeVerticesBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, cubeVerticesBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);

  cubeIndicesBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, cubeIndicesBuffer);
  gl.bufferData(
    gl.ELEMENT_ARRAY_BUFFER,
    new Uint16Array(indices),
    gl.STATIC_DRAW
  );

  cubeColorsBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, cubeColorsBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);

  cubeNormalsBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, cubeNormalsBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(normals), gl.STATIC_DRAW);

  textureCoordsBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, textureCoordsBuffer);
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array(textureCoords),
    gl.STATIC_DRAW
  );
  textureCoordsBuffer.itemSize = 2;
}

function drawSceneCube(typeTextureNumber) {
  gl.bindBuffer(gl.ARRAY_BUFFER, cubeVerticesBuffer);
  gl.vertexAttribPointer(vertexPositionAttribute, 3, gl.FLOAT, false, 0, 0);

  gl.bindBuffer(gl.ARRAY_BUFFER, cubeColorsBuffer);
  gl.vertexAttribPointer(colorPositionAttribute, 4, gl.FLOAT, false, 0, 0);

  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, cubeIndicesBuffer);

  gl.bindBuffer(gl.ARRAY_BUFFER, cubeNormalsBuffer);
  gl.vertexAttribPointer(normPositionAttribute, 3, gl.FLOAT, false, 0, 0);

  gl.bindBuffer(gl.ARRAY_BUFFER, textureCoordsBuffer);
  gl.vertexAttribPointer(vertexTextureAttribute, 2, gl.FLOAT, false, 0, 0);
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, typeTextureNumber);

  gl.drawElements(gl.TRIANGLES, 36, gl.UNSIGNED_SHORT, 0);
}

function drawPedestal(shaderProgram) {
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  mat3.normalFromMat4(nMatrix, mvMatrix);

  setMatrixUniforms(shaderProgram, pMatrix, mvMatrix, nMatrix);
  setupLights(shaderProgram);
  setupContributionOfTextures(shaderProgram);
  drawSceneCube(texturesScene[0]);
  /*
  // Сохранить исходную матрицу
  for (let i = 0; i < 100; i++) {
    const originalMvMatrix = mat4.clone(mvMatrix);
    mat4.translate(mvMatrix, mvMatrix, [
      treePositions[i].x,
      15.0,
      treePositions[i].z,
    ]);
    mat4.rotate(mvMatrix, mvMatrix, treePositions[i].randAngle, [0, 1, 0]);
    mat4.rotate(mvMatrix, mvMatrix, treePositions[i].randMinAngle, [0, 0, 1]);
    mat4.scale(mvMatrix, mvMatrix, [
      treePositions[i].scale,
      treePositions[i].scale,
      treePositions[i].scale,
    ]);

    setMatrixUniforms(shaderProgram, pMatrix, mvMatrix, nMatrix);
    drawModel(shaderProgram);
    mat4.copy(mvMatrix, originalMvMatrix);
  }

  for (let i = 0; i < 10; i++) {
    const originalMvMatrix = mat4.clone(mvMatrix);
    mat4.translate(mvMatrix, mvMatrix, [
      lampPositions[i].x,
      15.0,
      lampPositions[i].z,
    ]);
    mat4.rotate(mvMatrix, mvMatrix, lampPositions[i].randAngle, [0, 1, 0]);
    //mat4.rotate(mvMatrix, mvMatrix, lampPositions[i].randMinAngle, [0, 0, 1]);
    mat4.scale(mvMatrix, mvMatrix, [0.25, 0.25, 0.25]);

    setMatrixUniforms(shaderProgram, pMatrix, mvMatrix, nMatrix);
    drawModelLamp();
    mat4.copy(mvMatrix, originalMvMatrix);
  }
*/
  for (let i = 0; i < 3; i++) {
    const originalMvMatrix = mat4.clone(mvMatrix);
    mat4.translate(mvMatrix, mvMatrix, [
      housePositions[i].x,
      14.897,
      housePositions[i].z,
    ]);
    mat4.rotate(mvMatrix, mvMatrix, housePositions[i].randAngle, [0, 1, 0]);
    //mat4.rotate(mvMatrix, mvMatrix, 3,14, [0, 0, 1]);
    mat4.scale(mvMatrix, mvMatrix, [0.08, 0.08, 0.08]);

    setMatrixUniforms(shaderProgram, pMatrix, mvMatrix, nMatrix);
    drawModelHouse();
    mat4.copy(mvMatrix, originalMvMatrix);
  }
}

function setTextures(shaderProgram) {
  const total = textures.length;
  for (let i = 0; i < total; i++) {
    let texture = gl.createTexture();

    let image = new Image();
    image.src = textures[i];

    image.onload = function () {
      handleTextureLoaded(image, texture);
      //checkAllLoaded(i, total, shaderProgram);
    };
    texturesScene.push(texture);
  }
}

function handleTextureLoaded(image, texture) {
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.bindTexture(gl.TEXTURE_2D, null);
}

function changeAttenuation(shaderProgram) {
  attenuationLinear = document.getElementById("linear").value;
  attenuationQuadratic = document.getElementById("quadratic").value;
  ambientControl = document.getElementById("ambient").value;
  contributionControl = document.getElementById("contribution").value;

  drawPedestal(shaderProgram);
}

function changeShading() {
  let shadersType = document.getElementById("typeShadingSelect").value;
  let lightType = document.getElementById("typeLightingSelect").value;

  if (shadersType == "GouraudShading" && lightType == "LambertLight") {
    main(vsSourceCubeGouraud, fsSourceCubeGouraud, 1);
  } else if (shadersType == "GouraudShading" && lightType == "PhongLight") {
    main(vsSourceCubeGouraud, fsSourceCubeGouraud, 2);
  } else if (shadersType == "GouraudShading" && lightType == "ToonShading") {
    main(vsSourceCubeGouraud, fsSourceCubeGouraud, 3);
  } else if (shadersType == "PhongShading" && lightType == "LambertLight") {
    main(vsSourceCubePhong, fsSourceCubePhong, 1);
  } else if (shadersType == "PhongShading" && lightType == "PhongLight") {
    main(vsSourceCubePhong, fsSourceCubePhong, 2);
  } else if (shadersType == "PhongShading" && lightType == "ToonShading") {
    main(vsSourceCubePhong, fsSourceCubePhong, 3);
  }
}

/*function loadModel(url) {
  const loader = new OBJLoader();
  loader.load(
    url,
    (object) => {
      const geometry = object.children[0].geometry;
      geometry.computeVertexNormals(); // Вычисляем нормали если их нет
      initModelBuffers(geometry);
    },
    undefined,
    (error) => {
      alert("Error loading model:", error);
    }
  );
}*/

function initModelBuffers(geometry) {
  // Преобразуем геометрию в треугольники
  const indices = [];
  const vertices = geometry.attributes.position.array;
  const normals = geometry.attributes.normal.array;

  // Генерируем индексы если нужно
  for (let i = 0; i < vertices.length / 3; i++) {
    indices.push(i);
  }

  treeIndicesCount = indices.length;

  // Создаем буфер вершин
  objVerticesBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, objVerticesBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);

  // Создаем буфер нормалей
  objNormalsBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, objNormalsBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(normals), gl.STATIC_DRAW);

  // Создаем индексный буфер
  objIndicesBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, objIndicesBuffer);
  gl.bufferData(
    gl.ELEMENT_ARRAY_BUFFER,
    new Uint16Array(indices),
    gl.STATIC_DRAW
  );
}
function drawModel() {
  if (!objVerticesBuffer || !objIndicesBuffer) return;

  gl.bindBuffer(gl.ARRAY_BUFFER, objVerticesBuffer);
  gl.vertexAttribPointer(vertexPositionAttribute, 3, gl.FLOAT, false, 0, 0);

  gl.bindBuffer(gl.ARRAY_BUFFER, objNormalsBuffer);
  gl.vertexAttribPointer(normPositionAttribute, 3, gl.FLOAT, false, 0, 0);

  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, objIndicesBuffer);

  // Применяем текстуры
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, texturesScene[1]);

  // Рисуем модель
  gl.drawElements(gl.TRIANGLES, treeIndicesCount, gl.UNSIGNED_SHORT, 0);
}

/*function loadModelamp(url) {
  const loader = new OBJLoader();
  loader.load(
    url,
    (object) => {
      const geometry = object.children[0].geometry;
      geometry.computeVertexNormals(); // Вычисляем нормали если их нет
      initModelBuffersLamp(geometry);
    },
    undefined,
    (error) => {
      alert("Error loading model:", error);
    }
  );
}*/
function initModelBuffersLamp(geometry) {
  // Преобразуем геометрию в треугольники
  const indices = [];
  const vertices = geometry.attributes.position.array;
  const normals = geometry.attributes.normal.array;

  // Генерируем индексы если нужно
  for (let i = 0; i < vertices.length / 3; i++) {
    indices.push(i);
  }

  lampIndicesCount = indices.length;

  // Создаем буфер вершин
  lampVerticesBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, lampVerticesBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);

  // Создаем буфер нормалей
  lampNormalsBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, lampNormalsBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(normals), gl.STATIC_DRAW);

  // Создаем индексный буфер
  lampIndicesBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, lampIndicesBuffer);
  gl.bufferData(
    gl.ELEMENT_ARRAY_BUFFER,
    new Uint16Array(indices),
    gl.STATIC_DRAW
  );
}
function drawModelLamp() {
  if (!lampVerticesBuffer || !lampIndicesBuffer) return;

  gl.bindBuffer(gl.ARRAY_BUFFER, lampVerticesBuffer);
  gl.vertexAttribPointer(vertexPositionAttribute, 3, gl.FLOAT, false, 0, 0);

  gl.bindBuffer(gl.ARRAY_BUFFER, lampNormalsBuffer);
  gl.vertexAttribPointer(normPositionAttribute, 3, gl.FLOAT, false, 0, 0);

  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, lampIndicesBuffer);

  // Применяем текстуры
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, texturesScene[2]);

  // Рисуем модель
  gl.drawElements(gl.TRIANGLES, lampIndicesCount, gl.UNSIGNED_SHORT, 0);
}

/*function loadModeHouse(url) {
  const loader = new OBJLoader();
  loader.load(
    url,
    (object) => {
      const geometry = object.children[0].geometry;

      //geometry.computeVertexNormals(); // Вычисляем нормали если их нет
      initModelBuffersHouse(geometry);
    },
    undefined,
    (error) => {
      alert("Error loading model:", error.message);
    }
  );
}*/

function initModelBuffersHouse(houseObjString) {
  const dataModel = parseObj2(houseObjString);
  console.log(dataModel[0].length);
  console.log(dataModel[1].length);
  console.log(dataModel[2].length);
  console.log(dataModel[3].length);
  const indices = dataModel[0];
  const vertices = dataModel[1];
  const normals = dataModel[2];
  const texture = dataModel[3];

  /*
  const indices = [];
  const vertices = geometry.attributes.position.array;
  const normals = geometry.attributes.normal.array;
  const texture = geometry.attributes.uv.array;

  for (let i = 0; i < vertices.length / 3; i++) {
    indices.push(i);
  }
*/
  console.log(indices.length);
  console.log(vertices.length);
  console.log(normals.length);
  console.log(texture.length);

  houseIndicesCount = indices.length;

  // Создаем буфер вершин
  houseVerticesBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, houseVerticesBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);

  // Создаем буфер нормалей
  houseNormalsBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, houseNormalsBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(normals), gl.STATIC_DRAW);
  // Создаем индексный буфер
  houseIndicesBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, houseIndicesBuffer);
  gl.bufferData(
    gl.ELEMENT_ARRAY_BUFFER,
    new Uint16Array(indices),
    gl.STATIC_DRAW
  );

  houseTextureCoordsBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, houseTextureCoordsBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(texture), gl.STATIC_DRAW);
  houseTextureCoordsBuffer.itemSize = 2;
}
function drawModelHouse() {
  if (!houseVerticesBuffer || !houseIndicesBuffer || !houseTextureCoordsBuffer)
    return;

  gl.bindBuffer(gl.ARRAY_BUFFER, houseVerticesBuffer);
  gl.vertexAttribPointer(vertexPositionAttribute, 3, gl.FLOAT, false, 0, 0);

  gl.bindBuffer(gl.ARRAY_BUFFER, houseNormalsBuffer);
  gl.vertexAttribPointer(normPositionAttribute, 3, gl.FLOAT, false, 0, 0);

  gl.bindBuffer(gl.ARRAY_BUFFER, houseTextureCoordsBuffer);
  gl.vertexAttribPointer(vertexTextureAttribute, 2, gl.FLOAT, false, 0, 0);
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, texturesScene[3]);

  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, houseIndicesBuffer);

  // Рисуем модель
  gl.drawElements(gl.TRIANGLES, houseIndicesCount, gl.UNSIGNED_SHORT, 0);
}                                                                                                 

function parseObj(objContent) {
  const lines = objContent.split("\n");
  const indices = [];
  const vertices = [];
  const normals = [];
  const texCoords = [];

  const _vertices = [];
  const _normals = [];
  const _texCoords = [];

  for (const line of lines) {
    const tokens = line.trim().split(/[ ]+/);
    if (tokens.length === 0) continue;

    switch (tokens[0]) {
      case "v":
        _vertices.push([
          parseFloat(tokens[1]),
          parseFloat(tokens[2]),
          parseFloat(tokens[3]),
        ]);
        break;

      case "vn":
        _normals.push([
          parseFloat(tokens[1]),
          parseFloat(tokens[2]),
          parseFloat(tokens[3]),
        ]);
        break;

      case "vt":
        _texCoords.push([parseFloat(tokens[1]), parseFloat(tokens[2])]);
        break;

      case "f":
        const first = tokens[1]
          .split("/")
          .map((i) => (i ? parseInt(i) - 1 : -1));
        for (let i = 2; i < tokens.length - 1; i += 1) {
          let cur = tokens[i].split("/").map((x) => (x ? parseInt(x) - 1 : -1));
          let next = tokens[i + 1]
            .split("/")
            .map((x) => (x ? parseInt(x) - 1 : -1));

          const vertex0 = {
            position: _vertices[first[0]],
          };
          if (first.length > 1) {
            const textureIndex = first[1];
            vertex0.texCoord = _texCoords[textureIndex];
            if (first.length > 2) {
              const normalIndex = first[2];
              vertex0.normal = _normals[normalIndex];
            }
          }
          vertices.push(vertex0);
          indices.push(indices.length);

          const vertex1 = {
            position: _vertices[cur[0]],
          };
          if (cur.length > 1) {
            const textureIndex = cur[1];
            vertex1.texCoord = _texCoords[textureIndex];
            if (cur.length > 2) {
              const normalIndex = cur[2];
              vertex1.normal = _normals[normalIndex];
            }
          }
          vertices.push(vertex1);
          indices.push(indices.length);

          const vertex2 = {
            position: _vertices[next[0]],
          };
          if (next.length > 1) {
            const textureIndex = next[1];
            vertex2.texCoord = _texCoords[textureIndex];
            if (next.length > 2) {
              const normalIndex = next[2];
              vertex2.normal = _normals[normalIndex];
            }
          }
          vertices.push(vertex2);
          indices.push(indices.length);
        }
    }
  }

  return [indices, vertices, _normals, _texCoords];
}
function parseObj2(objContent) {
  console.log("Input OBJ content:", objContent.slice(0, 100) + "...");
  const lines = objContent.split("\n");
  const _vertices = [];
  const _normals = [];
  const _texCoords = [];
  const vertices = [];

  // Первый проход: сбор данных
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    const tokens = trimmed.split(/\s+/);
    switch (tokens[0]) {
      case "v":
        _vertices.push(tokens.slice(1, 4).map(parseFloat));
        break;
      case "vn":
        _normals.push(tokens.slice(1, 4).map(parseFloat));
        break;
      case "vt":
        _texCoords.push(tokens.slice(1, 3).map(parseFloat));
        break;
    }
  }

  // Второй проход: обработка граней
  // Второй проход: обработка граней и создание вершин
  const vertexCache = new Map();
  const uniqueVertices = [];
  const indices = [];
  
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed.startsWith("f ")) continue;

    const faceTokens = trimmed.split(/\s+/).slice(1);
    if (faceTokens.length < 3) continue;

    // Обработка вершин грани
    const faceIndices = [];
    for (const token of faceTokens) {
      if (vertexCache.has(token)) {
        faceIndices.push(vertexCache.get(token));
        continue;
      }

      const parts = token.split("/").map(p => p ? parseInt(p) - 1 : -1);
      const [vIdx, vtIdx, vnIdx] = parts;
      
      // Получаем данные с проверкой диапазонов
      const position = _vertices[vIdx] || [0, 0, 0];
      const texCoord = (vtIdx >= 0 && vtIdx < _texCoords.length) 
        ? _texCoords[vtIdx] 
        : [0, 0];
      const normal = (vnIdx >= 0 && vnIdx < _normals.length) 
        ? _normals[vnIdx] 
        : [0, 1, 0];

      // Добавляем новую уникальную вершину
      const newIndex = uniqueVertices.length;
      uniqueVertices.push({ position, texCoord, normal });
      vertexCache.set(token, newIndex);
      faceIndices.push(newIndex);
    }

    // Триангуляция полигона
    for (let i = 1; i < faceIndices.length - 1; i++) {
      indices.push(faceIndices[0], faceIndices[i], faceIndices[i + 1]);
    }
  }

  // Преобразование в плоские массивы
  const positions = [];
  const normals = [];
  const texCoords = [];
  
  for (const vertex of uniqueVertices) {
    positions.push(...vertex.position);
    normals.push(...vertex.normal);
    texCoords.push(...vertex.texCoord);
  }

  return [indices, positions, normals, texCoords]
}

async function loadObjModels() {
  const houseObjString = await (
    await fetch(`src/figures/house/house.obj`)
  ).text();
  initModelBuffersHouse(houseObjString);
  //lampObjString = await (await fetch("./figures/lamp.obj")).text();
  //treeObjString = await (await fetch("./figures/tree1.obj")).text();
}

function countData(countTrees, countLamps, countHouses) {
  treePositions = [];
  lampPositions = [];
  housePositions = [];

  for (let i = 0; i < countTrees; i++) {
    const x = Math.random() * 30.0 - 15.0;
    const z = Math.random() * 30.0 - 15.0;
    const randAngle = Math.random() * 360.0;
    const randMinAngle = Math.random() * 0.1;
    const scale = Math.random() * 0.0002 + 0.00045;
    treePositions.push({
      x: x,
      z: z,
      randAngle: randAngle,
      randMinAngle: randMinAngle,
      scale: scale,
    });
  }

  for (let i = 0; i < countLamps; i++) {
    const x = Math.random() * 30.0 - 15.0;
    const z = Math.random() * 30.0 - 15.0;
    const randAngle = Math.random() * 360.0;
    const randMinAngle = Math.random() * 0.1;
    lampPositions.push({
      x: x,
      z: z,
      randAngle: randAngle,
      randMinAngle: randMinAngle,
    });
  }

  for (let i = 0; i < countHouses; i++) {
    const x = Math.random() * 30.0 - 15.0;
    const z = Math.random() * 30.0 - 15.0;
    const randAngle = Math.random() * 360.0;
    const randMinAngle = Math.random() * 0.1;
    housePositions.push({
      x: x,
      z: z,
      randAngle: randAngle,
      randMinAngle: randMinAngle,
    });
  }
}

changeShading();
