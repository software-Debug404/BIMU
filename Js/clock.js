// A renderização acompanha a tela; a simulação avança sempre no mesmo passo.
export class SimulationClock {
    constructor(step = 1 / 60, maxFrameTime = 0.1) {
        this.step = step;
        this.maxFrameTime = maxFrameTime;
        this.reset();
    }

    reset() {
        this.lastTime = null;
        this.accumulator = 0;
    }

    advance(timestamp, update) {
        if (this.lastTime === null) {
            this.lastTime = timestamp;
            return;
        }
        this.accumulator += Math.min(Math.max((timestamp - this.lastTime) / 1000, 0), this.maxFrameTime);
        this.lastTime = timestamp;
        while (this.accumulator + 1e-10 >= this.step) {
            this.accumulator -= this.step;
            update(this.step);
        }
    }
}
