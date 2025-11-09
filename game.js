/* =====================================
   Flappy Feather - Dual Mode Game
   Mode A: Calm / Healing
   Mode B: Arcade / Energetic
   Optimized for Mobile + Desktop
   ===================================== */

// ---------- Canvas Setup ----------
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const particlesCanvas = document.getElementById("particlesCanvas");
const pctx = particlesCanvas.getContext("2d");

// make canvas explicitly interactive & prevent touch-default behavior
canvas.setAttribute("tabindex", "0");
canvas.style.outline = "none";
canvas.style.touchAction = "none";
canvas.style.userSelect = "none";
canvas.style.webkitUserSelect = "none";
canvas.style.msUserSelect = "none";
canvas.style.webkitTapHighlightColor = "transparent";

// ---------- Game State ----------
let mode = null; // "A" or "B"
let started = false;
let gameOver = false;
let frame = 0;
let score = 0;
let highScore = parseInt(localStorage.getItem("highScore")) || 0;

let bird = {
  x: 0,
  y: 0,
  width: 34,
  height: 24,
  vel: 0,
  gravity: 0.25,
  jumpPower: -5,
  flap: 0,
  trail: []
};

let obstacles = [];
const clouds = [];
const particles = [];

// ---------- DOM Elements ----------
const modeSelector = document.getElementById("modeSelector");
const instructions = document.getElementById("instructions");
const scoreDisplay = document.getElementById("score");
const highScoreDisplay = document.getElementById("highScore");
const gameOverPopup = document.getElementById("gameOver");
const finalScoreDisplay = document.getElementById("finalScore");
const restartBtn = document.getElementById("restartBtn");

// ---------- Mode Selector ----------
document.getElementById("modeA").addEventListener("click", () => startGame("A"));
document.getElementById("modeB").addEventListener("click", () => startGame("B"));

// ---------- Responsive Canvas ----------
function resizeCanvas() {
  // set pixel dimensions for crisp rendering
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  particlesCanvas.width = canvas.width;
  particlesCanvas.height = canvas.height;

  // reposition bird before start
  if (!started) {
    bird.x = canvas.width * 0.15;
    bird.y = canvas.height / 2;
  }
}
window.addEventListener("resize", resizeCanvas);
window.addEventListener("orientationchange", resizeCanvas);
resizeCanvas();

// ---------- Game Start ----------
function startGame(selectedMode) {
  mode = selectedMode;
  modeSelector.style.display = "none";
  instructions.classList.remove("hidden");
  setupMode();
  // ensure score UI correct on start
  score = 0;
  scoreDisplay.innerText = "Score: " + score;
  highScoreDisplay.innerText = "Best: " + highScore;
  // start the loop
  loop();
}

// ---------- Setup Mode ----------
function setupMode() {
  clouds.length = 0;
  const cloudCount = mode === "A" ? 7 : 10;
  for (let i = 0; i < cloudCount; i++) {
    clouds.push({
      x: Math.random() * canvas.width,
      y: Math.random() * (canvas.height / 2),
      size: Math.random() * 35 + 25,
      speed: mode === "A" ? Math.random() * 0.3 + 0.1 : Math.random() * 0.6 + 0.3,
      opacity: mode === "A" ? 0.8 : 0.9
    });
  }
}

// ---------- Controls ----------
function jump() {
  if (!started) {
    started = true;
    instructions.classList.add("hidden");
  }
  if (!gameOver) {
    bird.vel = bird.jumpPower;
    bird.flap = 5;
    addTrail();
  }
}

// robust input handling to support mobile reliably and avoid duplicate events
let ignoreMouseFor = 350; // ms to ignore mouse after touch
let lastTouchTime = 0;

// keyboard - Space to jump
document.addEventListener("keydown", e => {
  if (e.code === "Space") {
    e.preventDefault();
    jump();
  }
});

