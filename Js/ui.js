const overlay = document.querySelector('.overlay');
const canvas = document.querySelector('canvas');
const mainMenu = document.getElementById('mainMenu');
const controlsScreen = document.getElementById('controlsScreen');
const gameOverScreen = document.getElementById('gameOverScreen');
const loadingScreen = document.getElementById('loadingScreen');
const loadingTitle = document.getElementById('loadingTitle');
const levelNumber = document.getElementById('levelNumber');
const loadingBar = document.getElementById('loadingBar');
const loadingProgress = document.getElementById('loadingProgress');
const loadingTip = document.getElementById('loadingTip');
const loadingError = document.getElementById('loadingError');
const reloadButton = document.getElementById('reloadButton');
const pauseScreen = document.getElementById('pauseScreen');
const assetStatus = document.getElementById('assetStatus');
const audioReady = import(new URL('./Js/audioManager.js', document.baseURI).href);
let audio;
let screen = 'menu';
let transitioning = false;
let fatalError = null;
let progress = { loaded: 0, total: 0 };
let focusBeforePause = null;

function syncVolumes(volumes) {
    document.querySelectorAll('[data-volume]').forEach(input => {
        input.value = Math.round(volumes[input.dataset.volume] * 100);
    });
    document.querySelectorAll('[data-volume-output]').forEach(output => {
        output.value = `${Math.round(volumes[output.dataset.volumeOutput] * 100)}%`;
    });
}

audioReady.then(module => {
    audio = module;
    syncVolumes(audio.getVolumes());
}).catch(() => {});
window.addEventListener('audio:volumechange', event => syncVolumes(event.detail));
document.querySelectorAll('[data-volume]').forEach(input => {
    input.addEventListener('input', () => {
        const channel = input.dataset.volume;
        const value = Number(input.value) / 100;
        audioReady.then(module => {
            if (channel === 'music') module.setMusicVolume(value);
            else module.setEffectsVolume(value);
        }).catch(() => {});
    });
});

function unlockAudio() {
    if (audio) audio.unlockAudio();
    else audioReady.then(module => module.unlockAudio()).catch(() => {});
}

function hideScreens() {
    mainMenu.style.display = 'none';
    controlsScreen.style.display = 'none';
    gameOverScreen.style.display = 'none';
    loadingScreen.style.display = 'none';
}

function startGame() {
    document.activeElement?.blur();
    hideScreens();
    overlay.style.display = 'none';
    document.body.classList.add('is-playing');
    canvas.classList.remove('hidden');
    canvas.style.display = 'block';
    screen = 'playing';
    window.jogoIniciado = true;
    window.dispatchEvent(new CustomEvent('game:start'));
}

function setLoadingProgress(loaded, total) {
    progress = { loaded, total };
    const percentage = total > 0 ? Math.min(100, Math.round((loaded / total) * 100)) : 0;
    loadingBar.style.width = `${percentage}%`;
    loadingProgress.setAttribute('aria-valuenow', percentage);
    assetStatus.textContent = total > 0 && loaded >= total ? 'Pronto para jogar' : `Carregando recursos: ${loaded}/${total}`;
    if (!fatalError) loadingTip.textContent = total > 0 && loaded >= total ? 'Prepare sua espada.' : `Carregando recursos: ${loaded}/${total}`;
}

function showLoadError(error) {
    fatalError = error instanceof Error ? error.message : String(error || 'Falha ao carregar os recursos do jogo.');
    transitioning = false;
    screen = 'error';
    window.jogoIniciado = false;
    hideScreens();
    showPauseScreen(false);
    canvas.classList.add('hidden');
    canvas.style.display = 'none';
    loadingScreen.style.display = 'flex';
    loadingTitle.textContent = 'Não foi possível iniciar o jogo';
    levelNumber.style.display = 'none';
    loadingProgress.style.display = 'none';
    loadingTip.textContent = 'Confira a conexão e tente recarregar.';
    loadingError.textContent = fatalError;
    loadingError.hidden = false;
    reloadButton.hidden = false;
    reloadButton.focus();
}

