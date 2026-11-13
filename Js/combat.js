function collectContact(attacker, defender, damage) {
    if (!attacker || !defender || attacker === defender || attacker.dead || defender.dead ||
        !attacker.isAttackActive || attacker.hasDealtDamage) return null;

    const attack = attacker.attackBox;
    const body = defender.hurtBox;
    const left = Math.max(attack.position.x, body.position.x);
    const right = Math.min(attack.position.x + attack.width, body.position.x + body.width);
    const top = Math.max(attack.position.y, body.position.y);
    const bottom = Math.min(attack.position.y + attack.height, body.position.y + body.height);
    if (left >= right || top >= bottom) return null;
    return { attacker, defender, damage, x: (left + right) / 2, y: (top + bottom) / 2 };
}

function applyContact(contact) {
    if (!contact) return null;
    const { attacker, defender, damage, x, y } = contact;
    const type = defender.takeDamage(damage, attacker);
    if (type !== 'hit' && type !== 'blocked') return null;
    attacker.hasDealtDamage = true;
    return { type, x, y, attacker, defender };
}

/** Resolve one attack only while its impact frames overlap the defender's body. */
export function resolveAttack(attacker, defender, damage) {
    return applyContact(collectContact(attacker, defender, damage));
}

/**
 * Collect both contacts before applying either one. Getting hit must not erase
 * an opposing blow that was already active in the same simulation step.
 */
export function resolveExchange(first, second, damageFirst, damageSecond = damageFirst) {
    const contacts = [
        collectContact(first, second, damageFirst),
        collectContact(second, first, damageSecond)
    ];
    return contacts.map(applyContact).filter(Boolean);
}
