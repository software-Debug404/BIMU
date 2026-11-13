# Bimu

https://ajornadasamurai.netlify.app/

## Desenvolvimento

- [Checklist de melhorias](CHECKLIST.md): entregas concluídas e próximas etapas.
- [História — A Última Nota](HISTORIA.md): texto de referência da campanha.
- No ambiente deste projeto: [http://localhost:8080/BIMU/](http://localhost:8080/BIMU/). Para um servidor independente, execute `python3 -m http.server 8000` e abra `http://localhost:8000`.
- [Testes automatizados](tests/README.md): verificação da física, do combate e da integração.

## Modos de jogo

- **História — A Última Nota:** dez fases, cenas narrativas, progresso salvo localmente e o resgate de Hana no desfecho musical. O menu oferece continuar uma campanha em andamento.
- **Arenas sem fim:** sequência de duelos com inimigos sorteados e piano a cada dez fases.
- **Versus 1x1 local:** duas pessoas no mesmo teclado, melhor de três rounds, 60 segundos por round e sem poções. Um empate repete o round sem conceder pontos. O modo online continua no checklist.
- **Treino · Defesa e parry:** seis lições de movimento, ataque, bloqueio, quebra de guarda, parry e contra-ataque. O parceiro de treino permite praticar sem derrota e sem alterar a campanha.

| Ação | História / Jogador 1 | Jogador 2 no versus |
| --- | --- | --- |
| Mover | A / D | ← / → |
| Pular | W | ↑ |
| Defender | S | ↓ |
| Atacar | Espaço | L |
| Confirmar prontidão | F (versus) | Enter |
| Poção | E (história / arenas) | — |
| Interagir | Q (história / arenas) | — |
| Pausar | Esc | Esc |

Na campanha, o piano ensina a sequência **Z → W → R → T → R**. Solte todas as teclas e espere Hana tocar a última nota. É possível ouvir a melodia, tentar novamente ou concluir com assistência; a assistência também preserva a espera por Hana.

Defenda de frente com **S** (ou **↓** para o jogador 2). Bloqueios consomem postura; quando ela acaba, a guarda quebra e o personagem fica vulnerável por um instante. Solte a defesa para recuperar postura. Começar a defesa pouco antes do impacto causa um **parry**, atordoa o atacante e abre uma janela curta de contra-ataque com dano maior. Segurar a defesa não repete o parry. Os três golpes do combo aumentam em dano e alcance, com recuperação maior nos últimos golpes.

## Cenas narradas

Os trechos da história são apresentados em quadros com imagens estáticas e legendas, com movimento de câmera em CSS. A narração usa a síntese de voz em português disponível no navegador e acompanha o volume de efeitos. Os controles permitem pausar, repetir, navegar pelos quadros e desligar a voz. Quando a voz estiver desligada ou indisponível, os quadros avançam pelo tempo de leitura. A reprodução audível final no Chrome ainda está pendente de aprovação manual.

As 12 ilustrações ficam em [assets/story](assets/story/README.md), com os prompts e a origem registrados. A abertura usa três imagens distintas; os demais trechos mostram também o duelo, as ruínas, a árvore e as travessias pelos portais. A apresentação para antes de liberar o combate; use **Continuar jornada** para seguir ou **Pular trecho** para encerrar a cena.

Sobre o Projeto
Bimu é um jogo de luta 2D em estilo plataforma desenvolvido com HTML, CSS e JavaScript puro. O objetivo principal foi criar um sistema de combate simples, responsivo e visualmente atrativo utilizando apenas tecnologias web, sem bibliotecas externas ou banco de dados.

Funcionalidades Técnicas
Sistema de combate 1x1 com movimentação fluida, detecção de colisões e animações de ataque.

Múltiplas arenas, com transições entre biomas distintos (floresta, deserto, submundo), implementadas com mudanças de cenário e sprites.

Sprites animados em pixel art, controlados via JavaScript usando manipulação do DOM e canvas.

Vida, poções e estados de combate gerenciados em JavaScript. O checkpoint da campanha e as preferências ficam em armazenamento local do navegador. Evolução por melhorias e comportamentos próprios por espécie ainda estão planejados no checklist.

Controle de entrada via teclado, com movimentações direcionais, pulo e ataque responsivo.

Design responsivo para funcionamento básico em diferentes tamanhos de tela.

Tecnologias Utilizadas
HTML5: estrutura da página e carregamento das arenas;

CSS3: estilização dos elementos, cenários e efeitos visuais;

JavaScript: Controle de lógica de jogo e combate;

Manipulação do DOM e animações;

Eventos de teclado;

Gerenciamento de estado do jogo (vida, dano, cenário, progresso);

Objetivo do Projeto
Explorar o desenvolvimento de jogos diretamente no navegador usando apenas tecnologias nativas da web, sem frameworks ou engines externas. O foco foi a construção de uma base sólida para jogos 2D com combate, animações e múltiplos cenários, tudo gerenciado com JavaScript puro.

Contato
Para mais informações, feedback ou colaborações, entre em contato com:
Kauan Davi Oliveira de Sá
kauandavioliveiradesa@gmail.com
