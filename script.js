const dogVariants = ['dog.png', 'pitbull.png', 'demon.png'];
const placeholderDogSrc = 'placeholder.png';
const aggressiveDogSrc = 'aggresssive dog.webp';
let sound = new Audio('howl.mp3');
let sound2 = new Audio('baddog.wav');
let sound3 = new Audio('puppy.wav');
let roarSound = new Audio('roar.wav');
const dog = document.getElementById('dog');
const arm = document.getElementById('whip-arm');
const petHand = document.getElementById('pet-hand');
const flash = document.getElementById('flash');
const petFlash = document.getElementById('pet-flash');
const heartLayer = document.getElementById('heart-layer');
const angerLayer = document.getElementById('anger-layer');
const poopLayer = document.getElementById('poop-layer');
const whipMeter = document.getElementById('whip-meter');
const petMeter = document.getElementById('pet-meter');
const hpFill = document.getElementById('hp-fill');
const countdown = document.getElementById('countdown');
const instructionBox = document.getElementById('instruction-box');
const selectionStatus = document.getElementById('selection-status');
const selectionResult = document.getElementById('selection-result');
const goalText = document.getElementById('goal-text');
const hint = document.getElementById('hint');
const deathScreen = document.getElementById('death-screen');
let normalDogSrc = dogVariants[0];
dog.src = placeholderDogSrc;
let whipLevel = 50;
let petLevel = 50;
let hpLevel = 100;
let isLunging = false;
let isDead = false;
let isSelectingDog = false;
let dogSelected = false;
let canRestart = false;
let decayStarted = false;
let gameStarted = false;
let countdownActive = false;
let deathReloadTimer = null;
let deathClickEnableTimer = null;
let countdownTimer = null;
let decayInterval = null;
let lastZeroDisciplinePoopAt = 0;
let lastZeroHappinessLungeAt = 0;
const maxMeter = 100;
const whipStep = 18;
const petStep = 18;
let lungeDamage = 25;
let decayPerTick = 2;
let poisonDamagePerPoop = 0.25;
const poisonTickMs = 400;
const decayCountdownSeconds = 3;
const zeroDisciplinePoopCooldownMs = 900;
const zeroHappinessLungeCooldownMs = 1200;
const poopClicksToClean = 3;
const dogScrollIntervalMs = 120;
const dogScrollSteps = 9;

