
/* =====================================================
   CODELAB STUDIO
   Motor principal - Versão 0.1
   Blockly + JavaScript + Canvas 2D + Three.js
===================================================== */

const $ = (id) => document.getElementById(id);

const canvas = $("gameCanvas");
const ctx = canvas.getContext("2d");

const consoleOutput = $("consoleOutput");
const executionStatus = $("executionStatus");
const explanationTitle = $("explanationTitle");
const explanationText = $("explanationText");
const saveStatus = $("saveStatus");

let currentMode = "2d";
let workspace;
let running = false;
let threeEngine = null;

/* =====================================================
   1. PERSONAGEM E CENA 2D
===================================================== */

const player = {
  x: 400,
  y: 270,
  size: 34,
  direction: 0,
  color: "#397FEA",
  message: ""
};

let backgroundColor = "#DCE9F4";

function drawScene() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Fundo
  ctx.fillStyle = backgroundColor;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Grade decorativa
  ctx.strokeStyle = "rgba(60,90,120,0.10)";
  ctx.lineWidth = 1;

  for (let x = 0; x < canvas.width; x += 40) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, canvas.height);
    ctx.stroke();
  }

  for (let y = 0; y < canvas.height; y += 40) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(canvas.width, y);
    ctx.stroke();
  }

  // Sombra do personagem
  ctx.fillStyle = "rgba(0,0,0,0.15)";
  ctx.beginPath();
  ctx.ellipse(player.x, player.y + 17, 20, 7, 0, 0, Math.PI * 2);
  ctx.fill();

  // Personagem
  ctx.save();
  ctx.translate(player.x, player.y);
  ctx.rotate(player.direction);

  ctx.fillStyle = player.color;
  ctx.beginPath();
  ctx.roundRect(-15, -17, 30, 34, 9);
  ctx.fill();

  // Olhos
  ctx.fillStyle = "#FFFFFF";
  ctx.beginPath();
  ctx.arc(5, -6, 3, 0, Math.PI * 2);
  ctx.fill();

  ctx.beginPath();
  ctx.arc(5, 6, 3, 0, Math.PI * 2);
  ctx.fill();

  // Direção
  ctx.fillStyle = "#17345B";
  ctx.beginPath();
  ctx.moveTo(14, 0);
  ctx.lineTo(24, -6);
  ctx.lineTo(24, 6);
  ctx.closePath();
  ctx.fill();

  ctx.restore();

  // Mensagem do personagem
  if (player.message) {
    ctx.fillStyle = "#17243A";
    ctx.font = "bold 18px Arial";
    ctx.textAlign = "center";
    ctx.fillText(player.message, player.x, player.y - 35);
  }
}

function movePlayer(steps) {
  const distance = Number(steps) || 0;

  player.x += Math.cos(player.direction) * distance;
  player.y += Math.sin(player.direction) * distance;

  player.x = Math.max(18, Math.min(canvas.width - 25, player.x));
  player.y = Math.max(18, Math.min(canvas.height - 25, player.y));

  drawScene();
}

function turnPlayer(degrees) {
  player.direction += (Number(degrees) || 0) * Math.PI / 180;
  drawScene();
}

function sayMessage(message) {
  player.message = String(message);
  drawScene();
}

function changeBackground(color) {
  backgroundColor = color;
  drawScene();
}

/* =====================================================
   2. EXPLICAÇÕES DOS BLOCOS
===================================================== */

