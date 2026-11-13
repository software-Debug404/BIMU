import { GAME_CONFIG, SPRITE_PATHS, STAGES, ENEMY_CONFIGS, PORTAL_DIMENCIONAL, PIANO_CONFIG } from './gameConfig.js';
import { loadImages } from './loader.js';
import { Sprite, Fighter, FighterAI } from './sprites.js';
import { resolveAttack } from './combat.js';
import { SimulationClock } from './clock.js';
import { handleControls, keys, resetKeys } from './controls.js';
import * as audioManager from './audioManager.js';

const canvas = document.querySelector('canvas');
const ctx = canvas.getContext('2d');
canvas.width = GAME_CONFIG.CANVAS_WIDTH;
canvas.height = GAME_CONFIG.CANVAS_HEIGHT;

const clock = new SimulationClock(GAME_CONFIG.SIMULATION_STEP, GAME_CONFIG.MAX_FRAME_TIME);
const pianoWrapper = document.getElementById('piano-container-wrapper');
const enemyNames = {
    MINOTAUR: 'Minotauro', MINOTAUR_2: 'Minotauro das dunas', MINOTAUR_3: 'Minotauro do submundo',
    SKELETON_WARRIOR: 'Guerreiro esqueleto', SKELETON_SPEARMAN: 'Lanceiro esqueleto',
    SAMURAI_COMMANDER: 'Comandante samurai', KARASU_TENGU: 'Karasu Tengu', YAMABUSHI_TENGU: 'Yamabushi Tengu',
    WHITE_WEREWOLF: 'Lobisomem branco', BLACK_WEREWOLF: 'Lobisomem negro', READ_WEREWOLF: 'Lobisomem vermelho',
    GORGON: 'Górgona', GORGON_2: 'Górgona das dunas', GORGON_3: 'Górgona do submundo'
};
let player, enemy, background;
let loadedImages = {};
let currentStage = 0;
let stageDefinition;
let tombstonePortal = null;
let pianoObject = null;
let isPianoActive = false;
let pianoModule = null;
let pianoLoading = null;
let isPaused = false;
let isLoadingNextStage = false;
let gameOver = false;
let musicStarted = false;
let hitStop = 0;
let effects = [];
let notice = null;

function createEnemy(enemyType) {
    const config = ENEMY_CONFIGS[enemyType];
    const sprites = {};
    const availableAttacks = [];
    for (const [key, sprite] of Object.entries(config.sprites)) {
        sprites[key] = {
            image: loadedImages[SPRITE_PATHS.ENEMY[enemyType][sprite.imageKey]],
            totalSpriteFrames: sprite.totalSpriteFrames,
            framesPerSpriteFrame: sprite.framesPerSpriteFrame
        };
        if (key.startsWith('attacking')) availableAttacks.push(key);
    }
    const fighter = new FighterAI({
        position: { x: 700, y: 0 }, velocity: { x: 0, y: 0 },
        scale: config.scale, sprites, availableAttacks
    });
    fighter.name = enemyNames[enemyType] || enemyType;
    return fighter;
}

function createPortal() {
    const config = PORTAL_DIMENCIONAL.PORTAL;
    const image = loadedImages[SPRITE_PATHS.DIMENCIONAL_PORTAL];
    const width = image.width / config.sprites.portal.totalSpriteFrames * config.scale;
    const sprite = new Sprite({
        position: { x: canvas.width - width - 24, y: canvas.height - GAME_CONFIG.FLOOR_HEIGHT - image.height * config.scale },
        scale: config.scale,
        sprites: { idle: {
            image: loadedImages[SPRITE_PATHS.DIMENCIONAL_PORTAL],
            ...config.sprites.portal
        } }
    });
    return sprite;
}

function selectStage(index) {
    if ((index + 1) % 10 === 0) return { background: SPRITE_PATHS.BACKGROUND_FLORESTA, bonus: true };
    if (index < STAGES.length) return STAGES[index];
    const enemyTypes = Object.keys(ENEMY_CONFIGS);
    const backgrounds = [SPRITE_PATHS.BACKGROUND_FLORESTA, SPRITE_PATHS.BACKGROUND_DESERTO, SPRITE_PATHS.BACKGROUND_SUBMUNDO];
    return {
        enemyType: enemyTypes[Math.floor(Math.random() * enemyTypes.length)],
        background: backgrounds[Math.floor(Math.random() * backgrounds.length)]
    };
}

