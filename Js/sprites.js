import { GAME_CONFIG, PLAYER_ATTACK_PROFILES } from './gameConfig.js';

const BASE_FPS = 60;
const validDelta = deltaTime => Number.isFinite(deltaTime) && deltaTime > 0 ? deltaTime : 0;

class Sprite {
    constructor({ position, velocity, image, scale = 1, offset, sprites = {} }) {
        this.position = { ...position };
        this.velocity = velocity ? { ...velocity } : { x: 0, y: 0 };
        this.scale = scale;
        this.offset = offset || { x: 0, y: 0 };
        this.sprites = sprites;
        this.facing = 'right';
        this.image = sprites.idle?.image || image;

        if (!this.image) {
            console.error('ERRO: Sprite criado sem uma imagem válida.');
            this.image = new Image();
        }

        this.totalSpriteFrames = sprites.idle?.totalSpriteFrames || 1;
        this.framesPerSpriteFrame = sprites.idle?.framesPerSpriteFrame || 1;
        this.width = this.image.width / this.totalSpriteFrames * scale;
        this.height = this.image.height * scale;
        this.currentSpriteKey = 'idle';
        this.currentSprite = sprites.idle;
        this.currentSpriteFrame = 0;
        this.elapsedTime = 0;
    }

    setSprite(spriteKey) {
        if (this.dead && spriteKey !== 'dead') return;
        if (this.isAttacking || this.isHealing || this.isHurt) return;
        if (this.isStunned && spriteKey !== 'hurt' && spriteKey !== 'dead') return;
        if (this.currentSpriteKey === spriteKey) return;

        const sprite = this.sprites[spriteKey];
        if (!sprite?.image) return;
        this.image = sprite.image;
        this.totalSpriteFrames = sprite.totalSpriteFrames;
        this.framesPerSpriteFrame = sprite.framesPerSpriteFrame || 1;
        this.currentSpriteKey = spriteKey;
        this.currentSprite = sprite;
        this.currentSpriteFrame = 0;
        this.elapsedTime = 0;
    }

    draw(ctx) {
        ctx.imageSmoothingEnabled = false;
        const frameWidth = this.image.width / this.totalSpriteFrames;
        // Fighters mirror around their body, keeping transparent sprite padding
        // from moving the character when it turns around.
        const anchorX = this.body
            ? (this.body.offsetX + this.body.width / 2) * this.scale
            : frameWidth * this.scale / 2;
        const drawX = this.facing === 'left' ? -2 * anchorX : 0;

        ctx.save();
        ctx.translate(this.position.x + this.offset.x, this.position.y + this.offset.y);
        ctx.scale(this.facing === 'left' ? -1 : 1, 1);
        if (this.damageFlashTime > 0) ctx.filter = 'brightness(2.5) saturate(0)';
        else if (this.parryFlashTime > 0) ctx.filter = 'brightness(2) sepia(1) hue-rotate(140deg)';
        ctx.drawImage(
            this.image,
            this.currentSpriteFrame * frameWidth, 0, frameWidth, this.image.height,
            drawX, 0, frameWidth * this.scale, this.image.height * this.scale
        );
        ctx.restore();
    }

    animate(deltaTime = 1 / BASE_FPS) {
        this.elapsedTime += validDelta(deltaTime) * BASE_FPS;
        while (this.elapsedTime >= this.framesPerSpriteFrame) {
            this.elapsedTime -= this.framesPerSpriteFrame;
            if (this.dead && this.currentSpriteKey === 'dead' &&
                this.currentSpriteFrame >= this.totalSpriteFrames - 1) {
                this.elapsedTime = 0;
                break;
            }

            this.currentSpriteFrame++;
            if (this.currentSpriteFrame < this.totalSpriteFrames) continue;

            const actionEnded = this.currentSpriteKey.includes('attack') ||
                this.currentSpriteKey === 'hurt';
            if (actionEnded) {
                if (this.isStunned) {
                    this.currentSpriteFrame = this.totalSpriteFrames - 1;
                    this.elapsedTime = 0;
                    return;
                }
                if (this.currentSpriteKey.includes('attack') && this.combo) {
                    this.attackRecoveryTime = this.activeAttackProfile?.recovery || 0;
                    // The full combo window begins after any extra recovery.
                    this.combo.lastAttackTime = this.simulationTime + this.attackRecoveryTime * 1000;
                }
                this.isAttacking = false;
                this.isHealing = false;
                this.isHurt = false;
                this.setSprite('idle');
            } else if (this.currentSpriteKey === 'dead') {
                this.currentSpriteFrame = this.totalSpriteFrames - 1;
            } else {
                this.currentSpriteFrame = 0;
            }
        }
    }
}

