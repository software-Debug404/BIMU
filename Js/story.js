import { SPRITE_PATHS } from './gameConfig.js';

const forest = SPRITE_PATHS.BACKGROUND_FLORESTA;
const desert = SPRITE_PATHS.BACKGROUND_DESERTO;
const underworld = SPRITE_PATHS.BACKGROUND_SUBMUNDO;
const sceneBackground = path => new URL(path, import.meta.url).href;
const storyArt = name => new URL(`../assets/story/${name}.png`, import.meta.url).href;
const sceneArt = { 0: 'opening', 2: 'marked-tree', 3: 'commander', 9: 'piano-clearing' };

function withFrames(scene, images) {
    return { ...scene, frames: scene.paragraphs.map((text, index) => ({
        text, image: images?.[index] || scene.art || scene.background
    })) };
}

// A campanha tem uma ordem própria. O modo de arenas mantém seu sorteio independente.
export const STORY_STAGES = [
    { background: forest, enemyType: 'MINOTAUR' },
    { background: desert, enemyType: 'SKELETON_WARRIOR' },
    { background: forest, enemyType: 'SKELETON_SPEARMAN' },
    { background: underworld, enemyType: 'SAMURAI_COMMANDER' },
    { background: desert, enemyType: 'MINOTAUR_2' },
    { background: forest, enemyType: 'WHITE_WEREWOLF' },
    { background: underworld, enemyType: 'GORGON' },
    { background: desert, enemyType: 'YAMABUSHI_TENGU' },
    { background: forest, enemyType: 'BLACK_WEREWOLF' },
    { background: forest, bonus: true }
];

const scenes = [
    {
        id: 'chapter-1', chapter: 'Prólogo · Fase 1', title: 'Uma nota debaixo da terra', background: forest,
        paragraphs: [
            'Na noite em que a floresta engoliu sua irmã, Bimu ouviu o piano tocar uma nota debaixo da terra.',
            'Hana estava ao piano quando um clarão laranja abriu o chão da casa. Bimu correu para alcançá-la, mas viu apenas a mão dela desaparecer. No lugar da casa ficou uma cratera.',
            'Ele chamou pela irmã. Lá embaixo, bem longe, soou a primeira nota da música que os dois costumavam tocar juntos. Bimu seguiu o som até uma clareira de lápides azuis. Um minotauro guardava a passagem.'
        ]
    },
    {
        id: 'chapter-2', chapter: 'A travessia · Fase 2', title: 'As ruínas nas dunas', background: desert,
        paragraphs: [
            'Durante o duelo, a lâmina de Bimu raspou o tronco de uma árvore e deixou um corte fundo na casca.',
            'Quando o minotauro caiu, um portal surgiu entre as lápides. O samurai atravessou e foi parar num deserto.',
            'Diante dele, um guerreiro esqueleto ainda defendia as ruínas de uma cidade.'
        ]
    },
    {
        id: 'chapter-3', chapter: 'O retorno · Fase 3', title: 'A mesma lua', background: forest,
        paragraphs: [
            'A vitória seguinte o trouxe de volta à floresta. A lua estava no mesmo lugar.',
            'O corte que ele acabara de fazer na árvore já estava coberto de musgo.',
            'Entre as lápides, um lanceiro morto usava o brasão do seu antigo mestre.'
        ]
    },
    {
        id: 'chapter-4', chapter: 'O Submundo · Fase 4', title: 'O aviso do comandante', background: underworld,
        paragraphs: [
            'O Comandante Samurai tinha aberto a primeira passagem para trazer de volta os soldados que perdera em batalha. Quando viu o primeiro deles voltar de lança em punho, tentou fechar o portal. Já era tarde.',
            'Desde então, vigiava a passagem e atacava qualquer um que tentasse atravessá-la.',
            '— Se ouvir a voz dela, não responda — disse o comandante, desembainhando a espada. — Foi assim que começou comigo.'
        ]
    },
    {
        id: 'chapter-5', chapter: 'Além do aviso · Fase 5', title: 'De volta às dunas', background: desert,
        paragraphs: [
            'Bimu venceu o duelo e seguiu em frente.',
            'O portal o jogou de volta às dunas. Não havia caminho até Hana que não passasse por outra travessia.'
        ]
    },
    {
        id: 'chapter-6', chapter: 'Entre os portais · Fase 6', title: 'A floresta outra vez', background: forest,
        paragraphs: [
            'Depois das dunas, a floresta. Depois da floresta, outra passagem.',
            'A velha música ainda era a lembrança que Bimu carregava de casa.'
        ]
    },
    {
        id: 'chapter-7', chapter: 'Entre os portais · Fase 7', title: 'Um lugar conhecido', background: underworld,
        paragraphs: [
            'As colunas do Submundo apareceram de novo.',
            'Bimu já não sabia dizer se voltava aos mesmos lugares ou se apenas os reconhecia tarde demais.'
        ]
    },
    {
        id: 'chapter-8', chapter: 'Entre os portais · Fase 8', title: 'O tempo das travessias', background: desert,
        paragraphs: [
            'Os portais o levavam às dunas, depois à floresta, depois a lugares que ele já não sabia dizer se havia visitado.',
            'O corte coberto de musgo e a lua imóvel voltavam à sua memória. Mesmo sem entender o tempo daquele lugar, Bimu seguiu.'
        ]
    },
    {
        id: 'chapter-9', chapter: 'A última passagem · Fase 9', title: 'Perto da clareira', background: forest,
        paragraphs: [
            'Restava outra passagem entre Bimu e a música.',
            'Ele apertou o punho da espada. Continuar era a única forma de descobrir de onde vinha a nota.'
        ]
    },
    {
        id: 'chapter-10', chapter: 'A décima fase', title: 'O piano de casa', background: forest,
        paragraphs: [
            'Na décima travessia, Bimu chegou a uma clareira onde ninguém o esperava de arma em punho.',
            'No meio dela estava o piano de casa, com a mesma mancha redonda que Hana deixara ao pousar uma caneca quente sobre a madeira.',
            'Quando eram crianças, Bimu sempre se adiantava e roubava de Hana o final da música. Dessa vez, ele tocaria sua parte. A última nota era dela.'
        ]
    }
];

