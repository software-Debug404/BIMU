import assert from 'node:assert/strict';
import { StoryFilm, readingDuration } from '../Js/narration.js';
import { getStoryScene, REUNION_SCENE, EPILOGUE_SCENE } from '../Js/story.js';

const tests = [];
const test = (name, run) => tests.push({ name, run });
function clock() {
    let now = 0;
    let id = 0;
    const timers = new Map();
    return {
        schedule(callback, delay) { const key = ++id; timers.set(key, { callback, at: now + delay }); return key; },
        cancel(key) { timers.delete(key); },
        advance(ms) {
            now += ms;
            for (const [key, timer] of [...timers]) {
                if (timer.at <= now && timers.has(key)) { timers.delete(key); timer.callback(); }
            }
        },
        pending: () => timers.size
    };
}
const frames = [
    { text: 'Bimu ouviu a primeira nota.', image: 'forest.png' },
    { text: 'Hana estava do outro lado.', image: 'reunion.png' },
    { text: 'Ela deu a última batida.', image: 'epilogue.png' }
];
function fixture({ speech: suppliedSpeech, voices, volume = 1 } = {}) {
    const time = clock();
    const spoken = [];
    let cancels = 0;
    let ends = 0;
    const states = [];
    const shown = [];
    const speech = suppliedSpeech === null ? null : suppliedSpeech || {
        speak(utterance) { spoken.push(utterance); },
        cancel() { cancels++; },
        getVoices() { return voices || [{ lang: 'en-US', name: 'English' }, { lang: 'pt-PT', name: 'Português' }, { lang: 'pt-BR', name: 'Brasil' }]; }
    };
    const film = new StoryFilm({
        speech,
        createUtterance: text => ({ text }),
        schedule: time.schedule,
        cancel: time.cancel,
        onFrame: (frame, index, total) => shown.push({ frame, index, total }),
        onState: state => states.push(state),
        onEnd: () => ends++,
        volume
    });
    return { film, time, spoken, states, shown, cancels: () => cancels, ends: () => ends };
}

test('As cenas oferecem um frame por parágrafo e imagens correspondentes', () => {
    for (let index = 0; index < 10; index++) {
        const scene = getStoryScene(index);
        assert.equal(scene.frames.length, scene.paragraphs.length);
        scene.frames.forEach((frame, i) => {
            assert.equal(frame.text, scene.paragraphs[i]);
            assert.equal(typeof frame.image, 'string');
            assert.ok(frame.image.length > 0);
        });
    }
    const opening = getStoryScene(0);
    assert.match(opening.frames[0].image, /first-note\.png$/);
    assert.equal(new Set(opening.frames.map(frame => frame.image)).size, 3, 'A abertura precisa mostrar três imagens diferentes.');
    assert.match(opening.frames[1].image, /opening\.png$/);
    assert.match(opening.frames[2].image, /blue-graves\.png$/);
    assert.match(getStoryScene(1).frames[0].image, /fresh-cut\.png$/);
    assert.match(getStoryScene(2).frames[0].image, /forest-return\.png$/);
    assert.match(getStoryScene(2).frames[1].image, /marked-tree\.png$/);
    assert.ok(getStoryScene(1).frames.every(frame => !frame.image.endsWith('/marked-tree.png')), 'O musgo deve aparecer apenas depois do retorno.');
    assert.match(REUNION_SCENE.frames[0].image, /piano-clearing\.png$/);
    assert.match(REUNION_SCENE.frames[1].image, /reunion\.png$/);
    assert.match(EPILOGUE_SCENE.frames[0].image, /reunion\.png$/);
    assert.match(EPILOGUE_SCENE.frames[2].image, /epilogue\.png$/);
});

test('A voz pt-BR lê cada frame e o fim da fala troca a imagem', () => {
    const f = fixture();
    f.film.load(frames);
    assert.equal(f.shown.at(-1).index, 0);
    assert.equal(f.spoken.length, 0);
    f.film.play();
    assert.equal(f.spoken.length, 1);
    assert.equal(f.spoken[0].lang, 'pt-BR');
    assert.equal(f.spoken[0].voice.name, 'Brasil');
    assert.equal(f.spoken[0].rate, 0.95);
    f.spoken[0].onend();
    assert.equal(f.film.snapshot().index, 1);
    assert.equal(f.shown.at(-1).frame.image, 'reunion.png');
    assert.equal(f.spoken.length, 2);
});

test('Sem voz brasileira, prefere português e nunca seleciona explicitamente inglês', () => {
    const pt = fixture({ voices: [{ lang: 'en-US' }, { lang: 'pt-PT' }] });
    pt.film.load(frames); pt.film.play();
    assert.equal(pt.spoken[0].voice.lang, 'pt-PT');
    const englishOnly = fixture({ voices: [{ lang: 'en-US' }] });
    englishOnly.film.load(frames); englishOnly.film.play();
    assert.equal(englishOnly.spoken[0].voice, undefined);
    assert.equal(englishOnly.spoken[0].lang, 'pt-BR');
});

test('O último frame para o filme sem avançar o jogo e onEnd ocorre uma vez', () => {
    const f = fixture();
    f.film.load(frames); f.film.play();
    for (let i = 0; i < frames.length; i++) f.spoken[i].onend();
    assert.equal(f.film.snapshot().index, 2);
    assert.equal(f.film.snapshot().ended, true);
    assert.equal(f.film.snapshot().playing, false);
    assert.equal(f.ends(), 1);
    f.film.next();
    assert.equal(f.ends(), 1);
    assert.equal(f.time.pending(), 0);
});

