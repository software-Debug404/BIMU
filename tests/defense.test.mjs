import { Fighter, FighterAI } from '../Js/sprites.js';
import { resolveAttack, resolveExchange } from '../Js/combat.js';

const tests = [];
const test = (name, run) => tests.push({ name, run });
function assert(value, message = 'Condição não atendida') {
    if (!value) throw new Error(message);
}
function equal(actual, expected, message = '') {
    assert(actual === expected, `${message} Esperado: ${expected}; recebido: ${actual}`);
}
function near(actual, expected, tolerance = 0.00001) {
    assert(Math.abs(actual - expected) <= tolerance, `${actual} difere de ${expected}`);
}
function sprite(frames = 4) {
    return { image: { width: frames * 128, height: 128 }, totalSpriteFrames: frames, framesPerSpriteFrame: 8 };
}
function fighter(x = 200, Type = Fighter) {
    const actor = new Type({
        position: { x, y: 240 }, velocity: { x: 0, y: 0 }, scale: 2,
        sprites: {
            idle: sprite(6), walk: sprite(9), running: sprite(8), jumping: sprite(9),
            attacking_1: sprite(4), attacking_2: sprite(5), attacking_3: sprite(4),
            protect: sprite(2), hurt: sprite(3), dead: sprite(6)
        },
        availableAttacks: ['attacking_1']
    });
    actor.onGround = true;
    return actor;
}
function pair() {
    const first = fighter(200);
    const second = fighter(280);
    second.facing = 'left';
    return [first, second];
}
function advance(actor, seconds, fps = 60) {
    for (let i = 0; i < Math.round(seconds * fps); i++) actor.update(1 / fps);
}
function activeAttack(actor) {
    assert(actor.attack(), 'A ação de ataque deveria ser aceita');
    for (let i = 0; i < 180 && !actor.isAttackActive; i++) actor.update(1 / 60);
    assert(actor.isAttackActive, 'O golpe precisa ter um momento ativo');
}
function finishAction(actor) {
    for (let i = 0; i < 240 && (actor.isAttacking || actor.attackRecoveryTime > 0); i++) actor.update(1 / 60);
    assert(!actor.isAttacking && actor.attackRecoveryTime <= 0, 'A recuperação precisa terminar');
}
function placeInAttack(attacker, defender) {
    const attack = attacker.attackBox;
    const body = defender.hurtBox;
    defender.position.x += attack.position.x + attack.width / 2 - body.position.x - body.width / 2;
    defender.position.y += attack.position.y + attack.height / 2 - body.position.y - body.height / 2;
}
function sustainedGuard(actor) {
    assert(actor.protect(), 'A defesa precisa começar no chão');
    advance(actor, 0.2);
    assert(!actor.isParryActive, 'O bloqueio sustentado precisa estar fora da janela de parry');
}
function parry(attacker, defender) {
    attacker.attack();
    defender.protect();
    equal(defender.takeDamage(10, attacker), 'parried');
}

// Only the images are represented by dimensions. All fighter/attack rules are real modules.
test('A postura começa cheia e um bloqueio frontal sustentado gasta a reserva sem tirar vida', () => {
    const [attacker, defender] = pair();
    equal(defender.posture, 100);
    equal(defender.maxPosture, 100);
    sustainedGuard(defender);
    equal(defender.takeDamage(10, attacker), 'blocked');
    equal(defender.health, 100);
    equal(defender.posture, 68);
});

test('Manter a defesa impede regeneração e não gasta postura sem receber golpes', () => {
    const [attacker, defender] = pair();
    sustainedGuard(defender);
    equal(defender.takeDamage(10, attacker), 'blocked');
    advance(defender, 3);
    equal(defender.posture, 68);
    equal(defender.health, 100);
});

test('Soltar a guarda respeita a espera e depois recupera postura até o limite', () => {
    const [attacker, defender] = pair();
    sustainedGuard(defender);
    defender.takeDamage(10, attacker);
    defender.stopProtecting();
    advance(defender, 0.4);
    equal(defender.posture, 68, 'Não recuperar durante a espera após o contato.');
    advance(defender, 1);
    assert(defender.posture > 68 && defender.posture < 100);
    advance(defender, 3);
    equal(defender.posture, defender.maxPosture);
});

