const clampVolume = value => Number.isFinite(Number(value)) ? Math.min(1, Math.max(0, Number(value))) : 1;

export function readingDuration(text) {
    const words = String(text || '').trim().split(/\s+/).filter(Boolean).length;
    return Math.max(3000, Math.ceil(words * 60000 / 150));
}

// Owns the narration of one scene. Reaching its end never advances the game.
export class StoryFilm {
    constructor({
        speech = globalThis.speechSynthesis,
        createUtterance = text => new globalThis.SpeechSynthesisUtterance(text),
        schedule = (callback, delay) => globalThis.setTimeout(callback, delay),
        cancel = id => globalThis.clearTimeout(id),
        onFrame = () => {},
        onState = () => {},
        onEnd = () => {},
        volume = 1
    } = {}) {
        this.speech = speech;
        this.createUtterance = createUtterance;
        this.schedule = schedule;
        this.cancelTimer = cancel;
        this.onFrame = onFrame;
        this.onState = onState;
        this.onEnd = onEnd;
        this.volume = clampVolume(volume);
        this.voiceEnabled = true;
        this.frames = [];
        this.index = 0;
        this.playing = false;
        this.ended = false;
        this.narrating = false;
        this.destroyed = false;
        this.generation = 0;
        this.timer = null;
        this.utterance = null;
        this.ownsSpeech = false;
        this.speechFailed = false;
    }

    snapshot() {
        return {
            index: this.index,
            total: this.frames.length,
            playing: this.playing,
            ended: this.ended,
            voiceEnabled: this.voiceEnabled,
            volume: this.volume,
            narrating: this.narrating,
            voiceAvailable: Boolean(this.speech && typeof this.speech.speak === 'function' && !this.speechFailed)
        };
    }

    emitState() { this.onState(this.snapshot()); }
    emitFrame() {
        const frame = this.frames[this.index];
        if (frame) this.onFrame(frame, this.index, this.frames.length);
    }

    cancelCurrent() {
        this.generation++;
        if (this.timer !== null) this.cancelTimer(this.timer);
        this.timer = null;
        if (this.utterance) {
            this.utterance.onend = null;
            this.utterance.onerror = null;
        }
        this.utterance = null;
        // speechSynthesis.cancel is global; only call it when this film owns speech.
        if (this.ownsSpeech) {
            this.ownsSpeech = false;
            try { this.speech?.cancel?.(); } catch { /* The silent film remains usable. */ }
        }
        this.narrating = false;
    }

    load(frames, { voiceEnabled = true } = {}) {
        if (this.destroyed) return;
        this.cancelCurrent();
        this.frames = Array.isArray(frames) ? frames.filter(frame => frame && typeof frame === 'object')
            .map(frame => ({ ...frame, text: String(frame.text ?? '') })) : [];
        this.index = 0;
        this.playing = false;
        this.ended = false;
        this.voiceEnabled = Boolean(voiceEnabled);
        this.speechFailed = false;
        this.emitFrame();
        this.emitState();
    }

    play() {
        if (this.destroyed || this.playing) return;
        if (this.ended) {
            this.index = 0;
            this.ended = false;
            this.emitFrame();
        }
        if (!this.frames.length) {
            this.finish();
            return;
        }
        this.playing = true;
        this.startFrame();
    }

    pause() {
        if (this.destroyed) return;
        this.playing = false;
        this.cancelCurrent();
        this.emitState();
    }

    next() {
        if (this.destroyed || !this.frames.length) return;
        this.cancelCurrent();
        if (this.index >= this.frames.length - 1) {
            this.finish();
            return;
        }
        this.index++;
        this.ended = false;
        this.emitFrame();
        if (this.playing) this.startFrame();
        else this.emitState();
    }

    previous() {
        if (this.destroyed || !this.frames.length) return;
        this.cancelCurrent();
        this.index = Math.max(0, this.index - 1);
        this.ended = false;
        this.emitFrame();
        if (this.playing) this.startFrame();
        else this.emitState();
    }

