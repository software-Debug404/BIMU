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
const storyScreen = document.getElementById('storyScreen');
const storyText = document.getElementById('storyText');
const versusResultScreen = document.getElementById('versusResultScreen');
const campaignEndingScreen = document.getElementById('campaignEndingScreen');
const trainingCompleteScreen = document.getElementById('trainingCompleteScreen');
const audioReady = import(new URL('./Js/audioManager.js', document.baseURI).href);
let audio;
let screen = 'menu';
let transitioning = false;
let fatalError = null;
let progress = { loaded: 0, total: 0 };
let focusBeforePause = null;
let selectedMode = 'story';
let resumeStory = false;
let storyCallbacks = {};
let versusCallbacks = {};
let endingCallbacks = {};
let trainingCallbacks = {};
let storyFilm = null;
let storyFilmToken = 0;
let storyFrames = [];
let storyFrameIndex = 0;
let storyFilmState = null;
let storyImageRefs = [];
let failedStoryImages = new Set();
let storyFallbackImage = '';
let narrationReady = null;
let narrationEnabled = true;
try {
    const savedNarration = localStorage.getItem('bimu:narration:v1');
    if (savedNarration !== null) narrationEnabled = JSON.parse(savedNarration) !== false;
} catch { /* A preferência ainda funciona durante a sessão. */ }


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
window.addEventListener('audio:volumechange', event => {
    syncVolumes(event.detail);
    storyFilm?.setVolume(event.detail.effects);
});
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

function refreshStoryProgress() {
    let hasSave = false;
    try { hasSave = Boolean(window.hasStorySave?.()); } catch { /* A campanha também funciona sem armazenamento. */ }
    document.getElementById('continueStoryButton').hidden = !hasSave;
    document.getElementById('startButton').textContent = hasSave ? 'Nova história' : 'História · A Última Nota';
}
window.addEventListener('game:progresschanged', refreshStoryProgress);
window.addEventListener('load', refreshStoryProgress);

function startGame(options = {}) {
    if (['story', 'endless', 'versus', 'practice'].includes(options.mode)) selectedMode = options.mode;
    if (typeof options.resume === 'boolean') resumeStory = options.resume;
    document.activeElement?.blur();
    hideScreens();
    hideStoryScene();
    versusResultScreen.hidden = true;
    campaignEndingScreen.hidden = true;
    trainingCompleteScreen.hidden = true;
    overlay.style.display = 'none';
    document.body.classList.add('is-playing');
    canvas.classList.remove('hidden');
    canvas.style.display = 'block';
    screen = 'playing';
    window.jogoIniciado = true;
    document.getElementById('replayStoryButton').hidden = selectedMode !== 'story';
    window.dispatchEvent(new CustomEvent('game:start', { detail: { mode: selectedMode, resume: resumeStory } }));
}