function setupStage(definition) {
    stageDefinition = definition;
    background.image = loadedImages[definition.background];
    enemy = definition.bonus ? null : createEnemy(definition.enemyType);
    pianoObject = null;
    tombstonePortal = null;
    if (definition.bonus) {
        const image = loadedImages[SPRITE_PATHS.PIANO];
        const scale = PIANO_CONFIG.PIANO.scale;
        pianoObject = new Sprite({
            image, scale,
            position: {
                x: (canvas.width - image.width * scale) / 2,
                y: canvas.height - GAME_CONFIG.FLOOR_HEIGHT - image.height * scale
            }
        });
        tombstonePortal = createPortal();
    }
    player.reset({ x: 100, y: 0 });
    effects = [];
    hitStop = 0;
    notice = null;
    gameOver = false;
    isPaused = false;
    resetKeys();
    clock.reset();
}

async function advanceToNextStage() {
    if (isLoadingNextStage) return;
    isLoadingNextStage = true;
    resetKeys();
    try {
        await window.showLoadingScreen(currentStage + 2, () => {
            currentStage++;
            setupStage(selectStage(currentStage));
            canvas.classList.remove('hidden');
            canvas.style.display = 'block';
        });
    } finally {
        isLoadingNextStage = false;
        clock.reset();
        if (document.hidden || !document.hasFocus()) setPaused(true);
    }
}

async function togglePiano(show) {
    if (show && pianoLoading) return;
    resetKeys();
    isPianoActive = show;
    clock.reset();
    if (!show) {
        pianoModule?.deactivatePianoControls();
        pianoWrapper.classList.add('hidden');
        if (!isPaused) audioManager.resumeMusic();
        return;
    }
    audioManager.pauseMusic();
    try {
        if (!pianoModule) {
            pianoLoading = (async () => {
                const response = await fetch(new URL('../piano.html', import.meta.url));
                if (!response.ok) throw new Error('Não foi possível abrir o piano.');
                const doc = new DOMParser().parseFromString(await response.text(), 'text/html');
                const piano = doc.querySelector('.piano');
                if (!piano) throw new Error('O piano está indisponível.');
                pianoWrapper.replaceChildren(piano);
                pianoModule = await import('./piano_interactive.js');
                pianoModule.initializeInteractivePiano(pianoWrapper, () => togglePiano(false));
            })();
            await pianoLoading;
        }
        if (isPaused || !isPianoActive) return;
        pianoWrapper.classList.remove('hidden');
        pianoModule.activatePianoControls();
    } catch (error) {
        isPianoActive = false;
        notice = { text: `${error.message} Você pode seguir pelo portal.`, time: 5 };
        if (!isPaused) audioManager.resumeMusic();
    } finally {
        pianoLoading = null;
        clock.reset();
    }
}

function setPaused(value) {
    if (!window.jogoIniciado || gameOver || isLoadingNextStage || isPaused === value) return;
    isPaused = value;
    resetKeys();
    clock.reset();
    if (value) {
        audioManager.pauseMusic();
        if (isPianoActive) {
            pianoModule?.deactivatePianoControls();
            pianoWrapper.classList.add('hidden');
        }
    } else if (isPianoActive) {
        pianoWrapper.classList.remove('hidden');
        pianoModule?.activatePianoControls();
    } else {
        audioManager.resumeMusic();
    }
    window.showPauseScreen(value);
}

function isNear(object) {
    if (!object) return false;
    const body = player.hurtBox;
    return body.position.x + body.width > object.position.x - 38 &&
        body.position.x < object.position.x + object.width + 38 &&
        Math.abs(body.position.y + body.height - (object.position.y + object.height)) < 90;
}

