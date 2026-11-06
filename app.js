
/* =========================================================
   CODELAB STUDIO — MOTOR PRINCIPAL
   Blockly + Canvas 2D + Three.js
   ========================================================= */

const $ = (id) => document.getElementById(id);

let workspace;
let THREE = null;
let scene3D;
let camera3D;
let renderer3D;
let character3D;
let animationFrame;

let running = false;
let currentMode = "2D";

const STORAGE_KEY = "codelab_studio_projects_v2";

const game = {
  x: 400,
  y: 250,
  angle: 0,
  speed: 5,
  verticalSpeed: 0,
  gravity: 0.5,
  grounded: true,
  message: "",
  messageTime: 0,
  background: "#17233c",
  steps: 0
};

const explanations = {
  codelab_start: {
    title: "🚀 Quando iniciar",
    description: "Marca o começo de um programa. Use este bloco para organizar a sequência de comandos do seu projeto."
  },
  codelab_move: {
    title: "🏃 Mover personagem",
    description: "Movimenta o personagem na direção escolhida. No modo 2D, utiliza as direções da tela. No modo 3D, movimenta o personagem pelo mundo."
  },
  codelab_turn: {
    title: "🔄 Girar personagem",
    description: "Altera a orientação do personagem. Experimente diferentes ângulos para criar movimentos e direções."
  },
  codelab_say: {
    title: "💬 Mostrar mensagem",
    description: "Exibe uma mensagem sobre o personagem. É útil para diálogos, instruções e histórias."
  },
  codelab_background: {
    title: "🎨 Mudar cenário",
    description: "Altera a cor de fundo do projeto. Experimente diferentes cores para criar ambientes."
  },
  codelab_move3d: {
    title: "🌎 Movimento 3D",
    description: "Move o personagem nos eixos X, Y e Z. X representa esquerda e direita, Y representa altura e Z representa profundidade."
  },
  codelab_rotate3d: {
    title: "🧭 Rotação 3D",
    description: "Gira o objeto tridimensional nos eixos X, Y e Z."
  },
  codelab_jump: {
    title: "⬆️ Pular",
    description: "Aplica um impulso vertical no personagem. A gravidade atua depois do impulso."
  },
  codelab_speed: {
    title: "⚡ Definir velocidade",
    description: "Define a velocidade usada pelos próximos movimentos."
  }
};

function log(message, type = "normal") {
  const output = $("consoleOutput");
  if (!output) return;

  const line = document.createElement("p");
  line.textContent = message;
  line.className = "console-" + type;
  output.appendChild(line);
  output.scrollTop = output.scrollHeight;
}

function explainBlock(block) {
  const panel = $("blockExplanation");
  if (!panel) return;

  const info = explanations[block.type];

  if (!info) {
    panel.innerHTML = `
      <h3>${block.type.replaceAll("_", " ")}</h3>
      <p>Este é um bloco do Blockly. Use-o para construir a lógica do seu programa.</p>
    `;
    return;
  }

  panel.innerHTML = `
    <h3>${info.title}</h3>
    <p>${info.description}</p>
  `;
}

/* =========================================================
   PERSONAGEM 2D
   ========================================================= */

const canvas = $("gameCanvas");
const ctx = canvas.getContext("2d");

