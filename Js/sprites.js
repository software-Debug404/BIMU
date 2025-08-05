import { GAME_CONFIG } from './gameConfig.js';

const gravity = GAME_CONFIG.GRAVITY;

class Sprite {
    constructor({ position, velocity, image, scale, offset, sprites }) {
        this.position = position;
        this.velocity = velocity;
        this.scale = scale || 1;
        this.offset = offset || { x: 0, y: 0 };
        this.sprites = sprites || {};
        this.facing = "right";

        if (this.sprites.idle && this.sprites.idle.image) {
            this.image = this.sprites.idle.image;
        } else {
            this.image = image;
        }

        if (!this.image) {
            console.error("ERRO: Sprite criado sem uma imagem válida.");
            this.image = new Image(); 
        }
        
        this.width = (this.sprites.idle?.image.width / this.sprites.idle?.totalSpriteFrames || this.image.width) * this.scale;
        this.height = (this.sprites.idle?.image.height || this.image.height) * this.scale;
        
        this.currentSpriteKey = 'idle';
        this.currentSprite = this.sprites.idle;
        this.currentSpriteFrame = 0;
        this.elapsedTime = 0;
        this.totalSpriteFrames = this.sprites.idle ? this.sprites.idle.totalSpriteFrames : 1;
        this.framesPerSpriteFrame = this.sprites.idle ? this.sprites.idle.framesPerSpriteFrame : 1;
    }

    setSprite(spriteKey) {
        if (this.dead && spriteKey !== 'dead') return; // Não pode mudar de sprite se estiver morto
        if (this.isAttacking || this.isHealing) return; // Não muda o sprite durante essas ações
        if (this.currentSpriteKey === spriteKey) return;

        const newSprite = this.sprites[spriteKey];
        if (newSprite && newSprite.image) {
            this.image = newSprite.image;
            this.totalSpriteFrames = newSprite.totalSpriteFrames;
            this.framesPerSpriteFrame = newSprite.framesPerSpriteFrame;
            this.currentSpriteKey = spriteKey;
            this.currentSprite = newSprite;
            this.currentSpriteFrame = 0;
        }
    }

    draw(ctx) {
        ctx.imageSmoothingEnabled = false;
        const frameWidth = this.image.width / this.totalSpriteFrames;
        const xScale = this.facing === "left" ? -1 : 1;
        const drawX = (this.facing === "left") ? -frameWidth * this.scale : 0;
        
        ctx.save();
        ctx.translate(this.position.x + this.offset.x, this.position.y + this.offset.y);
        ctx.scale(xScale, 1);
        
        ctx.drawImage(
            this.image,
            this.currentSpriteFrame * frameWidth, 0, frameWidth, this.image.height,
            drawX, 0, frameWidth * this.scale, this.image.height * this.scale
        );
        ctx.restore();
    }

    animate() {
        this.elapsedTime++;
        if (this.elapsedTime >= this.framesPerSpriteFrame) {
            this.elapsedTime = 0;
            
            // Congela no último frame da animação de morte
            if (this.dead && this.currentSpriteKey === 'dead' && this.currentSpriteFrame >= this.totalSpriteFrames - 1) {
                return;
            }

            this.currentSpriteFrame++;
            if (this.currentSpriteFrame >= this.totalSpriteFrames) {
                // Lógica de final de animação
                if (this.currentSpriteKey.includes('attack')) this.isAttacking = false;
                if (this.currentSpriteKey === 'hurt') this.isHealing = false;

                // Loop para a maioria das animações, exceto ações únicas
                if (this.currentSpriteKey.includes('attack') || this.currentSpriteKey === 'hurt' || this.currentSpriteKey === 'dead') {
                    this.currentSpriteFrame = this.totalSpriteFrames -1; // Para no ultimo frame
                    if(this.currentSpriteKey !== 'dead') this.setSprite('idle');
                } else {
                     this.currentSpriteFrame = 0; // Reinicia a animação
                }
            }
        }
    }
}