class Fighter extends Sprite {
    constructor(options) {
        super(options);
        const sourceWidth = this.width / this.scale;
        const sourceHeight = this.height / this.scale;
        // Body measurements are source-image pixels, before sprite scaling.
        this.body = {
            offsetX: sourceWidth * 0.34,
            offsetY: sourceHeight * 0.35,
            width: sourceWidth * 0.32,
            height: sourceHeight * 0.65,
            ...options.body
        };
        this.attackConfig = { range: 56, ...options.attack };
        this.attackProfiles = Object.fromEntries(Object.entries(options.attackProfiles ?? PLAYER_ATTACK_PROFILES)
            .map(([name, profile]) => [name, { ...profile }]));
        this.maxPosture = options.maxPosture ?? GAME_CONFIG.POSTURE_MAX;
        this.maxHealth = options.maxHealth || 100;
        this.initialPotions = options.potions ?? 3;
        this.spawnPosition = { ...this.position };
        this.ajusteBorda = 100;
        this.combo = { state: 0, lastAttackTime: -Infinity };
        this.reset(this.position);
    }

    get hurtBox() {
        return {
            position: {
                x: this.position.x + this.offset.x + this.body.offsetX * this.scale,
                y: this.position.y + this.offset.y + this.body.offsetY * this.scale
            },
            width: this.body.width * this.scale,
            height: this.body.height * this.scale
        };
    }

    get attackBox() {
        const body = this.hurtBox;
        const width = (this.activeAttackProfile?.range ?? this.attackConfig.range) * this.scale;
        const height = (this.attackConfig.height ?? this.body.height * 0.65) * this.scale;
        const overlap = 4 * this.scale;
        return {
            position: {
                x: this.facing === 'left'
                    ? body.position.x - width + overlap
                    : body.position.x + body.width - overlap,
                y: body.position.y + (body.height - height) / 2
            },
            width,
            height
        };
    }

    get isAttackActive() {
        if (!this.isAttacking || this.dead || this.isHurt || this.isHealing || this.isProtecting || this.isStunned || this.isRecovering) return false;
        // Individual sprite configs may override active frames with zero-based
        // indices. Defaults reserve preparation and recovery around the impact.
        if (Array.isArray(this.currentSprite?.activeFrames)) {
            return this.currentSprite.activeFrames.includes(this.currentSpriteFrame);
        }
        const lastImpactFrame = Math.max(0, this.totalSpriteFrames - 2);
        const impactRatio = this.currentSpriteKey === 'attacking_2' ? 0.6 : 0.5;
        const start = Math.min(lastImpactFrame, Math.max(1, Math.floor(this.totalSpriteFrames * impactRatio)));
        const end = Math.min(lastImpactFrame, Math.max(start, Math.ceil(this.totalSpriteFrames * 0.75) - 1));
        return this.currentSpriteFrame >= start && this.currentSpriteFrame <= end;
    }

    get activeAttackProfile() {
        return this.isAttacking ? this.attackProfiles[this.currentSpriteKey] || null : null;
    }

    get attackDamageMultiplier() { return this.activeAttackProfile?.damageMultiplier ?? 1; }
    get isRecovering() { return this.attackRecoveryTime > 0; }
    get isStunned() { return this.guardBreakTime > 0 || this.staggerTime > 0; }
    get isActionLocked() {
        return this.dead || this.isAttacking || this.isHealing || this.isHurt || this.isStunned || this.isRecovering;
    }
    get parryReady() {
        return this.onGround && !this.isActionLocked && !this.guardInputHeld && this.parryCooldownTime <= 0;
    }
    get isParryActive() {
        return this.isProtecting && !this.isStunned && this.parryWindowTime > 0;
    }

