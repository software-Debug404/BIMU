import assert from 'node:assert/strict';
import { CombatTraining } from '../Js/training.js';

const tests = [];
const test = (name, run) => tests.push({ name, run });
function fixture() {
    const training = new CombatTraining();
    const player = { position: { x: 100 }, onGround: true, dead: false, counterWindow: 0 };
    const target = { position: { x: 400 }, onGround: true, dead: false };
    training.update(0, player, target);
    const incoming = (type, extra = {}) => ({ type, attacker: target, defender: player, ...extra });
    const outgoing = (type, extra = {}) => ({ type, attacker: player, defender: target, ...extra });
    return { training, player, target, incoming, outgoing };
}
function move(f) { f.player.position.x += 100; f.training.update(1 / 60, f.player, f.target); }
function reachCounter(f) {
    move(f);
    f.training.onImpact(f.outgoing('hit'));
    f.training.onImpact(f.incoming('blocked'));
    f.training.onImpact(f.incoming('guard-break'));
    f.training.onImpact(f.incoming('parried'));
    assert.equal(f.training.step, 'counter');
}

test('O treino começa com instrução e não avança sozinho com o tempo', () => {
    const f = fixture();
    f.training.update(3600, f.player, f.target);
    assert.equal(f.training.step, 'move');
    assert.equal(f.training.total, 6);
    assert.equal(f.training.targetMode, 'idle');
    assert.match(f.training.title, /distância/);
    assert.match(f.training.instruction, /A ou D/);
});

test('Movimento precisa de distância real no chão, sem contar a queda inicial', () => {
    const f = fixture();
    f.player.position.x += 100;
    f.player.onGround = false;
    f.training.update(1, f.player, f.target);
    assert.equal(f.training.step, 'move');
    f.player.onGround = true;
    f.training.update(0, f.player, f.target);
    assert.equal(f.training.step, 'attack');
    assert.equal(f.training.revision, 2);
});

test('Ataque só progride por um acerto do jogador no parceiro atual', () => {
    const f = fixture(); move(f);
    for (const event of [f.incoming('hit'), f.outgoing('blocked'),
        { ...f.outgoing('hit'), defender: {} }, { ...f.outgoing('hit'), attacker: {} }, null]) {
        assert.equal(f.training.onImpact(event), false);
        assert.equal(f.training.step, 'attack');
    }
    assert.equal(f.training.onImpact(f.outgoing('hit')), true);
    assert.equal(f.training.step, 'block');
    assert.equal(f.training.targetMode, 'attack');
});

test('Bloqueio e quebra de guarda exigem eventos distintos recebidos pelo jogador', () => {
    const f = fixture(); move(f); f.training.onImpact(f.outgoing('hit'));
    assert.equal(f.training.onImpact(f.incoming('parried')), false);
    assert.equal(f.training.onImpact(f.outgoing('blocked')), false);
    assert.equal(f.training.onImpact(f.incoming('blocked')), true);
    assert.equal(f.training.step, 'guard-break');
    assert.equal(f.training.onImpact(f.incoming('blocked')), false);
    assert.equal(f.training.onImpact(f.incoming('guard-break')), true);
    assert.equal(f.training.step, 'parry');
});

test('Etapa de parry ignora bloqueios normais e golpes no sentido errado', () => {
    const f = fixture(); move(f);
    f.training.onImpact(f.outgoing('hit'));
    f.training.onImpact(f.incoming('blocked'));
    f.training.onImpact(f.incoming('guard-break'));
    assert.equal(f.training.onImpact(f.incoming('blocked')), false);
    assert.equal(f.training.onImpact(f.outgoing('parried')), false);
    assert.equal(f.training.onImpact(f.incoming('parried')), true);
    assert.equal(f.training.step, 'counter');
});

test('Contra-ataque exige dano conectado com o bônus real e não apenas um ataque comum', () => {
    const f = fixture(); reachCounter(f);
    assert.equal(f.training.onImpact(f.outgoing('hit')), false);
    f.player.counterWindow = 0.8;
    f.training.onImpact(f.incoming('parried'));
    assert.equal(f.training.targetMode, 'idle');
    assert.equal(f.training.onImpact(f.outgoing('blocked', { isCounter: true })), false);
    assert.equal(f.training.onImpact(f.incoming('hit', { isCounter: true })), false);
    assert.equal(f.training.onImpact(f.outgoing('hit', { isCounter: true })), true);
    assert.equal(f.training.complete, true);
    assert.equal(f.training.step, 'finish');
    assert.equal(f.training.targetMode, 'idle');
});

test('Perder a janela de contra-ataque volta a pedir um golpe do parceiro', () => {
    const f = fixture(); reachCounter(f);
    f.player.counterWindow = 0.8;
    f.training.onImpact(f.incoming('parried'));
    assert.equal(f.training.targetMode, 'idle');
    f.player.counterWindow = 0;
    f.training.update(1, f.player, f.target);
    assert.equal(f.training.targetMode, 'attack');
    assert.equal(f.training.step, 'counter');
});

test('Morte do alvo ou jogador não concede uma etapa por contatos inválidos', () => {
    const f = fixture(); move(f);
    f.target.dead = true;
    assert.equal(f.training.onImpact(f.outgoing('hit')), false);
    f.target.dead = false;
    f.player.dead = true;
    assert.equal(f.training.onImpact(f.outgoing('hit')), false);
    assert.equal(f.training.step, 'attack');
});

test('Reset permite repetir o treino sem preservar progresso ou janela antiga', () => {
    const f = fixture(); reachCounter(f);
    f.player.counterWindow = 0.8;
    f.training.onImpact(f.incoming('parried'));
    f.training.onImpact(f.outgoing('hit', { isCounter: true }));
    const revision = f.training.revision;
    f.training.reset();
    assert.equal(f.training.step, 'move');
    assert.equal(f.training.complete, false);
    assert.equal(f.training.revision, revision + 1);
    assert.equal(f.training.onImpact(f.outgoing('hit')), false);
    f.player.position.x = 450;
    f.training.update(0, f.player, f.target);
    assert.equal(f.training.step, 'move');
    f.player.position.x = 350;
    f.training.update(1 / 60, f.player, f.target);
    assert.equal(f.training.step, 'attack');
});

test('Concluir o treino não avança novamente nem dispara progresso depois do final', () => {
    const f = fixture(); reachCounter(f);
    f.player.counterWindow = 0.8;
    f.training.onImpact(f.incoming('parried'));
    f.training.onImpact(f.outgoing('hit', { isCounter: true }));
    const revision = f.training.revision;
    assert.equal(f.training.onImpact(f.outgoing('hit', { isCounter: true })), false);
    f.training.update(3600, f.player, f.target);
    assert.equal(f.training.revision, revision);
    assert.equal(f.training.index, f.training.total);
});

let passed = 0;
for (const { name, run } of tests) {
    try { await run(); passed++; console.log(`PASS ${name}`); }
    catch (error) { console.error(`FAIL ${name}: ${error.stack}`); process.exitCode = 1; }
}
console.log(`\n${passed}/${tests.length} testes de treino passaram.`);
