# Testes do BIMU

Os testes usam JavaScript nativo, sem dependências adicionais.

## No navegador

No servidor do projeto, abra `http://localhost:8080/BIMU/tests/`. Como alternativa, execute `python3 -m http.server 8000` na raiz e abra `http://localhost:8000/tests/`. Essa página executa os **46 testes de combate e defesa**; as demais suítes são executadas no terminal.

## No terminal

Com Node.js 24 (versão usada nesta entrega) disponível, execute:

```sh
node tests/run.mjs
node tests/defense.test.mjs
node tests/story.test.mjs
node tests/versus.test.mjs
node tests/narration.test.mjs
node tests/film-ui.test.mjs
node tests/integration.test.mjs
node tests/training.test.mjs
```

A suíte cobre física e animações entre diferentes taxas de atualização, passos fixos do relógio, colisões para os dois lados, janela de dano, bloqueio, interrupção de ações, morte, cura e reinício da luta.

Defesa cobre recuperação de postura, quebra de guarda, defesa frontal, parry, atordoamento, contra-ataque, perfis dos três golpes e cancelamento/reinício dos estados. Versus inclui a leitura da defesa durante estados de recuperação e a retenção breve do comando de ataque durante a pausa de impacto.

As suítes de história e versus verificam saves, melodia, espera por Hana, duplo KO, prontidão, rounds e revanche. A suíte de narração verifica a sequência de quadros, fala em português, controles e cancelamento de callbacks. O teste de UI do filme reproduz as restrições dos temporizadores do navegador e confere que os controles de reprodução ficam habilitados.

O teste de integração importa os módulos reais e lê as dimensões dos PNGs do projeto. Ele verifica erro de carregamento, loop único, menus, movimento, pausa, perda de foco, nova tentativa, avanço por nove portais, três aberturas/fechamentos do piano, transições da campanha até a conclusão no epílogo, controles independentes no versus e pausa durante o primeiro carregamento do piano. Para avançar fases, causa dano diretamente aos inimigos e move Bimu até o portal; também encerra rounds do versus por dano direto. Não joga as lutas completas pelos controles normais.

No treino, a integração percorre as seis lições pelas teclas normais e pelos contatos reais de combate na simulação, incluindo um toque curto para o contra-ataque. Também verifica pausa, conclusão, repetição, saída e preservação do save da campanha. A suíte isolada de treino verifica a ordem das lições, identidades dos participantes e a exigência de um novo parry antes do contra-ataque.

DOM, canvas, áudio e `requestAnimationFrame` são simulados. A fala usa um sintetizador falso e eventos `onend` disparados pelo teste; o canvas não compara pixels, e `Audio.play()` não reproduz áudio. As suítes comprovam regras e transições, sem certificar voz audível, aparência, dificuldade ou funcionamento integral no Chrome.

Nos testes de combate, as imagens dos personagens são substituídas por dimensões sintéticas. Esses testes verificam as regras de simulação; alinhamento visual dos sprites, áudio, menus e transições devem ser conferidos no navegador do jogo.

## Resultado da entrega atual

| Suíte | Resultado |
| --- | --- |
| Combate | 21/21 |
| Defesa | 25/25 |
| História e piano | 14/14 |
| Versus local | 16/16 |
| Narração | 13/13 |
| Filme e UI | 6/6 |
| Integração | 22/22 |
| Treino | 10/10 |

Total: **127/127 testes e cenários passaram**. A conferência manual está registrada no [checklist](../CHECKLIST.md).
