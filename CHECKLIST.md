# Melhorias do BIMU

Este checklist reúne os pedidos feitos neste chat, as implementações e o trabalho restante. `[x]` significa que há implementação no código e evidência por revisão ou teste automatizado. Não significa aprovação completa de jogabilidade, áudio ou apresentação no navegador. Os itens de validação manual são separados.

## Auditoria do estado real — 13/11/2026

O código, os recursos e as oito suítes foram conferidos novamente. **127/127 testes passaram.** A defesa ganhou postura, parry e treino jogável; a apresentação da história agora tem 12 ilustrações, com três imagens diferentes na abertura. O resultado não certifica uma campanha jogada nem a voz audível no Chrome.

| Área | O que realmente existe | Limite ou trabalho restante |
| --- | --- | --- |
| Base e combate | Loop único, passo fixo, colisões direcionais, frames ativos, combos, cura, defesa, recuo e impacto | Ajuste visual das caixas e balanceamento ainda exigem partidas reais |
| Menus e conforto | Pausa, retry, troca de modo, HUD, volumes e CSS para diferentes telas | Responsividade completa e percepção do áudio não foram aprovadas manualmente |
| Campanha | Dez fases definidas, trechos narrativos, checkpoint por fase e final após o epílogo | A campanha não foi vencida manualmente do início ao fim; o save não restaura posição/vida de uma luta em andamento |
| Piano | Sequência, demonstração, assistência, espera por Hana e desbloqueio do portal | Áudio e apresentação final no Chrome continuam pendentes de conferência |
| Filme e voz | Apresentação de imagens estáticas com movimento CSS, legendas e síntese de voz do navegador | Não há vídeo, animação dos acontecimentos ou gravação de narrador; pronúncia e reprodução audível ainda precisam ser verificadas |
| Versus local | Dois humanos, prontidão, contagem, rounds de 60 segundos, placar, empate e revanche | Falta uma partida manual completa com dois jogadores |
| Multiplayer online | Planejamento no checklist | Não há salas, servidor de partida nem sincronização de rede |
| Profundidade do combate | Postura, quebra de guarda, parry frontal, contra-ataque, três golpes distintos e treino de seis etapas | Balanceamento manual, padrões próprios por espécie, escolhas de melhorias e recordes continuam pendentes; a IA ainda é compartilhada |

Evidências principais: [loop e integração](Js/game.js), [lutadores e IA](Js/sprites.js), [treino](Js/training.js), [regras do versus](Js/versus.js), [campanha e quadros](Js/story.js), [checkpoint](Js/storyProgress.js), [piano](Js/piano_interactive.js) e [narração](Js/narration.js).

## Pedidos registrados neste chat