    // reset({ x, y }) also clears action/timing/knockback state between stages.
    reset(position = this.spawnPosition) {
        this.position.x = position.x;
        this.position.y = position.y;
        this.velocity.x = 0;
        this.velocity.y = 0;
        this.health = this.maxHealth;
        this.potions = this.initialPotions;
        this.dead = false;
        this.isAttacking = false;
        this.isProtecting = false;
        this.isHealing = false;
        this.isHurt = false;
        this.hasDealtDamage = false;
        this.onGround = false;
        this.facing = 'right';
        this.simulationTime = 0;
        this.lastAttackTime = -Infinity;
        this.combo.state = 0;
        this.combo.lastAttackTime = -Infinity;
        this.knockbackX = 0;
        this.hurtTime = 0;
        this.damageFlashTime = 0;
        this.invulnerabilityTime = 0;
        this.posture = this.maxPosture;
        this.postureRegenDelayTime = 0;
        this.guardBreakTime = 0;
        this.staggerTime = 0;
        this.parryWindowTime = 0;
        this.parryCooldownTime = 0;
        this.counterWindow = 0;
        this.attackRecoveryTime = 0;
        this.guardInputHeld = false;
        this.parryFlashTime = 0;
        this.currentSpriteKey = '';
        this.setSprite('idle');
    }

    isFacingAttacker(attacker) {
        if (!attacker?.hurtBox) return true;
        const own = this.hurtBox;
        const other = attacker.hurtBox;
        const distance = other.position.x + other.width / 2 - (own.position.x + own.width / 2);
        if (Math.abs(distance) < 0.001) return attacker.facing !== this.facing;
        return this.facing === 'right' ? distance > 0 : distance < 0;
    }

    // Combat snapshots this decision before applying simultaneous contacts.
    previewDamage(amount, attacker) {
        if (this.dead || this.invulnerabilityTime > 0 || !(amount > 0)) return 'ignored';
        if (!this.isProtecting || this.isStunned || !this.isFacingAttacker(attacker)) return 'hit';
        if (attacker && this.isParryActive) return 'parried';
        return this.posture <= GAME_CONFIG.BLOCK_POSTURE_COST ? 'guard-break' : 'blocked';
    }

    cancelAction() {
        this.isAttacking = false;
        this.isHealing = false;
        this.isHurt = false;
        this.isProtecting = false;
        this.parryWindowTime = 0;
        this.attackRecoveryTime = 0;
        this.combo.state = 0;
        this.combo.lastAttackTime = -Infinity;
        this.velocity.x = 0;
        this.hasDealtDamage = true;
    }

    applyStagger(duration) {
        if (this.dead) return;
        this.cancelAction();
        this.staggerTime = Math.max(this.staggerTime, duration);
        this.hurtTime = 0;
        this.setSprite('hurt');
    }

    // frozenReaction is internal to the simultaneous-contact resolver.
    takeDamage(amount, attacker, frozenReaction) {
        const reaction = frozenReaction ?? this.previewDamage(amount, attacker);
        if (reaction === 'ignored') return 'ignored';
        if (reaction === 'parried') {
            this.parryWindowTime = 0;
            this.parryFlashTime = 0.14;
            this.counterWindow = GAME_CONFIG.COUNTER_WINDOW;
            attacker?.applyStagger(GAME_CONFIG.PARRY_STAGGER_DURATION);
            return 'parried';
        }
        if (reaction === 'blocked' || reaction === 'guard-break') {
            this.posture = Math.max(0, this.posture - GAME_CONFIG.BLOCK_POSTURE_COST);
            this.postureRegenDelayTime = GAME_CONFIG.POSTURE_REGEN_DELAY;
            if (reaction === 'guard-break') {
                this.cancelAction();
                this.counterWindow = 0;
                this.guardBreakTime = GAME_CONFIG.GUARD_BREAK_DURATION;
                this.damageFlashTime = 0.12;
                this.hurtTime = 0;
                this.setSprite('hurt');
            }
            return reaction;
        }

        this.health = Math.max(0, this.health - amount);
        this.cancelAction();
        this.counterWindow = 0;
        this.hurtTime = 0;
        this.damageFlashTime = 0.12;
        this.invulnerabilityTime = 0.16;
        this.postureRegenDelayTime = GAME_CONFIG.POSTURE_REGEN_DELAY;
        if (attacker) {
            const ownCenter = this.hurtBox.position.x + this.hurtBox.width / 2;
            const otherBox = attacker.hurtBox;
            const otherCenter = otherBox.position.x + otherBox.width / 2;
            this.knockbackX = ownCenter === otherCenter
                ? (attacker.facing === 'left' ? -3.5 : 3.5)
                : Math.sign(ownCenter - otherCenter) * 3.5;
        }

        if (this.health === 0) {
            this.dead = true;
            this.guardBreakTime = 0;
            this.staggerTime = 0;
            this.setSprite('dead');
        } else {
            this.setSprite('hurt');
            this.isHurt = true;
            this.hurtTime = 0.18;
        }
        return 'hit';
    }

