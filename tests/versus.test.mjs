import { Fighter } from '../Js/sprites.js';
import { resolveExchange } from '../Js/combat.js';
import { VersusMatch } from '../Js/versus.js';

const tests = [];
const test = (name, run) => tests.push({ name, run });
function assert(condition, message = 'Condição não atendida') {
    if (!condition) throw new Error(message);
}
const equal = (actual, expected, message = '') => assert(actual === expected, `${message} Esperado ${expected}; recebido ${actual}`);
const near = (actual, expected) => assert(Math.abs(actual - expected) < 0.00001, `${actual} difere de ${expected}`);
function sprite(frames = 4) {
    return { image: { width: 128 * frames, height: 128 }, totalSpriteFrames: frames, framesPerSpriteFrame: 8 };
}
function fighter(x = 200) {
    const actor = new Fighter({
        position: { x, y: 240 }, velocity: { x: 0, y: 0 }, scale: 2,
        sprites: {
            idle: sprite(), walk: sprite(), running: sprite(), jumping: sprite(),
            attacking_1: sprite(), attacking_2: sprite(5), attacking_3: sprite(),
            protect: sprite(2), hurt: sprite(3), dead: sprite(6)
        }
    });
    actor.onGround = true;
    return actor;
}
function combatants() {
    const first = fighter(200);
    const second = fighter(280);
    second.facing = 'left';
    return [first, second];
}
function activate(actor) {
    actor.attack();
    for (let i = 0; i < 80 && !actor.isAttackActive; i++) actor.update(1 / 60);
    assert(actor.isAttackActive, 'O golpe deve alcançar a janela ativa');
}
function startMatch(match) {
    match.markReady(0);
    match.markReady(1);
    for (let i = 0; i < 180; i++) match.update(1 / 60);
    equal(match.state, 'fighting');
}

// Only the input devices are mocked. Fighters, combat and rules are real modules.
const eventWindow = new EventTarget();
const eventDocument = new EventTarget();
eventWindow.jogoIniciado = true;
eventDocument.hidden = false;
globalThis.window = eventWindow;
globalThis.document = eventDocument;
const { keys, keys2, resetKeys, consumeReady, handleControls, updateInputBuffers } = await import('../Js/controls.js');
function sendKey(type, key, options = {}) {
    const event = new Event(type, { cancelable: true });
    Object.defineProperties(event, {
        key: { value: key },
        code: { value: options.code || (key === ' ' ? 'Space' : `Key${key.toUpperCase()}`) },
        repeat: { value: options.repeat || false }
    });
    window.dispatchEvent(event);
}

test('Cada jogador precisa confirmar prontidão antes da contagem de três segundos', () => {
    const match = new VersusMatch();
    const [first, second] = combatants();
    match.update(10, first, second);
    equal(match.state, 'ready');
    equal(match.timeLeft, 60);
    assert(!match.markReady(-1));
    assert(!match.markReady(2));
    match.markReady(0);
    equal(match.state, 'ready');
    match.markReady(1);
    equal(match.state, 'countdown');
    match.update(2.99, first, second);
    equal(match.state, 'countdown');
    match.update(0.01, first, second);
    equal(match.state, 'fighting');
    equal(match.timeLeft, 60);
});

test('Rounds duram 60 segundos e o timeout considera a proporção de vida', () => {
    const match = new VersusMatch();
    const [first, second] = combatants();
    first.maxHealth = 200;
    first.health = 100;
    second.health = 60;
    startMatch(match);
    match.update(59, first, second);
    equal(match.state, 'fighting');
    near(match.timeLeft, 1);
    const result = match.update(1, first, second);
    equal(result.winner, 1);
    equal(match.scores[1], 1);
    equal(match.state, 'round-over');
});

test('Timeout com a mesma vida é empate e não concede ponto', () => {
    const match = new VersusMatch();
    startMatch(match);
    const result = match.update(60, ...combatants());
    equal(result.winner, null);
    equal(match.scores.join(','), '0,0');
    assert(match.nextRound());
    equal(match.round, 1);
    equal(match.ready.join(','), 'false,false');
});

test('Dois rounds ganhos encerram a partida e a revanche limpa o placar', () => {
    const match = new VersusMatch();
    assert(!match.nextRound());
    for (let win = 1; win <= 2; win++) {
        const [first, second] = combatants();
        startMatch(match);
        second.takeDamage(1000);
        const result = match.update(1 / 60, first, second);
        equal(result.winner, 0);
        equal(result.scores[0], win);
        equal(result.matchOver, win === 2);
        match.update(30, first, second);
        equal(match.scores[0], win, 'Um resultado não pode pontuar duas vezes');
        if (win === 1) {
            assert(match.nextRound());
            equal(match.round, 2);
        }
    }
    equal(match.state, 'match-over');
    assert(!match.nextRound());
    match.rematch();
    equal(match.round, 1);
    equal(match.state, 'ready');
    equal(match.scores.join(','), '0,0');
});

