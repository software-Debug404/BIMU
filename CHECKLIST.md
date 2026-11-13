# Melhorias do BIMU

Este checklist organiza as melhorias por prioridade. As marcas indicam implementação concluída e verificação automatizada ou revisão do código. A conferência visual e os testes manuais estão separados ao final.

## 1. Base do jogo e combate — primeira entrega

- [x] Remover a inicialização duplicada e manter um único loop de jogo.
- [x] Atualizar a simulação em passos fixos, com movimento e animações independentes da taxa de atualização da tela.
- [x] Impedir saltos na simulação ao voltar de outra aba e limpar teclas ao perder o foco.
- [x] Corrigir as áreas de colisão do corpo e posicionar o ataque conforme a direção do personagem.
- [x] Aplicar dano somente nos frames ativos do golpe e uma única vez por ataque.
- [x] Corrigir conflitos entre ataque, defesa, cura, dano e morte.
- [x] Corrigir caminhos e diferenças de maiúsculas/minúsculas dos arquivos para hospedagem e execução em subpastas.
- [x] Esperar o carregamento real dos recursos e apresentar falhas de carregamento.
- [x] Verificar física, colisões e estados com testes automatizados.
- [ ] Conferir visualmente a execução no navegador.

## 2. Impacto dos golpes — primeira entrega

- [x] Acrescentar som de ataque, acerto e bloqueio, respeitando o volume escolhido.
- [x] Mostrar faíscas e reação visual ao receber ou bloquear um golpe.
- [x] Aplicar pequeno recuo e pausa breve de impacto ao acertar.

## 3. Orientação e conforto — primeira entrega

- [x] Mostrar a fase atual e o nome do inimigo.
- [x] Exibir avisos de interação perto do portal e do piano.
- [x] Adicionar pausa no Esc e pausa automática ao sair da aba.
- [x] Adicionar controle de volume para música e efeitos.
- [x] Permitir tentar novamente a luta atual depois de morrer.
- [x] Ajustar o canvas e os menus para caberem em telas menores.
- [x] Substituir a espera aleatória entre fases por uma transição curta.

## 4. Defesa e domínio do combate

- [ ] Adicionar barra de postura com recuperação e quebra de defesa.
- [ ] Criar uma janela curta de parry e abertura para contra-ataque.
- [ ] Diferenciar os golpes do combo em dano, alcance e recuperação.
- [ ] Ensinar as novas mecânicas em um tutorial jogável.
- [ ] Ajustar a dificuldade com sessões de teste de jogabilidade.

## 5. Inimigos com comportamentos próprios

- [ ] Minotauro: investida lenta com preparação visível.
- [ ] Esqueleto lanceiro: controle de distância e ataque de maior alcance.
- [ ] Comandante samurai: defesa e contra-ataque.
- [ ] Definir padrões, intervalos e atributos próprios para os demais inimigos.
- [ ] Criar progressão de dificuldade para as fases aleatórias.

## 6. Progressão entre fases

- [ ] Oferecer uma escolha entre três melhorias após vencer.
- [ ] Aplicar melhorias de vida, combo e parry durante a jornada.
- [ ] Definir regras de recuperação de vida e reposição de poções.
- [x] Salvar as configurações de áudio localmente.
- [ ] Salvar o melhor resultado localmente.
- [ ] Exibir um resumo da jornada ao ser derrotado.

## 7. Piano e identidade do jogo

- [ ] Introduzir no piano da décima fase a melodia que Bimu e Hana tocavam juntos.
- [ ] Ensinar a parte de Bimu e permitir praticar a sequência antes do desfecho.
- [ ] Fazer o jogador terminar a parte de Bimu e esperar, deixando a última nota para Hana.
- [ ] Fazer a nota de Hana mudar o destino do portal, revelando a cozinha de casa.
- [x] Permitir sair e reabrir o piano com Esc e botão, preservando os controles do jogo.
- [ ] Permitir repetir a sequência sem perder a campanha e oferecer uma alternativa acessível para concluir a cena.
- [ ] Reservar bênçãos e melhorias musicais para os intervalos do modo sem fim.

## 8. Modo história — A Última Nota

Texto completo de referência: [HISTORIA.md](HISTORIA.md). A história foi registrada; os itens abaixo ainda precisam ser implementados no jogo.

