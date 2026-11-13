import assert from 'node:assert/strict';
import { STORY_STAGES, getStoryScene, REUNION_SCENE, EPILOGUE_SCENE } from '../Js/story.js';
import { loadStoryProgress, saveStoryProgress, clearStoryProgress, STORY_STORAGE_KEY } from '../Js/storyProgress.js';
import { MelodyChallenge, MELODY_NOTES } from '../Js/piano_interactive.js';

const tests = [];
const test = (name, run) => tests.push({ name, run });
function memoryStorage() {
    const values = new Map();
    return {
        getItem: key => values.get(key) ?? null,
        setItem: (key, value) => values.set(key, value),
        removeItem: key => values.delete(key)
    };
}
function timerClock() {
    let now = 0;
    let id = 0;
    const timers = new Map();
    return {
        schedule(callback, delay) { const key = ++id; timers.set(key, { callback, at: now + delay }); return key; },
        cancel(key) { timers.delete(key); },
        advance(milliseconds) {
            now += milliseconds;
            for (const [key, timer] of [...timers]) {
                if (timer.at <= now && timers.has(key)) { timers.delete(key); timer.callback(); }
            }
        }
    };
}
function challengeFixture() {
    const clock = timerClock();
    let completions = 0;
    const hana = [];
    const challenge = new MelodyChallenge({
        schedule: clock.schedule,
        cancel: clock.cancel,
        onComplete: () => completions++,
        onHanaNote: note => hana.push(note)
    });
    return { clock, challenge, hana, completions: () => completions };
}

test('Campanha possui dez fases em ordem e termina na clareira sem inimigo', () => {
    assert.equal(STORY_STAGES.length, 10);
    assert.deepEqual(STORY_STAGES.slice(0, 4).map(stage => stage.enemyType),
        ['MINOTAUR', 'SKELETON_WARRIOR', 'SKELETON_SPEARMAN', 'SAMURAI_COMMANDER']);
    assert.equal(STORY_STAGES[9].bonus, true);
    assert.equal(STORY_STAGES[9].enemyType, undefined);
    assert.equal(new Set(Array.from({ length: 10 }, (_, i) => getStoryScene(i).id)).size, 10);
    assert.equal(getStoryScene(-1), null);
    assert.equal(getStoryScene(10), null);
});

test('Cenas preservam o aviso, a última nota de Hana e a batida do epílogo', () => {
    assert.match(getStoryScene(3).paragraphs.join(' '), /Se ouvir a voz dela, não responda/);
    assert.match(getStoryScene(9).paragraphs.join(' '), /A última nota era dela/);
    assert.match(REUNION_SCENE.paragraphs.join(' '), /Eu não sei tocar a sua parte/);
    assert.match(EPILOGUE_SCENE.paragraphs.join(' '), /Hana deu a última batida/);
});

test('Progresso de campanha persiste com chave própria e cenas sem duplicação', () => {
    const storage = memoryStorage();
    assert.equal(loadStoryProgress(storage), null);
    const saved = saveStoryProgress({ stage: 4, seenScenes: ['chapter-1', 'chapter-1', 'chapter-2'], melodyComplete: false }, storage);
    assert.deepEqual(saved.seenScenes, ['chapter-1', 'chapter-2']);
    assert.deepEqual(loadStoryProgress(storage), saved);
    assert.equal(storage.getItem('bimu:versus'), null);
    assert.equal(clearStoryProgress(storage), true);
    assert.equal(loadStoryProgress(storage), null);
});

test('Saves corrompidos ou de outra versão não impedem nova campanha', () => {
    const storage = memoryStorage();
    for (const value of ['{', 'null', 'false', '{"version":2,"stage":1}', '{"version":1,"stage":50}']) {
        storage.setItem(STORY_STORAGE_KEY, value);
        assert.equal(loadStoryProgress(storage), null);
    }
});

test('Armazenamento bloqueado preserva um progresso utilizável em memória', () => {
    const denied = { getItem() { throw Error('blocked'); }, setItem() { throw Error('blocked'); }, removeItem() { throw Error('blocked'); } };
    assert.equal(loadStoryProgress(denied), null);
    assert.equal(saveStoryProgress({ stage: 9, melodyComplete: true }, denied).melodyComplete, true);
    assert.equal(clearStoryProgress(denied), false);
});

test('Normalização impede final musical antecipado e conclusão exige fase dez', () => {
    const storage = memoryStorage();
    assert.equal(saveStoryProgress({ stage: 3, melodyComplete: true }, storage).melodyComplete, false);
    const saved = saveStoryProgress({ stage: 2, completed: true }, storage);
    assert.equal(saved.stage, 9);
    assert.equal(saved.melodyComplete, true);
});