function formatDogName(src) {
  return src
    .replace(/\.[^.]+$/, '')
    .replace(/[-_]+/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function playDogShake() {
  dog.classList.remove('shake');
  void dog.offsetWidth;
  dog.classList.add('shake');
}

function startDogSelectionScroll() {
  if (isSelectingDog || dogSelected) return;

  isSelectingDog = true;
  let currentIndex = 0;
  let stepsRemaining = dogScrollSteps;

  countdown.textContent = 'Selecting dog';
  dog.src = dogVariants[currentIndex];
  selectionStatus.classList.remove('hidden');
  playDogShake();

  const scrollTimer = window.setInterval(() => {
    currentIndex = (currentIndex + 1) % dogVariants.length;
    dog.src = dogVariants[currentIndex];
    playDogShake();
    stepsRemaining -= 1;

    if (stepsRemaining > 0) return;

    window.clearInterval(scrollTimer);
    normalDogSrc = dogVariants[Math.floor(Math.random() * dogVariants.length)];
    dog.src = normalDogSrc;
    isSelectingDog = false;
    dogSelected = true;
    countdown.textContent = 'Click to start';
    selectionStatus.classList.add('hidden');
    selectionResult.textContent = `You got ${formatDogName(normalDogSrc)}`;
    selectionResult.classList.remove('hidden');
    if(normalDogSrc == 'dog.png'){
      norm.classList.remove('hidden')
    }
    if(normalDogSrc == 'pitbull.png'){
      med.classList.remove('hidden')
      decayPerTick = 3;
      lungeDamage = 34;
      poisonDamagePerPoop = 0.5;
    }
    if(normalDogSrc == 'demon.png'){
      hard.classList.remove('hidden')
      decayPerTick = 5;
      lungeDamage = 50;
      poisonDamagePerPoop = 1;

    }
    goalText.classList.remove('hidden');
    hint.classList.remove('hidden');
  }, dogScrollIntervalMs);
}

function handlePreGameStart() {
  if (gameStarted || countdownActive || isSelectingDog) return false;

  if (!dogSelected) {
    startDogSelectionScroll();
    return true;
  }

  startDecayCountdown();
  return true;
}

function renderMeters() {
  whipMeter.style.height = `${whipLevel}%`;
  petMeter.style.height = `${petLevel}%`;
}

function renderHp() {
  hpFill.style.width = `${hpLevel}%`;
  hpFill.classList.toggle('poisoned', poopLayer.querySelectorAll('.poop').length > 0 && !isDead);
}

function applyPoisonDamage() {
  if (isDead) return;

  const poopCount = poopLayer.querySelectorAll('.poop').length;
  if (poopCount === 0) return;

  hpLevel = Math.max(0, hpLevel - (poisonDamagePerPoop * poopCount));
  renderHp();

  if (hpLevel === 0) {
    triggerDeath();
  }
}

function restartGame() {
  window.location.reload();
}

function triggerDeath() {
  if (isDead) return;

  isDead = true;
  isLunging = true;
  canRestart = false;
  deathScreen.classList.add('show');
  deathClickEnableTimer = window.setTimeout(() => {
    canRestart = true;
    deathScreen.classList.add('ready');
  }, 2000);
  deathReloadTimer = window.setTimeout(restartGame, 4000);
}

function startDecayLoop() {
  if (decayStarted) return;

  decayStarted = true;
  countdownActive = false;
  instructionBox.classList.add('hidden');
  decayInterval = window.setInterval(() => {
    whipLevel = Math.max(0, whipLevel - decayPerTick);
    petLevel = Math.max(0, petLevel - decayPerTick);
    renderMeters();

    const now = Date.now();

    if (whipLevel === 0 && now - lastZeroDisciplinePoopAt >= zeroDisciplinePoopCooldownMs) {
      lastZeroDisciplinePoopAt = now;
      spawnPoop();
    }

    if (petLevel === 0 && now - lastZeroHappinessLungeAt >= zeroHappinessLungeCooldownMs) {
      lastZeroHappinessLungeAt = now;
      triggerDogLunge();
    }
  }, 60);
}

function startDecayCountdown() {
  if (gameStarted) return;

  gameStarted = true;
  countdownActive = true;
  let secondsLeft = decayCountdownSeconds;
  countdown.textContent = `Decay in ${secondsLeft}`;

  countdownTimer = window.setInterval(() => {
    secondsLeft -= 1;

    if (secondsLeft > 0) {
      countdown.textContent = `Decay in ${secondsLeft}`;
      return;
    }

    window.clearInterval(countdownTimer);
    countdownTimer = null;
    countdown.textContent = 'Go!';
    window.setTimeout(() => {
      startDecayLoop();
    }, 250);
  }, 1000);
}

function spawnHearts() {
  for (let i = 0; i < 3; i++) {
    const heart = document.createElement('span');
    heart.className = 'heart';
    heart.textContent = '♥';
    heart.style.left = `${38 + Math.random() * 24}%`;
    heart.style.setProperty('--drift-x', `${-26 + Math.random() * 52}px`);
    heart.style.setProperty('--drift-y', `${-12 - Math.random() * 28}px`);
    heart.style.animationDelay = `${i * 0.08}s`;
    heartLayer.appendChild(heart);
    heart.addEventListener('animationend', () => heart.remove(), { once: true });
  }
}

function spawnAnger() {
  for (let i = 0; i < 3; i++) {
    const anger = document.createElement('span');
    anger.className = 'anger';
    anger.textContent = '😠';
    anger.style.left = `${36 + Math.random() * 28}%`;
    anger.style.setProperty('--drift-x', `${-30 + Math.random() * 60}px`);
    anger.style.setProperty('--drift-y', `${-8 - Math.random() * 24}px`);
    anger.style.animationDelay = `${i * 0.06}s`;
    angerLayer.appendChild(anger);
    anger.addEventListener('animationend', () => anger.remove(), { once: true });
  }
}

function spawnPoop() {
  const poop = document.createElement('span');
  poop.className = 'poop';
  poop.textContent = '💩';
  poop.dataset.cleanProgress = '0';
  poop.style.left = `${15 + Math.random() * 70}%`;
  poop.style.top = `${54 + Math.random() * 28}%`;
  poop.style.fontSize = `${28 + Math.random() * 44}px`;
  poopLayer.appendChild(poop);
  renderHp();
}

function cleanPoop() {
  const poops = poopLayer.querySelectorAll('.poop');
  if (poops.length === 0) return;

  const targetPoop = poops[0];
  const nextProgress = Number(targetPoop.dataset.cleanProgress || '0') + 1;

  if (nextProgress >= poopClicksToClean) {
    targetPoop.remove();
  } else {
    targetPoop.dataset.cleanProgress = String(nextProgress);
  }

  renderHp();
}

function triggerDogLunge() {
  if (isLunging || isDead) return;

  isLunging = true;
  hpLevel = Math.max(0, hpLevel - lungeDamage);
  renderHp();
  dog.src = aggressiveDogSrc;
  dog.classList.remove('lunge');
  void dog.offsetWidth;
  dog.classList.add('lunge');
  roarSound.currentTime = 0;
  roarSound.play();

  if (hpLevel === 0) {
    triggerDeath();
  }
}

dog.addEventListener('click', () => {
  if (handlePreGameStart()) {
    return;
  }

  if (countdownActive || isLunging || isDead) return;

  const wasFull = whipLevel >= maxMeter;
  whipLevel = Math.min(maxMeter, whipLevel + whipStep);
  renderMeters();
  cleanPoop();

  arm.classList.remove('swing');
  void arm.offsetWidth;
  arm.classList.add('swing');

  playDogShake();

  if (!wasFull && whipLevel >= maxMeter) {
    triggerDogLunge();
  }

  flash.classList.remove('pop');
  void flash.offsetWidth;
  flash.classList.add('pop');
  spawnAnger();
  sound.currentTime = 0.5;
  sound.play();
  sound2.currentTime = 0;
  sound2.play();
});

dog.addEventListener('contextmenu', (event) => {
  event.preventDefault();
  if (handlePreGameStart()) {
    return;
  }

  if (countdownActive || isLunging || isDead) return;

  const wasFull = petLevel >= maxMeter;
  petLevel = Math.min(maxMeter, petLevel + petStep);
  renderMeters();

  if (!wasFull && petLevel >= maxMeter) {
    spawnPoop();
  }

  petHand.classList.remove('pet');
  void petHand.offsetWidth;
  petHand.classList.add('pet');

  dog.classList.remove('petted');
  void dog.offsetWidth;
  dog.classList.add('petted');

  petFlash.classList.remove('pop');
  void petFlash.offsetWidth;
  petFlash.classList.add('pop');
  spawnHearts();

  sound3.currentTime = 0.01;
  sound3.play();
});

arm.addEventListener('animationend', () => arm.classList.remove('swing'));
dog.addEventListener('animationend', () => dog.classList.remove('shake'));
petHand.addEventListener('animationend', () => petHand.classList.remove('pet'));
dog.addEventListener('animationend', () => dog.classList.remove('petted'));
dog.addEventListener('animationend', () => {
  dog.classList.remove('lunge');
  dog.src = normalDogSrc;
  if (!isDead) {
    isLunging = false;
  }
});

deathScreen.addEventListener('click', () => {
  if (!isDead || !canRestart) return;

  if (deathReloadTimer !== null) {
    window.clearTimeout(deathReloadTimer);
    deathReloadTimer = null;
  }

  if (deathClickEnableTimer !== null) {
    window.clearTimeout(deathClickEnableTimer);
    deathClickEnableTimer = null;
  }

  restartGame();
});

flash.addEventListener('animationend', () => flash.classList.remove('pop'));
petFlash.addEventListener('animationend', () => petFlash.classList.remove('pop'));

window.setInterval(() => {
  applyPoisonDamage();
}, poisonTickMs);

renderMeters();
renderHp();