function drawCharacter2D() {
  ctx.save();
  ctx.translate(game.x, game.y);
  ctx.rotate(game.angle * Math.PI / 180);

  // Sombra
  ctx.beginPath();
  ctx.ellipse(0, 19, 17, 6, 0, 0, Math.PI * 2);
  ctx.fillStyle = "rgba(0,0,0,0.35)";
  ctx.fill();

  // Pernas
  ctx.fillStyle = "#263b6c";
  ctx.fillRect(-11, 5, 9, 17);
  ctx.fillRect(2, 5, 9, 17);

  // Botas
  ctx.fillStyle = "#18202d";
  ctx.fillRect(-13, 18, 12, 6);
  ctx.fillRect(2, 18, 12, 6);

  // Corpo
  ctx.fillStyle = "#4389e8";
  ctx.beginPath();
  ctx.roundRect(-14, -10, 28, 23, 8);
  ctx.fill();

  // Mochila
  ctx.fillStyle = "#24509a";
  ctx.fillRect(-17, -7, 6, 15);

  // Cabeça
  ctx.fillStyle = "#f0bd91";
  ctx.beginPath();
  ctx.arc(0, -19, 12, 0, Math.PI * 2);
  ctx.fill();

  // Cabelo
  ctx.fillStyle = "#392c29";
  ctx.beginPath();
  ctx.arc(0, -23, 12, Math.PI, Math.PI * 2);
  ctx.fill();

  // Olhos
  ctx.fillStyle = "#20232b";
  ctx.beginPath();
  ctx.arc(4, -19, 1.5, 0, Math.PI * 2);
  ctx.fill();

  // Indicador de direção
  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  ctx.moveTo(0, -35);
  ctx.lineTo(-5, -29);
  ctx.lineTo(5, -29);
  ctx.closePath();
  ctx.fill();

  ctx.restore();

  if (game.message && game.messageTime > 0) {
    ctx.fillStyle = "rgba(255,255,255,0.95)";
    ctx.beginPath();
    ctx.roundRect(game.x - 95, game.y - 75, 190, 30, 9);
    ctx.fill();

    ctx.fillStyle = "#18202d";
    ctx.font = "bold 13px Arial";
    ctx.textAlign = "center";
    ctx.fillText(game.message, game.x, game.y - 55, 175);

    game.messageTime--;
    if (game.messageTime <= 0) game.message = "";
  }
}

function draw2D() {
  if (!ctx) return;

  canvas.width = 800;
  canvas.height = 500;

  ctx.fillStyle = game.background;
  ctx.fillRect(0, 0, 800, 500);

  // Grade decorativa
  ctx.strokeStyle = "rgba(255,255,255,0.055)";
  ctx.lineWidth = 1;

  for (let x = 0; x <= 800; x += 40) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, 500);
    ctx.stroke();
  }

  for (let y = 0; y <= 500; y += 40) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(800, y);
    ctx.stroke();
  }

  drawCharacter2D();
}

/* =========================================================
   THREE.JS — PERSONAGEM 3D
   ========================================================= */

async function initialize3D() {
  if (renderer3D) {
    resize3D();
    return true;
  }

  try {
    const module = await import(
      "https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.module.js"
    );

    THREE = module;

    const container = $("threeContainer");

    scene3D = new THREE.Scene();
    scene3D.background = new THREE.Color("#91b9dc");

    camera3D = new THREE.PerspectiveCamera(
      55,
      1,
      0.1,
      1000
    );

    camera3D.position.set(5, 4, 7);
    camera3D.lookAt(0, 1, 0);

    renderer3D = new THREE.WebGLRenderer({
      antialias: true,
      alpha: false
    });

    renderer3D.setPixelRatio(
      Math.min(window.devicePixelRatio || 1, 2)
    );

    renderer3D.shadowMap.enabled = true;
    renderer3D.shadowMap.type = THREE.PCFSoftShadowMap;

    container.innerHTML = "";
    container.appendChild(renderer3D.domElement);

    // Iluminação
    const ambient = new THREE.HemisphereLight(
      0xffffff,
      0x71805d,
      2
    );
    scene3D.add(ambient);

    const sunlight = new THREE.DirectionalLight(
      0xffffff,
      2.5
    );

    sunlight.position.set(5, 10, 5);
    sunlight.castShadow = true;
    sunlight.shadow.mapSize.set(1024, 1024);
    scene3D.add(sunlight);

    // Terreno
    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(100, 100),
      new THREE.MeshStandardMaterial({
        color: "#6c9d63",
        roughness: 1
      })
    );

    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.03;
    ground.receiveShadow = true;
    scene3D.add(ground);

    // Grade do terreno
    const grid = new THREE.GridHelper(
      100,
      100,
      0x78976b,
      0x78976b
    );
    grid.position.y = 0.005;
    scene3D.add(grid);

    // Criar personagem
    character3D = new THREE.Group();
    scene3D.add(character3D);

    const material = (color) =>
      new THREE.MeshStandardMaterial({
        color,
        roughness: 0.75
      });

    function part(geometry, color, x, y, z) {
      const mesh = new THREE.Mesh(
        geometry,
        material(color)
      );

      mesh.position.set(x, y, z);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      character3D.add(mesh);

      return mesh;
    }

    // Corpo
    part(
      new THREE.CapsuleGeometry(0.32, 0.55, 5, 10),
      "#367bd4",
      0, 1.25, 0
    );

    // Cabeça
    part(
      new THREE.SphereGeometry(0.31, 24, 20),
      "#f1c29a",
      0, 2.05, 0
    );

    // Cabelo
    part(
      new THREE.SphereGeometry(0.315, 24, 12, 0, Math.PI * 2, 0, Math.PI * 0.55),
      "#44302a",
      0, 2.13, 0
    );

    // Mochila
    part(
      new THREE.BoxGeometry(0.48, 0.55, 0.2),
      "#8a542c",
      0, 1.32, -0.32
    );

    // Braços
    const armLeft = part(
      new THREE.CapsuleGeometry(0.105, 0.48, 4, 8),
      "#e8b58e",
      -0.43, 1.32, 0
    );

    const armRight = part(
      new THREE.CapsuleGeometry(0.105, 0.48, 4, 8),
      "#e8b58e",
      0.43, 1.32, 0
    );

    // Pernas
    const legLeft = part(
      new THREE.CapsuleGeometry(0.13, 0.45, 4, 8),
      "#263e6c",
      -0.17, 0.47, 0
    );

    const legRight = part(
      new THREE.CapsuleGeometry(0.13, 0.45, 4, 8),
      "#263e6c",
      0.17, 0.47, 0
    );

    // Botas
    part(
      new THREE.BoxGeometry(0.28, 0.16, 0.4),
      "#252b36",
      -0.17, 0.12, 0.08
    );

    part(
      new THREE.BoxGeometry(0.28, 0.16, 0.4),
      "#252b36",
      0.17, 0.12, 0.08
    );

    character3D.userData = {
      armLeft,
      armRight,
      legLeft,
      legRight,
      animationTime: 0,
      moving: false
    };

    resize3D();
    animate3D();

    log("Motor 3D inicializado.", "success");
    return true;

  } catch (error) {
    console.error(error);
    log("Não foi possível iniciar o motor 3D: " + error.message, "error");
    return false;
  }
}