test('A regeneração de postura depende do tempo e não da quantidade de atualizações', () => {
    const reserves = [30, 60, 120].map(fps => {
        const [attacker, defender] = pair();
        sustainedGuard(defender);
        defender.takeDamage(10, attacker);
        defender.stopProtecting();
        advance(defender, 1.4, fps);
        return defender.posture;
    });
    assert(reserves[0] > 68 && reserves[0] < 100);
    reserves.forEach(value => near(value, reserves[0]));
});

test('Quatro bloqueios quebram a guarda; o golpe seguinte encontra o alvo vulnerável', () => {
    const [attacker, defender] = pair();
    sustainedGuard(defender);
    for (let i = 0; i < 3; i++) equal(defender.takeDamage(10, attacker), 'blocked');
    equal(defender.takeDamage(10, attacker), 'guard-break');
    equal(defender.posture, 0);
    equal(defender.health, 100, 'O golpe que quebra a guarda ainda é bloqueado.');
    assert(defender.guardBreakTime > 0 && defender.isStunned);
    assert(!defender.isProtecting);
    equal(defender.takeDamage(10, attacker), 'hit');
    equal(defender.health, 90);
});

test('Quebra de guarda impede atacar, defender, curar e pular até o atordoamento terminar', () => {
    const [attacker, defender] = pair();
    sustainedGuard(defender);
    for (let i = 0; i < 4; i++) defender.takeDamage(10, attacker);
    defender.health = 50;
    const potions = defender.potions;
    assert(!defender.attack() && !defender.protect() && !defender.jump() && !defender.usePotion());
    equal(defender.health, 50);
    equal(defender.potions, potions);
    defender.velocity.x = 5;
    const x = defender.position.x;
    defender.update(1 / 60);
    near(defender.position.x, x);
    advance(defender, 1);
    assert(!defender.isStunned);
    assert(defender.attack(), 'O jogador precisa recuperar o controle depois do atordoamento.');
});

test('A defesa não protege de um atacante que chegou pelas costas', () => {
    const [attacker, defender] = pair();
    defender.facing = 'right';
    defender.protect();
    equal(defender.takeDamage(10, attacker), 'hit');
    equal(defender.health, 90);
    equal(defender.counterWindow, 0);
    assert(!defender.isProtecting);
    equal(attacker.staggerTime, 0);
});

test('Defender no instante certo a frente preserva postura, atordoa o atacante e abre contra-ataque', () => {
    const [attacker, defender] = pair();
    parry(attacker, defender);
    equal(defender.health, 100);
    equal(defender.posture, 100);
    assert(attacker.isStunned && attacker.staggerTime > 0);
    assert(!attacker.isAttacking);
    assert(defender.counterWindow > 0);
    assert(!attacker.attack() && !attacker.protect() && !attacker.jump());
    advance(attacker, 0.6);
    assert(!attacker.isStunned);
});

test('Segurar a guarda ou chamar protect repetidamente não renova a janela de parry', () => {
    const [attacker, defender] = pair();
    defender.protect();
    for (let i = 0; i < 20; i++) {
        defender.protect();
        defender.update(1 / 60);
    }
    assert(!defender.isParryActive);
    equal(defender.takeDamage(10, attacker), 'blocked');
});

test('Soltar e apertar defesa durante o cooldown não permite encadear parries sem intervalo', () => {
    const [attacker, defender] = pair();
    defender.protect();
    advance(defender, 0.2);
    defender.stopProtecting();
    defender.protect();
    assert(!defender.isParryActive);
    equal(defender.takeDamage(10, attacker), 'blocked');
    advance(defender, 0.3);
    defender.protect();
    assert(!defender.isParryActive, 'O fim do cooldown não deve rearmar uma guarda ainda mantida.');
    defender.stopProtecting();
    defender.protect();
    assert(defender.isParryActive, 'Uma nova pressão após o cooldown pode tentar outro parry.');
});

test('Janela e cooldown de parry expiram na mesma duração a 30, 60 e 120 atualizações', () => {
    const states = [30, 60, 120].map(fps => {
        const actor = fighter();
        actor.protect();
        advance(actor, 0.1, fps);
        assert(actor.isParryActive, 'A guarda recente precisa manter a janela inicial.');
        advance(actor, 0.1, fps);
        assert(!actor.isParryActive, 'A mesma guarda não deve prolongar a janela.');
        return [actor.parryWindowTime, actor.parryCooldownTime];
    });
    for (const state of states) state.forEach((value, index) => near(value, states[0][index]));
});