    applyGravity(deltaTime = 1 / BASE_FPS) {
        const dt = validDelta(deltaTime);
        const frames = dt * BASE_FPS;
        const knockbackDecay = Math.exp(-10 * dt);
        this.position.x += this.velocity.x * frames + this.knockbackX * (1 - knockbackDecay) * BASE_FPS / 10;
        this.knockbackX *= knockbackDecay;

        const floor = GAME_CONFIG.CANVAS_HEIGHT - GAME_CONFIG.FLOOR_HEIGHT - this.height;
        if (this.position.y >= floor && this.velocity.y >= 0) {
            this.position.y = floor;
            this.velocity.y = 0;
            this.onGround = true;
        } else {
            this.onGround = false;
            this.position.y += this.velocity.y * frames + GAME_CONFIG.GRAVITY * frames * frames / 2;
            this.velocity.y += GAME_CONFIG.GRAVITY * frames;
            if (this.position.y >= floor && this.velocity.y >= 0) {
                this.position.y = floor;
                this.velocity.y = 0;
                this.onGround = true;
            }
        }

        const box = this.hurtBox;
        if (box.position.x < 0) this.position.x -= box.position.x;
        else if (box.position.x + box.width > GAME_CONFIG.CANVAS_WIDTH) {
            this.position.x -= box.position.x + box.width - GAME_CONFIG.CANVAS_WIDTH;
        }
    }

    update(deltaTime = 1 / BASE_FPS) {
        const dt = validDelta(deltaTime);
        const previousStun = Math.max(this.guardBreakTime, this.staggerTime);
        const previousRegenDelay = this.postureRegenDelayTime;
        this.simulationTime += dt * 1000;
        for (const timer of ['damageFlashTime', 'parryFlashTime', 'invulnerabilityTime', 'hurtTime',
            'guardBreakTime', 'staggerTime', 'parryWindowTime', 'parryCooldownTime', 'counterWindow',
            'attackRecoveryTime', 'postureRegenDelayTime']) {
            this[timer] = Math.max(0, this[timer] - dt);
            if (this[timer] < 1e-10) this[timer] = 0;
        }
        if ((this.isHurt && this.hurtTime === 0) || (previousStun > 0 && !this.isStunned)) {
            this.isHurt = false;
            this.setSprite('idle');
        }
        if (!this.dead && !this.isProtecting) {
            // Account for the fraction of a step left after delay/stun expiry.
            const regenerationTime = Math.max(0, dt - Math.max(previousRegenDelay, previousStun));
            this.posture = Math.min(this.maxPosture, this.posture + GAME_CONFIG.POSTURE_REGEN_RATE * regenerationTime);
        }
        if (this.isActionLocked || this.isProtecting) this.velocity.x = 0;
        this.applyGravity(dt);
        this.animate(dt);
    }

    startAttack(spriteKey) {
        if (this.isActionLocked || this.isProtecting || !this.onGround) return false;
        if (!this.sprites[spriteKey]?.image) return false;
        this.setSprite(spriteKey);
        // Repeating the same attack must always restart its animation.
        this.currentSpriteFrame = 0;
        this.elapsedTime = 0;
        this.hasDealtDamage = false;
        this.isAttacking = true;
        this.velocity.x = 0;
        return true;
    }

