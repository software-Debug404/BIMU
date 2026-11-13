# Testes do BIMU

Os testes usam JavaScript nativo, sem dependências adicionais.

## No navegador

Na raiz do projeto, execute `python3 -m http.server 8000` e abra `http://localhost:8000/tests/`.

## No terminal

Com Node.js 24 (versão usada nesta entrega) disponível, execute:

```sh
node tests/run.mjs
node tests/story.test.mjs
node tests/versus.test.mjs
node tests/narration.test.mjs
node tests/integration.test.mjs
```

A suíte cobre física e animações entre diferentes taxas de atualização, passos fixos do relógio, colisões para os dois lados, janela de dano, bloqueio, interrupção de ações, morte, cura e reinício da luta.

As suítes de história e versus verificam saves, melodia, espera por Hana, duplo KO, prontidão, rounds e revanche. A suíte de narração verifica a sequência de quadros, fala em português, controles e cancelamento de callbacks.

O teste de integração importa os módulos reais e lê as dimensões dos PNGs do projeto. Ele verifica erro de carregamento, loop único, menus, movimento, pausa, perda de foco, nova tentativa, avanço por nove portais, três aberturas/fechamentos do piano, campanha completa, conclusão no epílogo, controles independentes no versus e pausa durante o primeiro carregamento do piano. DOM, canvas, áudio e `requestAnimationFrame` são simulados; a execução não substitui a conferência no navegador.

Nos testes de combate, as imagens dos personagens são substituídas por dimensões sintéticas. Esses testes verificam as regras de simulação; alinhamento visual dos sprites, áudio, menus e transições devem ser conferidos no navegador do jogo.