function resize3D() {
  if (!renderer3D || !$("threeContainer")) return;

  const container = $("threeContainer");
  const width = Math.max(container.clientWidth, 1);
  const height = Math.max(container.clientHeight, 1);

  camera3D.aspect = width / height;
  camera3D.updateProjectionMatrix();

  renderer3D.setSize(width, height);
}

function animate3D() {
  animationFrame = requestAnimationFrame(animate3D);

  if (!renderer3D || !character3D) return;

  const data = character3D.userData;

  if (data.moving) {
    data.animationTime += 0.12;

    data.legLeft.rotation.x = Math.sin(data.animationTime) * 0.55;
    data.legRight.rotation.x = Math.sin(data.animationTime + Math.PI) * 0.55;

    data.armLeft.rotation.x = Math.sin(data.animationTime + Math.PI) * 0.35;
    data.armRight.rotation.x = Math.sin(data.animationTime) * 0.35;
  } else {
    data.legLeft.rotation.x = 0;
    data.legRight.rotation.x = 0;
    data.armLeft.rotation.x = 0;
    data.armRight.rotation.x = 0;
  }

  renderer3D.render(scene3D, camera3D);
}

function reset3DCharacter() {
  if (!character3D) return;

  character3D.position.set(0, 0, 0);
  character3D.rotation.set(0, 0, 0);
  character3D.userData.moving = false;
}

/* =========================================================
   BLOCOS PERSONALIZADOS
   ========================================================= */

