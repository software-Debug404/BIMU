import { GAME_CONFIG } from './gameConfig.js';

const keys = {
    a: { pressed: false },
    d: { pressed: false },
    w: { pressed: false, hold: false },
    space: { pressed: false, hold: false },
    s: { pressed: false },
    e: { pressed: false, hold: false },
    q: { pressed: false, hold: false }, 
    escape: { pressed: false, hold: false }, 
    lastDirection: 'right',
    lastMovementPress: { key: null, time: 0 },
    isRunning: false
};

export { keys };

export function handleControls(player) {
    if (!player || player.dead) {
        if (player) player.velocity.x = 0;
        return;
    }

    if (keys.s.pressed) {
        player.velocity.x = 0;
        player.protect();
        return;
    } else {
        if (player.isProtecting) player.stopProtecting();
    }

    if (player.isAttacking || player.isHealing) {
        player.velocity.x = 0;
        return;
    }

    let intendedSprite = 'idle';
    if (!player.onGround) {
        intendedSprite = 'jumping';
    }

    player.velocity.x = 0;

    if (keys.a.pressed && keys.lastDirection === 'a') {
        player.velocity.x = keys.isRunning ? -5.5 : -3.0;
        player.facing = "left";
        if (player.onGround) intendedSprite = keys.isRunning ? 'running' : 'walk';
    } else if (keys.d.pressed && keys.lastDirection === 'd') {
        player.velocity.x = keys.isRunning ? 5.5 : 3.0;
        player.facing = "right";
        if (player.onGround) intendedSprite = keys.isRunning ? 'running' : 'walk';
    }

    if (keys.w.pressed && !keys.w.hold) {
        player.jump();
        keys.w.hold = true;
        intendedSprite = 'jumping';
    }
    
    if (keys.space.pressed && !keys.space.hold) {
        player.attack();
        keys.space.hold = true;
    }

    if (keys.e.pressed && !keys.e.hold) {
        player.usePotion();
        keys.e.hold = true;
    }
    
    player.setSprite(intendedSprite);
}


window.addEventListener("keydown", e => {
    const key = e.key.toLowerCase();
    switch(key) {
        case "a": 
            keys.a.pressed = true;
            keys.lastDirection = 'a';
            const nowA = performance.now();
            if (keys.lastMovementPress.key === 'a' && (nowA - keys.lastMovementPress.time < GAME_CONFIG.DOUBLE_TAP_WINDOW)) {
                keys.isRunning = true;
            }
            keys.lastMovementPress = { key: 'a', time: nowA };
            break;
        case "d": 
            keys.d.pressed = true;
            keys.lastDirection = 'd';
            const nowD = performance.now();
            if (keys.lastMovementPress.key === 'd' && (nowD - keys.lastMovementPress.time < GAME_CONFIG.DOUBLE_TAP_WINDOW)) {
                keys.isRunning = true;
            }
            keys.lastMovementPress = { key: 'd', time: nowD };
            break;
        case "w": keys.w.pressed = true; break;
        case "s": keys.s.pressed = true; break;
        case "e": keys.e.pressed = true; break;
        case "q": keys.q.pressed = true; break;
        case "escape": keys.escape.pressed = true; break;
        case " ": keys.space.pressed = true; break;
    }
});

window.addEventListener("keyup", e => {
    const key = e.key.toLowerCase();
    switch(key) {
        case "a": 
            keys.a.pressed = false;
            keys.isRunning = false;
            break;
        case "d": 
            keys.d.pressed = false;
            keys.isRunning = false;
            break;
        case "w": 
            keys.w.pressed = false;
            keys.w.hold = false;
            break;
        case "s": 
            keys.s.pressed = false;
            break;
        case "e": 
            keys.e.pressed = false;
            keys.e.hold = false;
            break;
        case "q": 
            keys.q.pressed = false;
            keys.q.hold = false;
            break;
        case "escape": 
            keys.escape.pressed = false;
            keys.escape.hold = false;
            break;
        case " ":
            keys.space.pressed = false;
            keys.space.hold = false;
            break;
    }
});