// --- Novo Arquivo: js/audioManager.js ---

let menuMusic;
let gameMusic;
let currentTrack = null; // Para saber qual música pausar/retomar

// Inicializa os elementos de áudio
export function initAudio() {
    menuMusic = new Audio('../assets/audio/menu-music.wav');
    menuMusic.loop = true; // A música do menu tocará em loop

    gameMusic = new Audio('../assets/audio/game-music.wav');
    gameMusic.loop = true; // A música do jogo tocará em loop
}

// Para de tocar todas as músicas
function stopAllMusic() {
    if (menuMusic) { // Verifica se menuMusic existe
        menuMusic.pause();
        menuMusic.currentTime = 0;
    }
    if (gameMusic) { // Verifica se gameMusic existe
        gameMusic.pause();
        gameMusic.currentTime = 0;
    }
    currentTrack = null;
}
// Toca a música do menu
export function playMenuMusic() {
    stopAllMusic();
    menuMusic.play().catch(e => console.error("Erro ao tocar música do menu:", e));
    currentTrack = menuMusic;
}

// Toca a música do jogo
export function playGameMusic() {
    stopAllMusic();
    gameMusic.play().catch(e => console.error("Erro ao tocar música do jogo:", e));
    currentTrack = gameMusic;
}

// Pausa a música que estiver tocando
export function pauseMusic() {
    if (currentTrack) {
        currentTrack.pause();
    }
}

// Retoma a música que estava pausada
export function resumeMusic() {
    if (currentTrack) {
        currentTrack.play().catch(e => console.error("Erro ao retomar a música:", e));
    }
}