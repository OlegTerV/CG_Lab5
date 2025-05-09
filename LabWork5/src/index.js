import {
  vsSourceCubeGouraud,
  fsSourceCubeGouraud,
} from "./cubeShadersGouraud.js";
import { vsSourceCubePhong, fsSourceCubePhong } from "./cubeShadersPhong.js";

import { mat3, mat4 } from "gl-matrix";
import { Mesh } from 'webgl-obj-loader';

import gorundText from "./ground.jpg"; //0
import treeText from "./figures/tree.png"; //1
import lampText from "./figures/snowman.png"; //2
import houseText from "./figures/house/house1.jpg"; //3
import shedText from "./figures/house/shed1.jpg"; //4
import stoneText from "./figures/Stone.png"; //5
//import house1 from "./figures/house/house.obj";
const house1 = new URL('./figures/house/house.obj', import.meta.url).href;
const lamp1 = new URL('./figures/lamp.obj', import.meta.url).href;

// Добавляем переменные для модели
let objModel = null;
let objVerticesBuffer;
let objNormalsBuffer;
let objTextureCoordsBuffer;
let objIndicesBuffer;
let treeTextureCoordsBuffer;

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

let shedIndicesCount;
let shedVerticesBuffer;
let shedNormalsBuffer;
let shedIndicesBuffer;
let shedTextureCoordsBuffer;

let stoneIndicesCount;
let stoneVerticesBuffer;
let stoneNormalsBuffer;
let stoneIndicesBuffer;
let stoneTextureCoordsBuffer;

let textures = [gorundText, treeText, lampText, houseText, shedText, stoneText];

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
let shedPositions = [];
let stonePositions = [];

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
    //drawPedestal(shaderProgram);
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
  loadObjModels();
  countData(100, 10, 3, 10, 10);

  // Инициализация скоростей для ламп
  for (let i = 0; i < 10; i++) {
    lampPositions[i].vx = (Math.random() - 0.5) * 2; // Случайная скорость от -1 до 1 единицы в секунду
    lampPositions[i].vz = (Math.random() - 0.5) * 2;
  }

  // Запуск цикла анимации
  let lastTime = Date.now();
  function animate() {
    const currentTime = Date.now();
    const deltaTime = (currentTime - lastTime) / 1000; // Время в секундах
    lastTime = currentTime;

    update(deltaTime);
    drawPedestal(shaderProgram);
    requestAnimationFrame(animate);
  }
  animate();
}

function update(deltaTime) {
  // Обновление позиций ламп
  for (let i = 0; i < 10; i++) {
    lampPositions[i].x += lampPositions[i].vx * deltaTime;
    lampPositions[i].z += lampPositions[i].vz * deltaTime;

    // Проверка границ и изменение направления при необходимости
    if (lampPositions[i].x > 15) {
      lampPositions[i].x = 15;
      lampPositions[i].vx *= -1;
    } else if (lampPositions[i].x < -15) {
      lampPositions[i].x = -15;
      lampPositions[i].vx *= -1;
    }
    if (lampPositions[i].z > 15) {
      lampPositions[i].z = 15;
      lampPositions[i].vz *= -1;
    } else if (lampPositions[i].z < -15) {
      lampPositions[i].z = -15;
      lampPositions[i].vz *= -1;
    }
  }
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
    mat4.scale(mvMatrix, mvMatrix, [0.3, 0.3, 0.3]);

    setMatrixUniforms(shaderProgram, pMatrix, mvMatrix, nMatrix);
    drawModelLamp();
    mat4.copy(mvMatrix, originalMvMatrix);
  }

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
    //drawModelLamp();
    mat4.copy(mvMatrix, originalMvMatrix);
  }

  for (let i = 0; i < 2; i++) {
    const originalMvMatrix = mat4.clone(mvMatrix);
    mat4.translate(mvMatrix, mvMatrix, [
      shedPositions[i].x,
      14.897,
      shedPositions[i].z,
    ]);
    mat4.rotate(mvMatrix, mvMatrix, shedPositions[i].randAngle, [0, 1, 0]);
    //mat4.rotate(mvMatrix, mvMatrix, 3,14, [0, 0, 1]);
    mat4.scale(mvMatrix, mvMatrix, [0.2, 0.2, 0.2]);

    setMatrixUniforms(shaderProgram, pMatrix, mvMatrix, nMatrix);
    drawModelShed();
    //drawModelLamp();
    mat4.copy(mvMatrix, originalMvMatrix);
  }

  for (let i = 0; i < 4; i++) {
    const originalMvMatrix = mat4.clone(mvMatrix);
    mat4.translate(mvMatrix, mvMatrix, [
      stonePositions[i].x,
      14.897,
      stonePositions[i].z,
    ]);
    mat4.rotate(mvMatrix, mvMatrix, stonePositions[i].randAngle, [0, 1, 0]);
    //mat4.rotate(mvMatrix, mvMatrix, 3,14, [0, 0, 1]);
    mat4.scale(mvMatrix, mvMatrix, [0.35, 0.5, 0.35]);

    setMatrixUniforms(shaderProgram, pMatrix, mvMatrix, nMatrix);
    drawModelStone();
    //drawModelLamp();
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


function initModelBuffers(geometry) {
  const meshTree= new Mesh(geometry);

  // Преобразуем геометрию в треугольники
  const indices = meshTree.indices;
  const vertices = meshTree.vertices;
  const normals = meshTree.vertexNormals;
  const texture = meshTree.textures;

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

  treeTextureCoordsBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, treeTextureCoordsBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(texture), gl.STATIC_DRAW);
  treeTextureCoordsBuffer.itemSize = 2;
}
function drawModel() {
  if (!objVerticesBuffer || !objIndicesBuffer) return;

  gl.bindBuffer(gl.ARRAY_BUFFER, objVerticesBuffer);
  gl.vertexAttribPointer(vertexPositionAttribute, 3, gl.FLOAT, false, 0, 0);

  gl.bindBuffer(gl.ARRAY_BUFFER, objNormalsBuffer);
  gl.vertexAttribPointer(normPositionAttribute, 3, gl.FLOAT, false, 0, 0);

  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, objIndicesBuffer);

  // Применяем текстуры
  gl.bindBuffer(gl.ARRAY_BUFFER, treeTextureCoordsBuffer);
  gl.vertexAttribPointer(vertexTextureAttribute, 2, gl.FLOAT, false, 0, 0);
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, texturesScene[1]);

  // Рисуем модель
  gl.drawElements(gl.TRIANGLES, treeIndicesCount, gl.UNSIGNED_SHORT, 0);
}


