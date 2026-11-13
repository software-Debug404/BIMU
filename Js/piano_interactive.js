import { getVolumes } from './audioManager.js';

export const MELODY_NOTES = [1, 5, 8, 10, 8];
const MELODY_LABELS = ['Z', 'W', 'R', 'T', 'R'];
const HANA_NOTE = 14;

// The clock is injectable so the last-note rule can be verified without a DOM.
export class MelodyChallenge {
    constructor({ onChange = () => {}, onComplete = () => {}, onHanaNote = () => {},
        schedule = (callback, delay) => globalThis.setTimeout(callback, delay),
        cancel = id => globalThis.clearTimeout(id), waitMs = 1000 } = {}) {
        this.onChange = onChange;
        this.onComplete = onComplete;
        this.onHanaNote = onHanaNote;
        this.schedule = schedule;
        this.cancel = cancel;
        this.waitMs = waitMs;
        this.active = false;
        this.keysHeld = 0;
        this.completed = false;
        this.progress = 0;
        this.waiting = false;
        this.timer = null;
        this.status = 'ready';
    }

    snapshot() {
        return { progress: this.progress, total: MELODY_NOTES.length,
            waiting: this.waiting, completed: this.completed, active: this.active, keysHeld: this.keysHeld, status: this.status };
    }

    publish() { this.onChange(this.snapshot()); }

    stopTimer() {
        if (this.timer !== null) this.cancel(this.timer);
        this.timer = null;
    }

    activate() {
        this.active = true;
        if (this.waiting && !this.completed) this.waitForHana();
        this.publish();
    }

    deactivate() {
        this.active = false;
        this.stopTimer();
        this.publish();
    }

    setKeysHeld(count) {
        const held = Number.isFinite(count) ? Math.max(0, Math.floor(count)) : 0;
        if (held === this.keysHeld) return;
        this.keysHeld = held;
        if (this.waiting && !this.completed) {
            this.stopTimer();
            if (held === 0) this.waitForHana();
            this.publish();
        }
    }

    reset(completed = false) {
        this.stopTimer();
        this.completed = completed;
        this.progress = completed ? MELODY_NOTES.length : 0;
        this.waiting = false;
        this.status = completed ? 'completed' : 'ready';
        this.publish();
    }

    note(note) {
        if (!this.active || this.completed) return;
        if (this.waiting) {
            this.waitForHana();
            this.publish();
            return;
        }
        if (Number(note) === MELODY_NOTES[this.progress]) {
            this.progress++;
            this.status = 'playing';
            if (this.progress === MELODY_NOTES.length) this.waitForHana();
        } else {
            this.progress = Number(note) === MELODY_NOTES[0] ? 1 : 0;
            this.status = 'retry';
        }
        this.publish();
    }

    assist() {
        if (!this.active || this.completed) return;
        this.progress = MELODY_NOTES.length;
        this.waitForHana();
        this.publish();
    }

    waitForHana() {
        this.stopTimer();
        this.waiting = true;
        this.status = 'waiting';
        if (!this.active || this.keysHeld > 0) return;
        this.timer = this.schedule(() => {
            this.timer = null;
            if (!this.active || this.completed) return;
            this.completed = true;
            this.waiting = false;
            this.status = 'completed';
            this.onHanaNote(HANA_NOTE);
            this.publish();
            this.onComplete();
        }, this.waitMs);
    }
}

let activate = () => {};
let deactivate = () => {};
let configure = () => {};
let resetChallenge = () => {};
let configuration = { mode: 'free', completed: false, onComplete: () => {} };

export function configurePiano(options = {}) {
    configuration = {
        mode: options.mode === 'story' ? 'story' : 'free',
        completed: options.completed === true,
        onComplete: typeof options.onComplete === 'function' ? options.onComplete : () => {}
    };
    configure(configuration);
}

// A new campaign starts a new attempt even when the piano module is already cached.
export function resetPianoChallenge() {
    configuration.completed = false;
    resetChallenge();
}