class Fighter extends Sprite {
    constructor(options) {
        super(options);
        this.maxHealth = 100;
        this.health = this.maxHealth;
        this.potions = 3; // --- NOVO: Poções iniciais
        this.dead = false;
        this.isAttacking = false;
        this.isProtecting = false; // --- NOVO: Estado de proteção
        this.isHealing = false; // --- NOVO: Estado de cura

        this.hasDealtDamage = false; // Controla se o ataque atual já causou dano

        this.attackBox = {
            position: { x: this.position.x, y: this.position.y },
            width: 125, height: 50
        };

        this.ajusteBorda = 100; 

        this.onGround = false;

        this.combo = {
            state: 0, // 0: nenhum, 1, 2, 3
            lastAttackTime: 0
        };
    }
    
    takeDamage(amount) {
        if (this.dead || this.isProtecting) return;
        
        this.health = Math.max(0, this.health - amount);
        
        if (this.health <= 0) {
            this.dead = true;
            this.isAttacking = false; // Cancela qualquer ação
            this.setSprite('dead');
        }
    }

    applyGravity(deltaTime) {
        const frameMultiplier = deltaTime * 60;

        this.position.x += this.velocity.x;
        this.position.y += this.velocity.y;
        
        // Impede de sair pela esquerda
        // A borda esquerda real do personagem é a posição X + o ajuste
        if (this.position.x + this.ajusteBorda < 0) {
            this.position.x = -this.ajusteBorda;
        }

        // Impede de sair pela direita
        // A borda direita real do personagem é a posição X + a largura total - o ajuste
        if (this.position.x + this.width - this.ajusteBorda > GAME_CONFIG.CANVAS_WIDTH) {
            this.position.x = GAME_CONFIG.CANVAS_WIDTH - this.width + this.ajusteBorda;
        }


        // Lógica do chão (limite vertical)
        if (this.position.y + this.height >= GAME_CONFIG.CANVAS_HEIGHT - GAME_CONFIG.FLOOR_HEIGHT) {
            this.onGround = true;
            this.velocity.y = 0;
            this.position.y = GAME_CONFIG.CANVAS_HEIGHT - this.height - GAME_CONFIG.FLOOR_HEIGHT;
        } else {
            this.onGround = false;
            this.velocity.y += gravity;
        }

        this.attackBox.position.x = this.position.x;
        this.attackBox.position.y = this.position.y;
    }
    
    update(deltaTime) {
        this.applyGravity(deltaTime);
        this.animate();
    }

    attack() {
        if (this.isAttacking || !this.onGround) return;

        this.hasDealtDamage = false; // Reseta o controle de dano a cada novo ataque de combo

        const now = Date.now();
        if (now - this.combo.lastAttackTime > GAME_CONFIG.COMBO_ATTACK_WINDOW) {
            this.combo.state = 0; // Reseta o combo se o tempo expirou
        }

        this.combo.state++;
        let attackSpriteKey;

        switch (this.combo.state) {
            case 1: attackSpriteKey = 'attacking_1'; break;
            case 2: attackSpriteKey = 'attacking_2'; break;
            case 3: attackSpriteKey = 'attacking_3'; this.combo.state = 0; break;
            default: this.combo.state = 0; return;
        }
        
        const newSprite = this.sprites[attackSpriteKey];
        if (newSprite) {
            this.image = newSprite.image;
            this.totalSpriteFrames = newSprite.totalSpriteFrames;
            this.framesPerSpriteFrame = newSprite.framesPerSpriteFrame;
            this.currentSpriteKey = attackSpriteKey;
            this.currentSprite = newSprite;
            this.currentSpriteFrame = 0;
            this.isAttacking = true;
            this.combo.lastAttackTime = now;
        }
    }
    
    protect() {
        if (!this.onGround) return;
        this.isProtecting = true;
        this.setSprite('protect');
    }

