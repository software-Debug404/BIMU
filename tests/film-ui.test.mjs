// Verifica a apresentação do filme com o HTML e os módulos reais.
// DOM, síntese de voz e dispositivos são simulados; layout e som audível exigem navegador.
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const root = new URL('../', import.meta.url);
const elements = [];
let document;
let focused = true;

class BrowserTarget extends EventTarget {
    addEventListener(type, listener, options) {
        super.addEventListener(type, listener, typeof options === 'boolean' ? { capture: options } : options);
    }
    removeEventListener(type, listener, options) {
        super.removeEventListener(type, listener, typeof options === 'boolean' ? { capture: options } : options);
    }
}

class Element extends BrowserTarget {
    constructor(tag = 'div', attributes = {}) {
        super();
        this.tagName = tag.toUpperCase();
        this.attributes = attributes;
        this.children = [];
        this.style = {};
        this.dataset = {};
        this.hidden = 'hidden' in attributes;
        this.value = attributes.value || '';
        this.checked = false;
        this.isConnected = true;
        this.parentElement = null;
        this.classes = new Set((attributes.class || '').split(/\s+/).filter(Boolean));
        for (const [key, value] of Object.entries(attributes)) {
            if (key.startsWith('data-')) {
                this.dataset[key.slice(5).replace(/-([a-z])/g, (_, letter) => letter.toUpperCase())] = value;
            }
        }
        this.classList = {
            contains: name => this.classes.has(name),
            add: (...names) => names.forEach(name => this.classes.add(name)),
            remove: (...names) => names.forEach(name => this.classes.delete(name)),
            toggle: (name, force = !this.classes.has(name)) => force ? this.classes.add(name) : this.classes.delete(name),
        };
        elements.push(this);
    }
    set id(value) { this.attributes.id = String(value); }
    get id() { return this.attributes.id || ''; }
    set type(value) { this.attributes.type = String(value); }
    get type() { return this.attributes.type || ''; }
    set className(value) { this.classes = new Set(value.split(/\s+/)); }
    get className() { return [...this.classes].join(' '); }
    setAttribute(key, value) { this.attributes[key] = String(value); }
    matches(selector) {
        return selector.split(',').some(part => {
            part = part.trim();
            if (part.startsWith('.')) return this.classes.has(part.slice(1));
            if (part.startsWith('#')) return this.attributes.id === part.slice(1);
            if (part.startsWith('[')) return part.slice(1, -1) in this.attributes;
            return this.tagName.toLowerCase() === part;
        });
    }
    closest(selector) { return this.matches(selector) ? this : this.parentElement?.closest(selector); }
    querySelectorAll(selector) {
        return this.children.flatMap(child => [child, ...child.querySelectorAll('*')])
            .filter(child => selector === '*' || child.matches(selector));
    }
    querySelector(selector) { return this.querySelectorAll(selector)[0] || null; }
    appendChild(child) { child.parentElement = this; this.children.push(child); return child; }
    replaceChildren(...children) { this.children = []; children.forEach(child => this.appendChild(child)); }
    contains(child) { return child === this || this.children.some(item => item.contains(child)); }
    focus() { document.activeElement = this; }
    blur() { if (document.activeElement === this) document.activeElement = document.body; }
    getClientRects() {
        if (this.hidden || this.style.display === 'none') return [];
        return this.parentElement ? this.parentElement.getClientRects() : [{}];
    }
}

function parseHTML(html) {
    const tree = new Element('document');
    const stack = [tree];
    for (const token of html.matchAll(/<\/?[a-z][^>]*>/gi)) {
        const text = token[0];
        const tag = text.match(/^<\/?([a-z][\w-]*)/i)[1].toLowerCase();
        if (text.startsWith('</')) {
            if (stack.at(-1)?.tagName.toLowerCase() === tag) stack.pop();
            continue;
        }
        const attributes = {};
        const attrs = text.slice(text.indexOf(tag) + tag.length, -1);
        for (const match of attrs.matchAll(/([\w-]+)(?:="([^"]*)"|='([^']*)')?/g)) {
            attributes[match[1]] = match[2] ?? match[3] ?? '';
        }
        const element = stack.at(-1).appendChild(new Element(tag, attributes));
        if (!['meta', 'link', 'input', 'br', 'img', 'hr'].includes(tag)) stack.push(element);
    }
    return tree;
}

