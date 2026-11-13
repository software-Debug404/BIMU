import { Sprite, Fighter, FighterAI } from '../Js/sprites.js';
import { resolveAttack } from '../Js/combat.js';
import { GAME_CONFIG } from '../Js/gameConfig.js';
import { SimulationClock } from '../Js/clock.js';

const tests = [];
const test = (name, run) => tests.push({ name, run });
function assert(condition, message = 'Condição não atendida') {
    if (!condition) throw new Error(message);
}
function equal(actual, expected, message = '') {
    assert(actual === expected, `${message} Esperado: ${expected}; recebido: ${actual}`);
}
function near(actual, expected, tolerance = 0.00001) {
    assert(Math.abs(actual - expected) <= tolerance, `${actual} difere de ${expected}`);
}

function sprite(frames = 6) {
    return { image: { width: 128 * frames, height: 128 }, totalSpriteFrames: frames, framesPerSpriteFrame: 6 };
}

function fighter(x = 250, y = 240, Type = Fighter) {
    const instance = new Type({
        position: { x, y }, velocity: { x: 0, y: 0 }, scale: 2,
        sprites: {
            idle: sprite(), walk: sprite(8), running: sprite(8), jumping: sprite(9),
            attacking_1: sprite(), attacking_2: sprite(), attacking_3: sprite(),
            protect: sprite(2), hurt: sprite(3), dead: sprite(6),
        },
        availableAttacks: ['attacking_1', 'attacking_2', 'attacking_3'],
    });
    instance.onGround = true;
    return instance;
}

function updateFor(instance, seconds, fps = 60) {
    for (let i = 0; i < Math.round(seconds * fps); i++) instance.update(1 / fps);
}

function activeAttack(instance) {
    instance.attack();
    for (let i = 0; i < 120 && !instance.isAttackActive; i++) instance.update(1 / 60);
    assert(instance.isAttackActive, 'O ataque precisa possuir uma janela ativa');
}

function placeInAttack(attacker, target) {
    const attack = attacker.attackBox;
    const body = target.hurtBox;
    target.position.x += attack.position.x + attack.width / 2 - body.position.x - body.width / 2;
    target.position.y += attack.position.y + attack.height / 2 - body.position.y - body.height / 2;
}

test('O loop executa 60 passos em um segundo com rAF a 30, 60 ou 144 Hz', () => {
    for (const fps of [30, 60, 144]) {
        const clock = new SimulationClock();
        let ticks = 0;
        for (let frame = 0; frame <= fps; frame++) {
            clock.advance(frame * 1000 / fps, dt => {
                near(dt, 1 / 60);
                ticks++;
            });
        }
        equal(ticks, 60, `rAF a ${fps} Hz.`);
    }
});

test('O loop limita atrasos longos e reset não avança o tempo da pausa', () => {
    const clock = new SimulationClock();
    let ticks = 0;
    clock.advance(0, () => ticks++);
    clock.advance(60000, () => ticks++);
    assert(ticks > 0 && ticks <= 6, 'Limitar a recuperação a 100 ms de simulação');
    clock.reset();
    ticks = 0;
    clock.advance(120000, () => ticks++);
    equal(ticks, 0, 'Primeiro frame após reset apenas sincroniza o relógio.');
    clock.advance(120000 + 1000 / 60, () => ticks++);
    equal(ticks, 1);
});

test('Movimento horizontal tem a mesma distância a 30, 60 e 120 atualizações por segundo', () => {
    const positions = [30, 60, 120].map(fps => {
        const actor = fighter(150);
        actor.velocity.x = 3;
        updateFor(actor, 1, fps);
        return actor.position.x;
    });
    near(positions[0], 330);
    positions.forEach(position => near(position, positions[0]));
});

test('Gravidade e velocidade vertical permanecem consistentes entre taxas de atualização', () => {
    const states = [30, 60, 120].map(fps => {
        const actor = fighter(150, -500);
        actor.onGround = false;
        updateFor(actor, 1, fps);
        return { y: actor.position.y, velocity: actor.velocity.y };
    });
    states.forEach(state => {
        near(state.y, states[0].y);
        near(state.velocity, states[0].velocity);
    });
});

