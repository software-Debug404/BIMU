import { GAME_CONFIG, SPRITE_PATHS, STAGES, ENEMY_CONFIGS, PORTAL_DIMENCIONAL, PIANO_CONFIG } from './gameConfig.js';
import { loadImages } from './loader.js';
import { Sprite, Fighter, FighterAI } from './sprites.js';
import { handleControls, keys } from './controls.js';
import * as audioManager from './audioManager.js';


const canvas = document.querySelector('canvas');
const ctx = canvas.getContext('2d');

canvas.width = GAME_CONFIG.CANVAS_WIDTH;
canvas.height = GAME_CONFIG.CANVAS_HEIGHT;

let player, enemy, background;
let gameOver = false;
let currentStage = 0;
let isLoadingNextStage = false;
let tombstonePortal = null;
let pianoObject = null;
let loadedImages = {};

let isPianoActive = false;
let isPianoHtmlLoaded = false;
let isGameMusicPlaying = false;
let lastTime = 0;
const pianoWrapper = document.getElementById('piano-container-wrapper');

function checkCollisions() {
    if (!player || !enemy || gameOver) return;

    if (player.isAttacking && !player.hasDealtDamage &&
        player.attackBox.position.x + player.attackBox.width > enemy.position.x &&
        player.attackBox.position.x < enemy.position.x + enemy.width &&
        player.attackBox.position.y + player.attackBox.height > enemy.position.y &&
        player.attackBox.position.y < enemy.position.y + enemy.height) {
        
        enemy.takeDamage(GAME_CONFIG.PLAYER_DAMAGE);
        player.hasDealtDamage = true;
    }

    if (enemy.isAttacking && !enemy.hasDealtDamage &&
        enemy.attackBox.position.x + enemy.attackBox.width > player.position.x &&
        enemy.attackBox.position.x < player.position.x + player.width &&
        enemy.attackBox.position.y + enemy.attackBox.height > player.position.y &&
        enemy.attackBox.position.y < player.position.y + player.height) {
        
        player.takeDamage(GAME_CONFIG.ENEMY_DAMAGE);
        enemy.hasDealtDamage = true;
    }
}

function drawUI() {
     if (!player || !enemy) return;

    const playerHealthPercentage = player.health / player.maxHealth;
    ctx.fillStyle = 'darkred';
    ctx.fillRect(20, 20, 300, 20);
    ctx.fillStyle = playerHealthPercentage > 0.6 ? 'green' : playerHealthPercentage > 0.3 ? 'yellow' : 'red';
    ctx.fillRect(20, 20, 300 * playerHealthPercentage, 20);
    ctx.strokeStyle = 'white';
    ctx.strokeRect(20, 20, 300, 20);
    
    const enemyHealthPercentage = enemy.health / enemy.maxHealth;
    ctx.fillStyle = 'darkred';
    ctx.fillRect(canvas.width - 320, 20, 300, 20);
    ctx.fillStyle = enemyHealthPercentage > 0.6 ? 'green' : enemyHealthPercentage > 0.3 ? 'yellow' : 'red';
    ctx.fillRect(canvas.width - 320, 20, 300 * enemyHealthPercentage, 20);
    ctx.strokeStyle = 'white';
    ctx.strokeRect(canvas.width - 320, 20, 300, 20);

    ctx.font = "24px Arial";
    ctx.fillStyle = "white";
    ctx.textAlign = "left";
    ctx.fillText(`Poções: ${player.potions}`, 20, 70);
}

function createEnemy(enemyType, loadedImages) {
    const config = ENEMY_CONFIGS[enemyType];
    if (!config) {
        console.error(`Configuração não encontrada para o inimigo: ${enemyType}`);
        return null;
    }

    const enemySpritePaths = SPRITE_PATHS.ENEMY[enemyType];
    const finalSpritesConfig = {};
    const availableAttacks = [];

    for (const spriteKey in config.sprites) {
        const spriteConfig = config.sprites[spriteKey];
        const imagePath = enemySpritePaths[spriteConfig.imageKey];

        finalSpritesConfig[spriteKey] = {
            image: loadedImages[imagePath],
            totalSpriteFrames: spriteConfig.totalSpriteFrames,
            framesPerSpriteFrame: spriteConfig.framesPerSpriteFrame
        };

        if (spriteKey.startsWith('attacking')) {
            availableAttacks.push(spriteKey);
        }
    }

    return new FighterAI({
        position: { x: 700, y: 0 },
        velocity: { x: 0, y: 10 },
        scale: config.scale,
        sprites: finalSpritesConfig,
        availableAttacks: availableAttacks
    });
}