test('Um contato sem parry após a janela inicial é bloqueio normal', () => {
    const [attacker, defender] = pair();
    defender.protect();
    advance(defender, 0.2);
    equal(defender.takeDamage(10, attacker), 'blocked');
    assert(!attacker.isStunned);
    equal(defender.counterWindow, 0);
});

test('O contra-ataque concede bônus só quando o golpe conecta, sem consumir em um contato fora de alcance', () => {
    const [attacker, defender] = pair();
    parry(attacker, defender);
    defender.stopProtecting();
    activeAttack(defender);
    attacker.position.x = 900;
    equal(resolveAttack(defender, attacker, 10), null);
    assert(defender.counterWindow > 0);
    placeInAttack(defender, attacker);
    const event = resolveAttack(defender, attacker, 10);
    equal(event?.type, 'hit');
    assert(event.isCounter);
    equal(attacker.health, 85);
    equal(defender.counterWindow, 0);
    equal(resolveAttack(defender, attacker, 10), null, 'Um contra-ataque não causa dano duas vezes.');
});

test('Um contra-ataque aparado não consome o bônus como se tivesse acertado o alvo', () => {
    const [attacker, defender] = pair();
    attacker.counterWindow = 0.8;
    activeAttack(attacker);
    defender.protect();
    const event = resolveAttack(attacker, defender, 10);
    equal(event?.type, 'parried');
    assert(event.isCounter);
    assert(attacker.counterWindow > 0);
    equal(defender.health, 100);
});

test('A abertura de contra-ataque expira pelo tempo de simulação', () => {
    const [attacker, defender] = pair();
    parry(attacker, defender);
    defender.stopProtecting();
    advance(defender, 1);
    equal(defender.counterWindow, 0);
    activeAttack(defender);
    placeInAttack(defender, attacker);
    const event = resolveAttack(defender, attacker, 10);
    equal(event?.type, 'hit');
    assert(!event.isCounter);
    equal(attacker.health, 90);
});

test('Um contra-ataque bloqueado consome a abertura daquele contato', () => {
    const [attacker, defender] = pair();
    parry(attacker, defender);
    defender.stopProtecting();
    advance(attacker, 0.6);
    attacker.facing = 'right';
    sustainedGuard(attacker);
    activeAttack(defender);
    placeInAttack(defender, attacker);
    const event = resolveAttack(defender, attacker, 10);
    equal(event?.type, 'blocked');
    assert(event.isCounter);
    equal(attacker.health, 100);
    equal(defender.counterWindow, 0);
});

test('Os três golpes do combo diferem em dano e alcance', () => {
    const damages = [];
    const ranges = [];
    for (let ordinal = 1; ordinal <= 3; ordinal++) {
        const attacker = fighter();
        for (let previous = 1; previous < ordinal; previous++) {
            attacker.attack();
            finishAction(attacker);
        }
        activeAttack(attacker);
        equal(attacker.currentSpriteKey, `attacking_${ordinal}`);
        const defender = fighter();
        placeInAttack(attacker, defender);
        ranges.push(attacker.attackBox.width);
        equal(resolveAttack(attacker, defender, 10)?.type, 'hit');
        damages.push(100 - defender.health);
    }
    equal(damages.join(','), '10,13,17');
    assert(ranges[0] < ranges[1] && ranges[1] < ranges[2]);
});

test('O último golpe possui recuperação extra e impede nova ação até seu término', () => {
    const actor = fighter();
    for (let previous = 0; previous < 2; previous++) {
        actor.attack();
        finishAction(actor);
    }
    actor.attack();
    equal(actor.currentSpriteKey, 'attacking_3');
    for (let i = 0; i < 180 && actor.isAttacking; i++) actor.update(1 / 60);
    assert(actor.attackRecoveryTime > 0);
    actor.health = 50;
    assert(!actor.attack() && !actor.protect() && !actor.jump() && !actor.usePotion());
    advance(actor, 0.2);
    assert(actor.attackRecoveryTime <= 0);
    assert(actor.attack(), 'A recuperação não deve perder a entrada do próximo combo.');
});