// prefer Pointer Events if available (covers touch & mouse), otherwise fallback to touch/click
if (window.PointerEvent) {
  canvas.addEventListener("pointerdown", e => {
    // treat pen/mouse/finger same
    // only simple press => jump
    e.preventDefault();
    jump();
  }, { passive: false });
} else {
  // touchstart
  canvas.addEventListener("touchstart", e => {
    lastTouchTime = Date.now();
    e.preventDefault();
    jump();
  }, { passive: false });

  // click/mousedown - ignore synthetic mouse events coming after touch
  canvas.addEventListener("mousedown", e => {
    if (Date.now() - lastTouchTime < ignoreMouseFor) return;
    e.preventDefault();
    jump();
  }, { passive: false });
  canvas.addEventListener("click", e => {
    if (Date.now() - lastTouchTime < ignoreMouseFor) return;
    e.preventDefault();
    jump();
  }, { passive: false });
}

// keep click on document as fallback (useful for desktop if canvas missed focus)
document.addEventListener("click", e => {
  // if click target is an interactive UI (buttons, etc.) ignore
  const tag = e.target && e.target.tagName && e.target.tagName.toLowerCase();
  if (tag === "button" || tag === "a" || tag === "input") return;
  // ignore if recent touch
  if (Date.now() - lastTouchTime < ignoreMouseFor) return;
  // if click came not from canvas, still allow space of entire screen to act as jump
  if (!gameOver && started) {
    e.preventDefault();
    jump();
  }
}, { passive: false });

// ---------- Spawn Obstacles ----------
function spawnObstacle() {
  const typeRoll = Math.random();
  const x = canvas.width;

  if (typeRoll < 0.6) {
    const gap = canvas.height * (0.22 + Math.random() * 0.05);
    const topHeight = Math.random() * (canvas.height - gap - canvas.height * 0.13);
    const width = canvas.width * 0.08;
    obstacles.push({ type: "pipe", x, topHeight, bottomY: topHeight + gap, width, passed: false });
  } else if (typeRoll < 0.85) {
    const width = 30, height = 50;
    obstacles.push({ type: "spike", x, y: canvas.height - height - canvas.height * 0.13, width, height });
  } else {
    const size = 30;
    const y = Math.random() * (canvas.height * 0.6) + 50;
    obstacles.push({ type: "floating", x, y, width: size, height: size });
  }
}

// ---------- Particles ----------
function addParticles(x, y, count = 6, color = null) {
  for (let i = 0; i < count; i++) {
    particles.push({
      x,
      y,
      vx: (Math.random() - 0.5) * 3,
      vy: (Math.random() - 1.5) * 3,
      life: 25 + Math.random() * 15,
      size: 2 + Math.random() * 3,
      color: color || (mode === "A" ? "#FFD700" : "#0ff")
    });
  }
}

function drawParticles() {
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.x += p.vx;
    p.y += p.vy;
    p.life--;
    pctx.globalAlpha = Math.max(0, p.life / 40);
    pctx.fillStyle = p.color;
    pctx.beginPath();
    pctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    pctx.fill();
    if (p.life <= 0) particles.splice(i, 1);
  }
  pctx.globalAlpha = 1;
}

// ---------- Bird Trail ----------
function addTrail() {
  if (mode !== "B") return;
  bird.trail.push({ x: bird.x + bird.width / 2, y: bird.y + bird.height / 2, alpha: 0.6, life: 18 });
  if (bird.trail.length > 20) bird.trail.shift();
}