test('Golpes ativos simultâneos atingem os dois jogadores uma única vez', () => {
    const [first, second] = combatants();
    activate(first);
    activate(second);
    const events = resolveExchange(first, second, 10, 10);
    equal(events.length, 2);
    equal(first.health, 90);
    equal(second.health, 90);
    equal(resolveExchange(first, second, 10, 10).length, 0);
});

test('A ordem dos jogadores não altera o resultado de golpes simultâneos', () => {
    for (const reverse of [false, true]) {
        const [first, second] = combatants();
        activate(first);
        activate(second);
        const pair = reverse ? [second, first] : [first, second];
        equal(resolveExchange(...pair, 10, 10).length, 2);
        equal(first.health, 90);
        equal(second.health, 90);
    }
});

test('Golpes letais simultâneos permitem duplo KO e repetição do round', () => {
    const [first, second] = combatants();
    first.health = 10;
    second.health = 10;
    activate(first);
    activate(second);
    equal(resolveExchange(first, second, 10, 10).length, 2);
    assert(first.dead && second.dead);
    const match = new VersusMatch();
    startMatch(match);
    const result = match.update(1 / 60, first, second);
    equal(result.winner, null);
    equal(match.scores.join(','), '0,0');
    assert(match.nextRound());
    equal(match.round, 1);
});

test('Um bloqueio preserva a vida e consome o golpe daquele contato', () => {
    const [first, second] = combatants();
    activate(first);
    second.protect();
    second.update(0.2); // Bloqueio sustentado, depois da janela de parry.
    const events = resolveExchange(first, second, 10, 10);
    equal(events.length, 1);
    equal(events[0].type, 'blocked');
    equal(second.health, 100);
    second.stopProtecting();
    equal(resolveExchange(first, second, 10, 10).length, 0);
});

test('Jogador 1 e jogador 2 movimentam em direções independentes simultaneamente', () => {
    resetKeys();
    const [first, second] = combatants();
    sendKey('keydown', 'd');
    sendKey('keydown', 'ArrowLeft');
    handleControls(first, keys);
    handleControls(second, keys2);
    equal(first.velocity.x, 3);
    equal(second.velocity.x, -3);
    equal(first.facing, 'right');
    equal(second.facing, 'left');
    sendKey('keyup', 'd');
    assert(!keys.d.pressed);
    assert(keys2.a.pressed, 'Soltar uma tecla não deve soltar a tecla do outro jogador');
    resetKeys();
});

test('Espaço e L atacam separadamente; poções podem ser desativadas no versus', () => {
    resetKeys();
    const [first, second] = combatants();
    first.health = second.health = 50;
    sendKey('keydown', ' ');
    handleControls(first, keys, { allowPotion: false });
    handleControls(second, keys2, { allowPotion: false });
    assert(first.isAttacking && !second.isAttacking);
    sendKey('keydown', 'l');
    handleControls(second, keys2, { allowPotion: false });
    assert(second.isAttacking);
    resetKeys();
    first.reset({ x: 200, y: 240 });
    first.health = 50;
    sendKey('keydown', 'e');
    handleControls(first, keys, { allowPotion: false });
    equal(first.health, 50);
    equal(first.potions, 3);
    assert(!first.isHealing);
    resetKeys();
});

test('Um toque curto de ataque durante a pausa de impacto executa uma única vez ao retomar', () => {
    resetKeys();
    const pair = combatants();
    const accepted = [0, 0];
    pair.forEach((actor, index) => {
        const attack = actor.attack.bind(actor);
        actor.attack = () => {
            const result = attack();
            if (result) accepted[index]++;
            return result;
        };
    });
    sendKey('keydown', ' ');
    sendKey('keydown', 'l');
    // O loop continua contando o tempo, mas não processa ações durante o impacto.
    updateInputBuffers(1 / 60);
    sendKey('keyup', ' ');
    sendKey('keyup', 'l');
    for (let i = 0; i < 3; i++) updateInputBuffers(1 / 60);
    assert(pair.every(actor => !actor.isAttacking));
    handleControls(pair[0], keys);
    handleControls(pair[1], keys2);
    assert(pair.every(actor => actor.isAttacking), 'Soltar a tecla não pode apagar uma pressão recente durante o impacto.');
    for (let frame = 0; frame < 120; frame++) {
        updateInputBuffers(1 / 60);
        pair.forEach((actor, index) => {
            actor.update(1 / 60);
            handleControls(actor, index === 0 ? keys : keys2);
        });
    }
    equal(accepted.join(','), '1,1', 'Cada pressão só pode gerar uma ação aceita.');
    assert(pair.every(actor => !actor.isAttacking), 'O ataque não pode se repetir depois da recuperação.');
    resetKeys();
});