async function togglePiano(show) {
    isPianoActive = show; 

    if (show) {
        audioManager.pauseMusic();
        if (!isPianoHtmlLoaded) {
            try {
                const response = await fetch('piano.html');
                const html = await response.text();
                pianoWrapper.innerHTML = html;

                const pianoScript = document.createElement('script');
                pianoScript.src = './js/piano_interactive.js';
                pianoScript.onload = () => {
                    if (window.activatePianoControls) {
                        window.activatePianoControls();
                    }
                };
                document.body.appendChild(pianoScript);
                isPianoHtmlLoaded = true;
            } catch (e) {
                console.error("Erro ao carregar o piano:", e);
                isPianoActive = false;
                return;
            }
        } else {
             if (window.activatePianoControls) {
                window.activatePianoControls();
             }
        }
        pianoWrapper.classList.remove('hidden');

    } else {
        audioManager.resumeMusic();
        if (window.deactivatePianoControls) {
            window.deactivatePianoControls();
        }
        pianoWrapper.classList.add('hidden');
    }
}


async function advanceToNextStage() {
    isLoadingNextStage = true;
    currentStage++;
    const stageNumber = currentStage + 1;

    const setupNextStage = () => {
        tombstonePortal = null;
        pianoObject = null;
        let nextBackgroundImg;
        let nextEnemy = null;
        let nextPiano = null;
        let nextPortal = null;
        
        if (stageNumber > 0 && stageNumber % 10 === 0) {
            console.log(`Entrando no estágio bônus: ${stageNumber}`);
            nextBackgroundImg = loadedImages[SPRITE_PATHS.BACKGROUND_FLORESTA];
            const pianoConfig = PIANO_CONFIG.PIANO;
            const pianoImg = loadedImages[SPRITE_PATHS.PIANO];
            const pianoWidth = pianoImg.width * pianoConfig.scale;
            const pianoHeight = pianoImg.height * pianoConfig.scale;
            nextPiano = new Sprite({
                position: { x: (GAME_CONFIG.CANVAS_WIDTH / 2) - (pianoWidth / 2), y: GAME_CONFIG.CANVAS_HEIGHT - GAME_CONFIG.FLOOR_HEIGHT - pianoHeight },
                scale: pianoConfig.scale,
                image: pianoImg
            });
            const portalConfig = PORTAL_DIMENCIONAL.PORTAL;
            nextPortal = new Sprite({
                position: {  x: GAME_CONFIG.CANVAS_WIDTH - 190, y: GAME_CONFIG.CANVAS_HEIGHT - GAME_CONFIG.FLOOR_HEIGHT - 168 },
                scale: portalConfig.scale,
                sprites: { idle: { image: loadedImages[SPRITE_PATHS.DIMENCIONAL_PORTAL], totalSpriteFrames: portalConfig.sprites.portal.totalSpriteFrames, framesPerSpriteFrame: portalConfig.sprites.portal.framesPerSpriteFrame } }
            });
        } else if (currentStage < STAGES.length) {
            const stageConfig = STAGES[currentStage];
            console.log(`Avançando para o estágio predefinido: ${stageConfig.enemyType}`);
            nextBackgroundImg = loadedImages[stageConfig.background];
            nextEnemy = createEnemy(stageConfig.enemyType, loadedImages);
        } else {
            console.log("Modo aleatório ativado!");
            const enemyTypes = Object.keys(ENEMY_CONFIGS);
            const randomEnemyType = enemyTypes[Math.floor(Math.random() * enemyTypes.length)];
            const backgrounds = [SPRITE_PATHS.BACKGROUND_FLORESTA, SPRITE_PATHS.BACKGROUND_DESERTO, SPRITE_PATHS.BACKGROUND_SUBMUNDO];
            const randomBackgroundPath = backgrounds[Math.floor(Math.random() * backgrounds.length)];
            nextBackgroundImg = loadedImages[randomBackgroundPath];
            nextEnemy = createEnemy(randomEnemyType, loadedImages);
            console.log(`Próximo estágio aleatório: ${randomEnemyType}`);
        }

        background.image = nextBackgroundImg;
        enemy = nextEnemy;
        pianoObject = nextPiano;
        tombstonePortal = nextPortal;
        if (tombstonePortal) tombstonePortal.setSprite('idle');

        player.position.x = 100;
        player.position.y = 0;
        player.health = player.maxHealth;
        player.potions = 3;
        isLoadingNextStage = false; 

        canvas.classList.remove('hidden');
        canvas.style.display = 'block';
    };

    showLoadingScreen(stageNumber, setupNextStage);
}