    attack() {
        if (this.isActionLocked || this.isProtecting || !this.onGround) return false;
        if (this.simulationTime - this.lastAttackTime < GAME_CONFIG.PLAYER_ATTACK_COOLDOWN) return false;
        const previousState = this.simulationTime - this.combo.lastAttackTime > GAME_CONFIG.COMBO_ATTACK_WINDOW
            ? 0 : this.combo.state;
        const nextState = previousState % 3 + 1;
        if (!this.startAttack(`attacking_${nextState}`)) return false;
        this.combo.state = nextState === 3 ? 0 : nextState;
        this.combo.lastAttackTime = this.simulationTime;
        this.lastAttackTime = this.simulationTime;
        return true;
    }

    protect() {
        const freshInput = !this.guardInputHeld;
        this.guardInputHeld = true;
        if (this.isActionLocked || !this.onGround || this.posture <= 0) return false;
        if (this.isProtecting) return true;
        this.setSprite('protect');
        this.isProtecting = true;
        this.velocity.x = 0;
        if (freshInput && this.parryCooldownTime <= 0) {
            this.parryWindowTime = GAME_CONFIG.PARRY_WINDOW;
            this.parryCooldownTime = GAME_CONFIG.PARRY_COOLDOWN;
        }
        return true;
    }

    stopProtecting() {
        this.isProtecting = false;
        this.guardInputHeld = false;
        this.parryWindowTime = 0;
    }

    usePotion() {
        if (this.isActionLocked || this.isProtecting ||
            this.potions <= 0 || this.health >= this.maxHealth) return false;
        this.potions--;
        this.health = Math.min(this.maxHealth, this.health + GAME_CONFIG.PLAYER_HEAL_AMOUNT);
        this.setSprite('hurt');
        this.currentSpriteFrame = 0;
        this.elapsedTime = 0;
        this.isHealing = true;
        this.velocity.x = 0;
        return true;
    }

    jump() {
        if (this.isActionLocked || !this.onGround || this.isProtecting) return false;
        this.velocity.y = -8;
        this.onGround = false;
        this.setSprite('jumping');
        return true;
    }
}

class FighterAI extends Fighter {
    constructor(options) {
        super({ ...options, attackProfiles: options.attackProfiles ?? {} });
        this.attackThreshold = options.attackThreshold ?? 100;
        this.attackCooldown = options.attackCooldown ?? GAME_CONFIG.ENEMY_HIT_COOLDOWN;
        this.availableAttacks = options.availableAttacks || [];
        this.moveSpeed = options.moveSpeed ?? 2;
    }

    attack() {
        const attackKey = this.availableAttacks[Math.floor(Math.random() * this.availableAttacks.length)];
        return attackKey ? this.startAttack(attackKey) : false;
    }

    updateAI(player, deltaTime = 1 / BASE_FPS) {
        if (this.isActionLocked || !player || player.dead) {
            this.velocity.x = 0;
            this.update(deltaTime);
            return;
        }

        const ownBox = this.hurtBox;
        const playerBox = player.hurtBox;
        const ownCenter = ownBox.position.x + ownBox.width / 2;
        const playerCenter = playerBox.position.x + playerBox.width / 2;
        const distance = Math.abs(playerCenter - ownCenter);
        this.facing = playerCenter > ownCenter ? 'right' : 'left';

        if (!this.onGround) {
            this.setSprite('jumping');
        } else if (distance > this.attackThreshold) {
            this.velocity.x = playerCenter > ownCenter ? this.moveSpeed : -this.moveSpeed;
            this.setSprite('running');
        } else {
            this.velocity.x = 0;
            this.setSprite('idle');
            if (this.simulationTime - this.lastAttackTime >= this.attackCooldown) {
                const acted = Math.random() < 0.15 && this.sprites.jumping ? this.jump() : this.attack();
                if (acted) this.lastAttackTime = this.simulationTime;
            }
        }

        const jumpChance = 1 - Math.pow(1 - 0.005, validDelta(deltaTime) * BASE_FPS);
        if (this.onGround && this.sprites.jumping && Math.random() < jumpChance) this.jump();
        this.update(deltaTime);
    }
}

export { Sprite, Fighter, FighterAI };