test('Uma pressão de ataque expirada ou descartada pelo reset não reaparece para nenhum jogador', () => {
    resetKeys();
    const [first, second] = combatants();
    for (const key of [' ', 'l']) {
        sendKey('keydown', key);
        sendKey('keyup', key);
    }
    updateInputBuffers(0.2);
    handleControls(first, keys);
    handleControls(second, keys2);
    assert(!first.isAttacking && !second.isAttacking, 'Uma entrada antiga precisa expirar antes de poder atacar.');
    for (const key of [' ', 'l']) {
        sendKey('keydown', key);
        sendKey('keyup', key);
    }
    resetKeys();
    handleControls(first, keys);
    handleControls(second, keys2);
    assert(!first.isAttacking && !second.isAttacking, 'Reset de modo deve descartar os ataques pendentes dos dois jogadores.');
    equal(first.combo.state, 0);
    equal(second.combo.state, 0);
});

test('Segurar defesa durante um ataque não cria um parry automático quando a ação termina', () => {
    resetKeys();
    const [first] = combatants();
    first.attack();
    sendKey('keydown', 's');
    handleControls(first, keys);
    assert(!first.isProtecting, 'Uma ação em andamento não pode ficar protegida.');
    for (let i = 0; i < 120 && (first.isAttacking || first.isRecovering); i++) first.update(1 / 60);
    handleControls(first, keys);
    assert(first.isProtecting, 'A tecla mantida pode iniciar bloqueio normal ao recuperar o controle.');
    assert(!first.isParryActive, 'A tecla já estava mantida, portanto não é uma nova tentativa de parry.');
    resetKeys();
});

test('Soltar defesa enquanto recebe dano permite uma nova tentativa legítima após o cooldown', () => {
    resetKeys();
    const [first, second] = combatants();
    first.facing = 'left'; // O atacante está à direita: um golpe pelas costas não pode ser defendido.
    sendKey('keydown', 's');
    handleControls(first, keys);
    equal(first.takeDamage(10, second), 'hit');
    sendKey('keyup', 's');
    handleControls(first, keys);
    for (let i = 0; i < 40; i++) first.update(1 / 60);
    first.facing = 'right';
    sendKey('keydown', 's');
    handleControls(first, keys);
    assert(first.isParryActive, 'A liberação durante o dano precisa limpar o estado anterior da guarda.');
    resetKeys();
});

test('Prontidão usa F e Enter, ignora repetição e só consome cada pressão uma vez', () => {
    resetKeys();
    sendKey('keydown', 'f');
    assert(consumeReady(0));
    assert(!consumeReady(0));
    assert(!consumeReady(1));
    sendKey('keydown', 'Enter');
    assert(consumeReady(1));
    assert(!consumeReady(1));
    sendKey('keydown', 'Enter', { repeat: true });
    assert(!consumeReady(1));
    sendKey('keyup', 'Enter');
    sendKey('keydown', 'Enter');
    assert(consumeReady(1));
    resetKeys();
    assert(!consumeReady(0) && !consumeReady(1));
});

test('Blur limpa as teclas de ambos os jogadores e não avança regras encerradas', () => {
    resetKeys();
    sendKey('keydown', 'd');
    sendKey('keydown', 'ArrowLeft');
    sendKey('keydown', 'f');
    window.dispatchEvent(new Event('blur'));
    assert(!keys.d.pressed && !keys2.a.pressed && !keys.ready.pressed);
    const match = new VersusMatch();
    startMatch(match);
    const [first, second] = combatants();
    match.update(NaN, first, second);
    equal(match.timeLeft, 60);
    match.update(-1, first, second);
    equal(match.timeLeft, 60);
});

let passed = 0;
for (const { name, run } of tests) {
    try {
        await run();
        passed++;
        console.log(`PASS ${name}`);
    } catch (error) {
        console.error(`FAIL ${name}: ${error.message}`);
    }
}
console.log(`\n${passed}/${tests.length} testes de versus passaram.`);
if (passed !== tests.length) process.exitCode = 1;