function gameLoop(timestamp) { 
    window.requestAnimationFrame(gameLoop);

    const deltaTime = (timestamp - lastTime) / 1000; // Calcula o tempo em segundos
    lastTime = timestamp;

    if (!window.jogoIniciado || isLoadingNextStage || !deltaTime) {
        return;
    }

    if (!isGameMusicPlaying) {
        audioManager.playGameMusic();
        isGameMusicPlaying = true;
    }

    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    background.draw(ctx);
    if (pianoObject) pianoObject.draw(ctx); 
    if (tombstonePortal) {
        tombstonePortal.animate();
        tombstonePortal.draw(ctx);
    }
    player.draw(ctx);
    if (enemy) enemy.draw(ctx);
    drawUI();

    if (isPianoActive) {
        if (keys.escape.pressed && !keys.escape.hold) {
            togglePiano(false);
            keys.escape.hold = true;
        }
        return; 
    }
    
    if (!gameOver) {
        handleControls(player);
        player.update(deltaTime); 
        if (enemy) enemy.updateAI(player, deltaTime);
        checkCollisions();

        if (enemy && enemy.dead && !tombstonePortal) {
            const portalImg = loadedImages[SPRITE_PATHS.DIMENCIONAL_PORTAL];
            const portalConfig = PORTAL_DIMENCIONAL.PORTAL;
            tombstonePortal = new Sprite({
                position: {  x: GAME_CONFIG.CANVAS_WIDTH - 190, y: GAME_CONFIG.CANVAS_HEIGHT - GAME_CONFIG.FLOOR_HEIGHT - 168 },
                scale: portalConfig.scale,
                sprites: { idle: { image: portalImg, totalSpriteFrames: portalConfig.sprites.portal.totalSpriteFrames, framesPerSpriteFrame: portalConfig.sprites.portal.framesPerSpriteFrame } }
            });
        }
        
        if (keys.q.pressed && !keys.q.hold) {
            if (tombstonePortal && player.position.x < tombstonePortal.position.x + tombstonePortal.width &&
                player.position.x + player.width > tombstonePortal.position.x) {
                advanceToNextStage();
            }
            else if (pianoObject && player.position.x < pianoObject.position.x + pianoObject.width &&
                     player.position.x + player.width > pianoObject.position.x)
            {
                togglePiano(true);
            }
            keys.q.hold = true;
        }

        if (player.dead) {
            gameOver = true;
            showGameOverScreen();
        }
    }
    
    if (gameOver) {
        return;
    }
}


async function main() {
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = 'white';
    ctx.textAlign = 'center';
    ctx.fillText('Carregando o universo do jogo...', canvas.width / 2, canvas.height / 2);

    const imagePaths = new Set();
    Object.values(SPRITE_PATHS.PLAYER).forEach(path => imagePaths.add(path));
    for (const enemyType in SPRITE_PATHS.ENEMY) {
        Object.values(SPRITE_PATHS.ENEMY[enemyType]).forEach(path => imagePaths.add(path));
    }
    imagePaths.add(SPRITE_PATHS.BACKGROUND_FLORESTA);
    imagePaths.add(SPRITE_PATHS.BACKGROUND_DESERTO);
    imagePaths.add(SPRITE_PATHS.BACKGROUND_SUBMUNDO);
    imagePaths.add(SPRITE_PATHS.DIMENCIONAL_PORTAL);
    imagePaths.add(SPRITE_PATHS.PIANO); 
    
    loadedImages = await loadImages(Array.from(imagePaths));
    audioManager.initAudio();

    const initialStage = STAGES[0];
    background = new Sprite({
        position: { x: 0, y: 0 },
        image: loadedImages[initialStage.background]
    });

    player = new Fighter({
        position: { x: 100, y: 0 }, velocity: { x: 0, y: 10 }, scale: 2,
        sprites: {
            idle:        { image: loadedImages[SPRITE_PATHS.PLAYER.IDLE], totalSpriteFrames: 6, framesPerSpriteFrame: 60 },
            walk:        { image: loadedImages[SPRITE_PATHS.PLAYER.WALK], totalSpriteFrames: 9, framesPerSpriteFrame: 10 },
            running:     { image: loadedImages[SPRITE_PATHS.PLAYER.RUN], totalSpriteFrames: 8, framesPerSpriteFrame: 8 },
            jumping:     { image: loadedImages[SPRITE_PATHS.PLAYER.JUMP], totalSpriteFrames: 9, framesPerSpriteFrame: 15 },
            attacking_1: { image: loadedImages[SPRITE_PATHS.PLAYER.ATTACK_1], totalSpriteFrames: 4, framesPerSpriteFrame: 8 },
            attacking_2: { image: loadedImages[SPRITE_PATHS.PLAYER.ATTACK_2], totalSpriteFrames: 5, framesPerSpriteFrame: 8 },
            attacking_3: { image: loadedImages[SPRITE_PATHS.PLAYER.ATTACK_3], totalSpriteFrames: 4, framesPerSpriteFrame: 8 },
            protect:     { image: loadedImages[SPRITE_PATHS.PLAYER.PROTECT], totalSpriteFrames: 2, framesPerSpriteFrame: 20 },
            hurt:        { image: loadedImages[SPRITE_PATHS.PLAYER.HURT], totalSpriteFrames: 3, framesPerSpriteFrame: 20 },
            dead:        { image: loadedImages[SPRITE_PATHS.PLAYER.DEAD], totalSpriteFrames: 6, framesPerSpriteFrame: 30 }
        }
    });

    enemy = createEnemy(initialStage.enemyType, loadedImages);
    
    gameLoop();
}

window.startMenuMusic = function() {
    audioManager.playMenuMusic();
}

window.addEventListener('DOMContentLoaded', () => {
    canvas.classList.add('hidden');
    main();
});

window.addEventListener('DOMContentLoaded', () => {
    canvas.classList.add('hidden');
    main();
});
