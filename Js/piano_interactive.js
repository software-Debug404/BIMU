import { getVolumes } from './audioManager.js';

let activate = () => {};
let deactivate = () => {};

export function initializeInteractivePiano(container, onClose) {
    const pianoKeys = [...container.querySelectorAll('[data-note]')];
    const checkbox = container.querySelector('.checkbox__keys');
    const switcher = container.querySelector('.switcher');
    const keySection = container.querySelector('.piano__keys');
    const layout = ['Tab', '1', 'q', '2', 'w', 'e', '4', 'r', '5', 't', '6', 'y', 'u', '8', 'i', '9', 'o', 'p', '-', '[', '=', ']', 'Backspace', String.fromCharCode(92)];
    const sounds = new Set();
    let active = false;

    function press(key) {
        if (!active || !key || key.classList.contains('pressed') || key.classList.contains('black--pressed')) return;
        const audio = new Audio(new URL(`../notes/${key.dataset.note}.wav`, import.meta.url).href);
        audio.volume = getVolumes().effects;
        sounds.add(audio);
        audio.addEventListener('ended', () => sounds.delete(audio), { once: true });
        audio.play().catch(() => sounds.delete(audio));
        key.classList.add(key.classList.contains('black') ? 'black--pressed' : 'pressed');
    }
    function release(key) {
        key?.classList.remove('pressed', 'black--pressed');
    }
    function clear() {
        pianoKeys.forEach(release);
        for (const audio of sounds) audio.pause();
        sounds.clear();
    }
    function keydown(event) {
        if (event.key === 'Escape') {
            event.preventDefault();
            event.stopPropagation();
            if (!event.repeat) onClose();
            return;
        }
        const index = layout.indexOf(event.key.length === 1 ? event.key.toLowerCase() : event.key);
        if (index < 0) return;
        event.preventDefault();
        event.stopPropagation();
        if (!event.repeat) press(pianoKeys[index]);
    }
    function keyup(event) {
        const index = layout.indexOf(event.key.length === 1 ? event.key.toLowerCase() : event.key);
        if (index < 0) return;
        event.preventDefault();
        event.stopPropagation();
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
    activate = () => {
        if (active) return;
        active = true;
        document.addEventListener('keydown', keydown, true);
        document.addEventListener('keyup', keyup, true);
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
}

export function activatePianoControls() { activate(); }
export function deactivatePianoControls() { deactivate(); }