function showMainMenu() {
    document.activeElement?.blur();
    hideScreens();
    hideStoryScene();
    pauseScreen.hidden = true;
    versusResultScreen.hidden = true;
    campaignEndingScreen.hidden = true;
    trainingCompleteScreen.hidden = true;
    document.getElementById('piano-container-wrapper').classList.add('hidden');
    canvas.classList.add('hidden');
    canvas.style.display = 'none';
    document.body.classList.remove('is-playing');
    overlay.style.display = 'block';
    mainMenu.style.display = 'block';
    screen = 'menu';
    transitioning = false;
    focusBeforePause = null;
    window.jogoIniciado = false;
    refreshStoryProgress();
    audioReady.then(module => module.playMenuMusic()).catch(() => {});
    const preferred = document.getElementById('continueStoryButton');
    (preferred.hidden ? document.getElementById('startButton') : preferred).focus();
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
    hideStoryScene();
    showPauseScreen(false);
    versusResultScreen.hidden = true;
    campaignEndingScreen.hidden = true;
    trainingCompleteScreen.hidden = true;
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
    hideStoryScene();
    canvas.classList.add('hidden');
    canvas.style.display = 'none';
    levelNumber.textContent = level;
    loadingTitle.textContent = 'Entrando na fase:';
    loadingScreen.style.display = 'flex';
    setLoadingProgress(progress.loaded, progress.total);
    try {
        if (!window.gameReady && document.readyState !== 'complete') {
            await new Promise(resolve => window.addEventListener('load', resolve, { once: true }));
        }
        if (!window.gameReady) throw new Error('O módulo do jogo não pôde ser carregado.');
        await window.gameReady;
        if (fatalError) return false;
        loadingBar.style.width = '100%';
        loadingProgress.setAttribute('aria-valuenow', '100');
        loadingTip.textContent = selectedMode === 'versus' ? 'Dois jogadores. Um duelo.' : 'Prepare sua espada.';
        await new Promise(resolve => setTimeout(resolve, 300));
        if (fatalError) return false;
        loadingScreen.style.display = 'none';
        await onComplete?.();
        // O callback pode ter aberto uma cena antes do próximo duelo.
        if (screen === 'loading') screen = 'playing';
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
    hideStoryScene();
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
        document.getElementById('replayStoryButton').hidden = selectedMode !== 'story';
        document.getElementById('resumeButton').focus();
    } else {
        if (pauseScreen.contains(document.activeElement)) document.activeElement.blur();
        pauseScreen.hidden = true;
        if (focusBeforePause?.isConnected && focusBeforePause.getClientRects().length > 0) focusBeforePause.focus();
        focusBeforePause = null;
    }
}

function narrationModule() {
    if (!narrationReady) {
        narrationReady = import(new URL('./Js/narration.js', document.baseURI).href).catch(error => {
            narrationReady = null;
            throw error;
        });
    }
    return narrationReady;
}

function storyImageURL(image) {
    const path = typeof image === 'string' ? image : image?.src;
    if (!path) return '';
    try { return new URL(path, document.baseURI).href; } catch { return ''; }
}

function preloadStoryFrames(token) {
    const sources = new Set(storyFrames.map(frame => storyImageURL(frame.image)).filter(Boolean));
    storyImageRefs = [...sources].map(source => {
        const image = new Image();
        image.onerror = () => {
            if (token !== storyFilmToken || storyScreen.hidden) return;
            failedStoryImages.add(source);
            if (storyImageURL(storyFrames[storyFrameIndex]?.image) === source) {
                document.getElementById('storyArt').style.backgroundImage = storyFallbackImage
                    ? `url("${storyFallbackImage}")` : '';
            }
        };
        image.src = source;
        return image;
    });
}

function renderStoryFrame(frame, index, total) {
    storyFrameIndex = index;
    storyText.replaceChildren();
    const line = document.createElement('p');
    line.textContent = frame.text;
    if (frame.text.startsWith('—')) line.className = 'story-dialogue';
    storyText.appendChild(line);
    const source = storyImageURL(frame.image);
    const image = failedStoryImages.has(source) ? storyFallbackImage : source;
    const art = document.getElementById('storyArt');
    art.style.backgroundImage = image ? `url("${image}")` : '';
    art.style.animationName = index % 2 ? 'storyDriftRight' : 'storyDriftLeft';
    document.getElementById('storyFrameCounter').textContent = `${index + 1} / ${total}`;
    document.getElementById('storyPreviousFrameButton').disabled = index === 0;
    document.getElementById('storyNextFrameButton').disabled = index >= total - 1;
    const percent = Math.round((index + 1) / total * 100);
    document.getElementById('storyFrameProgress').setAttribute('aria-valuenow', percent);
    document.getElementById('storyFrameProgressFill').style.width = `${percent}%`;
}