export function initializeInteractivePiano(container, onClose) {
    const piano = container.querySelector('.piano');
    const pianoKeys = [...container.querySelectorAll('[data-note]')];
    const checkbox = container.querySelector('.checkbox__keys');
    const switcher = container.querySelector('.switcher');
    const keySection = container.querySelector('.piano__keys');
    const layout = ['Tab', '1', 'q', '2', 'w', 'e', '4', 'r', '5', 't', '6', 'y', 'u', '8', 'i', '9', 'o', 'p', '-', '[', '=', ']', 'Backspace', String.fromCharCode(92)];
    const sounds = new Set();
    const demoTimers = new Set();
    let active = false;
    let demonstrating = false;
    let mode = 'free';
    let configuredCompleted = false;
    let completionCallback = () => {};

    const panel = document.createElement('section');
    panel.className = 'piano-challenge';
    panel.hidden = true;
    panel.setAttribute('aria-label', 'A melodia de Bimu e Hana');
    const title = document.createElement('h2');
    title.textContent = 'A última nota é de Hana';
    panel.appendChild(title);
    const description = document.createElement('p');
    description.textContent = 'Toque sua parte na ordem indicada. Depois, tire as mãos e espere sua irmã.';
    panel.appendChild(description);
    const sequence = document.createElement('div');
    sequence.className = 'melody-sequence';
    sequence.setAttribute('aria-label', 'Sequência: Z, W, R, T, R');
    const noteLabels = MELODY_LABELS.map(label => {
        const note = document.createElement('span');
        note.className = 'melody-note';
        note.textContent = label;
        sequence.appendChild(note);
        return note;
    });
    panel.appendChild(sequence);
    const status = document.createElement('p');
    status.className = 'melody-status';
    status.setAttribute('role', 'status');
    status.setAttribute('aria-live', 'polite');
    panel.appendChild(status);
    const actions = document.createElement('div');
    actions.className = 'melody-actions';
    function button(id, label, handler) {
        const element = document.createElement('button');
        element.type = 'button';
        element.id = id;
        element.className = 'piano-close';
        element.textContent = label;
        element.addEventListener('click', handler);
        actions.appendChild(element);
        return element;
    }
    const demoButton = button('pianoDemoButton', 'Ouvir a melodia', demonstrate);
    const resetButton = button('pianoResetButton', 'Tentar de novo', () => {
        stopDemo();
        challenge.reset();
        if (document.activeElement === resetButton) resetButton.blur();
    });
    const assistButton = button('pianoAssistButton', 'Concluir com assistência', () => {
        stopDemo();
        challenge.assist();
        assistButton.blur();
    });
    panel.appendChild(actions);
    piano.appendChild(panel);

    function renderChallenge(state) {
        const messages = {
            ready: 'Sua parte: Z → W → R → T → R.',
            playing: `${state.progress} de ${state.total} notas. Continue sua parte.`,
            retry: 'Tente outra vez. Sua irmã ainda espera por você.',
            waiting: 'Agora, tire as mãos das teclas. A última nota é de Hana…',
            completed: 'Hana tocou a última nota. O portal de casa está aberto.'
        };
        status.textContent = demonstrating ? 'Ouça a parte de Bimu. Depois, toque as teclas indicadas.' : messages[state.status];
        noteLabels.forEach((note, index) => {
            note.classList.toggle('melody-note--played', index < state.progress);
            note.classList.toggle('melody-note--next', index === state.progress && !state.completed);
        });
        demoButton.disabled = demonstrating || state.completed;
        resetButton.disabled = state.completed;
        assistButton.disabled = demonstrating || state.completed;
    }

    const challenge = new MelodyChallenge({
        onChange: renderChallenge,
        onHanaNote: note => {
            sound(note);
            const key = pianoKeys.find(item => Number(item.dataset.note) === note);
            key?.classList.add('hana-note');
        },
        onComplete: () => {
            configuredCompleted = true;
            configuration.completed = true;
            completionCallback();
        }
    });

    function sound(note) {
        if (!active) return;
        const audio = new Audio(new URL(`../notes/${note}.wav`, import.meta.url).href);
        audio.volume = getVolumes().effects;
        sounds.add(audio);
        audio.addEventListener('ended', () => sounds.delete(audio), { once: true });
        audio.play().catch(() => sounds.delete(audio));
    }

    function press(key) {
        if (!active || !key || demonstrating || key.classList.contains('pressed') || key.classList.contains('black--pressed')) return;
        sound(key.dataset.note);
        key.classList.add(key.classList.contains('black') ? 'black--pressed' : 'pressed');
        challenge.setKeysHeld(heldKeyCount());
        if (mode === 'story') challenge.note(Number(key.dataset.note));
    }
    function heldKeyCount() {
        return pianoKeys.filter(key => key.classList.contains('pressed') || key.classList.contains('black--pressed')).length;
    }
    function release(key) {
        key?.classList.remove('pressed', 'black--pressed');
        challenge.setKeysHeld(heldKeyCount());
    }

    function stopDemo() {
        for (const timer of demoTimers) clearTimeout(timer);
        demoTimers.clear();
        demonstrating = false;
        pianoKeys.forEach(key => key.classList.remove('melody-demo'));
        renderChallenge(challenge.snapshot());
    }

    function demonstrate() {
        if (!active || mode !== 'story' || challenge.completed) return;
        stopDemo();
        challenge.reset();
        demonstrating = true;
        renderChallenge(challenge.snapshot());
        MELODY_NOTES.forEach((note, index) => {
            const timer = setTimeout(() => {
                demoTimers.delete(timer);
                if (!active) return;
                pianoKeys.forEach(key => key.classList.remove('melody-demo'));
                sound(note);
                pianoKeys.find(key => Number(key.dataset.note) === note)?.classList.add('melody-demo');
            }, index * 450);
            demoTimers.add(timer);
        });
        const finish = setTimeout(() => {
            demoTimers.delete(finish);
            stopDemo();
            if (document.activeElement === demoButton) demoButton.blur();
        }, MELODY_NOTES.length * 450);
        demoTimers.add(finish);
    }

    function clear() {
        stopDemo();
        challenge.deactivate();
        pianoKeys.forEach(key => {
            release(key);
            key.classList.remove('hana-note');
        });
        for (const audio of sounds) audio.pause();
        sounds.clear();
    }

    function isFormControl(event) {
        return Boolean(event.target.closest?.('input, button, select, textarea'));
    }
    function keyIndex(event) {
        const key = event.key.length === 1 ? event.key.toLowerCase() : event.key;
        // Keep native Tab navigation available for the accessible story controls.
        if (mode === 'story' && key === 'Tab') return -1;
        if (mode === 'story' && key === 'z') return 0;
        return layout.indexOf(key);
    }
    function keydown(event) {
        if (event.key === 'Escape') {
            event.preventDefault();
            event.stopPropagation();
            if (!event.repeat) onClose();
            return;
        }
        if (isFormControl(event)) return;
        const index = keyIndex(event);
        if (index < 0) return;
        event.preventDefault();
        event.stopPropagation();
        if (!event.repeat) press(pianoKeys[index]);
    }
    function keyup(event) {
        const index = keyIndex(event);
        if (index < 0) return;
        // A key released over a focused button must still release its visual state.
        if (!isFormControl(event)) {
            event.preventDefault();
            event.stopPropagation();
        }
        release(pianoKeys[index]);
    }
    for (const key of pianoKeys) {
        key.addEventListener('pointerdown', event => {
            event.preventDefault();
            key.setPointerCapture?.(event.pointerId);
            press(key);
        });
        key.addEventListener('pointerup', () => release(key));
        key.addEventListener('pointercancel', () => release(key));
    }
    checkbox?.addEventListener('change', () => {
        switcher?.classList.toggle('switcher--active', checkbox.checked);
        keySection?.classList.toggle('disabled-keys', !checkbox.checked);
    });
    const close = document.createElement('button');
    close.type = 'button';
    close.className = 'piano-close';
    close.textContent = 'Voltar ao jogo · Esc';
    close.addEventListener('click', onClose);
    container.querySelector('.controls').appendChild(close);

    resetChallenge = () => {
        stopDemo();
        configuredCompleted = false;
        challenge.reset();
    };
    configure = options => {
        completionCallback = options.onComplete;
        const needsReset = mode !== options.mode || configuredCompleted !== options.completed;
        mode = options.mode;
        configuredCompleted = options.completed;
        panel.hidden = mode !== 'story';
        const firstLabel = pianoKeys[0]?.querySelector('span');
        if (firstLabel) firstLabel.textContent = mode === 'story' ? 'Z' : 'TAB';
        piano.classList.toggle('piano--story', mode === 'story');
        if (needsReset) challenge.reset(options.completed);
        if (mode === 'story') {
            checkbox.checked = true;
            switcher?.classList.add('switcher--active');
            keySection?.classList.remove('disabled-keys');
            if (active) challenge.activate();
        } else {
            challenge.deactivate();
        }
        renderChallenge(challenge.snapshot());
    };
    activate = () => {
        if (active) return;
        active = true;
        document.addEventListener('keydown', keydown, true);
        document.addEventListener('keyup', keyup, true);
        if (mode === 'story') challenge.activate();
    };
    deactivate = () => {
        active = false;
        document.removeEventListener('keydown', keydown, true);
        document.removeEventListener('keyup', keyup, true);
        clear();
        if (container.contains(document.activeElement)) document.activeElement.blur();
    };
    window.addEventListener('blur', clear);
    window.addEventListener('audio:volumechange', () => {
        for (const audio of sounds) audio.volume = getVolumes().effects;
    });
    configure(configuration);
}

export function activatePianoControls() { activate(); }
export function deactivatePianoControls() { deactivate(); }