export function getStoryScene(index) {
    if (!Number.isInteger(index) || index < 0 || index >= scenes.length) return null;
    const scene = { ...scenes[index], background: sceneBackground(scenes[index].background) };
    if (sceneArt[index]) scene.art = storyArt(sceneArt[index]);
    const images = index === 0 ? [scene.background, scene.art, scene.background]
        : index === 1 ? [sceneBackground(forest), sceneBackground(forest), scene.background] : null;
    return withFrames(scene, images);
}

export const REUNION_SCENE = withFrames({
    id: 'reunion', chapter: 'A última nota', title: 'Do outro lado, Hana', background: sceneBackground(forest),
    art: new URL('../assets/story/reunion.png', import.meta.url).href,
    paragraphs: [
        'Bimu tirou as mãos das teclas e esperou. A última nota veio de trás dele.',
        'O portal, que até então mostrava as colunas do Submundo, agora dava para a cozinha de casa. Hana estava do outro lado, com as duas mãos em concha junto à boca.',
        '— Anda, Bimu! — gritou ela. — Eu não sei tocar a sua parte!'
    ]
}, [storyArt('piano-clearing'), storyArt('reunion'), storyArt('reunion')]);

export const EPILOGUE_SCENE = withFrames({
    id: 'epilogue', chapter: 'Epílogo', title: 'A última batida', background: sceneBackground(forest),
    art: new URL('../assets/story/epilogue.png', import.meta.url).href,
    paragraphs: [
        'Ele correu. Hana o puxou pelo braço no instante em que a passagem se fechou. O piano ficou na clareira.',
        'Na manhã seguinte, os dois tomaram chá na soleira da porta. Sem piano, Bimu bateu os dedos no batente, marcando o ritmo da velha música.',
        'Quando chegou ao fim, Hana deu a última batida na madeira.'
    ]
}, [storyArt('reunion'), storyArt('epilogue'), storyArt('epilogue')]);