function renderStoryFilmState(state) {
    storyFilmState = state;
    const play = document.getElementById('storyPlayButton');
    play.textContent = state.ended ? 'Reproduzir de novo' : state.playing ? 'Pausar filme' : 'Reproduzir filme';
    play.setAttribute('aria-pressed', String(state.playing));
    const voice = document.getElementById('storyVoiceButton');
    voice.textContent = narrationEnabled ? 'Voz ligada' : 'Voz desligada';
    voice.setAttribute('aria-pressed', String(narrationEnabled));
    document.getElementById('storyArt').style.animationPlayState = state.playing ? 'running' : 'paused';
    let status;
    if (state.ended) status = 'Fim do trecho. Continue a jornada quando estiver pronto.';
    else if (!state.playing) status = 'Filme pausado. Reproduza para continuar este quadro.';
    else if (!narrationEnabled || state.volume === 0) status = 'Filme com legendas · os quadros avançam automaticamente.';
    else if (!state.voiceAvailable) status = 'Voz indisponível neste navegador. Acompanhe pelas legendas.';
    else status = state.narrating ? 'Narração em português · acompanhe pelas legendas.' : 'Filme em reprodução.';
    document.getElementById('storyFilmStatus').textContent = status;
}

async function startStoryFilm(token) {
    try {
        const module = await narrationModule();
        if (token !== storyFilmToken || storyScreen.hidden) return;
        storyFilm = new module.StoryFilm({
            volume: audio?.getVolumes().effects ?? 0.5,
            onFrame: (frame, index, total) => {
                if (token === storyFilmToken && !storyScreen.hidden) renderStoryFrame(frame, index, total);
            },
            onState: state => {
                if (token === storyFilmToken && !storyScreen.hidden) renderStoryFilmState(state);
            },
            onEnd: () => {
                if (token === storyFilmToken && !storyScreen.hidden) {
                    document.getElementById('storyFilmStatus').textContent = 'Fim do trecho. Continue a jornada quando estiver pronto.';
                }
            }
        });
        storyFilm.load(storyFrames, { voiceEnabled: narrationEnabled });
        document.getElementById('storyPlayButton').disabled = false;
        document.getElementById('storyReplayButton').disabled = false;
        storyFilm.play();
        if (document.hidden || !document.hasFocus()) storyFilm.pause();
    } catch (error) {
        if (token !== storyFilmToken || storyScreen.hidden) return;
        console.error('Falha ao preparar o filme narrado:', error);
        // A leitura e os controles manuais continuam disponíveis se o módulo não carregar.
        document.getElementById('storyFilmStatus').textContent = 'Use Anterior e Próximo para acompanhar a história.';
        document.getElementById('storyPlayButton').disabled = true;
        document.getElementById('storyReplayButton').disabled = false;
        renderStoryFrame(storyFrames[storyFrameIndex], storyFrameIndex, storyFrames.length);
    }
}

function showStoryScene(scene, callbacks = {}) {
    showPauseScreen(false);
    hideStoryScene();
    const token = ++storyFilmToken;
    storyCallbacks = callbacks;
    document.getElementById('storyChapter').textContent = scene.chapter || 'A ÚLTIMA NOTA';
    document.getElementById('storyTitle').textContent = scene.title || 'A Jornada do Samurai';
    const paragraphs = scene.paragraphs ?? scene.text ?? [];
    const fallback = typeof (scene.art || scene.background) === 'string'
        ? scene.art || scene.background : (scene.art || scene.background)?.src;
    const frames = scene.frames?.length ? scene.frames : (Array.isArray(paragraphs) ? paragraphs : [paragraphs]);
    storyFrames = (frames.length ? frames : [scene.title || 'A Última Nota']).map(frame => {
        const item = typeof frame === 'string' ? { text: frame } : frame;
        return { ...item, text: String(item.text || ''), image: item.image || fallback };
    });
    failedStoryImages = new Set();
    storyFallbackImage = storyImageURL(scene.background);
    storyFilmState = null;
    document.getElementById('storyPlayButton').disabled = true;
    document.getElementById('storyReplayButton').disabled = true;
    document.getElementById('storyPlayButton').textContent = 'Pausar filme';
    document.getElementById('storyVoiceButton').textContent = narrationEnabled ? 'Voz ligada' : 'Voz desligada';
    document.getElementById('storyVoiceButton').setAttribute('aria-pressed', String(narrationEnabled));
    document.getElementById('storyFilmStatus').textContent = 'Preparando narração…';
    renderStoryFrame(storyFrames[0], 0, storyFrames.length);
    document.getElementById('storyPreviousFrameButton').disabled = true;
    document.getElementById('storyNextFrameButton').disabled = true;
    document.getElementById('storyContinueButton').textContent = scene.continueLabel || 'Continuar jornada · ENTER';
    storyScreen.hidden = false;
    storyScreen.scrollTop = 0;
    screen = 'story';
    document.activeElement?.blur();
    document.getElementById('storyContinueButton').focus();
    preloadStoryFrames(token);
    startStoryFilm(token);
}

