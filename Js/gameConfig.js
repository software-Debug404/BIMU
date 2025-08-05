export const GAME_CONFIG = {
    CANVAS_WIDTH: 1024,
    CANVAS_HEIGHT: 576,
    GRAVITY: 0.2,
    FLOOR_HEIGHT: 80,
    PLAYER_ATTACK_COOLDOWN: 500,
    ENEMY_HIT_COOLDOWN: 500,
    PLAYER_DAMAGE: 10,
    ENEMY_DAMAGE: 10,
    DESIRED_FPS: 120,

    PLAYER_HEAL_AMOUNT: 20, 
    DOUBLE_TAP_WINDOW: 250, 
    COMBO_ATTACK_WINDOW: 700, 
};

export const SPRITE_PATHS = {
    BACKGROUND_FLORESTA: "../assets/background/Floresta.png",
    BACKGROUND_DESERTO: "../assets/background/Deserto.PNG",
    BACKGROUND_SUBMUNDO: "../assets/background/Submundo.PNG",
    DEFAULT_OBJECT: "../assets/objects/square.png",
    PIANO: "../assets/objects/piano.PNG",
    DIMENCIONAL_PORTAL: "../assets/objects/Dimensional_Portal.PNG",

    PLAYER: {
        IDLE: "../assets/player/Idle.png",
        RUN: "../assets/player/Run.png",
        JUMP: "../assets/player/Jump.png",
        ATTACK_1: "../assets/player/Attack_1.png",
        ATTACK_2: "../assets/player/Attack_2.png",
        ATTACK_3: "../assets/player/Attack_3.png",
        DEAD: "../assets/player/Dead.png",
        HURT: "../assets/player/Hurt.png",
        PROTECT: "../assets/player/Protection.png",
        WALK: "../assets/player/Walk.png",
    },

    ENEMY: {
        MINOTAUR: {
            IDLE: "../assets/inimigo/Minotaur_1/Idle.png",
            WALK: "../assets/inimigo/Minotaur_1/Walk.png",
            ATTACK: "../assets/inimigo/Minotaur_1/Attack.png",
            DEAD: "../assets/inimigo/Minotaur_1/Dead.png",
            HURT: "../assets/inimigo/Minotaur_1/Hurt.png",
        },
        MINOTAUR_2: {
            IDLE: "../assets/inimigo/Minotaur_2/Idle.png",
            WALK: "../assets/inimigo/Minotaur_2/Walk.png",
            ATTACK: "../assets/inimigo/Minotaur_2/Attack.png",
            DEAD: "../assets/inimigo/Minotaur_2/Dead.png",
            HURT: "../assets/inimigo/Minotaur_2/Hurt.png",
        },
        MINOTAUR_3: {
            IDLE: "../assets/inimigo/Minotaur_3/Idle.png",
            WALK: "../assets/inimigo/Minotaur_3/Walk.png",
            ATTACK: "../assets/inimigo/Minotaur_3/Attack.png",
            DEAD: "../assets/inimigo/Minotaur_3/Dead.png",
            HURT: "../assets/inimigo/Minotaur_3/Hurt.png",
        },
        SAMURAI_COMMANDER: {
            ATTACK_1: "../assets/inimigo/Samurai_Commander/Attack_1.png",
            ATTACK_2: "../assets/inimigo/Samurai_Commander/Attack_2.png",
            ATTACK_3: "../assets/inimigo/Samurai_Commander/Attack_3.png",
            DEAD: "../assets/inimigo/Samurai_Commander/Dead.png",
            HURT: "../assets/inimigo/Samurai_Commander/Hurt.png",
            IDLE: "../assets/inimigo/Samurai_Commander/Idle.png",
            JUMP: "../assets/inimigo/Samurai_Commander/Jump.png",
            PROTECT: "../assets/inimigo/Samurai_Commander/Protect.png",
            RUN: "../assets/inimigo/Samurai_Commander/Run.png",
            WALK: "../assets/inimigo/Samurai_Commander/Walk.png",
        },
        SKELETON_SPEARMAN: {
            ATTACK_1: "../assets/inimigo/Skeleton_Spearman/Attack_1.png",
            ATTACK_2: "../assets/inimigo/Skeleton_Spearman/Attack_2.png",
            DEAD: "../assets/inimigo/Skeleton_Spearman/Dead.png",
            FALL: "../assets/inimigo/Skeleton_Spearman/Fall.png",
            HURT: "../assets/inimigo/Skeleton_Spearman/Hurt.png",
            IDLE: "../assets/inimigo/Skeleton_Spearman/Idle.png",
            PROTECT: "../assets/inimigo/Skeleton_Spearman/Protect.png",
            RUN: "../assets/inimigo/Skeleton_Spearman/Run.png",
            RUN_ATTACK: "../assets/inimigo/Skeleton_Spearman/Run+attack.png",
            WALK: "../assets/inimigo/Skeleton_Spearman/Walk.png",
        },
        SKELETON_WARRIOR: {
            ATTACK_1: "../assets/inimigo/Skeleton_Warrior/Attack_1.png",
            ATTACK_2: "../assets/inimigo/Skeleton_Warrior/Attack_2.png",
            ATTACK_3: "../assets/inimigo/Skeleton_Warrior/Attack_3.png",
            DEAD: "../assets/inimigo/Skeleton_Warrior/Dead.png",
            HURT: "../assets/inimigo/Skeleton_Warrior/Hurt.png",
            IDLE: "../assets/inimigo/Skeleton_Warrior/Idle.png",
            PROTECT: "../assets/inimigo/Skeleton_Warrior/Protect.png",
            RUN: "../assets/inimigo/Skeleton_Warrior/Run.png",
            RUN_ATTACK: "../assets/inimigo/Skeleton_Warrior/Run+attack.png",
            WALK: "../assets/inimigo/Skeleton_Warrior/Walk.png",
        },
        KARASU_TENGU: {
            ATTACK_1: "../assets/inimigo/Karasu_tengu/Attack_1.png",
            ATTACK_2: "../assets/inimigo/Karasu_tengu/Attack_2.png",
            ATTACK_3: "../assets/inimigo/Karasu_tengu/Attack_3.png",
            DEAD: "../assets/inimigo/Karasu_tengu/Dead.png",
            HURT: "../assets/inimigo/Karasu_tengu/Hurt.png",
            IDLE: "../assets/inimigo/Karasu_tengu/Idle.png",
            JUMP: "../assets/inimigo/Karasu_tengu/Jump.png",
            RUN: "../assets/inimigo/Karasu_tengu/Run.png",
            WALK: "../assets/inimigo/Karasu_tengu/Walk.png",
        },
        YAMABUSHI_TENGU: {
            ATTACK_1: "../assets/inimigo/Yamabushi_tengu/Attack_1.png",
            ATTACK_2: "../assets/inimigo/Yamabushi_tengu/Attack_2.png",
            ATTACK_3: "../assets/inimigo/Yamabushi_tengu/Attack_3.png",
            DEAD: "../assets/inimigo/Yamabushi_tengu/Dead.png",
            HURT: "../assets/inimigo/Yamabushi_tengu/Hurt.png",
            IDLE: "../assets/inimigo/Yamabushi_tengu/Idle.png",
            JUMP: "../assets/inimigo/Yamabushi_tengu/Jump.png",
            RUN: "../assets/inimigo/Yamabushi_tengu/Run.png",
            WALK: "../assets/inimigo/Yamabushi_tengu/Walk.png",
        },
        WHITE_WEREWOLF: {
            ATTACK_1: "../assets/inimigo/White_Werewolf/Attack_1.png",
            ATTACK_2: "../assets/inimigo/White_Werewolf/Attack_2.png",
            ATTACK_3: "../assets/inimigo/White_Werewolf/Attack_3.png",
            DEAD: "../assets/inimigo/White_Werewolf/Dead.png",
            HURT: "../assets/inimigo/White_Werewolf/Hurt.png",
            IDLE: "../assets/inimigo/White_Werewolf/Idle.png",
            JUMP: "../assets/inimigo/White_Werewolf/Jump.png",
            RUN: "../assets/inimigo/White_Werewolf/Run.png",
            WALK: "../assets/inimigo/White_Werewolf/Walk.png",
        },
        BLACK_WEREWOLF: {
            ATTACK_1: "../assets/inimigo/Black_Werewolf/Attack_1.png",
            ATTACK_2: "../assets/inimigo/Black_Werewolf/Attack_2.png",
            ATTACK_3: "../assets/inimigo/Black_Werewolf/Attack_3.png",
            DEAD: "../assets/inimigo/Black_Werewolf/Dead.png",
            HURT: "../assets/inimigo/Black_Werewolf/Hurt.png",
            IDLE: "../assets/inimigo/Black_Werewolf/Idle.png",
            JUMP: "../assets/inimigo/Black_Werewolf/Jump.png",
            RUN: "../assets/inimigo/Black_Werewolf/Run.png",
            WALK: "../assets/inimigo/Black_Werewolf/Walk.png",
        },
        READ_WEREWOLF: {
            ATTACK_1: "../assets/inimigo/Red_Werewolf/Attack_1.png",
            ATTACK_2: "../assets/inimigo/Red_Werewolf/Attack_2.png",
            ATTACK_3: "../assets/inimigo/Red_Werewolf/Attack_3.png",
            DEAD: "../assets/inimigo/Red_Werewolf/Dead.png",
            HURT: "../assets/inimigo/Red_Werewolf/Hurt.png",
            IDLE: "../assets/inimigo/Red_Werewolf/Idle.png",
            JUMP: "../assets/inimigo/Red_Werewolf/Jump.png",
            RUN: "../assets/inimigo/Red_Werewolf/Run.png",
            WALK: "../assets/inimigo/Red_Werewolf/Walk.png",
        },
        GORGON: {
            ATTACK_1: "../assets/inimigo/Gorgon_1/Attack_1.png",
            ATTACK_2: "../assets/inimigo/Gorgon_1/Attack_2.png",
            ATTACK_3: "../assets/inimigo/Gorgon_1/Attack_3.png",
            DEAD: "../assets/inimigo/Gorgon_1/Dead.png",
            HURT: "../assets/inimigo/Gorgon_1/Hurt.png",
            IDLE: "../assets/inimigo/Gorgon_1/Idle.png",
            RUN: "../assets/inimigo/Gorgon_1/Run.png",
            WALK: "../assets/inimigo/Gorgon_1/Walk.png",
        },
        GORGON_2: {
            ATTACK_1: "../assets/inimigo/Gorgon_2/Attack_1.png",
            ATTACK_2: "../assets/inimigo/Gorgon_2/Attack_2.png",
            ATTACK_3: "../assets/inimigo/Gorgon_2/Attack_3.png",
            DEAD: "../assets/inimigo/Gorgon_2/Dead.png",
            HURT: "../assets/inimigo/Gorgon_2/Hurt.png",
            IDLE: "../assets/inimigo/Gorgon_2/Idle.png",
            RUN: "../assets/inimigo/Gorgon_2/Run.png",
            WALK: "../assets/inimigo/Gorgon_2/Walk.png",
        },
        GORGON_3: {
            ATTACK_1: "../assets/inimigo/Gorgon_3/Attack_1.png",
            ATTACK_2: "../assets/inimigo/Gorgon_3/Attack_2.png",
            ATTACK_3: "../assets/inimigo/Gorgon_3/Attack_3.png",
            DEAD: "../assets/inimigo/Gorgon_3/Dead.png",
            HURT: "../assets/inimigo/Gorgon_3/Hurt.png",
            IDLE: "../assets/inimigo/Gorgon_3/Idle.png",
            RUN: "../assets/inimigo/Gorgon_3/Run.png",
            WALK: "../assets/inimigo/Gorgon_3/Walk.png",
        },

    }
};

