// Exercita os módulos reais com DOM, canvas e dispositivos de áudio substituídos.
// Não verifica layout, som audível, autoplay ou comportamento de um navegador real.
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { Fighter, FighterAI } from '../Js/sprites.js';
import { loadImages } from '../Js/loader.js';

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
    getClientRects() { return this.hidden || this.style.display === 'none' ? [] : [{}]; }
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
const textDrawn = [];
const ctx = {
    clearRect() { textDrawn.length = 0; }, fillRect() {}, strokeRect() {},
    fillText(text) { textDrawn.push(String(text)); }, measureText: text => ({ width: text.length * 8 }),
    save() {}, restore() {}, translate() {}, scale() {},
    drawImage(image) { assert(image.width > 0 && image.height > 0, 'Imagem real precisa ter dimensões válidas'); },
};
document.querySelector('canvas').getContext = () => ctx;
let raf = [];
let timestamp = 0;
Object.assign(globalThis, {
    window, document,
    localStorage: { getItem: () => null, setItem() {} },
    requestAnimationFrame(callback) { raf.push(callback); return raf.length; },
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
    DOMParser: class { parseFromString(html) { return parseHTML(html); } },
    async fetch(url) {
        try {
            const content = await readFile(fileURLToPath(url), 'utf8');
            return { ok: true, text: async () => content };
        } catch { return { ok: false }; }
    },
});

function assert(condition, message) { if (!condition) throw new Error(message); }
function equal(actual, expected, message) { assert(actual === expected, `${message}: ${actual} !== ${expected}`); }
const wait = ms => new Promise(resolve => setTimeout(resolve, ms));
async function waitUntil(condition, message) {
    for (let i = 0; i < 100; i++) {
        if (condition()) return;
        await wait(10);
    }
    throw new Error(message);
}
function frames(count = 1) {
    for (let i = 0; i < count; i++) {
        equal(raf.length, 1, 'Deve existir apenas um loop de animação');
        const callbacks = raf;
        raf = [];
        timestamp += 1000 / 60;
        callbacks.forEach(callback => callback(timestamp));
    }
}
function key(type, name) {
    const event = new Event(type, { cancelable: true });
    Object.defineProperties(event, {
        key: { value: name }, code: { value: name === ' ' ? 'Space' : `Key${name.toUpperCase()}` },
        repeat: { value: false }, shiftKey: { value: false },
    });
    document.dispatchEvent(event);
    if (!event.cancelBubble) window.dispatchEvent(event);
}
const press = name => key('keydown', name);
const release = name => key('keyup', name);
const click = id => document.getElementById(id).dispatchEvent(new Event('click'));

const actors = new Set();
const originalUpdate = Fighter.prototype.update;
Fighter.prototype.update = function (dt) {
    actors.add(this);
    return originalUpdate.call(this, dt);
};
const player = () => [...actors].find(actor => !(actor instanceof FighterAI));
const enemy = () => [...actors].filter(actor => actor instanceof FighterAI).at(-1);
const pause = () => !document.getElementById('pauseScreen').hidden;
const stage = () => textDrawn.find(text => text.startsWith('FASE '));
const outcomes = [];
async function check(name, run) {
    await run();
    outcomes.push(name);
    console.log(`PASS ${name}`);
}