- [x] Analisar o jogo e organizar as melhorias por prioridade.
- [x] Criar um checklist `.md` e começar a implementação.
- [x] Registrar integralmente a história enviada em [HISTORIA.md](HISTORIA.md).
- [x] Incluir a campanha “BIMU — A Jornada do Samurai: A Última Nota” no jogo.
- [x] Incluir o multiplayer 1x1 no planejamento e implementar sua primeira versão local.
- [ ] Implementar também a versão online do multiplayer 1x1.
- [x] Continuar as melhorias e criar imagens quando necessário: 12 ilustrações em `assets/story/`.
- [x] Atender ao pedido de mais imagens: acrescentar seis quadros dos acontecimentos e alternar três imagens distintas no prólogo.
- [x] Integrar síntese de voz em português do navegador aos trechos com imagens e legendas; aprovação da voz audível ainda pendente.
- [x] Usar o Chrome e o endereço indicado: [http://localhost:8080/BIMU/](http://localhost:8080/BIMU/).
- [ ] Concluir a conferência manual de toda a campanha, da voz e do versus nesse endereço.
- [x] Atualizar este checklist com as implementações e os pedidos posteriores do chat.
- [x] Registrar que a pergunta sobre outra linguagem ou banco de dados não autorizou sua implementação; manter a estrutura atual do projeto.

## 1. Base do jogo e combate — implementado

- [x] Remover a inicialização duplicada e manter um único loop de jogo.
- [x] Usar simulação em passos fixos, com movimento e animações independentes da taxa de atualização.
- [x] Impedir saltos na simulação ao voltar de outra aba e limpar teclas ao perder o foco.
- [x] Implementar caixas retangulares de corpo e ataque, considerando o espaço transparente dos sprites e a direção.
- [ ] Conferir visualmente o alinhamento das caixas com todos os personagens e golpes.
- [x] Aplicar dano somente nos frames ativos e uma única vez por golpe.
- [x] Corrigir conflitos entre ataque, defesa, cura, reação a dano e morte.
- [x] Dar ao jogador uma janela de combo após terminar a animação e interromper a sequência ao receber dano.
- [x] Corrigir caminhos e diferenças de maiúsculas/minúsculas para hospedagem e execução em subpastas.
- [x] Corrigir sete contagens de frames dos inimigos e conferir as 114 configurações com os PNGs.
- [x] Esperar as imagens de combate listadas em `SPRITE_PATHS` e mostrar uma mensagem quando uma delas falhar.
- [ ] Aguardar ou sinalizar a disponibilidade/falha das músicas; hoje o áudio usa `preload="auto"` sem verificação de prontidão.
- [x] Criar testes automatizados para física, colisões, animações e estados.

## 2. Impacto dos golpes — implementado

- [x] Implementar tons sintetizados para ataque, acerto e bloqueio, respeitando o volume escolhido.
- [x] Mostrar faíscas e reação visual ao receber ou bloquear um golpe.
- [x] Aplicar pequeno recuo e pausa breve de impacto ao acertar.

## 3. Orientação e conforto — implementado

- [x] Mostrar a fase atual, o nome do inimigo e as barras de vida.
- [x] Exibir avisos de interação perto do portal e do piano.
- [x] Adicionar pausa no Esc e pausa automática ao sair da aba.
- [x] Adicionar controles de volume para música e efeitos, com persistência local.
- [x] Permitir tentar novamente a luta atual depois de morrer.
- [x] Permitir retornar ao menu e trocar de modo sem recarregar a página.
- [x] Implementar limites de tamanho e media queries para canvas e menus.
- [ ] Aprovar o layout em telas menores por conferência visual.
- [x] Substituir a espera aleatória entre fases por uma transição curta.
- [x] Impedir que Enter mantido acione sucessivamente botões de telas diferentes.
- [x] Acrescentar um favicon local após identificar a requisição ausente no console do Chrome.

## 4. Defesa e domínio do combate — implementado; balanceamento manual pendente

- [x] Adicionar barra de postura com recuperação e quebra de defesa.
- [x] Consumir 32 dos 100 pontos de postura por bloqueio; recuperar 24 por segundo fora da guarda, após uma espera de 0,8 segundo.
- [x] Atordoar por 0,9 segundo ao quebrar a guarda; o golpe que quebra a guarda é bloqueado, mas os seguintes podem causar dano.
- [x] Criar uma janela de parry de 0,16 segundo ao começar uma defesa frontal, com intervalo de 0,45 segundo entre tentativas.
- [x] Atordoar o atacante por 0,5 segundo após o parry e abrir 0,8 segundo para um contra-ataque com dano multiplicado por 1,5.
- [x] Consumir a oportunidade de contra-ataque no próximo contato que acerte ou seja bloqueado; golpes no ar não a consomem e o prazo continua correndo.
- [x] Impedir parry contínuo ao segurar a defesa e defesa contra golpes pelas costas.
- [x] Diferenciar os três golpes do jogador: multiplicadores de dano de 1 / 1,25 / 1,7; alcance de 72 / 76 / 86; recuperação adicional de 0 / 0,06 / 0,18 segundo. Os inimigos mantêm seus perfis anteriores.
- [x] Aceitar um toque de ataque por até 0,16 segundo, evitando perder um contra-ataque curto durante a pausa de impacto.
- [x] Mostrar postura, estados, faíscas, avisos e tons sintetizados distintos para bloqueio, parry, quebra de guarda e contra-ataque.
- [x] Ensinar as novas mecânicas em um tutorial jogável: movimento, ataque, bloqueio, quebra de guarda, parry e contra-ataque.
- [x] Usar contatos reais de combate para avançar as lições e manter o treino separado do save da campanha, sem poções nem derrota.
- [ ] Ajustar a dificuldade com sessões de teste de jogabilidade.

## 5. Inimigos com comportamentos próprios — pendente

- [ ] Minotauro: investida lenta com preparação visível.
- [ ] Esqueleto lanceiro: controle de distância e ataque de maior alcance.
- [ ] Comandante samurai: defesa e contra-ataque.
- [ ] Definir padrões, intervalos e atributos próprios para os demais inimigos.
- [ ] Criar progressão de dificuldade para as arenas sem fim.

## 6. Progressão e recompensas — parcial

- [ ] Oferecer uma escolha entre três melhorias após vencer.
- [ ] Aplicar melhorias de vida, combo e parry durante a jornada.
- [ ] Balancear recuperação de vida e reposição de poções entre os duelos.
- [x] Manter a regra atual explícita: cada fase ou nova tentativa individual restaura a vida e três poções; versus não usa poções.
- [x] Salvar as configurações de áudio e a preferência de narração localmente.
- [x] Salvar o índice da fase, as cenas vistas, a conclusão da melodia e da campanha em `localStorage`, separadamente dos outros modos, quando o navegador permite armazenamento.
- [ ] Salvar o melhor resultado das arenas sem fim.
- [ ] Exibir um resumo da jornada ao ser derrotado.

## 7. Piano e desfecho musical — implementado no código

- [x] Introduzir na décima fase a melodia que Bimu e Hana tocavam juntos.
- [x] Ensinar a parte de Bimu: **Z → W → R → T → R**.
- [x] Oferecer demonstração da melodia e opção de tentar novamente.
- [x] Exigir que o jogador solte todas as teclas e espere Hana tocar a última nota.
- [x] Adiar a nota de Hana caso o jogador volte a tocar durante a espera.
- [x] Oferecer assistência acessível que também preserva a espera e a última nota de Hana.
- [x] Abrir o portal de casa somente depois de completar a melodia na campanha.
- [x] Permitir sair e reabrir o piano, preservando a tentativa durante a mesma sessão.
- [x] Cancelar demonstração, notas e temporizadores ao fechar o piano ou perder o foco.
- [x] Preservar o desafio ao pausar durante o primeiro carregamento do piano.
- [x] Corrigir o contexto dos temporizadores nativos usado pelo Chrome na melodia e na narração.
- [x] Manter Tab disponível para navegar pelos botões no modo história.
- [ ] Acrescentar bênçãos e melhorias musicais aos intervalos das arenas sem fim.

## 8. Campanha — A Última Nota — implementada em narrativa e duelos

Referência integral: [HISTORIA.md](HISTORIA.md). A campanha tem nove duelos e uma décima fase com piano, terminando em cenas ilustradas de resgate e epílogo. Hana, cozinha, corte da árvore, musgo e brasão são apresentados por texto e ilustrações; não são eventos ou cenários interativos adicionais na arena. O portal da arena mantém o mesmo sprite; sua mudança de destino é contada na cena do reencontro.

- [x] Adicionar História, Continuar história, Arenas sem fim e Versus local ao menu.
- [x] Dividir a narrativa em trechos curtos entre os duelos, com a simulação pausada.
- [x] Permitir continuar/pular a cena e reler pela pausa o trecho da fase atual.
- [x] Prólogo: desaparecimento de Hana, clarão laranja, cratera e primeira nota debaixo da terra.
- [x] Fase 1: clareira de lápides azuis e minotauro guardando a passagem.
- [x] Fase 2: corte deixado por Bimu na árvore, portal e guerreiro esqueleto nas ruínas do deserto.
- [x] Fase 3: mesma lua, corte coberto de musgo e lanceiro com o brasão do antigo mestre.
- [x] Fase 4: passado do Comandante Samurai e o aviso “Se ouvir a voz dela, não responda”.
- [x] Fases 5 a 9: travessias repetidas, tempo irregular e desorientação de Bimu.
- [x] Fase 10: clareira sem inimigo e piano de casa com a marca da caneca de Hana.
- [x] Integrar a sequência musical, a espera de Bimu e a última nota de Hana ao desfecho.
- [x] Mostrar o reencontro na cozinha e a fala “Anda, Bimu! Eu não sei tocar a sua parte!”.
- [x] Encerrar com o resgate, o fechamento do portal e o piano deixado na clareira.
- [x] Apresentar o epílogo do chá na soleira e a última batida de Hana no batente.
- [x] Mostrar uma tela de conclusão com opções de reler o final ou voltar ao menu.
- [x] Registrar a campanha concluída somente depois do epílogo, sem criar uma fase 11.
- [x] Verificar em testes simulados que derrota, nova tentativa, releitura e retomada preservam a ordem e o progresso.
- [ ] Fazer uma sessão manual completa para avaliar o ritmo da história e a dificuldade dos nove duelos.

## 9. Multiplayer 1x1 — local implementado; online pendente

Estão previstos os formatos **local e online**, conforme a atualização feita neste checklist. Nesta entrega, o local funciona no mesmo computador; a versão online ainda precisa de infraestrutura de rede.

- [x] Criar dois lutadores humanos independentes e desativar a IA no versus.
- [x] Jogador 1: WASD, Espaço para atacar e F para confirmar prontidão.
- [x] Jogador 2: setas, L para atacar e Enter para confirmar prontidão.
- [x] Mostrar identificação, vida, placar, número do round e tempo restante dos dois jogadores.
- [x] Exigir prontidão dos dois e contagem de três segundos antes de cada round.
- [x] Usar posições iniciais e atributos equivalentes, sem poções.
- [x] Resolver golpes simultâneos sem favorecer a ordem de atualização, incluindo duplo KO.
- [x] Definir melhor de três, 60 segundos por round e desempate por proporção de vida no fim do tempo.
- [x] Repetir rounds empatados sem conceder pontos.
- [x] Mostrar resultado, próximo round, revanche e retorno ao menu.
- [x] Pausar a partida local para os dois jogadores e limpar os controles ao trocar de modo.
- [x] Manter o versus separado do progresso e dos recursos da campanha.
- [x] Testar entradas simultâneas, vitórias dos dois lados, empate, revanche e troca de modo.
- [ ] Implementar criação e entrada em salas para o modo online.
- [ ] Sincronizar jogadores, comandos, dano e resultados pela rede.
- [ ] Definir autoridade das regras da partida e validar latência.
- [ ] Tratar saída, perda de conexão e reconexão.
- [ ] Testar o versus online em dois computadores.

## 10. Apresentação de imagens e narração — código implementado; aprovação no Chrome pendente

O filme solicitado foi implementado como uma apresentação de imagens estáticas, reutilizadas entre os quadros, com movimento de câmera em CSS. A fala usa `speechSynthesis`/`SpeechSynthesisUtterance`: configura `pt-BR`, prefere uma voz portuguesa disponível e oferece legendas temporizadas se a síntese falhar. Não foram produzidos arquivos de vídeo nem faixas de voz gravada.

- [x] Apresentar um quadro e uma legenda por vez, com imagens dos acontecimentos.
- [x] Associar os quadros aos parágrafos da história, preservando a ordem dos fatos.
- [x] Configurar narração em português com a voz disponível no navegador e o volume de efeitos; funcionamento lógico testado com voz simulada.
- [x] Trocar de quadro ao terminar a fala e manter o combate pausado durante a cena.
- [x] Adicionar anterior/próximo, pausar/reproduzir, repetir cena e voz ligada/desligada.
- [x] Salvar a preferência de narração localmente e manter as legendas visíveis.
- [x] Usar tempo de leitura quando a voz estiver desligada, indisponível ou falhar.
- [x] Evitar que uma síntese de voz sem resposta deixe o filme travado.
- [x] Cancelar falas e temporizadores ao sair da cena ou perder o foco, sem retomar automaticamente.
- [x] Invalidar callbacks antigos para não alterar outra cena ou interromper a partida.
- [x] Pré-carregar as imagens dos próximos quadros e usar um cenário de reserva em caso de falha.
- [x] Criar `opening.png`: ilustração do desaparecimento de Hana e do clarão laranja.
- [x] Criar `marked-tree.png`: árvore com o corte coberto de musgo e o lanceiro.
- [x] Criar `commander.png`: encontro com o comandante no Submundo.
- [x] Criar `piano-clearing.png`: Bimu esperando a última nota na clareira.
- [x] Criar `reunion.png`: portal para a cozinha e reencontro com Hana.
- [x] Criar `epilogue.png`: chá na soleira e a última batida no batente.
- [x] Criar `first-note.png`: Bimu à beira da cratera e a luz da primeira nota.
- [x] Criar `blue-graves.png`: chegada à clareira das lápides azuis e ao minotauro.
- [x] Criar `fresh-cut.png`: duelo e corte novo na árvore, ainda sem musgo.
- [x] Criar `desert-ruins.png`: guerreiro esqueleto nas ruínas do deserto.
- [x] Criar `forest-return.png`: retorno à floresta e corte coberto de musgo.
- [x] Criar `lost-portals.png`: Bimu perdido entre as dunas e os portais.
- [x] Associar os novos quadros aos parágrafos correspondentes; o prólogo alterna cratera, desaparecimento e lápides. Manter Hana ausente nas imagens da jornada antes do reencontro.
- [x] Registrar prompts, origem e edições das 12 imagens em [assets/story/README.md](assets/story/README.md) e nos documentos vinculados.
- [x] Adicionar testes para voz, sincronização, volume, pausa, falhas e cancelamento.
- [ ] Confirmar no Chrome a reprodução audível e a passagem automática dos quadros após a última correção dos temporizadores.

## Validação automatizada

Última execução: **127/127 testes e cenários passaram** — combate 21, defesa 25, história/piano 14, versus 16, narração 13, UI do filme 6, integração 22 e treino 10. Comandos em [tests/README.md](tests/README.md).

O que essa contagem não comprova:

- A integração percorre as transições da campanha usando dano direto (`takeDamage(1000)`) e posicionamento do jogador junto ao portal. Não vence os nove duelos com os controles normais nem avalia dificuldade.
- Os rounds do versus também são encerrados por dano direto nos testes de integração; as regras e entradas são testadas separadamente.
- O treino é percorrido pelas teclas e pelos contatos reais na simulação, incluindo um toque curto de contra-ataque; isso verifica a sequência das lições, mas não aprova seu ritmo ou clareza no navegador.
- `Audio.play()` e a síntese de voz são substituídos por simulações; `onend` da fala é acionado pelo teste. Não é emitida ou ouvida uma narração real nesses cenários, e o áudio Web Audio dos impactos não é exercitado pela integração.
- O canvas simulado verifica dimensões, não pixels renderizados, responsividade ou alinhamento visual dos golpes.
- A página `/tests/` executa os **46 testes de combate e defesa**. As oito suítes e os 127 cenários são executados pelos comandos de terminal.

- [x] Combate: física/animações em taxas diferentes, relógio fixo, frames ativos, direção, bloqueio, cura, morte, recuo e reset.
- [x] Defesa: postura e recuperação, quebra de guarda, parry frontal, janela de contra-ataque, dano dos combos e reinício dos estados.
- [x] História/piano: dez fases, progresso persistido/corrompido, melodia, teclas seguradas, assistência e nota final de Hana.
- [x] Versus: prontidão, contagem, tempo, placar, empate, golpes simultâneos e revanche.
- [x] Narração: voz em português, quadros, volume, pausa, repetição, alternativa silenciosa e callbacks antigos.
- [x] Integração: módulos reais e dimensões dos PNGs, menus, retry, transições da campanha até o epílogo com combate contornado, piano, troca de modo e regras do versus.
- [x] Treino: seis lições percorridas com os controles, pausa, repetição, retorno ao menu e isolamento do progresso da história.
- [x] Regressão simulada: temporizadores que exigem o receptor global correto. O erro foi reproduzido no teste; a reprodução final corrigida no Chrome não foi confirmada.
- [x] Conferir recursos HTTP, nomes de arquivos e sintaxe dos módulos JavaScript.

Auditoria de recursos: **130 caminhos de sprites** com nomes e maiúsculas/minúsculas corretos; **114/114 configurações de inimigos** compatíveis com os PNGs; **12 ilustrações de 1672 × 941**, somando aproximadamente **29,2 MiB**. As 12 imagens servidas em `http://localhost:8080/BIMU/` responderam HTTP 200 e correspondem aos arquivos locais. Os 15 módulos JavaScript passaram na verificação de sintaxe.

DOM, canvas, sintetizador de voz e dispositivos de áudio são simulados nos testes de integração. A aparência, o som ouvido e a sensação dos controles precisam da conferência manual abaixo. Na sessão mais recente, o menu com a opção de treino foi observado no Chrome; falhas de captura impediram concluir a conferência das novas mecânicas e imagens.

## Conferência manual no Chrome

Endereço solicitado para teste: **[http://localhost:8080/BIMU/](http://localhost:8080/BIMU/)**.

- [x] Abrir o jogo nesse endereço e conferir as opções do menu.
- [x] Observar no menu do Chrome a nova opção “Treino · Defesa e parry”.
- [x] Conferir a tela de controles da campanha e a abertura do prólogo.
- [x] Conferir o bloqueio de combate durante a narrativa, movimento, pausa, releitura e retorno ao menu.
- [x] Conferir a apresentação inicial do filme: título, imagem, legenda, contador de quadros e controles.
- [x] Inspecionar o console e identificar o favicon ausente.
- [x] Registrar a falha observada de reprodução e ajustar o contexto dos temporizadores, com reprodução e regressão em ambiente simulado.
- [ ] Repetir o teste da voz e da reprodução do filme no Chrome após essa correção.
- [ ] Conferir a alternância das novas imagens no prólogo e nas travessias no Chrome.
- [ ] Concluir as seis lições do treino no Chrome, conferindo a barra de postura, os avisos e o tempo do parry/contra-ataque.
- [ ] Jogar a campanha completa, conferir o piano e as imagens do reencontro/epílogo no navegador.
- [ ] Jogar uma partida local com dois jogadores, incluindo próximo round e revanche.
- [ ] Conferir perda de foco, volume, telas menores e console sem erros na versão final.

A conferência manual foi parcial: o acesso ao Chrome sofreu falhas de captura e perda da janela durante os testes. Esses itens permanecem pendentes; não foram considerados aprovados apenas por passarem nos testes simulados.

## Como executar e testar

- No ambiente indicado pelo usuário, abrir **http://localhost:8080/BIMU/** no Chrome.
- Para um servidor estático independente, executar `python3 -m http.server 8000` na raiz e abrir `http://localhost:8000`.
- Executar os testes conforme [tests/README.md](tests/README.md).

O jogo usa módulos JavaScript e `fetch`; deve ser aberto por um servidor HTTP.