- [ ] Adicionar a opção “História” ao menu com o título “BIMU — A Jornada do Samurai: A Última Nota”.
- [ ] Separar a campanha, com desfecho na décima fase, do modo de arenas sem fim existente.
- [ ] Dividir a narrativa em trechos curtos antes ou depois dos duelos, sem interromper ataques em andamento.
- [ ] Permitir avançar, pular e reler os trechos, mantendo a simulação pausada durante a leitura.
- [ ] Criar a abertura: desaparecimento de Hana, clarão laranja, cratera e primeira nota vinda debaixo da terra.
- [ ] Fase 1: apresentar a clareira de lápides azuis, o minotauro e o corte deixado por Bimu na árvore.
- [ ] Fase 2: apresentar o guerreiro esqueleto que defende as ruínas da cidade no deserto.
- [ ] Fase 3: mostrar a lua na mesma posição, o corte coberto de musgo e o lanceiro com o brasão do antigo mestre.
- [ ] Fase 4: contar por que o Comandante Samurai abriu o portal e incluir o aviso “Se ouvir a voz dela, não responda”.
- [ ] Fases 5 a 9: mostrar as travessias repetidas, a passagem irregular do tempo e a desorientação de Bimu.
- [ ] Fase 10: apresentar a clareira sem inimigo e o piano de casa com a marca redonda da caneca de Hana.
- [ ] Integrar o desfecho à interação musical descrita na seção 7, preservando a espera de Bimu pela última nota de Hana.
- [ ] Mostrar Hana na cozinha e a fala “Anda, Bimu! Eu não sei tocar a sua parte!”.
- [ ] Encerrar a campanha com o resgate, o fechamento do portal e o piano deixado na clareira.
- [ ] Criar o epílogo do chá na soleira, com Bimu marcando o ritmo no batente e Hana dando a última batida.
- [ ] Preparar os elementos visuais e sonoros necessários para Hana, árvore marcada, brasão, piano, cozinha e epílogo.
- [ ] Salvar o progresso da campanha, incluindo trechos vistos e conclusão, separadamente dos outros modos.
- [ ] Validar a ordem dos trechos e garantir que derrota, nova tentativa e retorno ao jogo não pulem partes essenciais.

## 9. Multiplayer 1x1 — jogador contra jogador

O formato local ou online ainda precisa ser definido. Essa decisão determina os controles e a necessidade de infraestrutura de rede.

- [ ] Definir se a primeira versão do 1x1 será local ou online.
- [ ] Adicionar a opção “Versus 1x1” ao menu, separada da campanha e do modo sem fim.
- [ ] Permitir que dois jogadores controlem lutadores independentes, desativando a IA nesse modo.
- [ ] Se local: definir comandos distintos para os dois jogadores e verificar teclas pressionadas simultaneamente.
- [ ] Se online: definir criação/entrada em sala, conexão dos dois jogadores e sincronização da partida.
- [ ] Identificar Jogador 1 e Jogador 2 com indicadores visuais e barras de vida próprias.
- [ ] Começar a luta somente quando ambos estiverem prontos, com posições iniciais e condições equivalentes.
- [ ] Adaptar dano, defesa, combos e colisões para os dois lutadores, incluindo ataques simultâneos sem vantagem pela ordem de atualização.
- [ ] Definir regras de poções, duração da luta, rounds e empate para o modo competitivo.
- [ ] Exibir o resultado da partida e oferecer revanche ou retorno ao menu.
- [ ] Definir pausa, saída de um jogador e, se online, perda de conexão e reconexão.
- [ ] Manter recursos e resultados do versus separados do progresso da campanha.
- [ ] Testar vitória dos dois lados, empate, entradas simultâneas, revanche e limpeza dos controles ao trocar de modo.
- [ ] Se online: validar latência, sincronização de dano e autoridade das regras da partida.

## Validação da primeira entrega

- [x] Comparar movimento e duração de animações em diferentes taxas de atualização (testes automatizados).
- [x] Conferir ataques para os dois lados, bloqueio e morte durante outras ações (testes automatizados).
- [x] Conferir menu, início, pausa, retorno à aba, derrota e nova tentativa com DOM simulado.
- [ ] Conferir esses fluxos manualmente no navegador.
- [x] Conferir nove portais até a fase 10 e três aberturas/fechamentos do piano com DOM simulado.
- [ ] Conferir portal e piano manualmente no navegador.
- [x] Conferir os 141 arquivos pelo servidor HTTP local e a sintaxe dos 10 módulos JavaScript.
- [x] Validar volume, persistência e troca de faixas com áudio simulado.
- [ ] Conferir som percebido, layout em telas menores e ausência de erros no console do navegador.

## Situação da primeira entrega

Implementados os itens de base, impacto dos golpes e conforto. Validação automatizada: 21/21 testes de combate e 8/8 cenários de integração passaram; 114/114 configurações de animação dos inimigos conferidas com os PNGs. As próximas etapas incluem postura/parry, comportamentos próprios dos inimigos, melhorias entre fases, a campanha “A Última Nota” com seu desfecho musical e o multiplayer 1x1. A campanha e o multiplayer estão planejados neste checklist e ainda não foram implementados.

A conferência visual no navegador está pendente: a ferramenta de acesso ao navegador retornou “The browser access host is unavailable” nesta sessão. Os testes automatizados usam dimensões reais dos PNGs e substitutos de DOM/áudio; eles não comprovam aparência, som percebido ou sensação dos controles.

## Como executar

Na raiz do projeto, execute `python3 -m http.server 8000` e abra `http://localhost:8000`. Use um servidor HTTP, pois o jogo utiliza módulos JavaScript e carregamento de arquivos com `fetch`.