const explanations = {
  codelab_start: {
    title: "Quando iniciar o programa",
    text: "Este bloco marca o começo de uma sequência de instruções. Coloque os comandos abaixo dele para definir o que acontecerá quando você executar seu projeto."
  },

  codelab_move: {
    title: "Mover personagem",
    text: "Este bloco movimenta o personagem para a direção em que ele está olhando. O número representa a distância percorrida. Experimente 10, 50 ou 100 passos."
  },

  codelab_turn: {
    title: "Girar personagem",
    text: "Gira o personagem em graus. 90 representa um quarto de volta, 180 representa meia volta e 360 representa uma volta completa."
  },

  codelab_say: {
    title: "Dizer uma mensagem",
    text: "Mostra uma mensagem acima do personagem. É útil para diálogos, avisos, histórias e comunicação com o jogador."
  },

  codelab_background: {
    title: "Mudar cenário",
    text: "Altera a cor do fundo da cena. Você pode utilizar cores como skyblue, lightgreen, orange ou códigos como #FFCC88."
  },

  controls_repeat_ext: {
    title: "Repetir uma quantidade de vezes",
    text: "Executa os blocos que estão dentro deste espaço várias vezes. É útil para criar movimentos repetidos e evitar copiar o mesmo comando."
  },

  controls_if: {
    title: "Se uma condição for verdadeira",
    text: "Executa comandos somente quando uma condição é atendida. Isso permite criar decisões dentro dos seus jogos."
  },

  logic_compare: {
    title: "Comparar valores",
    text: "Compara dois valores para descobrir se são iguais, diferentes, maiores ou menores."
  },

  math_number: {
    title: "Número",
    text: "Fornece um valor numérico para outros blocos utilizarem em cálculos, movimento e condições."
  },

  math_arithmetic: {
    title: "Operações matemáticas",
    text: "Realiza adição, subtração, multiplicação e divisão. Esses cálculos podem controlar pontuação, velocidade e distância."
  }
};

function showExplanation(block) {
  if (!block) return;

  const info = explanations[block.type];

  if (info) {
    explanationTitle.textContent = info.title;
    explanationText.textContent = info.text;
  } else {
    explanationTitle.textContent = block.type.replaceAll("_", " ");
    explanationText.textContent =
      "Este bloco faz parte da programação do seu projeto. Experimente conectá-lo a outros blocos e executar o programa para entender seu funcionamento.";
  }
}

/* =====================================================
   3. CRIAÇÃO DOS BLOCOS PERSONALIZADOS
===================================================== */

Blockly.defineBlocksWithJsonArray([
  {
    "type": "codelab_start",
    "message0": "quando iniciar o programa",
    "nextStatement": null,
    "style": "event_blocks",
    "tooltip": "Inicia uma sequência de comandos.",
    "helpUrl": ""
  },
  {
    "type": "codelab_move",
    "message0": "mover personagem %1 passos",
    "args0": [
      {
        "type": "field_number",
        "name": "STEPS",
        "value": 50,
        "min": -500,
        "max": 500
      }
    ],
    "previousStatement": null,
    "nextStatement": null,
    "style": "motion_blocks",
    "tooltip": "Movimenta o personagem.",
    "helpUrl": ""
  },
  {
    "type": "codelab_turn",
    "message0": "girar personagem %1 graus",
    "args0": [
      {
        "type": "field_number",
        "name": "DEGREES",
        "value": 90,
        "min": -360,
        "max": 360
      }
    ],
    "previousStatement": null,
    "nextStatement": null,
    "style": "motion_blocks",
    "tooltip": "Gira o personagem.",
    "helpUrl": ""
  },
  {
    "type": "codelab_say",
    "message0": "dizer %1",
    "args0": [
      {
        "type": "field_input",
        "name": "MESSAGE",
        "text": "Olá, mundo!"
      }
    ],
    "previousStatement": null,
    "nextStatement": null,
    "style": "looks_blocks",
    "tooltip": "Exibe uma mensagem.",
    "helpUrl": ""
  },
  {
    "type": "codelab_background",
    "message0": "mudar fundo para %1",
    "args0": [
      {
        "type": "field_input",
        "name": "COLOR",
        "text": "#B9E5FF"
      }
    ],
    "previousStatement": null,
    "nextStatement": null,
    "style": "looks_blocks",
    "tooltip": "Altera o fundo do cenário.",
    "helpUrl": ""
  }
]);

/* =====================================================
   4. GERADOR DE JAVASCRIPT
===================================================== */

const JS = Blockly.JavaScript;

JS.forBlock["codelab_start"] = function () {
  return "// Início do programa\n";
};

JS.forBlock["codelab_move"] = function (block) {
  const steps = Number(block.getFieldValue("STEPS")) || 0;
  return `api.move(${steps});\n`;
};

JS.forBlock["codelab_turn"] = function (block) {
  const degrees = Number(block.getFieldValue("DEGREES")) || 0;
  return `api.turn(${degrees});\n`;
};

JS.forBlock["codelab_say"] = function (block) {
  const message = JSON.stringify(block.getFieldValue("MESSAGE"));
  return `api.say(${message});\n`;
};

