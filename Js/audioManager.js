const STORAGE_KEY = 'bimu:audio';
const defaults = { music: 0.35, effects: 0.5 };
const clampVolume = value => Math.min(1, Math.max(0, Number.isFinite(Number(value)) ? Number(value) : 0));
let volumes = { ...defaults };

try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (saved && typeof saved === 'object') {
        for (const channel of Object.keys(defaults)) {
            if (typeof saved[channel] === 'number' && Number.isFinite(saved[channel])) {
                volumes[channel] = clampVolume(saved[channel]);
            }
        }
    }
} catch {
    // O áudio continua disponível quando o navegador impede o armazenamento local.
}

let menuMusic;
let gameMusic;
let currentTrack = null;
let musicPaused = false;
let audioContext;
let effectsGain;

export function initAudio() {
    if (menuMusic) return;
    menuMusic = new Audio(new URL('../assets/audio/menu-music.wav', import.meta.url).href);
    gameMusic = new Audio(new URL('../assets/audio/game-music.wav', import.meta.url).href);
    for (const track of [menuMusic, gameMusic]) {
        track.loop = true;
        track.preload = 'auto';
        track.volume = volumes.music;
    }
}

function tryPlay(track) {
    if (!track) return;
    try {
        const playback = track.play();
        if (playback?.catch) playback.catch(() => {});
    } catch {
        // Uma nova interação do jogador pode liberar a reprodução.
    }
}

function playTrack(track) {
    if (currentTrack !== track) {
        currentTrack?.pause();
        if (currentTrack) currentTrack.currentTime = 0;
        currentTrack = track;
    }
    musicPaused = false;
    tryPlay(currentTrack);
}

export function playMenuMusic() {
    initAudio();
    playTrack(menuMusic);
}

export function playGameMusic() {
    initAudio();
    playTrack(gameMusic);
}

export function pauseMusic() {
    musicPaused = true;
    currentTrack?.pause();
}

export function resumeMusic() {
    musicPaused = false;
    tryPlay(currentTrack);
}

export function getVolumes() {
    return { ...volumes };
}

function saveVolumes() {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(volumes));
    } catch {
        // As configurações ainda funcionam durante esta sessão.
    }
    window.dispatchEvent(new CustomEvent('audio:volumechange', { detail: getVolumes() }));
}

export function setMusicVolume(value) {
    volumes.music = clampVolume(value);
    for (const track of [menuMusic, gameMusic]) {
        if (track) track.volume = volumes.music;
    }
    saveVolumes();
}

export function setEffectsVolume(value) {
    volumes.effects = clampVolume(value);
    if (effectsGain) effectsGain.gain.setTargetAtTime(volumes.effects, audioContext.currentTime, 0.01);
    saveVolumes();
}

export function unlockAudio() {
    initAudio();
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (AudioContextClass && !audioContext) {
        try {
            audioContext = new AudioContextClass();
            effectsGain = audioContext.createGain();
            effectsGain.gain.value = volumes.effects;
            effectsGain.connect(audioContext.destination);
        } catch {
            audioContext = null;
        }
    }
    if (audioContext?.state === 'suspended') audioContext.resume().catch(() => {});
    if (!musicPaused && currentTrack?.paused) tryPlay(currentTrack);
}

export function playEffect(type) {
    if (!['swing', 'hit', 'block', 'parried', 'guard-break', 'counter'].includes(type) || volumes.effects === 0) return;
    unlockAudio();
    if (!audioContext || audioContext.state !== 'running') return;

    const now = audioContext.currentTime;
    const duration = type === 'guard-break' ? 0.18 : type === 'parried' ? 0.14 : type === 'swing' ? 0.12 : 0.09;
    const oscillator = audioContext.createOscillator();
    const envelope = audioContext.createGain();
    oscillator.type = type === 'parried' ? 'sine' : type === 'guard-break' ? 'sawtooth' : type === 'block' ? 'square' : 'triangle';
    oscillator.frequency.setValueAtTime(type === 'parried' ? 1500 : type === 'guard-break' ? 280 : type === 'counter' ? 240 : type === 'block' ? 1200 : type === 'hit' ? 160 : 500, now);
    oscillator.frequency.exponentialRampToValueAtTime(type === 'parried' ? 2200 : type === 'block' ? 480 : 45, now + duration);
    envelope.gain.setValueAtTime(0.0001, now);
    envelope.gain.exponentialRampToValueAtTime(type === 'swing' ? 0.12 : 0.22, now + 0.005);
    envelope.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    oscillator.connect(envelope);
    envelope.connect(effectsGain);
    oscillator.start(now);
    oscillator.stop(now + duration);
    oscillator.onended = () => {
        oscillator.disconnect();
        envelope.disconnect();
    };
}