try {
    await check('Loader rejeita recurso ausente com caminho identificável', async () => {
        let error;
        try { await loadImages(['../assets/ausente-no-teste.png']); } catch (failure) { error = failure; }
        assert(error?.message.includes('ausente-no-teste.png'), 'Recurso ausente deve rejeitar o carregamento');
    });

    await import('../Js/ui.js');
    await import('../Js/game.js');
    await window.gameReady;
    await check('Inicialização aguarda imagens PNG reais e mantém um único rAF', () => {
        equal(raf.length, 1, 'Loop único');
        equal(document.getElementById('assetStatus').textContent, 'Pronto para jogar', 'Progresso real');
    });

    await check('Menu inicia a luta e os controles movimentam o jogador', async () => {
        click('startButton');
        click('playButton');
        await wait(350);
        equal(window.jogoIniciado, true, 'Jogo iniciado');
        frames(60);
        const before = player().position.x;
        press('d'); frames(10); release('d');
        assert(player().position.x > before, 'D deve mover o personagem');
        equal(stage(), 'FASE 1', 'HUD inicial');
    });

    await check('Esc e perda de foco pausam; retornar não mantém teclas presas', () => {
        press('Escape');
        assert(pause(), 'Esc deve abrir pausa');
        const before = player().position.x;
        press('d'); frames(20);
        equal(player().position.x, before, 'Pausa deve congelar a simulação');
        press('Escape'); frames(3);
        equal(player().position.x, before, 'Retomar deve limpar teclas anteriores');
        press('d'); frames(2);
        focused = false;
        window.dispatchEvent(new Event('blur'));
        assert(pause(), 'Perder foco deve pausar');
        focused = true;
        click('resumeButton'); frames(3);
        const after = player().position.x;
        frames(3);
        equal(player().position.x, after, 'Tecla anterior ao blur precisa ser limpa');
    });

    await check('Derrota e nova tentativa restauram a mesma luta', () => {
        const previousEnemy = enemy();
        player().takeDamage(1000);
        frames(2);
        equal(document.getElementById('gameOverScreen').style.display, 'flex', 'Tela de derrota');
        click('retryButton'); frames(3);
        equal(player().health, player().maxHealth, 'Vida restaurada');
        equal(player().potions, 3, 'Poções restauradas');
        equal(enemy().name, previousEnemy.name, 'Mesmo inimigo da fase');
        assert(enemy() !== previousEnemy, 'Nova tentativa deve reconstruir o inimigo');
        equal(stage(), 'FASE 1', 'Mesma fase após retry');
    });

    async function nextStage(loseFocus = false) {
        enemy().takeDamage(1000);
        frames(2);
        player().position.x = 800;
        player().position.y = 240;
        player().onGround = true;
        press('q'); frames(1); release('q');
        if (loseFocus) {
            focused = false;
            document.hidden = true;
            document.dispatchEvent(new Event('visibilitychange'));
        }
        await wait(350);
        if (loseFocus) {
            assert(pause(), 'Perder foco durante a transição também deve pausar');
            focused = true;
            document.hidden = false;
            document.dispatchEvent(new Event('visibilitychange'));
            click('resumeButton');
        }
        frames(3);
    }

    await check('Portal avança e preserva a pausa ao perder foco durante a transição', async () => {
        await nextStage(true);
        equal(stage(), 'FASE 2', 'Avanço para fase2');
    });

    await check('Nove portais chegam ao estágio bônus com piano', async () => {
        for (let number = 3; number <= 10; number++) {
            await nextStage();
            equal(stage(), `FASE ${number}`, 'Número da fase');
        }
        assert(textDrawn.includes('Um momento de descanso'), 'Fase10 deve ser o bônus');
    });

    await check('Piano abre e fecha três vezes sem bloquear a jornada', async () => {
        const wrapper = document.getElementById('piano-container-wrapper');
        player().position.x = 450;
        player().position.y = 240;
        player().onGround = true;
        for (let attempt = 0; attempt < 3; attempt++) {
            press('q'); frames(2); release('q');
            await waitUntil(() => !wrapper.classList.contains('hidden'), `Piano não abriu na tentativa${attempt + 1}`);
            press('q'); release('q'); // Nota do piano não deve acionar o jogo.
            press('Escape'); release('Escape');
            assert(wrapper.classList.contains('hidden'), `Piano não fechou na tentativa${attempt + 1}`);
            frames(3);
            assert(!pause(), 'Fechar piano com Esc não deve abrir pausa');
        }
        equal(stage(), 'FASE 10', 'Piano mantém a fase atual');
    });

    console.log(`\n${outcomes.length}/${outcomes.length} cenários de integração passaram.`);
} catch (error) {
    console.error(`FAIL após ${outcomes.length} cenários: ${error.stack}`);
    process.exitCode = 1;
} finally {
    Fighter.prototype.update = originalUpdate;
}