JS.forBlock["codelab_background"] = function (block) {
  const color = JSON.stringify(block.getFieldValue("COLOR"));
  return `api.background(${color});\n`;
};

/* =====================================================
   5. MOTOR DE EXECUÇÃO
===================================================== */

const api = {
  move: (steps) => {
    if (currentMode === "2d") {
      movePlayer(steps);
    } else if (threeEngine) {
      threeEngine.move(steps);
    }
  },

  turn: (degrees) => {
    if (currentMode === "2d") {
      turnPlayer(degrees);
    } else if (threeEngine) {
      threeEngine.turn(degrees);
    }
  },

  say: (message) => {
    if (currentMode === "2d") {
      sayMessage(message);
    } else if (threeEngine) {
      threeEngine.say(message);
    }

    addConsole("Personagem: " + message);
  },

  background: (color) => {
    if (currentMode === "2d") {
      changeBackground(color);
    } else if (threeEngine) {
      threeEngine.background(color);
    }

    addConsole("Cenário alterado: " + color);
  }
};

function addConsole(message, type = "normal") {
  const line = document.createElement("p");

  line.textContent = "> " + message;

  if (type === "error") line.className = "console-error";
  if (type === "success") line.className = "console-success";

  consoleOutput.appendChild(line);
  consoleOutput.scrollTop = consoleOutput.scrollHeight;
}

function clearConsole() {
  consoleOutput.innerHTML = "";
}

function runProgram() {
  if (!workspace) return;

  stopProgram();
  clearConsole();

  const code = JS.workspaceToCode(workspace);

  if (!code.trim()) {
    addConsole("Adicione alguns blocos antes de executar.");
    executionStatus.textContent = "Nenhum comando encontrado";
    return;
  }

  try {
    running = true;

    addConsole("Executando programa...");
    executionStatus.textContent = "Programa executado";

    // O código gerado utiliza somente a API disponibilizada.
    const execute = new Function("api", `"use strict";\n${code}`);
    execute(api);

    addConsole("Programa concluído!", "success");

  } catch (error) {
    console.error(error);
    addConsole(error.message, "error");
    executionStatus.textContent = "Erro na execução";
  } finally {
    running = false;
  }
}

function stopProgram() {
  running = false;
  executionStatus.textContent = "Programa interrompido";
}

/* =====================================================
   6. MOTOR 3D - THREE.JS
===================================================== */

async function initialize3D() {
  if (threeEngine) return threeEngine;

  const container = $("threeContainer");

  try {
    const THREE = await import(
      "https://cdn.jsdelivr.net/npm/three@0.180.0/build/three.module.js"
    );

    const scene = new THREE.Scene();
    scene.background = new THREE.Color("#B9D9F4");

    const camera = new THREE.PerspectiveCamera(
      60,
      container.clientWidth / container.clientHeight,
      0.1,
      1000
    );

    camera.position.set(5, 5, 8);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({
      antialias: true
    });

    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(container.clientWidth, container.clientHeight);

    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    container.innerHTML = "";
    container.appendChild(renderer.domElement);

    // Luz ambiente
    const ambient = new THREE.HemisphereLight(
      0xffffff,
      0x526078,
      2
    );

    scene.add(ambient);

    // Luz principal
    const sunlight = new THREE.DirectionalLight(0xffffff, 2.5);

    sunlight.position.set(5, 10, 5);
    sunlight.castShadow = true;

    scene.add(sunlight);

    // Terreno
    const groundGeometry = new THREE.PlaneGeometry(100, 100);

    const groundMaterial = new THREE.MeshStandardMaterial({
      color: "#76B77A",
      roughness: 1
    });

    const ground = new THREE.Mesh(groundGeometry, groundMaterial);

    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;

    scene.add(ground);

    // Personagem provisório
    const character = new THREE.Group();

    const body = new THREE.Mesh(
      new THREE.BoxGeometry(0.8, 1.2, 0.5),
      new THREE.MeshStandardMaterial({ color: "#397FEA" })
    );

    body.position.y = 1;
    body.castShadow = true;

    const head = new THREE.Mesh(
      new THREE.SphereGeometry(0.32, 24, 24),
      new THREE.MeshStandardMaterial({ color: "#F1C49B" })
    );

    head.position.y = 1.85;
    head.castShadow = true;

    character.add(body, head);
    character.position.y = 0;

    scene.add(character);

    function resize() {
      const width = container.clientWidth;
      const height = container.clientHeight;

      if (!width || !height) return;

      camera.aspect = width / height;
      camera.updateProjectionMatrix();

      renderer.setSize(width, height);
    }

    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(container);

    function animate() {
      requestAnimationFrame(animate);
      renderer.render(scene, camera);
    }

    animate();

    threeEngine = {
      scene,
      camera,
      renderer,
      character,

      move(steps) {
        const distance = Number(steps) / 50;

        character.position.x += Math.sin(character.rotation.y) * distance;
        character.position.z += Math.cos(character.rotation.y) * distance;
      },

      turn(degrees) {
        character.rotation.y -= Number(degrees) * Math.PI / 180;
      },

      say(message) {
        addConsole("Personagem: " + message);
      },

      background(color) {
        try {
          scene.background = new THREE.Color(color);
        } catch {
          addConsole("Cor inválida: " + color, "error");
        }
      }
    };

    return threeEngine;

  } catch (error) {
    console.error(error);
    addConsole("Não foi possível carregar o motor 3D: " + error.message, "error");
    throw error;
  }
}