test('Animação avança pelo tempo transcorrido em vez do número de atualizações', () => {
    const frames = [30, 60, 120].map(fps => {
        const actor = new Sprite({ position: { x: 0, y: 0 }, sprites: { idle: sprite() } });
        for (let i = 0; i < fps; i++) actor.animate(1 / fps);
        return actor.currentSpriteFrame;
    });
    equal(frames[0], 4);
    frames.forEach(frame => equal(frame, frames[0]));
});

test('O combo aceita o próximo golpe após a animação e expira depois da janela de entrada', () => {
    const actor = fighter();
    for (const [name, frames] of [['attacking_1', 4], ['attacking_2', 5], ['attacking_3', 4]]) {
        actor.sprites[name] = { ...sprite(frames), framesPerSpriteFrame: 8 };
    }
    const finishAttack = () => {
        for (let i = 0; i < 120 && actor.isAttacking; i++) actor.update(1 / 60);
        assert(!actor.isAttacking);
    };
    actor.attack();
    equal(actor.currentSpriteKey, 'attacking_1');
    finishAttack();
    updateFor(actor, 0.2);
    actor.attack();
    equal(actor.currentSpriteKey, 'attacking_2');
    finishAttack();
    updateFor(actor, 0.2);
    actor.attack();
    equal(actor.currentSpriteKey, 'attacking_3');
    finishAttack();
    updateFor(actor, 0.8);
    actor.attack();
    equal(actor.currentSpriteKey, 'attacking_1');
});

test('Receber dano interrompe a sequência do combo', () => {
    const actor = fighter();
    actor.attack();
    actor.takeDamage(10);
    updateFor(actor, 1);
    actor.attack();
    equal(actor.currentSpriteKey, 'attacking_1');
});

test('O corpo usa uma área menor que o quadro transparente do sprite', () => {
    const actor = fighter();
    assert(actor.hurtBox.width < actor.width);
    assert(actor.hurtBox.height < actor.height);
    assert(actor.hurtBox.position.x > actor.position.x);
    assert(actor.hurtBox.position.y > actor.position.y);
});

test('A área de ataque fica à frente do corpo nas duas direções', () => {
    const actor = fighter();
    const center = actor.hurtBox.position.x + actor.hurtBox.width / 2;
    actor.facing = 'right';
    assert(actor.attackBox.position.x + actor.attackBox.width / 2 > center);
    actor.facing = 'left';
    assert(actor.attackBox.position.x + actor.attackBox.width / 2 < center);
});

for (const facing of ['left', 'right']) {
    test(`Golpe para ${facing}: preparo sem dano, acerto ativo e apenas um dano`, () => {
        const attacker = fighter();
        const defender = fighter();
        attacker.facing = facing;
        attacker.attack();
        placeInAttack(attacker, defender);
        equal(resolveAttack(attacker, defender, 10), null, 'Não aplicar dano no preparo.');
        for (let i = 0; i < 120 && !attacker.isAttackActive; i++) attacker.update(1 / 60);
        placeInAttack(attacker, defender);
        const event = resolveAttack(attacker, defender, 10);
        equal(event?.type, 'hit');
        equal(defender.health, 90);
        equal(resolveAttack(attacker, defender, 10), null);
        equal(defender.health, 90);
    });
}

test('O ataque não alcança um alvo atrás do personagem', () => {
    const attacker = fighter();
    const defender = fighter();
    attacker.facing = 'right';
    activeAttack(attacker);
    defender.position.x = attacker.position.x - defender.width;
    equal(resolveAttack(attacker, defender, 10), null);
    equal(defender.health, 100);
});

test('A recuperação do ataque não causa dano', () => {
    const attacker = fighter();
    const defender = fighter();
    activeAttack(attacker);
    for (let i = 0; i < 120 && attacker.isAttackActive; i++) attacker.update(1 / 60);
    placeInAttack(attacker, defender);
    equal(resolveAttack(attacker, defender, 10), null);
    equal(defender.health, 100);
});