function initModelBuffersLamp(geometry) {

  const meshLamp= new Mesh(geometry);

  // Преобразуем геометрию в треугольники
  const indices = meshLamp.indices;
  const vertices = meshLamp.vertices;
  const normals = meshLamp.vertexNormals;
  const texture = meshLamp.textures;

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

  lampTextureCoordsBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, lampTextureCoordsBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(texture), gl.STATIC_DRAW);
  lampTextureCoordsBuffer.itemSize = 2;
}
function drawModelLamp() {
  if (!lampVerticesBuffer || !lampIndicesBuffer) return;

  gl.bindBuffer(gl.ARRAY_BUFFER, lampVerticesBuffer);
  gl.vertexAttribPointer(vertexPositionAttribute, 3, gl.FLOAT, false, 0, 0);

  gl.bindBuffer(gl.ARRAY_BUFFER, lampNormalsBuffer);
  gl.vertexAttribPointer(normPositionAttribute, 3, gl.FLOAT, false, 0, 0);

  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, lampIndicesBuffer);

  gl.bindBuffer(gl.ARRAY_BUFFER, lampTextureCoordsBuffer);
  gl.vertexAttribPointer(vertexTextureAttribute, 2, gl.FLOAT, false, 0, 0);
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, texturesScene[2]);

  // Рисуем модель
  gl.drawElements(gl.TRIANGLES, lampIndicesCount, gl.UNSIGNED_SHORT, 0);
}


function initModelBuffersHouse(houseObjString) {
  /*const dataModel = parseObj2(houseObjString);
  console.log(dataModel[0].length);
  console.log(dataModel[1].length);
  console.log(dataModel[2].length);
  console.log(dataModel[3].length);
  const indices = dataModel[0];
  const vertices = dataModel[1];
  const normals = dataModel[2];
  const texture = dataModel[3];
*/
  /*
  const indices = houseObjString.index?.array;
  const vertices = houseObjString.attributes.position.array;
  const normals = houseObjString.attributes.normal.array;
  const texture = houseObjString.attributes.uv.array;
*/

  const meshHouse = new Mesh(houseObjString);

  console.log(meshHouse.indices.length);
  console.log(meshHouse.vertices.length);
  console.log(meshHouse.vertexNormals.length);
  console.log(meshHouse.textures.length);

  const indices = meshHouse.indices;
  const vertices = meshHouse.vertices;
  const normals = meshHouse.vertexNormals;
  const texture = meshHouse.textures;

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

function initModelBuffersShed(houseObjString) {
  const meshHouse = new Mesh(houseObjString);

  console.log(meshHouse.indices.length);
  console.log(meshHouse.vertices.length);
  console.log(meshHouse.vertexNormals.length);
  console.log(meshHouse.textures.length);

  const indices = meshHouse.indices;
  const vertices = meshHouse.vertices;
  const normals = meshHouse.vertexNormals;
  const texture = meshHouse.textures;

  shedIndicesCount = indices.length;

  // Создаем буфер вершин
  shedVerticesBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, shedVerticesBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);

  // Создаем буфер нормалей
  shedNormalsBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, shedNormalsBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(normals), gl.STATIC_DRAW);
  // Создаем индексный буфер
  shedIndicesBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, shedIndicesBuffer);
  gl.bufferData(
    gl.ELEMENT_ARRAY_BUFFER,
    new Uint16Array(indices),
    gl.STATIC_DRAW
  );

  shedTextureCoordsBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, shedTextureCoordsBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(texture), gl.STATIC_DRAW);
  shedTextureCoordsBuffer.itemSize = 2;
}
function drawModelShed() {
  if (!shedVerticesBuffer || !shedIndicesBuffer || !shedTextureCoordsBuffer)
    return;

  gl.bindBuffer(gl.ARRAY_BUFFER, shedVerticesBuffer);
  gl.vertexAttribPointer(vertexPositionAttribute, 3, gl.FLOAT, false, 0, 0);

  gl.bindBuffer(gl.ARRAY_BUFFER, shedNormalsBuffer);
  gl.vertexAttribPointer(normPositionAttribute, 3, gl.FLOAT, false, 0, 0);

  gl.bindBuffer(gl.ARRAY_BUFFER, shedTextureCoordsBuffer);
  gl.vertexAttribPointer(vertexTextureAttribute, 2, gl.FLOAT, false, 0, 0);
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, texturesScene[4]);

  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, shedIndicesBuffer);

  // Рисуем модель
  gl.drawElements(gl.TRIANGLES, shedIndicesCount, gl.UNSIGNED_SHORT, 0);
} 