test('Pausa cancela voz e timer, ignora evento antigo e retoma o mesmo frame', () => {
    const f = fixture();
    f.film.load(frames); f.film.play();
    const stale = f.spoken[0].onend;
    f.film.pause();
    assert.equal(f.cancels(), 1);
    stale();
    f.time.advance(100000);
    assert.equal(f.film.snapshot().index, 0);
    assert.equal(f.film.snapshot().playing, false);
    f.film.play();
    assert.equal(f.spoken.length, 2);
    assert.equal(f.spoken[1].text, frames[0].text);
});

test('Stop, novo load e destroy invalidam callbacks de cenas anteriores', () => {
    const f = fixture();
    f.film.load(frames); f.film.play();
    const oldEnd = f.spoken[0].onend;
    const oldError = f.spoken[0].onerror;
    f.film.stop();
    f.film.load([{ text: 'Outra cena.', image: 'new.png' }]);
    f.film.play();
    oldEnd(); oldError();
    assert.equal(f.film.snapshot().index, 0);
    assert.equal(f.shown.at(-1).frame.image, 'new.png');
    const newEnd = f.spoken.at(-1).onend;
    f.film.destroy();
    newEnd();
    f.time.advance(100000);
    assert.equal(f.ends(), 0);
    assert.equal(f.time.pending(), 0);
});

test('Sem síntese de voz, leitura silenciosa usa no mínimo três segundos por frame', () => {
    const f = fixture({ speech: null });
    f.film.load(frames); f.film.play();
    assert.equal(f.film.snapshot().narrating, false);
    f.time.advance(2999);
    assert.equal(f.film.snapshot().index, 0);
    f.time.advance(1);
    assert.equal(f.film.snapshot().index, 1);
    assert.equal(readingDuration(Array(30).fill('palavra').join(' ')), 12000);
});

test('Erro de voz e exceção ao falar preservam os frames em modo silencioso', () => {
    const f = fixture();
    f.film.load(frames); f.film.play();
    f.spoken[0].onerror({ error: 'not-allowed' });
    assert.equal(f.film.snapshot().narrating, false);
    assert.equal(f.film.snapshot().voiceAvailable, false);
    f.time.advance(3000);
    assert.equal(f.film.snapshot().index, 1);
    assert.equal(f.spoken.length, 1);
    const throwing = fixture({ speech: { speak() { throw Error('unavailable'); }, cancel() {} } });
    throwing.film.load(frames); throwing.film.play();
    throwing.time.advance(3000);
    assert.equal(throwing.film.snapshot().index, 1);
});

test('Um mecanismo de voz travado não deixa o filme preso indefinidamente', () => {
    const f = fixture();
    f.film.load(frames); f.film.play();
    f.time.advance(8000);
    assert.equal(f.film.snapshot().index, 1);
    assert.equal(f.film.snapshot().narrating, false);
    assert.equal(f.cancels(), 1);
    assert.equal(f.film.snapshot().voiceAvailable, false);
});

test('Desligar voz ou zerar volume cancela fala e reinicia o frame sem som', () => {
    const f = fixture();
    f.film.load(frames); f.film.play();
    const old = f.spoken[0].onend;
    f.film.setVoiceEnabled(false);
    old();
    assert.equal(f.film.snapshot().index, 0);
    assert.equal(f.film.snapshot().narrating, false);
    f.time.advance(3000);
    assert.equal(f.film.snapshot().index, 1);
    f.film.setVoiceEnabled(true);
    assert.equal(f.spoken.at(-1).text, frames[1].text);
    f.film.setVolume(0);
    assert.equal(f.film.snapshot().narrating, false);
    f.time.advance(3000);
    assert.equal(f.film.snapshot().index, 2);
    f.film.setVolume(0.4);
    assert.equal(f.spoken.at(-1).volume, 0.4);
});

test('Avançar, voltar e rever cancelam a fala antiga e mantêm o frame correto', () => {
    const f = fixture();
    f.film.load(frames); f.film.play();
    const old = f.spoken[0].onend;
    f.film.next();
    old();
    assert.equal(f.film.snapshot().index, 1);
    f.film.pause();
    f.film.previous();
    assert.equal(f.film.snapshot().index, 0);
    assert.equal(f.film.snapshot().playing, false);
    f.film.replay();
    assert.equal(f.film.snapshot().playing, true);
    assert.equal(f.spoken.at(-1).text, frames[0].text);
});

test('Cancelar filme ocioso não interrompe falas de outro recurso', () => {
    const f = fixture();
    f.film.load(frames);
    f.film.pause(); f.film.stop(); f.film.destroy();
    assert.equal(f.cancels(), 0);
});

test('Timers globais padrão preservam o receiver exigido pelo navegador', () => {
    const originalSetTimeout = globalThis.setTimeout;
    const originalClearTimeout = globalThis.clearTimeout;
    let scheduled = 0;
    const cancelled = [];
    globalThis.setTimeout = function (callback, delay) {
        assert.equal(this, globalThis, 'setTimeout deve receber globalThis');
        assert.equal(typeof callback, 'function');
        assert.equal(delay, 3000);
        return ++scheduled;
    };
    globalThis.clearTimeout = function (id) {
        assert.equal(this, globalThis, 'clearTimeout deve receber globalThis');
        cancelled.push(id);
    };
    try {
        const film = new StoryFilm({ speech: null });
        film.load([{ text: 'Uma nota.', image: 'forest.png' }]);
        film.play();
        assert.equal(scheduled, 1);
        film.pause();
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
console.log(`\n${passed}/${tests.length} testes de narração passaram.`);
if (passed !== tests.length) process.exitCode = 1;
