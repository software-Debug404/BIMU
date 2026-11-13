const LESSONS = [
    { step: 'move', title: '1 · Encontre sua distância', instruction: 'Use A ou D e caminhe até sentir a distância da espada.', targetMode: 'idle' },
    { step: 'attack', title: '2 · Acerte um golpe', instruction: 'Aproxime-se, olhe para o parceiro e ataque com ESPAÇO.', targetMode: 'idle' },
    { step: 'block', title: '3 · Sustente a defesa', instruction: 'Fique de frente e segure S antes do golpe chegar. Observe o custo na postura.', targetMode: 'attack' },
    { step: 'guard-break', title: '4 · Conheça o limite da guarda', instruction: 'Continue segurando S para sentir a quebra de defesa. Depois, solte para recuperar a postura.', targetMode: 'attack' },
    { step: 'parry', title: '5 · Defenda no instante certo', instruction: 'Solte S. Quando o parceiro anunciar o golpe, espere a espada se aproximar e aperte S para aparar.', targetMode: 'attack' },
    { step: 'counter', title: '6 · Aproveite a abertura', instruction: 'Faça outro parry, solte S e acerte ESPAÇO antes que a abertura termine.', targetMode: 'attack' }
];

/** Tracks real training actions; arena setup, health and timing belong to the game. */
export class CombatTraining {
    constructor() {
        this.revision = 0;
        this.reset();
    }

    reset() {
        this.index = 0;
        this.revision++;
        this.player = null;
        this.target = null;
        this.startX = null;
        this.counterPrimed = false;
    }

    get total() { return LESSONS.length; }
    get complete() { return this.index >= LESSONS.length; }
    get step() { return this.complete ? 'finish' : LESSONS[this.index].step; }
    get title() { return this.complete ? 'Treino concluído' : LESSONS[this.index].title; }
    get instruction() { return this.complete ? 'Leve sua defesa para a jornada ou pratique outra vez.' : LESSONS[this.index].instruction; }
    get targetMode() {
        if (this.complete || this.step === 'counter' && this.counterPrimed) return 'idle';
        return LESSONS[this.index]?.targetMode || 'idle';
    }

    advance() {
        if (this.complete) return false;
        this.index++;
        this.revision++;
        this.counterPrimed = false;
        return true;
    }

    update(deltaTime, player, target) {
        // deltaTime is deliberately not an automatic success condition.
        if (!player || !target || this.complete) return;
        if (this.player !== player || this.target !== target) {
            this.player = player;
            this.target = target;
            this.startX = Number.isFinite(player.position?.x) ? player.position.x : null;
            this.counterPrimed = false;
        }
        if (player.dead || target.dead) return;
        if (this.step === 'move' && player.onGround && this.startX !== null &&
            Math.abs(player.position.x - this.startX) >= 96) {
            this.advance();
        }
        if (this.step === 'counter' && this.counterPrimed && !(player.counterWindow > 0)) {
            this.counterPrimed = false;
        }
    }

    onImpact(event) {
        if (!event || this.complete || !this.player || !this.target || this.player.dead || this.target.dead) return false;
        const playerHit = event.attacker === this.player && event.defender === this.target;
        const incoming = event.attacker === this.target && event.defender === this.player;
        if (this.step === 'attack' && playerHit && event.type === 'hit') return this.advance();
        if (this.step === 'block' && incoming && event.type === 'blocked') return this.advance();
        if (this.step === 'guard-break' && incoming && event.type === 'guard-break') return this.advance();
        if (this.step === 'parry' && incoming && event.type === 'parried') return this.advance();
        if (this.step === 'counter') {
            if (incoming && event.type === 'parried') this.counterPrimed = true;
            if (this.counterPrimed && playerHit && event.type === 'hit' && event.isCounter === true) return this.advance();
        }
        return false;
    }
}