function registerBlocks() {
  Blockly.defineBlocksWithJsonArray([
    {
      type: "codelab_start",
      message0: "🚀 quando executar o programa",
      nextStatement: null,
      style: "event_blocks",
      tooltip: "Inicia a sequência de comandos.",
      helpUrl: ""
    },
    {
      type: "codelab_move",
      message0: "mover %1 por %2 passos",
      args0: [
        {
          type: "field_dropdown",
          name: "DIRECTION",
          options: [
            ["para frente", "FORWARD"],
            ["para trás", "BACKWARD"],
            ["para direita", "RIGHT"],
            ["para esquerda", "LEFT"],
            ["para cima", "UP"],
            ["para baixo", "DOWN"]
          ]
        },
        {
          type: "input_value",
          name: "DISTANCE",
          check: "Number"
        }
      ],
      previousStatement: null,
      nextStatement: null,
      style: "motion_blocks",
      tooltip: "Movimenta o personagem no ambiente."
    },
    {
      type: "codelab_turn",
      message0: "girar %1 graus",
      args0: [
        {
          type: "input_value",
          name: "ANGLE",
          check: "Number"
        }
      ],
      previousStatement: null,
      nextStatement: null,
      style: "motion_blocks",
      tooltip: "Gira o personagem."
    },
    {
      type: "codelab_say",
      message0: "💬 dizer %1",
      args0: [
        {
          type: "input_value",
          name: "TEXT",
          check: "String"
        }
      ],
      previousStatement: null,
      nextStatement: null,
      style: "looks_blocks",
      tooltip: "Exibe uma mensagem."
    },
    {
      type: "codelab_background",
      message0: "mudar fundo para %1",
      args0: [
        {
          type: "field_colour",
          name: "COLOR",
          colour: "#17233c"
        }
      ],
      previousStatement: null,
      nextStatement: null,
      style: "looks_blocks",
      tooltip: "Altera o fundo do projeto."
    },
    {
      type: "codelab_move3d",
      message0: "mover 3D X %1 Y %2 Z %3",
      args0: [
        { type: "input_value", name: "X", check: "Number" },
        { type: "input_value", name: "Y", check: "Number" },
        { type: "input_value", name: "Z", check: "Number" }
      ],
      previousStatement: null,
      nextStatement: null,
      style: "motion_blocks",
      tooltip: "Move o personagem nos três eixos."
    },
    {
      type: "codelab_rotate3d",
      message0: "rotacionar 3D X %1 Y %2 Z %3",
      args0: [
        { type: "input_value", name: "X", check: "Number" },
        { type: "input_value", name: "Y", check: "Number" },
        { type: "input_value", name: "Z", check: "Number" }
      ],
      previousStatement: null,
      nextStatement: null,
      style: "motion_blocks",
      tooltip: "Rotaciona o personagem nos três eixos."
    },
    {
      type: "codelab_jump",
      message0: "⬆️ pular com força %1",
      args0: [
        { type: "input_value", name: "POWER", check: "Number" }
      ],
      previousStatement: null,
      nextStatement: null,
      style: "motion_blocks",
      tooltip: "Aplica impulso vertical."
    },
    {
      type: "codelab_speed",
      message0: "definir velocidade para %1",
      args0: [
        { type: "input_value", name: "SPEED", check: "Number" }
      ],
      previousStatement: null,
      nextStatement: null,
      style: "motion_blocks",
      tooltip: "Define a velocidade dos movimentos."
    }
  ]);
}

/* =========================================================
   GERADORES JAVASCRIPT
   ========================================================= */

function registerGenerators() {
  const JS = Blockly.JavaScript;

  JS.forBlock["codelab_start"] = function () {
    return "api.start();\n";
  };

  JS.forBlock["codelab_move"] = function (block, generator) {
    const direction = block.getFieldValue("DIRECTION");
    const distance = generator.valueToCode(
      block, "DISTANCE", JS.ORDER_ATOMIC
    ) || "10";

    return `api.move("${direction}", ${distance});\n`;
  };

  JS.forBlock["codelab_turn"] = function (block, generator) {
    const angle = generator.valueToCode(
      block, "ANGLE", JS.ORDER_ATOMIC
    ) || "90";

    return `api.turn(${angle});\n`;
  };

  JS.forBlock["codelab_say"] = function (block, generator) {
    const value = generator.valueToCode(
      block, "TEXT", JS.ORDER_ATOMIC
    ) || '""';

    return `api.say(${value});\n`;
  };

  JS.forBlock["codelab_background"] = function (block) {
    const color = block.getFieldValue("COLOR");
    return `api.background("${color}");\n`;
  };

  JS.forBlock["codelab_move3d"] = function (block, generator) {
    const x = generator.valueToCode(block, "X", JS.ORDER_ATOMIC) || "0";
    const y = generator.valueToCode(block, "Y", JS.ORDER_ATOMIC) || "0";
    const z = generator.valueToCode(block, "Z", JS.ORDER_ATOMIC) || "0";

    return `api.move3D(${x}, ${y}, ${z});\n`;
  };

  JS.forBlock["codelab_rotate3d"] = function (block, generator) {
    const x = generator.valueToCode(block, "X", JS.ORDER_ATOMIC) || "0";
    const y = generator.valueToCode(block, "Y", JS.ORDER_ATOMIC) || "0";
    const z = generator.valueToCode(block, "Z", JS.ORDER_ATOMIC) || "0";

    return `api.rotate3D(${x}, ${y}, ${z});\n`;
  };

  JS.forBlock["codelab_jump"] = function (block, generator) {
    const power = generator.valueToCode(
      block, "POWER", JS.ORDER_ATOMIC
    ) || "5";

    return `api.jump(${power});\n`;
  };

  JS.forBlock["codelab_speed"] = function (block, generator) {
    const speed = generator.valueToCode(
      block, "SPEED", JS.ORDER_ATOMIC
    ) || "5";

    return `api.speed(${speed});\n`;
  };
}