/* =====================================================
   7. ALTERNÂNCIA ENTRE 2D E 3D
===================================================== */

async function setMode(mode) {
  currentMode = mode;

  const is3D = mode === "3d";

  $("gameCanvas").hidden = is3D;
  $("threeContainer").hidden = !is3D;

  $("previewLabel").textContent = is3D ? "MODO 3D" : "MODO 2D";

  document.querySelectorAll(".view-button").forEach(button => {
    button.classList.toggle(
      "active",
      button.dataset.mode === mode
    );
  });

  document.querySelectorAll(".side-item[data-mode]").forEach(button => {
    button.classList.toggle(
      "selected",
      button.dataset.mode === mode
    );
  });

  if (is3D) {
    try {
      await initialize3D();
    } catch {
      return;
    }
  }

  drawScene();

  addConsole("Modo " + mode.toUpperCase() + " selecionado.");
}

/* =====================================================
   8. SALVAR E CARREGAR PROJETOS
===================================================== */

const STORAGE_KEY = "codelab_studio_project_v1";

function saveProject() {
  try {
    const xml = Blockly.Xml.workspaceToDom(workspace);
    const xmlText = Blockly.Xml.domToText(xml);

    const project = {
      title: $("projectTitle").textContent,
      mode: currentMode,
      workspace: xmlText
    };

    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(project)
    );

    saveStatus.textContent = "Salvo no navegador";
    addConsole("Projeto salvo com sucesso!", "success");

  } catch (error) {
    addConsole("Erro ao salvar: " + error.message, "error");
  }
}

function loadProject() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);

    if (!saved) return;

    const project = JSON.parse(saved);

    if (project.title) {
      $("projectTitle").textContent = project.title;
    }

    if (project.workspace) {
      const xml = Blockly.utils.xml.textToDom(project.workspace);
      Blockly.Xml.domToWorkspace(xml, workspace);
    }

    if (project.mode) {
      setMode(project.mode);
    }

    saveStatus.textContent = "Projeto recuperado";

  } catch (error) {
    console.error("Não foi possível recuperar o projeto:", error);
  }
}

/* =====================================================
   9. INICIALIZAÇÃO DO BLOCKLY
===================================================== */