export const ENEMY_CONFIGS = {
    MINOTAUR: {
        scale: 2,
        sprites: {
            idle:        { totalSpriteFrames: 10, framesPerSpriteFrame: 10, imageKey: 'IDLE' },
            running:     { totalSpriteFrames: 12, framesPerSpriteFrame: 8, imageKey: 'WALK' },
            attacking_1: { totalSpriteFrames: 5,  framesPerSpriteFrame: 8, imageKey: 'ATTACK' },
            dead:        { totalSpriteFrames: 5,  framesPerSpriteFrame: 20, imageKey: 'DEAD' },
            hurt:        { totalSpriteFrames: 3,  framesPerSpriteFrame: 10, imageKey: 'HURT' },
        }
    },

    MINOTAUR_2: {
        scale: 2,
        sprites: {
            idle:        { totalSpriteFrames: 10, framesPerSpriteFrame: 10, imageKey: 'IDLE' },
            running:     { totalSpriteFrames: 12, framesPerSpriteFrame: 8, imageKey: 'WALK' },
            attacking_1: { totalSpriteFrames: 5,  framesPerSpriteFrame: 8, imageKey: 'ATTACK' },
            dead:        { totalSpriteFrames: 5,  framesPerSpriteFrame: 20, imageKey: 'DEAD' },
            hurt:        { totalSpriteFrames: 3,  framesPerSpriteFrame: 10, imageKey: 'HURT' },
        }
    },

    MINOTAUR_3: {
        scale: 2,
        sprites: {
            idle:        { totalSpriteFrames: 10, framesPerSpriteFrame: 10, imageKey: 'IDLE' },
            running:     { totalSpriteFrames: 12, framesPerSpriteFrame: 8, imageKey: 'WALK' },
            attacking_1: { totalSpriteFrames: 4,  framesPerSpriteFrame: 8, imageKey: 'ATTACK' },
            dead:        { totalSpriteFrames: 5,  framesPerSpriteFrame: 20, imageKey: 'DEAD' },
            hurt:        { totalSpriteFrames: 3,  framesPerSpriteFrame: 10, imageKey: 'HURT' },
        }
    },

    SKELETON_WARRIOR: {
        scale: 2,
        sprites: {
            idle:        { totalSpriteFrames: 7, framesPerSpriteFrame: 15, imageKey: 'IDLE' },
            running:     { totalSpriteFrames: 8, framesPerSpriteFrame: 8, imageKey: 'RUN' },
            walk:        { totalSpriteFrames: 8, framesPerSpriteFrame: 12, imageKey: 'WALK' },
            dead:        { totalSpriteFrames: 4, framesPerSpriteFrame: 20, imageKey: 'DEAD' },
            hurt:        { totalSpriteFrames: 3, framesPerSpriteFrame: 12, imageKey: 'HURT' },
            protect:     { totalSpriteFrames: 4, framesPerSpriteFrame: 10, imageKey: 'PROTECT' },
            run_attack:  { totalSpriteFrames: 5, framesPerSpriteFrame: 10, imageKey: 'RUN_ATTACK' },
            attacking_1: { totalSpriteFrames: 5, framesPerSpriteFrame: 8, imageKey: 'ATTACK_1' },
            attacking_2: { totalSpriteFrames: 6, framesPerSpriteFrame: 8, imageKey: 'ATTACK_2' },
            attacking_3: { totalSpriteFrames: 4, framesPerSpriteFrame: 8, imageKey: 'ATTACK_3' }, 
        }
    },

    SAMURAI_COMMANDER: {
        scale: 2,
        sprites: {
            idle:        { totalSpriteFrames: 5, framesPerSpriteFrame: 15, imageKey: 'IDLE' },
            running:     { totalSpriteFrames: 8, framesPerSpriteFrame: 8, imageKey: 'RUN' },
            walk:        { totalSpriteFrames: 8, framesPerSpriteFrame: 12, imageKey: 'WALK' },
            jumping:     { totalSpriteFrames: 7, framesPerSpriteFrame: 15, imageKey: 'JUMP' },
            dead:        { totalSpriteFrames: 6, framesPerSpriteFrame: 25, imageKey: 'DEAD' },
            hurt:        { totalSpriteFrames: 3, framesPerSpriteFrame: 12, imageKey: 'HURT' },
            protect:     { totalSpriteFrames: 4, framesPerSpriteFrame: 10, imageKey: 'PROTECT' },
            attacking_1: { totalSpriteFrames: 4, framesPerSpriteFrame: 8, imageKey: 'ATTACK_1' },
            attacking_2: { totalSpriteFrames: 5, framesPerSpriteFrame: 8, imageKey: 'ATTACK_2' },
            attacking_3: { totalSpriteFrames: 4, framesPerSpriteFrame: 8, imageKey: 'ATTACK_3' },
        }
    },
    
    SKELETON_SPEARMAN: {
        scale: 2,
        sprites: {
            idle:         { totalSpriteFrames: 7,  framesPerSpriteFrame: 15, imageKey: 'IDLE' },
            running:      { totalSpriteFrames: 6,  framesPerSpriteFrame: 8, imageKey: 'RUN' },
            walking:      { totalSpriteFrames: 7,  framesPerSpriteFrame: 14, imageKey: 'WALK' },
            falling:      { totalSpriteFrames: 6,  framesPerSpriteFrame: 15, imageKey: 'FALL' },
            protecting:   { totalSpriteFrames: 2,  framesPerSpriteFrame: 15, imageKey: 'PROTECT' },
            hurt:         { totalSpriteFrames: 3,  framesPerSpriteFrame: 15, imageKey: 'HURT' },
            dead:         { totalSpriteFrames: 5,  framesPerSpriteFrame: 25, imageKey: 'DEAD' },
            attacking_1:  { totalSpriteFrames: 4,  framesPerSpriteFrame: 8, imageKey: 'ATTACK_1' },
            attacking_2:  { totalSpriteFrames: 4,  framesPerSpriteFrame: 8, imageKey: 'ATTACK_2' },
            run_attacking:{ totalSpriteFrames: 5,  framesPerSpriteFrame: 8, imageKey: 'RUN_ATTACK' },
        }
    },

    KARASU_TENGU: {
        scale: 2,
        sprites: {
            idle:        { totalSpriteFrames: 6, framesPerSpriteFrame: 15, imageKey: 'IDLE' },
            running:     { totalSpriteFrames: 8, framesPerSpriteFrame: 8, imageKey: 'RUN' },
            walk:        { totalSpriteFrames: 8, framesPerSpriteFrame: 12, imageKey: 'WALK' },
            jumping:     { totalSpriteFrames: 15, framesPerSpriteFrame: 15, imageKey: 'JUMP' },
            dead:        { totalSpriteFrames: 6, framesPerSpriteFrame: 25, imageKey: 'DEAD' },
            hurt:        { totalSpriteFrames: 3, framesPerSpriteFrame: 12, imageKey: 'HURT' },
            attacking_1: { totalSpriteFrames: 6, framesPerSpriteFrame: 8, imageKey: 'ATTACK_1' },
            attacking_2: { totalSpriteFrames: 4, framesPerSpriteFrame: 8, imageKey: 'ATTACK_2' },
            attacking_3: { totalSpriteFrames: 3, framesPerSpriteFrame: 8, imageKey: 'ATTACK_3' },
        }
    },

    YAMABUSHI_TENGU: {
        scale: 2,
        sprites: {
            idle:        { totalSpriteFrames: 6, framesPerSpriteFrame: 15, imageKey: 'IDLE' },
            running:     { totalSpriteFrames: 8, framesPerSpriteFrame: 8, imageKey: 'RUN' },
            walk:        { totalSpriteFrames: 8, framesPerSpriteFrame: 12, imageKey: 'WALK' },
            jumping:     { totalSpriteFrames: 15, framesPerSpriteFrame: 15, imageKey: 'JUMP' },
            dead:        { totalSpriteFrames: 6, framesPerSpriteFrame: 25, imageKey: 'DEAD' },
            hurt:        { totalSpriteFrames: 3, framesPerSpriteFrame: 12, imageKey: 'HURT' },
            attacking_1: { totalSpriteFrames: 3, framesPerSpriteFrame: 8, imageKey: 'ATTACK_1' },
            attacking_2: { totalSpriteFrames: 6, framesPerSpriteFrame: 8, imageKey: 'ATTACK_2' },
            attacking_3: { totalSpriteFrames: 4, framesPerSpriteFrame: 8, imageKey: 'ATTACK_3' },
        }
    },

    WHITE_WEREWOLF: {
        scale: 2,
        sprites: {
            idle:        { totalSpriteFrames: 8, framesPerSpriteFrame: 15, imageKey: 'IDLE' },
            running:     { totalSpriteFrames: 9, framesPerSpriteFrame: 8, imageKey: 'RUN' },
            walk:        { totalSpriteFrames: 11, framesPerSpriteFrame: 12, imageKey: 'WALK' },
            jumping:     { totalSpriteFrames: 11, framesPerSpriteFrame: 15, imageKey: 'JUMP' },
            dead:        { totalSpriteFrames: 2, framesPerSpriteFrame: 25, imageKey: 'DEAD' },
            hurt:        { totalSpriteFrames: 2, framesPerSpriteFrame: 12, imageKey: 'HURT' },
            attacking_1: { totalSpriteFrames: 6, framesPerSpriteFrame: 8, imageKey: 'ATTACK_1' },
            attacking_2: { totalSpriteFrames: 4, framesPerSpriteFrame: 8, imageKey: 'ATTACK_2' },
            attacking_3: { totalSpriteFrames: 5, framesPerSpriteFrame: 8, imageKey: 'ATTACK_3' },
        }
    },

    BLACK_WEREWOLF: {
        scale: 2,
        sprites: {
            idle:        { totalSpriteFrames: 8, framesPerSpriteFrame: 15, imageKey: 'IDLE' },
            running:     { totalSpriteFrames: 9, framesPerSpriteFrame: 8, imageKey: 'RUN' },
            walk:        { totalSpriteFrames: 11, framesPerSpriteFrame: 12, imageKey: 'WALK' },
            jumping:     { totalSpriteFrames: 11, framesPerSpriteFrame: 15, imageKey: 'JUMP' },
            dead:        { totalSpriteFrames: 2, framesPerSpriteFrame: 25, imageKey: 'DEAD' },
            hurt:        { totalSpriteFrames: 2, framesPerSpriteFrame: 12, imageKey: 'HURT' },
            attacking_1: { totalSpriteFrames: 6, framesPerSpriteFrame: 8, imageKey: 'ATTACK_1' },
            attacking_2: { totalSpriteFrames: 4, framesPerSpriteFrame: 8, imageKey: 'ATTACK_2' },
            attacking_3: { totalSpriteFrames: 5, framesPerSpriteFrame: 8, imageKey: 'ATTACK_3' },
        }
    },

    READ_WEREWOLF: {
        scale: 2,
        sprites: {
            idle:        { totalSpriteFrames: 8, framesPerSpriteFrame: 15, imageKey: 'IDLE' },
            running:     { totalSpriteFrames: 9, framesPerSpriteFrame: 8, imageKey: 'RUN' },
            walk:        { totalSpriteFrames: 11, framesPerSpriteFrame: 12, imageKey: 'WALK' },
            jumping:     { totalSpriteFrames: 11, framesPerSpriteFrame: 15, imageKey: 'JUMP' },
            dead:        { totalSpriteFrames: 2, framesPerSpriteFrame: 25, imageKey: 'DEAD' },
            hurt:        { totalSpriteFrames: 2, framesPerSpriteFrame: 12, imageKey: 'HURT' },
            attacking_1: { totalSpriteFrames: 6, framesPerSpriteFrame: 8, imageKey: 'ATTACK_1' },
            attacking_2: { totalSpriteFrames: 4, framesPerSpriteFrame: 8, imageKey: 'ATTACK_2' },
            attacking_3: { totalSpriteFrames: 5, framesPerSpriteFrame: 8, imageKey: 'ATTACK_3' },
        }
    },

    GORGON: {
        scale: 2,
        sprites: {
            idle:        { totalSpriteFrames: 7, framesPerSpriteFrame: 15, imageKey: 'IDLE' },
            running:     { totalSpriteFrames: 7, framesPerSpriteFrame: 8, imageKey: 'RUN' },
            walk:        { totalSpriteFrames: 13, framesPerSpriteFrame: 12, imageKey: 'WALK' },
            dead:        { totalSpriteFrames: 3, framesPerSpriteFrame: 25, imageKey: 'DEAD' },
            hurt:        { totalSpriteFrames: 3, framesPerSpriteFrame: 12, imageKey: 'HURT' },
            attacking_1: { totalSpriteFrames: 16, framesPerSpriteFrame: 8, imageKey: 'ATTACK_1' },
            attacking_2: { totalSpriteFrames: 7, framesPerSpriteFrame: 8, imageKey: 'ATTACK_2' },
            attacking_3: { totalSpriteFrames: 10, framesPerSpriteFrame: 8, imageKey: 'ATTACK_3' },
        }
    },

    GORGON_2: {
        scale: 2,
        sprites: {
            idle:        { totalSpriteFrames: 7, framesPerSpriteFrame: 15, imageKey: 'IDLE' },
            running:     { totalSpriteFrames: 7, framesPerSpriteFrame: 8, imageKey: 'RUN' },
            walk:        { totalSpriteFrames: 13, framesPerSpriteFrame: 12, imageKey: 'WALK' },
            dead:        { totalSpriteFrames: 3, framesPerSpriteFrame: 25, imageKey: 'DEAD' },
            hurt:        { totalSpriteFrames: 3, framesPerSpriteFrame: 12, imageKey: 'HURT' },
            attacking_1: { totalSpriteFrames: 16, framesPerSpriteFrame: 8, imageKey: 'ATTACK_1' },
            attacking_2: { totalSpriteFrames: 7, framesPerSpriteFrame: 8, imageKey: 'ATTACK_2' },
            attacking_3: { totalSpriteFrames: 10, framesPerSpriteFrame: 8, imageKey: 'ATTACK_3' },
        }
    },

    GORGON_3: {
        scale: 2,
        sprites: {
            idle:        { totalSpriteFrames: 7, framesPerSpriteFrame: 15, imageKey: 'IDLE' },
            running:     { totalSpriteFrames: 7, framesPerSpriteFrame: 8, imageKey: 'RUN' },
            walk:        { totalSpriteFrames: 13, framesPerSpriteFrame: 12, imageKey: 'WALK' },
            dead:        { totalSpriteFrames: 3, framesPerSpriteFrame: 25, imageKey: 'DEAD' },
            hurt:        { totalSpriteFrames: 3, framesPerSpriteFrame: 12, imageKey: 'HURT' },
            attacking_1: { totalSpriteFrames: 16, framesPerSpriteFrame: 8, imageKey: 'ATTACK_1' },
            attacking_2: { totalSpriteFrames: 10, framesPerSpriteFrame: 8, imageKey: 'ATTACK_2' },
            attacking_3: { totalSpriteFrames: 7, framesPerSpriteFrame: 8, imageKey: 'ATTACK_3' },
        }
    },
};

export const PORTAL_DIMENCIONAL = {
    PORTAL: {
        scale: 3,
        sprites: {
            portal:         { totalSpriteFrames: 6,  framesPerSpriteFrame: 15, imageKey: 'DIMENCIONAL_PORTAL' }
        }
    }
};
export const PIANO_CONFIG = {
    PIANO: {
        scale: 0.5,
    }
};

export const STAGES = [
    {
        background: SPRITE_PATHS.BACKGROUND_FLORESTA,
        enemyType: 'MINOTAUR'
    },
    {
        background: SPRITE_PATHS.BACKGROUND_DESERTO,
        enemyType: 'SKELETON_WARRIOR'
    },
    {
        background: SPRITE_PATHS.BACKGROUND_FLORESTA,
        enemyType: 'SKELETON_SPEARMAN'
    },
    {
        background: SPRITE_PATHS.BACKGROUND_SUBMUNDO,
        enemyType: 'SAMURAI_COMMANDER'
    }
];