/* =========================================================
   API DOS BLOCOS
   ========================================================= */

const api = {
  start() {
    log("Programa iniciado.", "success");
  },

  move(direction, distance) {
    if (!running) return;

    const amount = Math.max(
      -1000,
      Math.min(1000, Number(distance) || 0)
    );

    if (currentMode === "2D") {
      const angle = game.angle * Math.PI / 180;

      let dx = 0;
      let dy = 0;

      if (direction === "FORWARD") {
        dx = Math.sin(angle) * amount;
        dy = -Math.cos(angle) * amount;
      }

      if (direction === "BACKWARD") {
        dx = -Math.sin(angle) * amount;
        dy = Math.cos(angle) * amount;
      }

      if (direction === "RIGHT") dx = amount;
      if (direction === "LEFT") dx = -amount;
      if (direction === "UP") dy = -amount;
      if (direction === "DOWN") dy = amount;

      game.x = Math.max(15, Math.min(785, game.x + dx));
      game.y = Math.max(15, Math.min(485, game.y + dy));

      draw2D();
    } else if (character3D) {
      const amount3D = amount / 20;

      if (direction === "FORWARD") character3D.translateZ(-amount3D);
      if (direction === "BACKWARD") character3D.translateZ(amount3D);
      if (direction === "RIGHT") character3D.translateX(amount3D);
      if (direction === "LEFT") character3D.translateX(-amount3D);
      if (direction === "UP") character3D.position.y += amount3D;
      if (direction === "DOWN") character3D.position.y -= amount3D;

      character3D.userData.moving = true;
    }

    game.steps++;
  },

  turn(angle) {
    if (!running) return;

    const value = Number(angle) || 0;

    if (currentMode === "2D") {
      game.angle += value;
      draw2D();
    } else if (character3D) {
      character3D.rotation.y += value * Math.PI / 180;
    }
  },

  say(message) {
    if (!running) return;

    game.message = String(message).slice(0, 100);
    game.messageTime = 180;

    log("Personagem: " + game.message);
    if (currentMode === "2D") draw2D();
  },

  background(color) {
    if (!running) return;

    game.background = color;

    if (currentMode === "2D") {
      draw2D();
    } else if (scene3D) {
      scene3D.background = new THREE.Color(color);
    }
  },

  move3D(x, y, z) {
    if (!running || !character3D) return;

    character3D.position.x += Number(x) || 0;
    character3D.position.y += Number(y) || 0;
    character3D.position.z += Number(z) || 0;
    character3D.userData.moving = true;
  },

  rotate3D(x, y, z) {
    if (!running || !character3D) return;

    character3D.rotation.x += Number(x) * Math.PI / 180 || 0;
    character3D.rotation.y += Number(y) * Math.PI / 180 || 0;
    character3D.rotation.z += Number(z) * Math.PI / 180 || 0;
  },

  jump(power) {
    if (!running) return;

    const force = Math.max(0, Math.min(30, Number(power) || 5));

    if (currentMode === "2D") {
      game.y = Math.max(15, game.y - force * 5);
      draw2D();
    } else if (character3D) {
      character3D.position.y += force / 10;
    }
  },

  speed(value) {
    game.speed = Math.max(0, Math.min(100, Number(value) || 0));
    log("Velocidade definida: " + game.speed);
  }
};

/* =========================================================
   EXECUTAR E PARAR
   ========================================================= */