function initializeBlockly() {
  const theme = Blockly.Theme.defineTheme("codelabTheme", {
    base: Blockly.Themes.Classic,

    blockStyles: {
      event_blocks: {
        colourPrimary: "#397FEA",
        colourSecondary: "#2866BE",
        colourTertiary: "#1C4D96"
      },

      motion_blocks: {
        colourPrimary: "#159B83",
        colourSecondary: "#107E6B",
        colourTertiary: "#0C6557"
      },

      looks_blocks: {
        colourPrimary: "#A36BDD",
        colourSecondary: "#8954C2",
        colourTertiary: "#7040A4"
      }
    },

    categoryStyles: {
      event_category: { colour: "#397FEA" },
      motion_category: { colour: "#159B83" },
      looks_category: { colour: "#A36BDD" },
      logic_category: { colour: "#5B9BD5" },
      loop_category: { colour: "#D69B36" },
      math_category: { colour: "#4C9B67" },
      text_category: { colour: "#B16C9E" },
      variable_category: { colour: "#D66A53" }
    },

    componentStyles: {
      workspaceBackgroundColour: "#101B2D",
      toolboxBackgroundColour: "#15243A",
      toolboxForegroundColour: "#FFFFFF",
      flyoutBackgroundColour: "#1A2B43",
      flyoutForegroundColour: "#FFFFFF",
      flyoutOpacity: 1,
      scrollbarColour: "#526783",
      insertionMarkerColour: "#FFFFFF",
      insertionMarkerOpacity: 0.3,
      cursorColour: "#FFFFFF",
      blackBackground: "#000000"
    }
  });

  workspace = Blockly.inject("blocklyDiv", {
    toolbox: $("toolbox"),
    theme,
    renderer: "zelos",

    trashcan: true,
    sounds: false,

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
      colour: "#263A56",
      snap: true
    }
  });

  workspace.addChangeListener((event) => {
    if (event.type === Blockly.Events.SELECTED) {
      const block = workspace.getBlockById(event.newElementId);
      showExplanation(block);
    }

    if (
      event.type === Blockly.Events.BLOCK_CHANGE ||
      event.type === Blockly.Events.BLOCK_CREATE ||
      event.type === Blockly.Events.BLOCK_DELETE ||
      event.type === Blockly.Events.BLOCK_MOVE
    ) {
      saveStatus.textContent = "Alterações não salvas";
    }
  });

  Blockly.svgResize(workspace);
}

/* =====================================================
   10. BOTÕES E INTERAÇÕES
===================================================== */

$("runButton").addEventListener("click", runProgram);

$("stopButton").addEventListener("click", stopProgram);

$("saveButton").addEventListener("click", saveProject);

$("resetButton").addEventListener("click", () => {
  if (!confirm("Deseja apagar todos os blocos deste projeto?")) return;

  workspace.clear();
  player.x = 400;
  player.y = 270;
  player.direction = 0;
  player.message = "";
  backgroundColor = "#DCE9F4";

  drawScene();

  if (threeEngine) {
    threeEngine.character.position.set(0, 0, 0);
    threeEngine.character.rotation.set(0, 0, 0);
  }

  clearConsole();
  addConsole("Projeto limpo. Comece uma nova criação.");
});

document.querySelectorAll(".view-button, .side-item[data-mode]").forEach(button => {
  button.addEventListener("click", () => {
    setMode(button.dataset.mode);
  });
});

$("projectTitle").addEventListener("click", () => {
  const title = prompt(
    "Digite o nome do seu projeto:",
    $("projectTitle").textContent
  );

  if (title && title.trim()) {
    $("projectTitle").textContent = title.trim();
    saveStatus.textContent = "Nome alterado";
  }
});

document.querySelectorAll("[data-page]").forEach(button => {
  button.addEventListener("click", () => {
    const page = button.dataset.page;

    document.querySelectorAll(".nav-button").forEach(nav => {
      nav.classList.toggle("active", nav.dataset.page === page);
    });

    if (page === "learn") {
      explanationTitle.textContent = "Biblioteca de aprendizado";
      explanationText.textContent =
        "Aqui vamos construir cursos, explicações, exemplos práticos e desafios de programação.";
    } else if (page === "projects") {
      explanationTitle.textContent = "Meus projetos";
      explanationText.textContent =
        "Seus projetos podem ser salvos no navegador. Futuramente teremos uma galeria online com compartilhamento.";
    } else {
      explanationTitle.textContent = "Editor de programação";
      explanationText.textContent =
        "Arraste os blocos para criar seu programa e clique em executar para experimentar.";
    }
  });
});

window.addEventListener("resize", () => {
  if (workspace) {
    Blockly.svgResize(workspace);
  }
});

/* =====================================================
   11. INICIAR A PLATAFORMA
===================================================== */

function startCodeLab() {
  try {
    initializeBlockly();
    drawScene();
    loadProject();

    addConsole("CODELAB STUDIO iniciado!", "success");
    addConsole("Editor de blocos carregado.");
    addConsole("Motor 2D disponível.");
    addConsole("Motor 3D pronto para inicialização.");

  } catch (error) {
    console.error(error);
    addConsole("Erro ao iniciar: " + error.message, "error");
  }
}

startCodeLab();