document = parseHTML(await readFile(new URL('index.html', root), 'utf8'));
document.body = document.querySelector('body');
document.activeElement = document.body;
document.baseURI = new URL('index.html', root).href;
document.readyState = 'complete';
document.hidden = false;
document.hasFocus = () => focused;
document.getElementById = id => document.querySelector(`#${id}`);
document.createElement = tag => new Element(tag);

const window = new BrowserTarget();
window.location = { reload() {} };
const storage = new Map();
Object.assign(globalThis, {
    window, document,
    localStorage: {
        getItem: key => storage.get(key) ?? null,
        setItem: (key, value) => storage.set(key, String(value)),
        removeItem: key => storage.delete(key)
    },
    Image: class {
        width = 0;
        height = 0;
        set src(value) {
            readFile(fileURLToPath(value)).then(buffer => {
                this.width = buffer.readUInt32BE(16);
                this.height = buffer.readUInt32BE(20);
                this.onload?.();
            }, () => this.onerror?.());
        }
    },
    Audio: class extends EventTarget {
        paused = true;
        constructor(src) { super(); this.src = src; }
        play() { this.paused = false; return Promise.resolve(); }
        pause() { this.paused = true; }
    },

});

function assert(condition, message) { if (!condition) throw new Error(message); }
function equal(actual, expected, message) { assert(actual === expected, `${message}: ${actual} !== ${expected}`); }
const wait = ms => new Promise(resolve => setTimeout(resolve, ms));
async function waitUntil(condition, message) {
    for (let i = 0; i < 200; i++) {
        if (condition()) return;
        await wait(10);
    }
    throw new Error(message);
}
const click = id => document.getElementById(id).dispatchEvent(new Event('click'));


// Window timers may be called bare or with Window as receiver, never as StoryFilm methods.
// This catches borrowed-browser-API failures that ordinary Node timers do not expose.
const nativeSetTimeout = globalThis.setTimeout;
const nativeClearTimeout = globalThis.clearTimeout;
const pendingTimers = new Set();
globalThis.setTimeout = function (callback, delay, ...args) {
    assert(this === undefined || this === globalThis, 'Timer recebeu receiver incompatível com Window');
    let handle;
    handle = nativeSetTimeout(() => {
        pendingTimers.delete(handle);
        callback(...args);
    }, delay);
    pendingTimers.add(handle);
    return handle;
};
globalThis.clearTimeout = function (handle) {
    assert(this === undefined || this === globalThis, 'Cancelamento recebeu receiver incompatível com Window');
    pendingTimers.delete(handle);
    nativeClearTimeout(handle);
};

