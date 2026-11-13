import { GAME_CONFIG } from './gameConfig.js';

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
    // Snapshot power, counter and reaction before either fighter can be interrupted.
    const isCounter = attacker.counterWindow > 0;
    const multiplier = (attacker.attackDamageMultiplier ?? 1) *
        (isCounter ? GAME_CONFIG.COUNTER_DAMAGE_MULTIPLIER : 1);
    const finalDamage = Math.round(damage * multiplier);
    const reaction = defender.previewDamage(finalDamage, attacker);
    return { attacker, defender, damage: finalDamage, reaction, isCounter,
        x: (left + right) / 2, y: (top + bottom) / 2 };
}

function applyContact(contact) {
    if (!contact) return null;
    const { attacker, defender, damage, reaction, isCounter, x, y } = contact;
    const type = defender.takeDamage(damage, attacker, reaction);
    if (!['hit', 'blocked', 'parried', 'guard-break'].includes(type)) return null;
    attacker.hasDealtDamage = true;
    if (isCounter && type !== 'parried') attacker.counterWindow = 0;
    return { type, x, y, attacker, defender, isCounter, damage };
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