    stopProtecting() {
        this.isProtecting = false;
    }

    usePotion() {
        if (this.potions > 0 && this.health < this.maxHealth && !this.isHealing) {
            this.potions--;
            this.health = Math.min(this.maxHealth, this.health + GAME_CONFIG.PLAYER_HEAL_AMOUNT);
            this.isHealing = true;
            
            // Lógica para forçar a troca de sprite para 'hurt'
            const newSprite = this.sprites['hurt'];
            this.image = newSprite.image;
            this.totalSpriteFrames = newSprite.totalSpriteFrames;
            this.framesPerSpriteFrame = newSprite.framesPerSpriteFrame;
            this.currentSpriteKey = 'hurt';
            this.currentSpriteFrame = 0;
        }
    }

    jump() {        
        if (!this.onGround) return;
        this.velocity.y = -8;
        this.setSprite('jumping');
    }
}

class FighterAI extends Fighter {
    constructor(options) {
        super(options);
        this.attackThreshold = 100; // Distância para começar a atacar
        this.lastAttackTime = 0;
        this.attackCooldown = GAME_CONFIG.ENEMY_HIT_COOLDOWN; // Usa o cooldown de inimigo
        this.availableAttacks = options.availableAttacks || []; // Recebe a lista de ataques possíveis
    }

    // A IA terá seu próprio método de ataque, ignorando o sistema de combo do player
    attack() {
        if (this.isAttacking || !this.onGround || this.availableAttacks.length === 0) return;

        this.hasDealtDamage = false; // Reseta o controle de dano a cada novo ataque da IA

        // Escolhe um ataque aleatório da sua lista de ataques disponíveis
        const attackIndex = Math.floor(Math.random() * this.availableAttacks.length);
        const attackSpriteKey = this.availableAttacks[attackIndex];
        
        const newSprite = this.sprites[attackSpriteKey];
        if (newSprite) {
            this.isAttacking = true;
            this.image = newSprite.image;
            this.totalSpriteFrames = newSprite.totalSpriteFrames;
            this.framesPerSpriteFrame = newSprite.framesPerSpriteFrame;
            this.currentSpriteKey = attackSpriteKey;
            this.currentSpriteFrame = 0;
        }
    }

    // A IA agora tem um "cérebro" para tomar decisões
    updateAI(player, deltaTime) {
        if (this.dead || this.isAttacking) {
            this.update(deltaTime); // Continua aplicando gravidade e animação
            return;
        }

        const distance = Math.abs(player.position.x - this.position.x);
        const isToTheRight = player.position.x > this.position.x;
        const currentTime = performance.now();
        
        // 1. A prioridade máxima é a animação de pulo se não estiver no chão
        if (!this.onGround) {
            this.setSprite('jumping');
        } 
        // 2. Lógica de movimento e ataque SOMENTE se estiver no chão
        else {
            if (distance > this.attackThreshold) {
                // Movendo em direção ao jogador
                this.velocity.x = isToTheRight ? 2 : -2;
                this.facing = isToTheRight ? "right" : "left";
                this.setSprite("running");
            } else {
                // Perto o suficiente para atacar
                this.velocity.x = 0;
                this.facing = isToTheRight ? "right" : "left"; // Continua virado para o jogador
                this.setSprite("idle");

                // Lógica de ação (Ataque ou Pulo)
                if (currentTime - this.lastAttackTime > this.attackCooldown) {
                    // Decide aleatoriamente se vai pular ou atacar
                    if (Math.random() < 0.15 && this.sprites.jumping) { // 15% de chance de pular
                        this.jump();
                    } else {
                        this.attack();
                    }
                    this.lastAttackTime = currentTime;
                }
            }
        }

        // Lógica de Pulo Espontâneo (para ser menos previsível)
        if (this.onGround && Math.random() < 0.005 && this.sprites.jumping) {
             this.jump();
        }

        this.update(deltaTime);
    }
}


export { Sprite, Fighter, FighterAI };