function addImpact(result) {
    const blocked = result.type === 'blocked';
    audioManager.playEffect(blocked ? 'block' : 'hit');
    if (!blocked) hitStop = GAME_CONFIG.HIT_STOP_DURATION;
    for (let i = 0; i < 12; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 60 + Math.random() * 150;
        effects.push({
            x: result.x, y: result.y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed,
            life: 0.25, color: blocked ? '#a8e2ff' : '#ffd67a'
        });
    }
}

function update(dt) {
    if (isPaused || isLoadingNextStage || isPianoActive || gameOver) return;
    for (const effect of effects) {
        effect.x += effect.vx * dt;
        effect.y += effect.vy * dt;
        effect.life -= dt;
    }
    effects = effects.filter(effect => effect.life > 0);
    if (notice) {
        notice.time -= dt;
        if (notice.time <= 0) notice = null;
    }
    if (hitStop > 0) {
        hitStop -= dt;
        return;
    }
    const playerWasAttacking = player.isAttacking;
    const enemyWasAttacking = enemy?.isAttacking;
    handleControls(player);
    player.update(dt);
    if (enemy) enemy.updateAI(player, dt);
    tombstonePortal?.animate(dt);
    if ((!playerWasAttacking && player.isAttacking) || (!enemyWasAttacking && enemy?.isAttacking)) {
        audioManager.playEffect('swing');
    }
    if (enemy && !enemy.dead && !player.dead) {
        const playerHit = resolveAttack(player, enemy, GAME_CONFIG.PLAYER_DAMAGE);
        if (playerHit) addImpact(playerHit);
        const enemyHit = resolveAttack(enemy, player, GAME_CONFIG.ENEMY_DAMAGE);
        if (enemyHit) addImpact(enemyHit);
    }
    if (enemy?.dead && !tombstonePortal) tombstonePortal = createPortal();
    if (keys.q.pressed && !keys.q.hold) {
        keys.q.hold = true;
        if (isNear(tombstonePortal)) advanceToNextStage();
        else if (isNear(pianoObject)) togglePiano(true);
    }
    if (player.dead) {
        gameOver = true;
        resetKeys();
        audioManager.pauseMusic();
        window.showGameOverScreen();
    }
}

function drawBar(x, y, width, fighter, label) {
    ctx.fillStyle = '#10151ddd';
    ctx.fillRect(x - 8, y - 27, width + 16, 58);
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 16px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(label, x, y - 8);
    ctx.fillStyle = '#4b2028';
    ctx.fillRect(x, y, width, 18);
    const ratio = fighter.health / fighter.maxHealth;
    ctx.fillStyle = ratio > 0.3 ? '#e63946' : '#ff9b54';
    ctx.fillRect(x, y, width * ratio, 18);
    ctx.strokeStyle = '#e5d8be';
    ctx.strokeRect(x, y, width, 18);
    ctx.font = '12px Arial';
    ctx.textAlign = 'right';
    ctx.fillStyle = '#fff';
    ctx.fillText(`${fighter.health} / ${fighter.maxHealth}`, x + width - 4, y + 13);
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    background.draw(ctx);
    pianoObject?.draw(ctx);
    tombstonePortal?.draw(ctx);
    player.draw(ctx);
    enemy?.draw(ctx);
    for (const effect of effects) {
        ctx.globalAlpha = effect.life / 0.25;
        ctx.fillStyle = effect.color;
        ctx.fillRect(effect.x, effect.y, 4, 4);
    }
    ctx.globalAlpha = 1;
    drawBar(24, 47, 275, player, 'BIMU');
    if (enemy) drawBar(canvas.width - 299, 47, 275, enemy, enemy.name);
    ctx.textAlign = 'center';
    ctx.font = 'bold 18px Arial';
    ctx.fillStyle = '#fff';
    ctx.fillText(`FASE ${currentStage + 1}`, canvas.width / 2, 34);
    ctx.font = '14px Arial';
    ctx.fillText(stageDefinition.bonus ? 'Um momento de descanso' : 'A Jornada do Samurai', canvas.width / 2, 56);
    ctx.textAlign = 'left';
    ctx.fillText(`E · Poções: ${player.potions}`, 24, 96);
    ctx.textAlign = 'right';
    ctx.fillText('Esc · Pausar', canvas.width - 24, 96);
    const prompt = notice?.text || (isNear(tombstonePortal) ? 'Q · Entrar no portal' :
        isNear(pianoObject) ? 'Q · Tocar piano' : enemy?.dead ? 'Vitória! Siga até o portal.' : null);
    if (prompt) {
        ctx.font = 'bold 18px Arial';
        const width = Math.min(ctx.measureText(prompt).width + 32, canvas.width - 40);
        ctx.fillStyle = '#10151de8';
        ctx.fillRect((canvas.width - width) / 2, canvas.height - 57, width, 36);
        ctx.fillStyle = '#ffe2a0';
        ctx.textAlign = 'center';
        ctx.fillText(prompt, canvas.width / 2, canvas.height - 33, width - 16);
    }
}