test('Tocar a parte de Bimu não conclui antes da nota de Hana', () => {
    const fixture = challengeFixture();
    fixture.challenge.activate();
    MELODY_NOTES.forEach(note => fixture.challenge.note(note));
    assert.equal(fixture.challenge.waiting, true);
    assert.equal(fixture.completions(), 0);
    fixture.clock.advance(999);
    assert.equal(fixture.completions(), 0);
    fixture.clock.advance(1);
    assert.deepEqual(fixture.hana, [14]);
    assert.equal(fixture.completions(), 1);
    fixture.clock.advance(10000);
    fixture.challenge.note(14);
    assert.equal(fixture.completions(), 1);
});

test('Hana só termina depois de soltar a última tecla e esperar um segundo', () => {
    const fixture = challengeFixture();
    fixture.challenge.activate();
    MELODY_NOTES.slice(0, -1).forEach(note => fixture.challenge.note(note));
    fixture.challenge.setKeysHeld(1);
    fixture.challenge.note(MELODY_NOTES.at(-1));
    fixture.clock.advance(5000);
    assert.equal(fixture.completions(), 0);
    fixture.challenge.setKeysHeld(0);
    fixture.clock.advance(999);
    assert.equal(fixture.completions(), 0);
    fixture.clock.advance(1);
    assert.equal(fixture.completions(), 1);
});

test('Tocar durante a espera adia o final para deixar Hana terminar', () => {
    const fixture = challengeFixture();
    fixture.challenge.activate();
    MELODY_NOTES.forEach(note => fixture.challenge.note(note));
    fixture.clock.advance(800);
    fixture.challenge.note(14);
    fixture.clock.advance(800);
    assert.equal(fixture.completions(), 0);
    fixture.clock.advance(200);
    assert.equal(fixture.completions(), 1);
});

test('Erro permite repetir a melodia sem conclusão nem perda de campanha', () => {
    const fixture = challengeFixture();
    fixture.challenge.activate();
    fixture.challenge.note(MELODY_NOTES[0]);
    fixture.challenge.note(24);
    assert.equal(fixture.challenge.progress, 0);
    assert.equal(fixture.challenge.status, 'retry');
    MELODY_NOTES.forEach(note => fixture.challenge.note(note));
    fixture.clock.advance(1000);
    assert.equal(fixture.completions(), 1);
});

test('Fechar o piano cancela a espera e reabrir preserva a tentativa', () => {
    const fixture = challengeFixture();
    fixture.challenge.activate();
    MELODY_NOTES.forEach(note => fixture.challenge.note(note));
    fixture.challenge.deactivate();
    fixture.clock.advance(5000);
    assert.equal(fixture.completions(), 0);
    assert.equal(fixture.challenge.progress, MELODY_NOTES.length);
    fixture.challenge.activate();
    fixture.clock.advance(1000);
    assert.equal(fixture.completions(), 1);
});

test('Assistência também espera e deixa a última nota para Hana', () => {
    const fixture = challengeFixture();
    fixture.challenge.activate();
    fixture.challenge.assist();
    assert.equal(fixture.completions(), 0);
    assert.equal(fixture.challenge.waiting, true);
    fixture.clock.advance(1000);
    assert.equal(fixture.completions(), 1);
    assert.deepEqual(fixture.hana, [14]);
});

test('Restaurar desafio concluído não dispara o final novamente', () => {
    const fixture = challengeFixture();
    fixture.challenge.reset(true);
    fixture.challenge.activate();
    fixture.challenge.assist();
    fixture.clock.advance(10000);
    assert.equal(fixture.completions(), 0);
    assert.equal(fixture.challenge.completed, true);
});

test('Timers padrão da melodia usam o receiver global ao aguardar Hana', () => {
    const originalSetTimeout = globalThis.setTimeout;
    const originalClearTimeout = globalThis.clearTimeout;
    let scheduled = 0;
    const cancelled = [];
    globalThis.setTimeout = function (callback, delay) {
        assert.equal(this, globalThis, 'setTimeout deve receber globalThis');
        assert.equal(typeof callback, 'function');
        assert.equal(delay, 1000);
        return ++scheduled;
    };
    globalThis.clearTimeout = function (id) {
        assert.equal(this, globalThis, 'clearTimeout deve receber globalThis');
        cancelled.push(id);
    };
    try {
        const challenge = new MelodyChallenge();
        challenge.activate();
        MELODY_NOTES.forEach(note => challenge.note(note));
        assert.equal(scheduled, 1);
        challenge.deactivate();
        assert.deepEqual(cancelled, [1]);
    } finally {
        globalThis.setTimeout = originalSetTimeout;
        globalThis.clearTimeout = originalClearTimeout;
    }
});

let passed = 0;
for (const { name, run } of tests) {
    try { await run(); passed++; console.log(`PASS ${name}`); }
    catch (error) { console.error(`FAIL ${name}: ${error.stack}`); }
}
console.log(`\n${passed}/${tests.length} testes de história passaram.`);
if (passed !== tests.length) process.exitCode = 1;
