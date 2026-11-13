/** Resolve one attack only while its impact frames overlap the defender's body. */
export function resolveAttack(attacker, defender, damage) {
    if (!attacker || !defender || attacker === defender || attacker.dead || defender.dead ||
        !attacker.isAttackActive || attacker.hasDealtDamage) return null;

    const attack = attacker.attackBox;
    const body = defender.hurtBox;
    const left = Math.max(attack.position.x, body.position.x);
    const right = Math.min(attack.position.x + attack.width, body.position.x + body.width);
    const top = Math.max(attack.position.y, body.position.y);
    const bottom = Math.min(attack.position.y + attack.height, body.position.y + body.height);
    if (left >= right || top >= bottom) return null;

    const type = defender.takeDamage(damage, attacker);
    if (type !== 'hit' && type !== 'blocked') return null;
    attacker.hasDealtDamage = true;
    return {
        type,
        x: (left + right) / 2,
        y: (top + bottom) / 2,
        attacker,
        defender
    };
}
