const overlay = document.querySelector(".overlay");
const canvas = document.querySelector("canvas");

const mainMenu = document.getElementById("mainMenu");
const controlsScreen = document.getElementById("controlsScreen");
const gameOverScreen = document.getElementById("gameOverScreen");
const restartButton = document.getElementById("restartButton");
const loadingScreen = document.getElementById("loadingScreen");
const levelNumber = document.getElementById("levelNumber");
const loadingBar = document.getElementById("loadingBar");
const loadingTip = document.getElementById("loadingTip");

const loadingTips = [
  "Dica: Inimigos diferentes têm padrões de ataque diferentes. Observe e aprenda!",
  "Dica: Use a defesa (S) para bloquear ataques e evitar dano.",
  "Dica: Fique de olho na sua barra de vida e use poções (E) quando necessário.",
  "Dica: Correr (toque duplo em A ou D) pode ser útil para se reposicionar rapidamente.",
  "Dica: Alguns estágios contêm segredos. Explore!",
];

function startGame() {

    if (overlay) {
    overlay.style.display = "none";
  }

  document.body.style.backgroundImage = "none";
  document.body.style.backgroundColor = "#000";
  mainMenu.style.display = "none";
  controlsScreen.style.display = "none";
  gameOverScreen.style.display = "none";
  loadingScreen.style.display = "none";

  canvas.classList.remove("hidden");
  canvas.style.display = "block";
  window.jogoIniciado = true; 
}

function showLoadingScreen(level, onComplete) {
  levelNumber.textContent = level;
  loadingTip.textContent =
    loadingTips[Math.floor(Math.random() * loadingTips.length)];
  loadingScreen.style.display = "flex";
  canvas.classList.add("hidden"); 
  canvas.style.display = "none";

  let progress = 0;
  const interval = setInterval(() => {
    progress += Math.random() * 20; 
    loadingBar.style.width = `${Math.min(progress, 100)}%`;

    if (progress >= 100) {
      clearInterval(interval);
      setTimeout(() => {
        loadingScreen.style.display = "none";
        if (onComplete) {
          onComplete(); 
        }
      }, 500);
    }
  }, 150);
}

function showGameOverScreen() {
  canvas.classList.add("hidden");
  canvas.style.display = "none";
  gameOverScreen.style.display = "flex"; 
}


function restartGame() {
  window.location.reload();
}

document.addEventListener("keydown", function (event) {
  if (event.key === "Enter") {
    // Se o menu principal estiver visível (primeira vez apertando Enter)
    if (getComputedStyle(mainMenu).display !== "none") {
      mainMenu.style.display = "none";
      controlsScreen.style.display = "block";
      
      // Chama a função para iniciar a música
      if (window.startMenuMusic) {
          window.startMenuMusic();
      }

    } else if (getComputedStyle(controlsScreen).display === "block") {
      showLoadingScreen(1, startGame); 
    }
  }
});

restartButton.addEventListener("click", restartGame);

function createLeaves() {
  const colors = ["#e63946", "#a8dadc", "#f1faee", "#457b9d"];
  for (let i = 0; i < 20; i++) {
    const leaf = document.createElement("div");
    leaf.className = "leaf";

    leaf.innerHTML = "❀";
    leaf.style.color = colors[Math.floor(Math.random() * colors.length)];
    leaf.style.fontSize = Math.random() * 20 + 10 + "px";
    leaf.style.left = Math.random() * 100 + "vw";
    leaf.style.top = -50 + "px";

    const animationDuration = Math.random() * 10 + 5;
    leaf.style.animation = `fall ${animationDuration}s linear infinite`;

    document.body.appendChild(leaf);

    const keyframes = `
                    @keyframes fall {
                        to {
                            transform: translateY(100vh) rotate(360deg);
                            left: ${Math.random() * 100}vw;
                        }
                    }
                `;

    const style = document.createElement("style");
    style.innerHTML = keyframes;
    document.head.appendChild(style);
  }
}

createLeaves();
