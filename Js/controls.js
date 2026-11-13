import { GAME_CONFIG } from './gameConfig.js';

export const keys = {
    a: { pressed: false }, d: { pressed: false }, s: { pressed: false },
    w: { pressed: false, hold: false }, space: { pressed: false, hold: false },
    e: { pressed: false, hold: false }, q: { pressed: false, hold: false },
    escape: { pressed: false, hold: false },
    lastDirection: 'd', lastMovementPress: { key: null, time: 0 }, isRunning: false
};

export function resetKeys() {
    for (const value of Object.values(keys)) {
        if (value && typeof value === 'object' && 'pressed' in value) {
            value.pressed = false;
            if ('hold' in value) value.hold = false;
        }
    }
    keys.isRunning = false;
    keys.lastMovementPress = { key: null, time: 0 };
}

export function handleControls(player) {
    player.velocity.x = 0;
    if (player.dead) return;

    // Defesa só começa quando a ação anterior terminou; não concede imunidade ao atacar.
    if (player.isAttacking || player.isHealing || player.isHurt) return;
    if (keys.s.pressed && player.onGround) {
        player.protect();
        return;
    }
    player.stopProtecting();

    let sprite = player.onGround ? 'idle' : 'jumping';
    const direction = keys[keys.lastDirection]?.pressed
        ? keys.lastDirection : keys.a.pressed ? 'a' : keys.d.pressed ? 'd' : null;
    if (direction) {
        player.facing = direction === 'a' ? 'left' : 'right';
        player.velocity.x = (direction === 'a' ? -1 : 1) * (keys.isRunning ? 5.5 : 3);
        if (player.onGround) sprite = keys.isRunning ? 'running' : 'walk';
    }
    if (keys.w.pressed && !keys.w.hold) {
        player.jump();
        keys.w.hold = true;
        sprite = 'jumping';
    }
    if (keys.space.pressed && !keys.space.hold) {
        player.attack();
        keys.space.hold = true;
    }
    if (keys.e.pressed && !keys.e.hold) {
        player.usePotion();
        keys.e.hold = true;
    }
    player.setSprite(sprite);
}

function keyName(event) {
    return event.code === 'Space' ? 'space' : event.key.toLowerCase();
}

window.addEventListener('keydown', event => {
    const key = keyName(event);
    if (!keys[key] || typeof keys[key] !== 'object' || !('pressed' in keys[key])) return;
    if (event.target.closest?.('input, button, select, textarea')) return;
    if (window.jogoIniciado) event.preventDefault();
    if (event.repeat) return;
    keys[key].pressed = true;
    if (key === 'a' || key === 'd') {
        const now = performance.now();
        keys.isRunning = keys.lastMovementPress.key === key &&
            now - keys.lastMovementPress.time < GAME_CONFIG.DOUBLE_TAP_WINDOW;
        keys.lastMovementPress = { key, time: now };
        keys.lastDirection = key;
    }
});

window.addEventListener('keyup', event => {
    const key = keyName(event);
    if (!keys[key] || typeof keys[key] !== 'object' || !('pressed' in keys[key])) return;
    keys[key].pressed = false;
    if ('hold' in keys[key]) keys[key].hold = false;
    if (key === 'a' || key === 'd') keys.isRunning = false;
});

window.addEventListener('blur', resetKeys);
document.addEventListener('visibilitychange', () => {
    if (document.hidden) resetKeys();
});