function drawTrail() {
  if (mode !== "B") return;
  bird.trail.forEach(t => {
    ctx.save();
    ctx.globalAlpha = t.alpha;
    ctx.fillStyle = "#0ff";
    ctx.beginPath();
    ctx.arc(t.x, t.y, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    t.alpha *= 0.92;
    t.life--;
  });
  bird.trail = bird.trail.filter(t => t.life > 0);
}

// ---------- Drawing ----------
function drawBackground() {
  const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
  grad.addColorStop(0, mode === "A" ? "#87ceeb" : "#0b0033");
  grad.addColorStop(1, mode === "A" ? "#f0f8ff" : "#330066");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
}

function drawSunMoon() {
  const sunMoonY = canvas.height * 0.15 + Math.sin(frame * 0.01) * (mode === "A" ? 20 : 15);
  const radius = canvas.height * (mode === "A" ? 0.07 : 0.05);
  const x = canvas.width - canvas.width * 0.2;

  ctx.save();
  if (mode === "A") {
    ctx.fillStyle = "#FFD700";
    ctx.shadowColor = "#FFD700";
    ctx.shadowBlur = 20;
    ctx.beginPath();
    ctx.arc(x, sunMoonY, radius, 0, Math.PI * 2);
    ctx.fill();
  } else {
    ctx.fillStyle = "#eee";
    ctx.shadowColor = "#eee";
    ctx.shadowBlur = 12;
    ctx.beginPath();
    ctx.arc(x, sunMoonY, radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#330066";
    ctx.beginPath();
    ctx.arc(x + radius * 0.5, sunMoonY, radius, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();

  // Stars
  if (mode === "B" || (mode === "A" && frame % 2 === 0)) {
    const starCount = /Mobi|Android/i.test(navigator.userAgent) ? 10 : 30;
    for (let i = 0; i < starCount; i++) {
      ctx.globalAlpha = Math.random();
      ctx.fillStyle = "#fff";
      ctx.beginPath();
      ctx.arc(Math.random() * canvas.width, Math.random() * canvas.height * 0.5, Math.random() * 2 + 1, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }
}

function drawClouds() {
  clouds.forEach(c => {
    ctx.save();
    ctx.globalAlpha = c.opacity;
    ctx.fillStyle = "#fff";
    ctx.beginPath();
    ctx.ellipse(c.x, c.y, c.size, c.size * 0.5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    c.x -= c.speed;
    if (c.x < -100) c.x = canvas.width + 120;
  });
}

function drawBird() {
  ctx.save();
  ctx.translate(bird.x + bird.width / 2, bird.y + bird.height / 2);

  if (mode === "A") {
    ctx.rotate(Math.sin(frame * 0.12) * 0.12 - bird.vel * 0.02);
    ctx.fillStyle = "#FFD700";
    ctx.beginPath();
    ctx.moveTo(0, -12);
    ctx.lineTo(-15 - bird.flap, 0);
    ctx.lineTo(0, 12);
    ctx.lineTo(15 + bird.flap, 0);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = "#8B4513";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, -12);
    ctx.lineTo(0, 12);
    ctx.stroke();
  } else {
    ctx.rotate(Math.sin(frame * 0.2) * 0.12 - bird.vel * 0.03);
    ctx.fillStyle = "#0ff";
    ctx.shadowColor = "#0ff";
    ctx.shadowBlur = 20;
    ctx.beginPath();
    ctx.ellipse(0, 0, 18, 12, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "rgba(0,255,255,0.4)";
    ctx.beginPath();
    ctx.ellipse(0, 0, 12, 8, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
  if (bird.flap > 0) bird.flap -= 0.3;
}

function drawObstacles() {
  obstacles.forEach(obs => {
    ctx.save();
    if (mode === "A") ctx.fillStyle = obs.color || "green";
    else {
      const grad = ctx.createLinearGradient(obs.x, 0, obs.x + (obs.width || 20), 0);
      grad.addColorStop(0, obs.color1 || "#0ff");
      grad.addColorStop(1, obs.color2 || "#0f0");
      ctx.fillStyle = grad;
    }

    switch (obs.type) {
      case "pipe":
        ctx.fillRect(obs.x, 0, obs.width, obs.topHeight);
        ctx.fillRect(obs.x, obs.bottomY, obs.width, canvas.height - obs.bottomY);
        break;
      case "spike":
        ctx.beginPath();
        ctx.moveTo(obs.x, obs.y + obs.height);
        ctx.lineTo(obs.x + obs.width / 2, obs.y);
        ctx.lineTo(obs.x + obs.width, obs.y + obs.height);
        ctx.closePath();
        ctx.fill();
        break;
      case "floating":
        ctx.beginPath();
        ctx.arc(obs.x + obs.width / 2, obs.y + obs.height / 2, obs.width / 2, 0, Math.PI * 2);
        ctx.fill();
        break;
    }

    ctx.restore();
  });
}

function drawGround() {
  ctx.fillStyle = mode === "A" ? "#8B4513" : "#3300aa";
  ctx.fillRect(0, canvas.height - canvas.height * 0.13, canvas.width, canvas.height * 0.13);
}

// ---------- Flash ----------
function flashScreen() {
  if (mode === "B") {
    ctx.fillStyle = "rgba(255,255,255,0.25)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }
}

// ---------- Game Loop ----------
function loop() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  pctx.clearRect(0, 0, canvas.width, canvas.height);

  drawBackground();
  drawSunMoon();
  drawClouds();

  if (started && !gameOver) {
    bird.vel += bird.gravity;
    bird.y += bird.vel;
    frame++;

    const spawnInterval = Math.max(20, Math.floor(90 - canvas.width / 150));
    if (frame % spawnInterval === 0) spawnObstacle();
    if (mode === "B") addTrail();
  }

  const speed = Math.max(3, canvas.width / 400);
  updateObstacles(speed);

  drawObstacles();
  drawGround();
  drawTrail();
  drawBird();
  drawParticles();

  if (!gameOver && (bird.y + bird.height > canvas.height - canvas.height * 0.13 || bird.y < 0)) {
    addParticles(bird.x + bird.width / 2, bird.y + bird.height / 2, 30);
    flashScreen();
    endGame();
  }

  if (!gameOver) requestAnimationFrame(loop);
}

function updateObstacles(speed) {
  obstacles.forEach(obs => {
    obs.x -= speed;
    let collided = false;
    const bx = bird.x + bird.width / 2;
    const by = bird.y + bird.height / 2;

    if (obs.type === "pipe") {
      if (bird.x + bird.width > obs.x && bird.x < obs.x + obs.width &&
        (bird.y < obs.topHeight || bird.y + bird.height > obs.bottomY)) collided = true;

      if (!obs.passed && obs.x + obs.width < bird.x) {
        obs.passed = true;
        score++;
        addParticles(bx, by, 15);
        scoreDisplay.innerText = "Score: " + score;
        if (score > highScore) {
          highScore = score;
          localStorage.setItem("highScore", highScore);
          highScoreDisplay.innerText = "Best: " + highScore;
        }
      }
    } else if (obs.type === "spike") {
      if (bx > obs.x && bx < obs.x + obs.width && by + bird.height / 2 > obs.y) collided = true;
    } else if (obs.type === "floating") {
      const dx = bx - (obs.x + obs.width / 2);
      const dy = by - (obs.y + obs.height / 2);
      if (Math.sqrt(dx * dx + dy * dy) < obs.width / 2 + bird.width / 2) collided = true;
    }

    if (collided) {
      addParticles(bx, by, 25);
      flashScreen();
      endGame();
    }
  });

  obstacles = obstacles.filter(obs => obs.x + (obs.width || 20) > -20);
}

// ---------- Game Over ----------
function endGame() {
  if (gameOver) return;
  gameOver = true;
  finalScoreDisplay.innerText = "Your Score: " + score;
  gameOverPopup.classList.add("show");
}

// ---------- Restart ----------
restartBtn.addEventListener("click", () => {
  Object.assign(bird, { y: canvas.height / 2, vel: 0, flap: 0 });
  obstacles = [];
  particles.length = 0;
  bird.trail = [];
  frame = 0;
  score = 0;
  gameOver = false;
  started = false;

  instructions.classList.remove("hidden");
  gameOverPopup.classList.remove("show");

  setupMode();
  loop();
});

// ---------- Initialize ----------
highScoreDisplay.innerText = "Best: " + highScore;
modeSelector.style.display = "block";
instructions.classList.add("hidden");
