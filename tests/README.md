# Testes de combate

Os testes usam JavaScript nativo, sem dependências adicionais.

## No navegador

Na raiz do projeto, execute `python3 -m http.server 8000` e abra `http://localhost:8000/tests/`.

## No terminal

Com Node.js 24 (versão usada nesta entrega) disponível, execute:

```sh
node tests/run.mjs
node tests/integration.test.mjs
```

A suíte cobre física e animações entre diferentes taxas de atualização, passos fixos do relógio, colisões para os dois lados, janela de dano, bloqueio, interrupção de ações, morte, cura e reinício da luta.

O teste de integração importa os módulos reais e lê as dimensões dos PNGs do projeto. Ele verifica erro de carregamento, loop único, menus, movimento, pausa, perda de foco, nova tentativa, avanço por nove portais e três aberturas/fechamentos do piano. DOM, canvas, áudio e `requestAnimationFrame` são simulados; a execução não substitui a conferência no navegador.

Nos testes de combate, as imagens dos personagens são substituídas por dimensões sintéticas. Esses testes verificam as regras de simulação; alinhamento visual dos sprites, áudio, menus e transições devem ser conferidos no navegador do jogo.