function hideStoryScene() {
    storyFilmToken++;
    storyFilm?.destroy();
    storyFilm = null;
    storyFilmState = null;
    for (const image of storyImageRefs) image.onerror = image.onload = null;
    storyImageRefs = [];
    if (storyScreen.contains(document.activeElement)) document.activeElement.blur();
    storyScreen.hidden = true;
    storyCallbacks = {};
    if (screen === 'story') screen = 'playing';
}

function moveStoryFrame(direction) {
    if (storyScreen.hidden) return;
    if (storyFilm) {
        if (direction < 0) storyFilm.previous();
        else storyFilm.next();
    } else {
        const next = Math.max(0, Math.min(storyFrames.length - 1, storyFrameIndex + direction));
        renderStoryFrame(storyFrames[next], next, storyFrames.length);
    }
}

function finishStory(skip = false) {
    if (storyScreen.hidden) return;
    const callback = skip ? storyCallbacks.onSkip || storyCallbacks.onContinue : storyCallbacks.onContinue;
    hideStoryScene();
    unlockAudio();
    callback?.();
}

function showVersusResult(options = {}) {
    showPauseScreen(false);
    hideStoryScene();
    versusCallbacks = options;
    const { winner, scores = [0, 0], matchOver = false } = options;
    document.getElementById('versusResultTitle').textContent = winner
        ? `${winner} ${matchOver ? 'venceu a partida' : 'venceu o round'}` : 'Empate';
    document.getElementById('versusResultScore').textContent = `${scores[0]} : ${scores[1]}`;
    document.getElementById('versusResultDescription').textContent = matchOver
        ? 'A partida terminou. Prontos para mais um duelo?' : winner ? 'Melhor de três rounds. Preparem-se para o próximo.' : 'Ninguém leva o ponto. O duelo continua.';
    document.getElementById('versusNextButton').hidden = matchOver;
    document.getElementById('versusRematchButton').hidden = !matchOver;
    versusResultScreen.hidden = false;
    screen = 'versus-result';
    document.activeElement?.blur();
    document.getElementById(matchOver ? 'versusRematchButton' : 'versusNextButton').focus();
}

function showCampaignEnding(callbacks = {}) {
    showPauseScreen(false);
    hideStoryScene();
    endingCallbacks = callbacks;
    campaignEndingScreen.hidden = false;
    screen = 'ending';
    refreshStoryProgress();
    document.activeElement?.blur();
    document.getElementById('campaignMenuButton').focus();
}

function showTrainingComplete(callbacks = {}) {
    showPauseScreen(false);
    hideStoryScene();
    versusResultScreen.hidden = true;
    campaignEndingScreen.hidden = true;
    trainingCallbacks = callbacks;
    trainingCompleteScreen.hidden = false;
    screen = 'training-result';
    document.activeElement?.blur();
    document.getElementById('trainingRetryButton').focus();
}

function goToMenu() {
    unlockAudio();
    window.dispatchEvent(new CustomEvent('game:menu'));
}