test('Bloquear preserva a vida e consome o contato daquele ataque', () => {
    const attacker = fighter();
    const defender = fighter();
    activeAttack(attacker);
    placeInAttack(attacker, defender);
    defender.protect();
    equal(resolveAttack(attacker, defender, 10)?.type, 'blocked');
    equal(defender.health, 100);
    defender.stopProtecting();
    equal(resolveAttack(attacker, defender, 10), null);
    equal(defender.health, 100);
});

test('Não é possível ficar protegido durante um ataque', () => {
    const actor = fighter();
    actor.attack();
    actor.protect();
    assert(actor.isAttacking);
    assert(!actor.isProtecting);
});

test('Cura impede ataque e defesa até a ação terminar', () => {
    const actor = fighter();
    actor.health = 50;
    actor.usePotion();
    equal(actor.potions, 2);
    equal(actor.health, Math.min(100, 50 + GAME_CONFIG.PLAYER_HEAL_AMOUNT));
    actor.attack();
    actor.protect();
    assert(actor.isHealing);
    assert(!actor.isAttacking);
    assert(!actor.isProtecting);
});

test('Morte durante cura encerra a ação e preserva a animação de morte', () => {
    const actor = fighter();
    actor.health = 20;
    actor.usePotion();
    actor.takeDamage(200);
    assert(actor.dead);
    assert(!actor.isHealing);
    assert(!actor.isAttacking);
    equal(actor.currentSpriteKey, 'dead');
    actor.protect();
    actor.attack();
    actor.usePotion();
    updateFor(actor, 2);
    equal(actor.health, 0);
    equal(actor.currentSpriteKey, 'dead');
    equal(actor.currentSpriteFrame, actor.totalSpriteFrames - 1);
});

test('Receber um golpe interrompe o ataque e aplica recuo', () => {
    const attacker = fighter(0);
    const defender = fighter(250);
    defender.attack();
    equal(defender.takeDamage(10, attacker), 'hit');
    assert(!defender.isAttacking);
    equal(defender.currentSpriteKey, 'hurt');
    const x = defender.position.x;
    defender.update(1 / 60);
    assert(defender.position.x > x, 'O alvo precisa recuar para longe do atacante');
});

test('Vida cheia ou ausência de poções não desperdiçam uma cura', () => {
    const actor = fighter();
    actor.usePotion();
    equal(actor.potions, 3);
    assert(!actor.isHealing);
    actor.health = 20;
    actor.potions = 0;
    actor.usePotion();
    equal(actor.health, 20);
    assert(!actor.isHealing);
});

test('Reset restaura os recursos e elimina os estados da luta anterior', () => {
    const actor = fighter();
    actor.health = 30;
    actor.potions = 1;
    actor.attack();
    actor.takeDamage(500);
    actor.reset({ x: 123, y: 0 });
    equal(actor.health, actor.maxHealth);
    equal(actor.potions, 3);
    equal(actor.position.x, 123);
    equal(actor.position.y, 0);
    assert(!actor.dead && !actor.isAttacking && !actor.isHealing && !actor.isProtecting);
    assert(!actor.hasDealtDamage);
    equal(actor.currentSpriteKey, 'idle');
});

test('A IA também só aplica dano na janela ativa e restaura seu estado', () => {
    const actor = fighter(250, 240, FighterAI);
    activeAttack(actor);
    const defender = fighter();
    placeInAttack(actor, defender);
    equal(resolveAttack(actor, defender, 10)?.type, 'hit');
    actor.reset({ x: 500, y: 0 });
    equal(actor.health, actor.maxHealth);
    assert(!actor.isAttacking);
});

export async function runCombatTests() {
    const results = [];
    for (const { name, run } of tests) {
        try {
            await run();
            results.push({ name, passed: true });
        } catch (error) {
            results.push({ name, passed: false, error: error.message });
        }
    }
    return { passed: results.filter(result => result.passed).length, total: results.length, results };
}