function gameLoop(timestamp) {
    requestAnimationFrame(gameLoop);
    if (!window.jogoIniciado || isPaused || isLoadingNextStage || isPianoActive) {
        clock.reset();
        return;
    }
    if (!musicStarted) {
        audioManager.playGameMusic();
        musicStarted = true;
    }
    clock.advance(timestamp, update);
    draw();
}

async function main() {
    const paths = new Set();
    const collect = object => {
        for (const value of Object.values(object)) {
            if (typeof value === 'string') paths.add(value);
            else collect(value);
        }
    };
    collect(SPRITE_PATHS);
    loadedImages = await loadImages([...paths], (loaded, total) => window.setLoadingProgress?.(loaded, total));
    audioManager.initAudio();
    const sprites = {};
    const definitions = {
        idle: ['IDLE', 6, 15], walk: ['WALK', 9, 10], running: ['RUN', 8, 8],
        jumping: ['JUMP', 9, 8], attacking_1: ['ATTACK_1', 4, 8],
        attacking_2: ['ATTACK_2', 5, 8], attacking_3: ['ATTACK_3', 4, 8],
        protect: ['PROTECT', 2, 12], hurt: ['HURT', 3, 6], dead: ['DEAD', 6, 12]
    };
    for (const [key, [image, totalSpriteFrames, framesPerSpriteFrame]] of Object.entries(definitions)) {
        sprites[key] = { image: loadedImages[SPRITE_PATHS.PLAYER[image]], totalSpriteFrames, framesPerSpriteFrame };
    }
    player = new Fighter({
        position: { x: 100, y: 0 }, velocity: { x: 0, y: 0 }, scale: 2, sprites,
        body: { offsetX: 22, offsetY: 62, width: 24, height: 66 },
        attack: { range: 72 }
    });
    background = new Sprite({ position: { x: 0, y: 0 }, image: loadedImages[SPRITE_PATHS.BACKGROUND_FLORESTA] });
    setupStage(selectStage(0));
    requestAnimationFrame(gameLoop);
}

window.startMenuMusic = () => {
    audioManager.unlockAudio();
    audioManager.playMenuMusic();
};
window.addEventListener('game:resume', () => setPaused(false));
window.addEventListener('game:start', () => {
    if (document.hidden || !document.hasFocus()) setPaused(true);
});
window.addEventListener('game:retry', () => {
    if (!gameOver || isLoadingNextStage) return;
    setupStage(stageDefinition);
    document.getElementById('gameOverScreen').style.display = 'none';
    canvas.classList.remove('hidden');
    canvas.style.display = 'block';
    audioManager.unlockAudio();
    audioManager.playGameMusic();
});
window.addEventListener('keydown', event => {
    if (event.key !== 'Escape' || event.repeat) return;
    event.preventDefault();
    if (isPianoActive && !isPaused) {
        togglePiano(false);
        return;
    }
    setPaused(!isPaused);
});
window.addEventListener('blur', () => setPaused(true));
document.addEventListener('visibilitychange', () => {
    if (document.hidden) setPaused(true);
});
window.gameReady = main();
window.gameReady.catch(error => window.showLoadError?.(error));
