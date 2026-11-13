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
const textDrawn = [];
const ctx = {
    clearRect() { textDrawn.length = 0; }, fillRect() {}, strokeRect() {},
    fillText(text) { textDrawn.push(String(text)); }, measureText: text => ({ width: text.length * 8 }),
    save() {}, restore() {}, translate() {}, scale() {},
    drawImage(image) { assert(image.width > 0 && image.height > 0, 'Imagem real precisa ter dimensões válidas'); },
};
document.querySelector('canvas').getContext = () => ctx;
const storage = new Map();
let raf = [];
let timestamp = 0;
let pianoFetchGate = null;
let pianoFetchCalls = 0;
Object.assign(globalThis, {
    window, document,
    localStorage: {
        getItem: key => storage.get(key) ?? null,
        setItem: (key, value) => storage.set(key, String(value)),
        removeItem: key => storage.delete(key)
    },
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
        if (new URL(url).pathname.endsWith('/piano.html')) {
            pianoFetchCalls++;
            if (pianoFetchGate) await pianoFetchGate;
        }
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
    for (let i = 0; i < 200; i++) {
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
const originalReset = Fighter.prototype.reset;
Fighter.prototype.reset = function (position) {
    actors.add(this);
    return originalReset.call(this, position);
};
Fighter.prototype.update = function (dt) {
    actors.add(this);
    return originalUpdate.call(this, dt);
};
const player = () => [...actors].find(actor => !(actor instanceof FighterAI));
const enemy = () => [...actors].filter(actor => actor instanceof FighterAI).at(-1);
const secondPlayer = () => [...actors].filter(actor => !(actor instanceof FighterAI) && actor !== player()).at(-1);
const storyVisible = () => !document.getElementById('storyScreen').hidden;
const storySave = () => JSON.parse(storage.get('bimu:story:v1') || 'null');
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

    await check('Primeiro piano da história carrega pausado, retoma e espera o jogador soltar as teclas', async () => {
        storage.set('bimu:story:v1', JSON.stringify({ version: 1, stage: 9,
            seenScenes: ['chapter-10'], melodyComplete: false, completed: false }));
        window.dispatchEvent(new CustomEvent('game:progresschanged'));
        click('continueStoryButton'); click('playButton'); await wait(350); frames(60);
        equal(stage(), 'FASE 10', 'Checkpoint usado para testar primeiro carregamento');
        let releaseFetch;
        pianoFetchGate = new Promise(resolve => { releaseFetch = resolve; });
        const wrapper = document.getElementById('piano-container-wrapper');
        player().position.x = 450; player().position.y = 240; player().onGround = true;
        press('q'); frames(3); release('q');
        await waitUntil(() => pianoFetchCalls === 1, 'O primeiro fetch do piano deve estar pendente');
        focused = false; document.hidden = true;
        document.dispatchEvent(new Event('visibilitychange'));
        assert(pause(), 'Perder foco durante o primeiro fetch deve pausar');
        releaseFetch(); pianoFetchGate = null;
        await waitUntil(() => document.getElementById('pianoAssistButton'), 'O piano deve terminar de carregar mesmo pausado');
        await wait(10);
        assert(wrapper.classList.contains('hidden'), 'Piano não deve aparecer por trás da pausa');
        assert(!wrapper.querySelector('.piano-challenge').hidden, 'O primeiro carregamento pausado precisa configurar modo história');
        assert(!storySave().melodyComplete, 'Carregar ou pausar não pode concluir a melodia');
        focused = true; document.hidden = false;
        document.dispatchEvent(new Event('visibilitychange'));
        click('resumeButton');
        await waitUntil(() => !wrapper.classList.contains('hidden'), 'Retomar deve abrir o piano já configurado');
        for (const note of ['z', 'w', 'r', 't']) { press(note); release(note); }
        press('r');
        await wait(1100);
        assert(!storySave().melodyComplete, 'Hana não pode tocar enquanto Bimu mantém a última tecla pressionada');
        release('r');
        await waitUntil(() => storySave().melodyComplete, 'Soltar as teclas e esperar deve permitir a última nota de Hana');
        press('Escape'); release('Escape'); frames(3);
        assert(wrapper.classList.contains('hidden'), 'Piano deve continuar fechando normalmente');
        window.dispatchEvent(new CustomEvent('game:menu'));
        storage.delete('bimu:story:v1');
        window.dispatchEvent(new CustomEvent('game:progresschanged'));
    });

    await check('Menu inicia a luta e os controles movimentam o jogador', async () => {
        click('endlessButton');
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


    async function launchMode(button) {
        window.dispatchEvent(new CustomEvent('game:menu'));
        click(button);
        click('playButton');
        await wait(350);
        frames(3);
    }
    function continueStory() {
        assert(storyVisible(), 'Um trecho da história precisa estar aberto');
        click('storyContinueButton');
        frames(3);
    }
    function leaveUsingPause() {
        press('Escape'); release('Escape');
        assert(pause(), 'Sair pelo menu requer abrir a pausa');
        click('returnMenuButton');
        equal(window.jogoIniciado, false, 'Retorno ao menu encerra a sessão');
    }

    await check('História abre o prólogo, bloqueia combate durante a leitura e salva o trecho visto', async () => {
        await launchMode('startButton');
        assert(storyVisible(), 'História deve começar pelo prólogo');
        equal(document.getElementById('storyTitle').textContent, 'Uma nota debaixo da terra', 'Título do prólogo');
        const before = player().position.x;
        press('d'); frames(30); release('d');
        equal(player().position.x, before, 'Movimento não deve avançar durante a narrativa');
        equal(storySave().stage, 0, 'Checkpoint inicial');
        continueStory();
        assert(!storyVisible(), 'Continuar deve liberar o combate');
        assert(storySave().seenScenes.includes('chapter-1'), 'Trecho concluído deve ser salvo');
    });

    await check('Portal da campanha abre o trecho da fase seguinte e retry não repete trecho visto', async () => {
        frames(60);
        await nextStage();
        assert(storyVisible(), 'Avançar deve abrir a narrativa da fase2');
        equal(document.getElementById('storyTitle').textContent, 'As ruínas nas dunas', 'Narrativa da fase2');
        equal(storySave().stage, 1, 'Checkpoint da fase2');
        continueStory();
        player().takeDamage(1000); frames(2);
        click('retryButton'); frames(3);
        assert(!storyVisible(), 'Retry não deve repetir um trecho já visto');
        equal(stage(), 'FASE 2', 'Retry deve preservar a fase da história');
        equal(player().health, player().maxHealth, 'Retry restaura a vida');
    });

    await check('Menu e Continuar história retomam o checkpoint sem perder trechos vistos', async () => {
        leaveUsingPause();
        assert(!document.getElementById('continueStoryButton').hidden, 'Menu deve oferecer continuar');
        const savedBefore = storySave();
        click('continueStoryButton'); click('playButton'); await wait(350); frames(3);
        equal(stage(), 'FASE 2', 'Continuar deve retomar a fase2');
        assert(!storyVisible(), 'Trecho já visto não deve reaparecer');
        equal(storySave().seenScenes.join(','), savedBefore.seenScenes.join(','), 'Trechos vistos preservados');
    });

    await check('Reler o trecho pela pausa não altera progresso e retorna ao jogo pausado', () => {
        press('Escape'); release('Escape');
        assert(pause(), 'Pausa inicial');
        const before = storage.get('bimu:story:v1');
        click('replayStoryButton');
        assert(storyVisible(), 'Reler deve abrir o trecho atual');
        continueStory();
        assert(pause(), 'Reler deve retornar à pausa');
        equal(storage.get('bimu:story:v1'), before, 'Reler não pode alterar o save');
        click('resumeButton'); frames(3);
    });

    await check('Campanha chega ao piano da fase10 e impede portal antes da última nota', async () => {
        for (let number = 3; number <= 10; number++) {
            frames(60);
            await nextStage();
            assert(storyVisible(), `A fase${number} deve ter um trecho próprio`);
            equal(storySave().stage, number - 1, 'Checkpoint acompanha cada fase');
            continueStory();
        }
        equal(stage(), 'FASE 10', 'Última fase da campanha');
        player().position.x = 800; player().position.y = 240; player().onGround = true;
        press('q'); frames(3); release('q');
        await wait(20);
        assert(!storyVisible(), 'Sem melodia, não deve abrir o reencontro');
        equal(stage(), 'FASE 10', 'Sem melodia, não deve avançar para fase11');
        assert(!storySave().melodyComplete && !storySave().completed, 'Campanha ainda não concluída');
    });

    await check('Assistência preserva a espera pela nota de Hana e abre o portal de casa', async () => {
        const wrapper = document.getElementById('piano-container-wrapper');
        player().position.x = 450; player().position.y = 240; player().onGround = true;
        press('q'); frames(3); release('q');
        await waitUntil(() => !wrapper.classList.contains('hidden'), 'Piano da história deve abrir');
        const assist = document.getElementById('pianoAssistButton');
        assert(assist, 'Assistência precisa estar disponível');
        assist.dispatchEvent(new Event('click'));
        assert(!storySave().melodyComplete, 'Assistência não deve pular a espera de Hana');
        await waitUntil(() => storySave().melodyComplete, 'Hana deve completar a melodia após a espera');
        assert(!storySave().completed, 'Melodia sozinha não encerra a campanha');
        assert(!wrapper.classList.contains('hidden'), 'O som final não deve ser cortado fechando o piano automaticamente');
        press('Escape'); release('Escape'); frames(3);
        assert(wrapper.classList.contains('hidden'), 'Esc permite voltar ao portal');
        player().position.x = 800; player().position.y = 240; player().onGround = true;
        press('q'); frames(3); release('q');
        assert(storyVisible(), 'Portal deve abrir o reencontro');
        equal(document.getElementById('storyTitle').textContent, 'Do outro lado, Hana', 'Cena do reencontro');
    });

    await check('Reencontro e epílogo encerram a história sem criar fase11', () => {
        assert(!storySave().completed, 'Campanha só conclui depois do epílogo');
        continueStory();
        assert(storyVisible(), 'Epílogo deve seguir o reencontro');
        equal(document.getElementById('storyTitle').textContent, 'A última batida', 'Epílogo preservado');
        continueStory();
        assert(storySave().completed, 'Save deve registrar conclusão depois do epílogo');
        assert(!document.getElementById('campaignEndingScreen').hidden, 'Tela de conclusão deve permitir reler o final');
        frames(30);
        assert(!textDrawn.includes('FASE 11'), 'Campanha não pode criar fase11');
        click('campaignMenuButton');
        equal(window.jogoIniciado, false, 'Final permite voltar ao menu');
        assert(document.getElementById('continueStoryButton').hidden, 'História concluída não deve oferecer checkpoint ativo');
    });

    await check('Versus local cria dois lutadores humanos, preserva o save e exige os dois prontos', async () => {
        const saved = storage.get('bimu:story:v1');
        await launchMode('versusButton');
        frames(60);
        assert(player() instanceof Fighter && !(player() instanceof FighterAI), 'J1 humano');
        assert(secondPlayer() instanceof Fighter && !(secondPlayer() instanceof FighterAI), 'J2 humano sem IA');
        equal(player().potions, 0, 'J1 sem poções');
        equal(secondPlayer().potions, 0, 'J2 sem poções');
        const before1 = player().position.x;
        const before2 = secondPlayer().position.x;
        press('d'); press('ArrowLeft'); frames(10); release('d'); release('ArrowLeft');
        equal(player().position.x, before1, 'J1 não se move antes da prontidão');
        equal(secondPlayer().position.x, before2, 'J2 não se move antes da prontidão');
        press('f'); frames(2); release('f');
        assert(textDrawn.some(text => text.includes('J1: pronto')), 'J1 confirma prontidão');
        assert(textDrawn.some(text => text.includes('Enter para ficar pronto')), 'J2 ainda precisa confirmar');
        press('Enter'); frames(2); release('Enter');
        assert(textDrawn.some(text => text.includes('Preparem-se!')), 'Os dois iniciam contagem');
        frames(190);
        press('d'); press('ArrowLeft'); frames(10); release('d'); release('ArrowLeft');
        assert(player().position.x > before1, 'J1 controla sua direção');
        assert(secondPlayer().position.x < before2, 'J2 controla sua direção');
        equal(storage.get('bimu:story:v1'), saved, 'Versus não pode alterar o progresso da história');
    });

    await check('Versus pontua, prepara próximo round, encerra melhor de3 e oferece revanche', () => {
        const saved = storage.get('bimu:story:v1');
        secondPlayer().takeDamage(1000); frames(2);
        assert(!document.getElementById('versusResultScreen').hidden, 'Resultado do primeiro round');
        assert(document.getElementById('versusResultTitle').textContent.includes('Jogador 1 venceu o round'), 'Vitória do J1');
        equal(document.getElementById('versusResultScore').textContent, '1 : 0', 'Placar após round1');
        click('versusNextButton'); frames(3);
        equal(player().health, player().maxHealth, 'Novo round restaura J1');
        equal(secondPlayer().health, secondPlayer().maxHealth, 'Novo round restaura J2');
        assert(textDrawn.some(text => text.includes('F para ficar pronto')), 'Novo round exige prontidão');
        press('f'); press('Enter'); frames(2); release('f'); release('Enter'); frames(190);
        secondPlayer().takeDamage(1000); frames(2);
        assert(document.getElementById('versusResultTitle').textContent.includes('Jogador 1 venceu a partida'), 'Duas vitórias encerram a partida');
        equal(document.getElementById('versusResultScore').textContent, '2 : 0', 'Placar final');
        assert(!document.getElementById('versusRematchButton').hidden, 'Revanche disponível');
        click('versusRematchButton'); frames(3);
        assert(textDrawn.some(text => text.includes('F para ficar pronto')), 'Revanche volta à prontidão');
        assert(textDrawn.some(text => text.includes('ROUND 1 · 0 × 0')), 'Revanche zera placar');
        equal(storage.get('bimu:story:v1'), saved, 'Resultados versus não alteram campanha');
    });

    await check('Voltar ao menu e trocar de modo limpa as teclas dos dois jogadores', async () => {
        press('f'); press('Enter'); frames(2); release('f'); release('Enter'); frames(190);
        press('d'); press('ArrowLeft'); frames(2);
        leaveUsingPause();
        click('endlessButton'); click('playButton'); await wait(350); frames(60);
        const before = player().position.x;
        frames(5);
        equal(player().position.x, before, 'A tecla pressionada no versus não pode mover na arena');
        assert(enemy() instanceof FighterAI, 'A arena deve restaurar o adversário com IA');
        equal(stage(), 'FASE 1', 'Arena inicia jornada própria');
        release('d'); release('ArrowLeft');
    });

    console.log(`\n${outcomes.length}/${outcomes.length} cenários de integração passaram.`);
} catch (error) {
    console.error(`FAIL após ${outcomes.length} cenários: ${error.stack}`);
    process.exitCode = 1;
} finally {
    Fighter.prototype.update = originalUpdate;
    Fighter.prototype.reset = originalReset;
}
