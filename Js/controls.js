import { GAME_CONFIG } from './gameConfig.js';

function createInput() {
    return {
        a: { pressed: false }, d: { pressed: false }, s: { pressed: false },
        w: { pressed: false, hold: false }, space: { pressed: false, hold: false, bufferTime: 0 },
        e: { pressed: false, hold: false }, q: { pressed: false, hold: false },
        escape: { pressed: false, hold: false }, ready: { pressed: false, hold: false },
        lastDirection: 'd', lastMovementPress: { key: null, time: 0 }, isRunning: false
    };
}

export const keys = createInput();
export const keys2 = createInput();
const inputs = [keys, keys2];

export function resetKeys() {
    for (const input of inputs) {
        for (const value of Object.values(input)) {
            if (value && typeof value === 'object' && 'pressed' in value) {
                value.pressed = false;
                if ('hold' in value) value.hold = false;
                if ('bufferTime' in value) value.bufferTime = 0;
            }
        }
        input.isRunning = false;
        input.lastMovementPress = { key: null, time: 0 };
    }
}

// Buffers use simulation time, including impact pauses, and are cleared on pause/menu.
export function updateInputBuffers(deltaTime) {
    const dt = Number.isFinite(deltaTime) ? Math.max(0, deltaTime) : 0;
    for (const input of inputs) input.space.bufferTime = Math.max(0, input.space.bufferTime - dt);
}

// Each physical press signals readiness once. Releasing the key permits a new press.
export function consumeReady(playerIndex) {
    const ready = inputs[playerIndex]?.ready;
    if (!ready?.pressed || ready.hold) return false;
    ready.hold = true;
    return true;
}

export function handleControls(player, input = keys, { allowPotion = true } = {}) {
    player.velocity.x = 0;
    // Observe press/release even during stun or recovery. Holding guard through an
    // interruption must not open a fresh parry window when the action unlocks.
    if (input.s.pressed) player.protect();
    else player.stopProtecting();
    if (player.isActionLocked) return;
    if (input.s.pressed && player.onGround) return;

    let sprite = player.onGround ? 'idle' : 'jumping';
    const direction = input[input.lastDirection]?.pressed
        ? input.lastDirection : input.a.pressed ? 'a' : input.d.pressed ? 'd' : null;
    if (direction) {
        player.facing = direction === 'a' ? 'left' : 'right';
        player.velocity.x = (direction === 'a' ? -1 : 1) * (input.isRunning ? 5.5 : 3);
        if (player.onGround) sprite = input.isRunning ? 'running' : 'walk';
    }
    if (input.w.pressed && !input.w.hold) {
        player.jump();
        input.w.hold = true;
        sprite = 'jumping';
    }
    if (input.space.pressed && !input.space.hold || input.space.bufferTime > 0) {
        const started = player.attack();
        input.space.hold = true;
        if (started) input.space.bufferTime = 0;
    }
    if (input.e.pressed && !input.e.hold) {
        if (allowPotion) player.usePotion();
        input.e.hold = true;
    }
    player.setSprite(sprite);
}

function binding(event) {
    const key = event.key.toLowerCase();
    const second = {
        arrowleft: 'a', arrowright: 'd', arrowup: 'w', arrowdown: 's', l: 'space', enter: 'ready'
    }[key];
    if (second) return [keys2, second];
    const first = event.code === 'Space' || key === ' ' ? 'space' : key === 'f' ? 'ready' : key;
    if (keys[first] && typeof keys[first] === 'object' && 'pressed' in keys[first]) return [keys, first];
    return null;
}

window.addEventListener('keydown', event => {
    const mapped = binding(event);
    if (!mapped) return;
    if (event.target?.closest?.('input, button, select, textarea')) return;
    if (window.jogoIniciado) event.preventDefault();
    if (event.repeat) return;
    const [input, key] = mapped;
    input[key].pressed = true;
    if (key === 'space') input.space.bufferTime = GAME_CONFIG.ATTACK_INPUT_BUFFER;
    if (key === 'a' || key === 'd') {
        const now = performance.now();
        input.isRunning = input.lastMovementPress.key === key &&
            now - input.lastMovementPress.time < GAME_CONFIG.DOUBLE_TAP_WINDOW;
        input.lastMovementPress = { key, time: now };
        input.lastDirection = key;
    }
});

window.addEventListener('keyup', event => {
    const mapped = binding(event);
    if (!mapped) return;
    const [input, key] = mapped;
    input[key].pressed = false;
    if ('hold' in input[key]) input[key].hold = false;
    if (key === 'a' || key === 'd') input.isRunning = false;
});

window.addEventListener('blur', resetKeys);
document.addEventListener('visibilitychange', () => {
    if (document.hidden) resetKeys();
});