    replay() {
        if (this.destroyed) return;
        this.cancelCurrent();
        this.index = 0;
        this.ended = false;
        this.playing = false;
        this.speechFailed = false;
        this.emitFrame();
        this.play();
    }

    setVoiceEnabled(enabled) {
        if (this.destroyed || this.voiceEnabled === Boolean(enabled)) return;
        this.voiceEnabled = Boolean(enabled);
        this.speechFailed = false;
        this.cancelCurrent();
        if (this.playing) this.startFrame();
        else this.emitState();
    }

    setVolume(value) {
        if (this.destroyed) return;
        const volume = clampVolume(value);
        if (volume === this.volume) return;
        this.volume = volume;
        this.cancelCurrent();
        if (this.playing) this.startFrame();
        else this.emitState();
    }

    stop() {
        if (this.destroyed) return;
        this.playing = false;
        this.cancelCurrent();
        this.emitState();
    }

    destroy() {
        if (this.destroyed) return;
        this.stop();
        this.destroyed = true;
        this.frames = [];
        this.onFrame = this.onState = this.onEnd = () => {};
    }

    isCurrent(token) {
        return !this.destroyed && this.playing && token === this.generation;
    }

    selectVoice() {
        try {
            const voices = this.speech?.getVoices?.() || [];
            const lang = voice => String(voice.lang || '').toLowerCase().replace('_', '-');
            return voices.find(voice => lang(voice) === 'pt-br') ||
                voices.find(voice => lang(voice) === 'pt' || lang(voice).startsWith('pt-')) || null;
        } catch { return null; }
    }

    startFrame() {
        if (this.destroyed || !this.playing || !this.frames[this.index]) return;
        const token = this.generation;
        const frame = this.frames[this.index];
        if (this.voiceEnabled && this.volume > 0 && !this.speechFailed &&
            this.speech && typeof this.speech.speak === 'function') {
            try {
                const utterance = this.createUtterance(frame.text);
                if (!utterance || typeof utterance !== 'object') throw new Error('Voice unavailable');
                utterance.lang = 'pt-BR';
                utterance.rate = 0.95;
                utterance.pitch = 1;
                utterance.volume = this.volume;
                const voice = this.selectVoice();
                if (voice) utterance.voice = voice;
                utterance.onend = () => {
                    if (!this.isCurrent(token)) return;
                    this.ownsSpeech = false;
                    this.next();
                };
                utterance.onerror = () => {
                    if (!this.isCurrent(token)) return;
                    this.speechFailed = true;
                    this.cancelCurrent();
                    this.startSilentFrame();
                };
                this.utterance = utterance;
                this.ownsSpeech = true;
                this.narrating = true;
                // A failed/browser-blocked speech engine may never dispatch an event.
                this.timer = this.schedule(() => {
                    if (!this.isCurrent(token)) return;
                    this.speechFailed = true;
                    this.cancelCurrent();
                    this.next();
                }, Math.max(8000, readingDuration(frame.text) * 2 + 2000));
                this.speech.speak(utterance);
                if (this.isCurrent(token)) this.emitState();
                return;
            } catch {
                this.speechFailed = true;
                this.cancelCurrent();
            }
        }
        this.startSilentFrame();
    }

    startSilentFrame() {
        if (this.destroyed || !this.playing || !this.frames[this.index]) return;
        this.narrating = false;
        const token = this.generation;
        this.timer = this.schedule(() => {
            if (!this.isCurrent(token)) return;
            this.timer = null;
            this.next();
        }, readingDuration(this.frames[this.index].text));
        this.emitState();
    }

    finish() {
        if (this.destroyed || this.ended) return;
        this.cancelCurrent();
        this.playing = false;
        this.ended = true;
        this.emitState();
        this.onEnd();
    }
}
