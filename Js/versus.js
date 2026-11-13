/** Local best-of-three rules, separate from campaign and endless progression. */
export class VersusMatch {
    constructor() {
        this.rematch();
    }

    rematch() {
        this.scores = [0, 0];
        this.round = 1;
        this.resetRound();
    }

    resetRound() {
        this.timeLeft = 60;
        this.ready = [false, false];
        this.countdown = 3;
        this.state = 'ready';
        this.result = null;
    }

    markReady(playerIndex) {
        if (this.state !== 'ready' || ![0, 1].includes(playerIndex)) return false;
        this.ready[playerIndex] = true;
        if (this.ready.every(Boolean)) this.state = 'countdown';
        return true;
    }

    update(deltaTime, first, second) {
        const dt = Number.isFinite(deltaTime) && deltaTime > 0 ? deltaTime : 0;
        if (this.state === 'countdown') {
            this.countdown = Math.max(0, this.countdown - dt);
            if (this.countdown <= 1e-9) {
                this.countdown = 0;
                this.state = 'fighting';
            }
            // Fight time begins on the following simulation step.
            return null;
        }
        if (this.state !== 'fighting' || !first || !second) return null;

        this.timeLeft = Math.max(0, this.timeLeft - dt);
        const firstDefeated = first.dead || first.health <= 0;
        const secondDefeated = second.dead || second.health <= 0;
        if (!firstDefeated && !secondDefeated && this.timeLeft > 1e-9) return null;

        let winner = null;
        if (firstDefeated !== secondDefeated) {
            winner = firstDefeated ? 1 : 0;
        } else if (!firstDefeated && !secondDefeated) {
            const firstRatio = first.health / first.maxHealth;
            const secondRatio = second.health / second.maxHealth;
            if (Math.abs(firstRatio - secondRatio) > 1e-9) winner = firstRatio > secondRatio ? 0 : 1;
        }
        if (winner !== null) this.scores[winner]++;
        const matchOver = this.scores.some(score => score >= 2);
        this.state = matchOver ? 'match-over' : 'round-over';
        this.result = { winner, scores: [...this.scores], matchOver };
        return this.result;
    }

    nextRound() {
        if (this.state !== 'round-over') return false;
        // A tied round is repeated; it does not consume one of the three rounds.
        if (this.result?.winner !== null) this.round++;
        this.resetRound();
        return true;
    }
}