async function showLoadingScreen(level, onComplete) {
    if (transitioning || fatalError) return false;
    transitioning = true;
    screen = 'loading';
    hideScreens();
    showPauseScreen(false);
    canvas.classList.add('hidden');
    canvas.style.display = 'none';
    levelNumber.textContent = level;
    loadingTitle.textContent = 'Entrando na fase:';
    loadingScreen.style.display = 'flex';
    setLoadingProgress(progress.loaded, progress.total);
    try {
        // Os módulos terminam de executar antes do evento load da página.
        if (!window.gameReady && document.readyState !== 'complete') {
            await new Promise(resolve => window.addEventListener('load', resolve, { once: true }));
        }
        if (!window.gameReady) throw new Error('O módulo do jogo não pôde ser carregado.');
        await window.gameReady;
        if (fatalError) return false;
        loadingBar.style.width = '100%';
        loadingProgress.setAttribute('aria-valuenow', '100');
        loadingTip.textContent = 'Prepare sua espada.';
        await new Promise(resolve => setTimeout(resolve, 300));
        if (fatalError) return false;
        loadingScreen.style.display = 'none';
        await onComplete?.();
        screen = 'playing';
        return true;
    } catch (error) {
        showLoadError(error);
        return false;
    } finally {
        transitioning = false;
    }
}

function showGameOverScreen() {
    screen = 'gameover';
    showPauseScreen(false);
    hideScreens();
    canvas.classList.add('hidden');
    canvas.style.display = 'none';
    gameOverScreen.style.display = 'flex';
    document.getElementById('retryButton').focus();
}

function showPauseScreen(show) {
    if (show) {
        if (!pauseScreen.hidden) return;
        focusBeforePause = document.activeElement;
        pauseScreen.hidden = false;
        document.getElementById('resumeButton').focus();
    } else {
        if (pauseScreen.contains(document.activeElement)) document.activeElement.blur();
        pauseScreen.hidden = true;
        if (focusBeforePause?.isConnected && focusBeforePause.getClientRects().length > 0) focusBeforePause.focus();
        focusBeforePause = null;
    }
}

function showControls() {
    if (screen !== 'menu') return;
    unlockAudio();
    audioReady.then(module => module.playMenuMusic()).catch(() => {});
    hideScreens();
    screen = 'controls';
    controlsScreen.style.display = 'block';
    document.getElementById('playButton').focus();
}

function requestPlay() {
    if (screen !== 'controls') return;
    unlockAudio();
    showLoadingScreen(1, startGame);
}

document.getElementById('startButton').addEventListener('click', showControls);
document.getElementById('playButton').addEventListener('click', requestPlay);
document.getElementById('restartButton').addEventListener('click', () => window.location.reload());
reloadButton.addEventListener('click', () => window.location.reload());
document.getElementById('retryButton').addEventListener('click', () => {
    if (screen !== 'gameover') return;
    unlockAudio();
    document.activeElement?.blur();
    screen = 'playing';
    gameOverScreen.style.display = 'none';
    canvas.classList.remove('hidden');
    canvas.style.display = 'block';
    window.dispatchEvent(new CustomEvent('game:retry'));
});
document.getElementById('resumeButton').addEventListener('click', () => {
    unlockAudio();
    window.dispatchEvent(new CustomEvent('game:resume'));
});

document.addEventListener('keydown', event => {
    if (event.key === 'Tab' && !pauseScreen.hidden) {
        const focusable = [...pauseScreen.querySelectorAll('button, input')];
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (event.shiftKey && document.activeElement === first) {
            event.preventDefault();
            last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
            event.preventDefault();
            first.focus();
        }
        return;
    }
    if (event.key !== 'Enter' || event.repeat) return;
    if (event.target.matches('input, button')) return;
    if (screen === 'menu') {
        event.preventDefault();
        showControls();
    } else if (screen === 'controls') {
        event.preventDefault();
        requestPlay();
    }
});

function createLeaves() {
    const colors = ['#e63946', '#a8dadc', '#f1faee', '#457b9d'];
    for (let i = 0; i < 16; i++) {
        const leaf = document.createElement('div');
        leaf.className = 'leaf';
        leaf.setAttribute('aria-hidden', 'true');
        leaf.textContent = '❀';
        leaf.style.color = colors[i % colors.length];
        leaf.style.fontSize = `${12 + Math.random() * 16}px`;
        leaf.style.left = `${Math.random() * 100}vw`;
        leaf.style.animationDuration = `${7 + Math.random() * 8}s`;
        leaf.style.animationDelay = `${-Math.random() * 10}s`;
        document.body.appendChild(leaf);
    }
}

Object.assign(window, { startGame, showLoadingScreen, setLoadingProgress, showLoadError, showGameOverScreen, showPauseScreen });
createLeaves();