function initModelBuffersStone(houseObjString) {
  const meshHouse = new Mesh(houseObjString);

  console.log(meshHouse.indices.length);
  console.log(meshHouse.vertices.length);
  console.log(meshHouse.vertexNormals.length);
  console.log(meshHouse.textures.length);

  const indices = meshHouse.indices;
  const vertices = meshHouse.vertices;
  const normals = meshHouse.vertexNormals;
  const texture = meshHouse.textures;

  stoneIndicesCount = indices.length;

  // Создаем буфер вершин
  stoneVerticesBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, stoneVerticesBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);

  // Создаем буфер нормалей
  stoneNormalsBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, stoneNormalsBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(normals), gl.STATIC_DRAW);
  // Создаем индексный буфер
  stoneIndicesBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, stoneIndicesBuffer);
  gl.bufferData(
    gl.ELEMENT_ARRAY_BUFFER,
    new Uint16Array(indices),
    gl.STATIC_DRAW
  );

  stoneTextureCoordsBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, stoneTextureCoordsBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(texture), gl.STATIC_DRAW);
  stoneTextureCoordsBuffer.itemSize = 2;
}
function drawModelStone() {
  if (!stoneVerticesBuffer || !stoneIndicesBuffer || !stoneTextureCoordsBuffer)
    return;

  gl.bindBuffer(gl.ARRAY_BUFFER, stoneVerticesBuffer);
  gl.vertexAttribPointer(vertexPositionAttribute, 3, gl.FLOAT, false, 0, 0);

  gl.bindBuffer(gl.ARRAY_BUFFER, stoneNormalsBuffer);
  gl.vertexAttribPointer(normPositionAttribute, 3, gl.FLOAT, false, 0, 0);

  gl.bindBuffer(gl.ARRAY_BUFFER, stoneTextureCoordsBuffer);
  gl.vertexAttribPointer(vertexTextureAttribute, 2, gl.FLOAT, false, 0, 0);
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, texturesScene[5]);

  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, stoneIndicesBuffer);

  // Рисуем модель
  gl.drawElements(gl.TRIANGLES, stoneIndicesCount, gl.UNSIGNED_SHORT, 0);
} 

async function loadObjModels() {
  const houseObjString = await (
    await fetch(`src/figures/house/house.obj`)
  ).text();
  initModelBuffersHouse(houseObjString);

  const lampObjString = await (
    await fetch(`src/figures/snowman.obj`)
  ).text();
  initModelBuffersLamp(lampObjString);

  const treeObjString = await (
    await fetch(`src/figures/tree1.obj`)
  ).text();
  initModelBuffers(treeObjString);

  const shedObjString = await (
    await fetch(`src/figures/house/shed1.obj`)
  ).text();
  initModelBuffersShed(shedObjString);

  const stoneObjString = await (
    await fetch(`src/figures/stone.obj`)
  ).text();
  initModelBuffersStone(stoneObjString);
}

function countData(countTrees, countLamps, countHouses, countSheds, countStones) {
  treePositions = [];
  lampPositions = [];
  housePositions = [];
  shedPositions = [];
  stonePositions = [];

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

  for (let i = 0; i < countSheds; i++) {
    const x = Math.random() * 30.0 - 15.0;
    const z = Math.random() * 30.0 - 15.0;
    const randAngle = Math.random() * 360.0;
    const randMinAngle = Math.random() * 0.1;
    shedPositions.push({
      x: x,
      z: z,
      randAngle: randAngle,
      randMinAngle: randMinAngle,
    });
  }

  for (let i = 0; i < countStones; i++) {
    const x = Math.random() * 30.0 - 15.0;
    const z = Math.random() * 30.0 - 15.0;
    const randAngle = Math.random() * 360.0;
    const randMinAngle = Math.random() * 0.1;
    stonePositions.push({
      x: x,
      z: z,
      randAngle: randAngle,
      randMinAngle: randMinAngle,
    });
  }
}

changeShading();