test('O bônus de contra-ataque usa o perfil do golpe conectado e arredonda o dano uma vez', () => {
    const damages = [];
    for (let ordinal = 1; ordinal <= 3; ordinal++) {
        const actor = fighter();
        for (let i = 1; i < ordinal; i++) {
            actor.attack();
            finishAction(actor);
        }
        actor.counterWindow = 0.8;
        activeAttack(actor);
        const target = fighter();
        placeInAttack(actor, target);
        const event = resolveAttack(actor, target, 10);
        assert(event?.isCounter);
        damages.push(100 - target.health);
    }
    equal(damages.join(','), '15,19,26');
});

test('Os perfis de combo do jogador não alteram os ataques básicos da IA', () => {
    const actor = fighter(200, FighterAI);
    activeAttack(actor);
    const defender = fighter();
    placeInAttack(actor, defender);
    equal(resolveAttack(actor, defender, 10)?.type, 'hit');
    equal(defender.health, 90);
    near(actor.attackDamageMultiplier, 1);
});

test('Reset de fase restaura postura e elimina cooldown, atordoamento e abertura anteriores', () => {
    const [attacker, defender] = pair();
    parry(attacker, defender);
    defender.posture = 0;
    defender.guardBreakTime = 0.9;
    defender.staggerTime = 0.5;
    defender.reset({ x: 100, y: 0 });
    equal(defender.posture, defender.maxPosture);
    equal(defender.guardBreakTime, 0);
    equal(defender.staggerTime, 0);
    equal(defender.counterWindow, 0);
    equal(defender.parryCooldownTime, 0);
    equal(defender.attackRecoveryTime, 0);
    assert(!defender.isStunned && !defender.isProtecting);
});

test('Um golpe fatal durante a quebra de guarda encerra os estados sem permitir novas ações', () => {
    const [attacker, defender] = pair();
    sustainedGuard(defender);
    for (let i = 0; i < 4; i++) defender.takeDamage(10, attacker);
    equal(defender.takeDamage(200, attacker), 'hit');
    assert(defender.dead);
    equal(defender.health, 0);
    equal(defender.currentSpriteKey, 'dead');
    assert(!defender.attack() && !defender.protect() && !defender.jump() && !defender.usePotion());
    advance(defender, 2);
    equal(defender.currentSpriteKey, 'dead');
    equal(defender.health, 0);
});

test('Sem atualizar a simulação, uma pausa não consome parry, cooldown ou abertura', () => {
    const [attacker, defender] = pair();
    parry(attacker, defender);
    const before = [defender.counterWindow, defender.parryCooldownTime, attacker.staggerTime];
    // Read-only rendering and snapshots do not advance any gameplay clock.
    for (let i = 0; i < 100; i++) {
        void defender.attackBox;
        void defender.hurtBox;
        void defender.isParryActive;
    }
    equal([defender.counterWindow, defender.parryCooldownTime, attacker.staggerTime].join(','), before.join(','));
});

test('Golpes simultâneos com duas aberturas mantêm os dois bônus em qualquer ordem de resolução', () => {
    for (const reverse of [false, true]) {
        const [first, second] = pair();
        first.counterWindow = second.counterWindow = 0.8;
        activeAttack(first);
        activeAttack(second);
        const events = resolveExchange(...(reverse ? [second, first] : [first, second]), 10, 10);
        equal(events.length, 2);
        assert(events.every(event => event.isCounter));
        equal(first.health, 85);
        equal(second.health, 85);
        equal(first.counterWindow, 0);
        equal(second.counterWindow, 0);
    }
});

test('Trocar a ordem dos participantes não altera um parry legítimo no versus', () => {
    for (const reverse of [false, true]) {
        const [attacker, defender] = pair();
        activeAttack(attacker);
        defender.protect();
        const events = resolveExchange(...(reverse ? [defender, attacker] : [attacker, defender]), 10, 10);
        equal(events.length, 1);
        equal(events[0].type, 'parried');
        equal(attacker.health, 100);
        equal(defender.health, 100);
        assert(attacker.isStunned && defender.counterWindow > 0);
    }
});

export async function runDefenseTests() {
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

if (typeof process !== 'undefined' && process.versions?.node) {
    const report = await runDefenseTests();
    for (const result of report.results) console.log(`${result.passed ? 'PASS' : 'FAIL'} ${result.name}${result.error ? `: ${result.error}` : ''}`);
    console.log(`\n${report.passed}/${report.total} testes de postura e parry passaram.`);
    if (report.passed !== report.total) process.exitCode = 1;
}