async function runProgram() {
  if (!workspace) return;

  if (running) {
    log("Já existe um programa em execução.", "warning");
    return;
  }

  if (currentMode === "3D") {
    const ready = await initialize3D();
    if (!ready) return;
  }

  try {
    resetCharacter();

    const code = Blockly.JavaScript.workspaceToCode(workspace);

    if (!code.trim()) {
      log("Adicione blocos antes de executar.", "warning");
      return;
    }

    running = true;

    if (character3D) {
      character3D.userData.moving = false;
    }

    $("previewStatus").textContent = "EXECUTANDO";

    log("Executando programa...");

    const execute = new Function(
      "api",
      `"use strict";\n${code}`
    );

    execute(api);

    if (running) {
      running = false;
      $("previewStatus").textContent = "CONCLUÍDO";
      if (character3D) character3D.userData.moving = false;
      log("Programa concluído.", "success");
    }

  } catch (error) {
    running = false;
    $("previewStatus").textContent = "ERRO";
    if (character3D) character3D.userData.moving = false;
    log("Erro: " + error.message, "error");
    console.error(error);
  }
}

function stopProgram() {
  running = false;

  if (character3D) {
    character3D.userData.moving = false;
  }

  $("previewStatus").textContent = "PARADO";
  log("Execução interrompida.");
}

function resetCharacter() {
  game.x = 400;
  game.y = 250;
  game.angle = 0;
  game.message = "";
  game.messageTime = 0;
  game.steps = 0;

  if (currentMode === "2D") {
    draw2D();
  } else {
    reset3DCharacter();
  }
}

/* =========================================================
   SALVAR E ABRIR PROJETOS
   ========================================================= */

function getProjects() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  } catch {
    return [];
  }
}

function saveProject() {
  if (!workspace) return;

  const name = $("projectName").value.trim() || "Projeto sem nome";

  const xml = Blockly.Xml.domToText(
    Blockly.Xml.workspaceToDom(workspace)
  );

  const projects = getProjects();

  const existingIndex = projects.findIndex(
    project => project.name === name
  );

  const project = {
    name,
    xml,
    mode: currentMode,
    updatedAt: new Date().toISOString()
  };

  if (existingIndex >= 0) {
    projects[existingIndex] = project;
  } else {
    projects.push(project);
  }

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
    log("Projeto salvo: " + name, "success");
    renderProjects();
  } catch {
    log("Armazenamento cheio. Exporte ou apague projetos antigos.", "error");
  }
}

function openProject(name) {
  const project = getProjects().find(item => item.name === name);
  if (!project) return;

  try {
    workspace.clear();

    const xml = Blockly.utils.xml.textToDom(project.xml);
    Blockly.Xml.domToWorkspace(xml, workspace);

    $("projectName").value = project.name;

    if (project.mode) {
      setMode(project.mode);
    }

    log("Projeto aberto: " + project.name, "success");
    showPage("editor");
  } catch (error) {
    log("Não foi possível abrir o projeto: " + error.message, "error");
  }
}

function renderProjects() {
  const container = $("projectsList");
  if (!container) return;

  const projects = getProjects();
  container.innerHTML = "";

  if (projects.length === 0) {
    container.textContent = "Nenhum projeto salvo ainda.";
    return;
  }

  projects.forEach(project => {
    const card = document.createElement("article");
    card.className = "learning-card";

    const title = document.createElement("h3");
    title.textContent = "📁 " + project.name;

    const date = document.createElement("p");
    date.textContent = "Última alteração: " +
      new Date(project.updatedAt).toLocaleString("pt-BR");

    const open = document.createElement("button");
    open.textContent = "Abrir projeto";
    open.addEventListener("click", () => openProject(project.name));

    const remove = document.createElement("button");
    remove.textContent = "Excluir";
    remove.addEventListener("click", () => {
      const updated = getProjects().filter(
        item => item.name !== project.name
      );
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      renderProjects();
    });

    card.append(title, date, open, remove);
    container.appendChild(card);
  });
}

function newProject() {
  if (workspace) workspace.clear();

  $("projectName").value = "Novo projeto";
  resetCharacter();
  showPage("editor");

  log("Novo projeto criado.");
}

/* =========================================================
   EXPORTAR E IMPORTAR PROJETO
   ========================================================= */