function showControls(mode = 'story', resume = false) {
    if (screen !== 'menu') return;
    selectedMode = mode;
    resumeStory = resume;
    unlockAudio();
    audioReady.then(module => module.playMenuMusic()).catch(() => {});
    hideScreens();
    const versus = mode === 'versus';
    const practice = mode === 'practice';
    document.getElementById('singlePlayerControls').hidden = versus;
    document.getElementById('versusControls').hidden = !versus;
    document.getElementById('practiceBriefing').hidden = !practice;
    document.getElementById('controlsMode').textContent = versus ? 'VERSUS 1x1 · LOCAL' : practice ? 'TREINO · DEFESA E PARRY' : mode === 'story' ? 'HISTÓRIA · A ÚLTIMA NOTA' : 'ARENAS SEM FIM';
    document.getElementById('controlsTitle').textContent = versus ? 'Dois jogadores. Um duelo.' : practice ? 'Domine a defesa' : resume ? 'Continuar a jornada' : 'Prepare sua jornada';
    document.getElementById('playButton').textContent = versus ? 'Preparar duelo' : practice ? 'Entrar no treino' : resume ? 'Continuar história' : 'Jogar';
    screen = 'controls';
    controlsScreen.style.display = 'block';
    document.getElementById('playButton').focus();
}

function requestPlay() {
    if (screen !== 'controls') return;
    unlockAudio();
    let level = 1;
    if (selectedMode === 'story' && resumeStory) {
        const savedStage = window.getStoryProgress?.()?.stage;
        if (Number.isInteger(savedStage) && savedStage >= 0 && savedStage < 10) level = savedStage + 1;
    }
    showLoadingScreen(level, startGame);
}

document.getElementById('startButton').addEventListener('click', () => showControls('story'));
document.getElementById('continueStoryButton').addEventListener('click', () => showControls('story', true));
document.getElementById('endlessButton').addEventListener('click', () => showControls('endless'));
document.getElementById('versusButton').addEventListener('click', () => showControls('versus'));
document.getElementById('trainingButton').addEventListener('click', () => showControls('practice'));
document.getElementById('controlsBackButton').addEventListener('click', showMainMenu);
document.getElementById('playButton').addEventListener('click', requestPlay);
document.getElementById('restartButton').addEventListener('click', goToMenu);
reloadButton.addEventListener('click', () => window.location.reload());
document.getElementById('returnMenuButton').addEventListener('click', goToMenu);
document.getElementById('replayStoryButton').addEventListener('click', () => {
    window.dispatchEvent(new CustomEvent('game:replay-story'));
});
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
document.getElementById('storyContinueButton').addEventListener('click', () => finishStory());
document.getElementById('storySkipButton').addEventListener('click', () => finishStory(true));
document.getElementById('storyPreviousFrameButton').addEventListener('click', () => moveStoryFrame(-1));
document.getElementById('storyNextFrameButton').addEventListener('click', () => moveStoryFrame(1));
document.getElementById('storyPlayButton').addEventListener('click', () => {
    unlockAudio();
    if (!storyFilm) return;
    if (storyFilmState?.ended) storyFilm.replay();
    else if (storyFilmState?.playing) storyFilm.pause();
    else storyFilm.play();
});
document.getElementById('storyVoiceButton').addEventListener('click', () => {
    narrationEnabled = !narrationEnabled;
    try { localStorage.setItem('bimu:narration:v1', JSON.stringify(narrationEnabled)); } catch { /* Somente nesta sessão. */ }
    unlockAudio();
    storyFilm?.setVoiceEnabled(narrationEnabled);
    document.getElementById('storyVoiceButton').textContent = narrationEnabled ? 'Voz ligada' : 'Voz desligada';
    document.getElementById('storyVoiceButton').setAttribute('aria-pressed', String(narrationEnabled));
});
document.getElementById('storyReplayButton').addEventListener('click', () => {
    unlockAudio();
    if (storyFilm) storyFilm.replay();
    else renderStoryFrame(storyFrames[0], 0, storyFrames.length);
});
document.addEventListener('visibilitychange', () => {
    if (document.hidden && !storyScreen.hidden) storyFilm?.pause();
});
window.addEventListener('blur', () => {
    if (!storyScreen.hidden) storyFilm?.pause();
});
document.getElementById('versusNextButton').addEventListener('click', () => {
    const callback = versusCallbacks.onNextRound;
    versusResultScreen.hidden = true;
    screen = 'playing';
    document.activeElement?.blur();
    callback?.();
});
document.getElementById('versusRematchButton').addEventListener('click', () => {
    const callback = versusCallbacks.onRematch;
    versusResultScreen.hidden = true;
    screen = 'playing';
    document.activeElement?.blur();
    callback?.();
});
document.getElementById('versusMenuButton').addEventListener('click', () => {
    if (versusCallbacks.onMenu) versusCallbacks.onMenu();
    else goToMenu();
});
document.getElementById('campaignMenuButton').addEventListener('click', () => {
    if (endingCallbacks.onMenu) endingCallbacks.onMenu();
    else goToMenu();
});
document.getElementById('campaignReplayButton').addEventListener('click', () => {
    const callback = endingCallbacks.onReplay;
    campaignEndingScreen.hidden = true;
    trainingCompleteScreen.hidden = true;
    callback?.();
});