const spoken = [];
let speechCancels = 0;
globalThis.SpeechSynthesisUtterance = class { constructor(text) { this.text = text; } };
globalThis.speechSynthesis = {
    speak(utterance) { spoken.push(utterance); },
    cancel() { speechCancels++; },
    getVoices() { return [{ lang: 'pt-BR', name: 'Português do Brasil' }]; }
};
const outcomes = [];
async function check(name, run) {
    await run();
    outcomes.push(name);
    console.log(`PASS ${name}`);
}
const background = new URL('assets/background/Floresta.PNG', root).href;
let continuations = 0;
try {
    await import('../Js/ui.js');
    await check('Abertura prepara o filme, habilita Play e mostra somente a legenda do quadro atual', async () => {
        window.showStoryScene({ title: 'A última nota', background, frames: [
            { text: 'Bimu ouviu o piano.', image: background },
            { text: 'Hana tocou a última nota.', image: new URL('assets/story/reunion.png', root).href }
        ] }, { onContinue: () => continuations++ });
        await waitUntil(() => spoken.length === 1, 'O filme precisa narrar o primeiro quadro');
        equal(document.getElementById('storyPlayButton').disabled, false, 'Play habilitado após preparar');
        equal(document.getElementById('storyReplayButton').disabled, false, 'Replay habilitado após preparar');
        equal(document.getElementById('storyText').children.length, 1, 'Uma legenda por vez');
        equal(document.getElementById('storyFrameCounter').textContent, '1 / 2', 'Contador inicial');
        equal(spoken[0].lang, 'pt-BR', 'Idioma');
        equal(spoken[0].volume, 0.5, 'Volume segue efeitos');
        assert(document.getElementById('storyFilmStatus').textContent.includes('Narração'), 'Estado de narração pronto');
    });
    await check('Fim da fala troca o quadro e os controles permitem pausar, voltar e retomar', () => {
        spoken[0].onend();
        equal(document.getElementById('storyFrameCounter').textContent, '2 / 2', 'Fim da fala avança quadro');
        equal(spoken.length, 2, 'Segunda fala');
        click('storyPlayButton');
        assert(document.getElementById('storyFilmStatus').textContent.includes('pausado'), 'Pausa interrompe fala');
        click('storyPreviousFrameButton');
        equal(document.getElementById('storyFrameCounter').textContent, '1 / 2', 'Voltar quadro');
        click('storyPlayButton');
        assert(spoken.length >= 3, 'Play retoma o quadro');
    });
    await check('Perder foco pausa a narração sem desabilitar o botão de retorno', () => {
        window.dispatchEvent(new Event('blur'));
        assert(document.getElementById('storyFilmStatus').textContent.includes('pausado'), 'Blur deve pausar filme');
        equal(document.getElementById('storyPlayButton').disabled, false, 'Play segue disponível após blur');
        click('storyPlayButton');
        assert(document.getElementById('storyFilmStatus').textContent.includes('Narração'), 'Play retoma fala após blur');
    });
    await check('Voz desligada mantém legendas e a saída cancela timers e callbacks antigos', () => {
        const staleEnd = spoken.at(-1).onend;
        click('storyVoiceButton');
        equal(document.getElementById('storyVoiceButton').attributes['aria-pressed'], 'false', 'Voz desligada');
        assert(pendingTimers.size > 0, 'Filme silencioso precisa ter timer de leitura');
        click('storyContinueButton');
        equal(continuations, 1, 'Continuar chama callback uma vez');
        assert(document.getElementById('storyScreen').hidden, 'Continuar encerra filme');
        equal(pendingTimers.size, 0, 'Nenhum timer permanece após continuar');
        const counter = document.getElementById('storyFrameCounter').textContent;
        staleEnd();
        equal(document.getElementById('storyFrameCounter').textContent, counter, 'Fim antigo não altera a tela');
        assert(speechCancels > 0, 'A fala anterior deve ser cancelada');
    });
    await check('Preferência de voz é aplicada na próxima cena e pular mantém a integração', async () => {
        window.showStoryScene({ title: 'Outra cena', background, text: 'Sem voz, a legenda continua.' }, {
            onSkip: () => continuations++
        });
        await waitUntil(() => !document.getElementById('storyPlayButton').disabled, 'Filme sem voz deve preparar normalmente');
        assert(document.getElementById('storyFilmStatus').textContent.includes('legendas'), 'Preferência voz desligada aplicada');
        equal(storage.get('bimu:narration:v1'), 'false', 'Preferência persistida');
        click('storySkipButton');
        equal(continuations, 2, 'Pular mantém callback');
        equal(pendingTimers.size, 0, 'Pular também cancela timers');
    });
    await check('Ocultar uma cena durante o import pendente não inicia fala depois da saída', async () => {
        const before = spoken.length;
        window.showStoryScene({ title: 'Cena cancelada', background, text: 'Esta fala não deve começar.' });
        window.hideStoryScene();
        await wait(20);
        equal(spoken.length, before, 'Import antigo não inicia narração');
        equal(pendingTimers.size, 0, 'Import antigo não deixa timer');
    });
    console.log(`\n${outcomes.length}/${outcomes.length} cenários de filme e UI passaram.`);
} catch (error) {
    console.error(`FAIL após ${outcomes.length} cenários:`, error);
    window.hideStoryScene?.();
    process.exitCode = 1;
} finally {
    globalThis.setTimeout = nativeSetTimeout;
    globalThis.clearTimeout = nativeClearTimeout;
}