function exportProject() {
  if (!workspace) return;

  const xml = Blockly.Xml.domToText(
    Blockly.Xml.workspaceToDom(workspace)
  );

  const file = new Blob([xml], {
    type: "text/xml;charset=utf-8"
  });

  const url = URL.createObjectURL(file);
  const link = document.createElement("a");

  link.href = url;
  link.download = ($("projectName").value || "projeto") + ".xml";
  link.click();

  URL.revokeObjectURL(url);
  log("Arquivo exportado.", "success");
}

/* =========================================================
   MODOS 2D E 3D
   ========================================================= */

async function setMode(mode) {
  currentMode = mode;

  const is3D = mode === "3D";

  $("mode2D").classList.toggle("active", !is3D);
  $("mode3D").classList.toggle("active", is3D);

  $("gameCanvas").hidden = is3D;
  $("threeContainer").hidden = !is3D;

  $("currentMode").textContent = "MODO " + mode;

  if (is3D) {
    await initialize3D();
  } else {
    draw2D();
  }
}

/* =========================================================
   NAVEGAÇÃO
   ========================================================= */

function showPage(page) {
  const pages = {
    editor: "editorPage",
    learn: "learnPage",
    projects: "projectsPage",
    challenges: "challengesPage"
  };

  Object.values(pages).forEach(id => {
    const element = $(id);
    if (element) element.hidden = true;
  });

  if (pages[page]) $(pages[page]).hidden = false;

  document.querySelectorAll("[data-page]").forEach(button => {
    button.classList.toggle(
      "active",
      button.dataset.page === page
    );
  });

  if (page === "projects") renderProjects();
}

/* =========================================================
   INICIALIZAÇÃO DO BLOCKLY
   ========================================================= */

function initializeBlockly() {
  if (!window.Blockly) {
    log("Blockly não foi carregado. Verifique sua conexão.", "error");
    return;
  }

  registerBlocks();

  const JS = Blockly.JavaScript;

  if (!JS || !JS.forBlock) {
    log("Gerador JavaScript do Blockly não foi carregado.", "error");
    return;
  }

  registerGenerators();

  workspace = Blockly.inject("blocklyDiv", {
    toolbox: $("toolbox"),
    renderer: "zelos",
    trashcan: true,
    sounds: true,
    move: {
      scrollbars: true,
      drag: true,
      wheel: true
    },
    zoom: {
      controls: true,
      wheel: true,
      startScale: 0.9,
      maxScale: 1.5,
      minScale: 0.5,
      scaleSpeed: 1.1
    },
    grid: {
      spacing: 25,
      length: 3,
      colour: "#39445c",
      snap: true
    }
  });

  workspace.addChangeListener(event => {
    if (event.type === Blockly.Events.SELECTED) {
      const block = workspace.getBlockById(event.newElementId);
      if (block) explainBlock(block);
    }
  });

  window.addEventListener("resize", () => {
    Blockly.svgResize(workspace);
    resize3D();
  });

  log("Editor Blockly carregado.", "success");
}

/* =========================================================
   EVENTOS DA INTERFACE
   ========================================================= */

function connectInterface() {
  $("runBtn").addEventListener("click", runProgram);
  $("stopBtn").addEventListener("click", stopProgram);
  $("saveBtn").addEventListener("click", saveProject);

  $("clearBtn").addEventListener("click", () => {
    if (workspace) workspace.clear();
    log("Blocos removidos.");
  });

  $("clearConsoleBtn").addEventListener("click", () => {
    $("consoleOutput").innerHTML = "";
  });

  $("mode2D").addEventListener("click", () => setMode("2D"));
  $("mode3D").addEventListener("click", () => setMode("3D"));

  $("newProjectBtn").addEventListener("click", newProject);

  document.querySelectorAll("[data-page]").forEach(button => {
    button.addEventListener("click", () => {
      showPage(button.dataset.page);
    });
  });

  // Exportação também pode ser chamada pelo console do navegador.
  window.exportCodeLabProject = exportProject;
}

/* =========================================================
   INICIAR CODELAB
   ========================================================= */

function startCodeLab() {
  try {
    initializeBlockly();
    connectInterface();
    draw2D();
    renderProjects();

    log("CODELAB STUDIO pronta para criar!", "success");

  } catch (error) {
    console.error(error);
    log("Falha na inicialização: " + error.message, "error");
  }
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", startCodeLab);
} else {
  startCodeLab();
}