document.getElementById('trainingRetryButton').addEventListener('click', () => {
    if (trainingCompleteScreen.hidden) return;
    const callback = trainingCallbacks.onRetry;
    trainingCompleteScreen.hidden = true;
    screen = 'playing';
    document.activeElement?.blur();
    unlockAudio();
    callback?.();
});
document.getElementById('trainingMenuButton').addEventListener('click', () => {
    if (trainingCompleteScreen.hidden) return;
    if (trainingCallbacks.onMenu) trainingCallbacks.onMenu();
    else goToMenu();
});

function activeDialog() {
    if (!pauseScreen.hidden) return pauseScreen;
    if (!storyScreen.hidden) return storyScreen;
    if (!versusResultScreen.hidden) return versusResultScreen;
    if (!campaignEndingScreen.hidden) return campaignEndingScreen;
    if (!trainingCompleteScreen.hidden) return trainingCompleteScreen;
    return null;
}

document.addEventListener('keydown', event => {
    // Enter mantido não pode acionar nativamente o próximo botão que recebeu foco.
    if (event.key === 'Enter' && event.repeat) {
        event.preventDefault();
        return;
    }
    const dialog = activeDialog();
    if (event.key === 'Tab' && dialog) {
        const focusable = [...dialog.querySelectorAll('button, input')].filter(element => !element.hidden && !element.disabled);
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (event.shiftKey && document.activeElement === first) {
            event.preventDefault();
            last?.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
            event.preventDefault();
            first?.focus();
        }
        return;
    }
    if (event.key !== 'Enter') return;
    if (event.target.matches?.('input, button, select, textarea')) return;
    if (screen === 'menu') {
        event.preventDefault();
        showControls('story');
    } else if (screen === 'controls') {
        event.preventDefault();
        requestPlay();
    }
});

// A narrativa captura seus atalhos antes de os controles de combate receberem as teclas.
document.addEventListener('keydown', event => {
    if (storyScreen.hidden || !pauseScreen.hidden) return;
    if (event.repeat) {
        if (event.key === 'Enter' || event.key === 'Escape' || event.code === 'Space') event.preventDefault();
        event.stopPropagation();
        return;
    }
    if (event.key === 'Escape') {
        event.preventDefault();
        event.stopPropagation();
        finishStory(true);
    } else if (event.key === 'Enter' && !event.target.matches?.('button, input, select, textarea')) {
        event.preventDefault();
        event.stopPropagation();
        finishStory();
    } else if (event.key !== 'Tab') {
        event.stopPropagation();
    }
}, true);

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

Object.assign(window, {
    startGame, showMainMenu, showLoadingScreen, setLoadingProgress, showLoadError,
    showGameOverScreen, showPauseScreen, showStoryScene, hideStoryScene,
    showVersusResult, showCampaignEnding, showTrainingComplete, refreshStoryProgress
});
createLeaves();
refreshStoryProgress();
