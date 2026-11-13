# Bimu

https://ajornadasamurai.netlify.app/

## Desenvolvimento

- [Checklist de melhorias](CHECKLIST.md): entregas concluídas e próximas etapas.
- [História — A Última Nota](HISTORIA.md): texto de referência da campanha.
- Para executar localmente: `python3 -m http.server 8000`, depois abra `http://localhost:8000`.
- [Testes automatizados](tests/README.md): verificação da física, do combate e da integração.

## Modos de jogo

- **História — A Última Nota:** dez fases, cenas narrativas, progresso salvo localmente e o resgate de Hana no desfecho musical. O menu oferece continuar uma campanha em andamento.
- **Arenas sem fim:** sequência de duelos com inimigos sorteados e piano a cada dez fases.
- **Versus 1x1 local:** duas pessoas no mesmo teclado, melhor de três rounds, 60 segundos por round e sem poções. Um empate repete o round sem conceder pontos. O modo online continua no checklist.

| Ação | História / Jogador 1 | Jogador 2 no versus |
| --- | --- | --- |
| Mover | A / D | ← / → |
| Pular | W | ↑ |
| Defender | S | ↓ |
| Atacar | Espaço | L |
| Confirmar prontidão | F (versus) | Enter |
| Poção | E (modo individual) | — |
| Interagir | Q (modo individual) | — |
| Pausar | Esc | Esc |

Na campanha, o piano ensina a sequência **Z → W → R → T → R**. Solte todas as teclas e espere Hana tocar a última nota. É possível ouvir a melodia, tentar novamente ou concluir com assistência; a assistência também preserva a espera por Hana.

## Cenas narradas

Os trechos da história são apresentados em quadros com imagens e legendas. A narração usa a voz em português disponível no navegador e acompanha o volume de efeitos. Os controles permitem pausar, repetir, navegar pelos quadros e desligar a voz. Quando a voz estiver desligada ou indisponível, os quadros avançam pelo tempo de leitura.

As novas ilustrações ficam em [assets/story](assets/story/README.md), com os prompts e a origem registrados. A apresentação para antes de liberar o combate; use **Continuar jornada** para seguir ou **Pular trecho** para encerrar a cena.

Sobre o Projeto
Bimu é um jogo de luta 2D em estilo plataforma desenvolvido com HTML, CSS e JavaScript puro. O objetivo principal foi criar um sistema de combate simples, responsivo e visualmente atrativo utilizando apenas tecnologias web, sem bibliotecas externas ou banco de dados.

Funcionalidades Técnicas
Sistema de combate 1x1 com movimentação fluida, detecção de colisões e animações de ataque.

Múltiplas arenas, com transições entre biomas distintos (floresta, deserto, submundo), implementadas com mudanças de cenário e sprites.

Sprites animados em pixel art, controlados via JavaScript usando manipulação do DOM e canvas.

Sistema de evolução baseado em variáveis de estado (vida, força, velocidade), sem persistência de dados.

Decisões do jogador impactam o comportamento de algumas lutas e fases, usando apenas lógica condicional em JavaScript.

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
