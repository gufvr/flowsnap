<p align="center">
  <img src="assets/qaquest.png" width="150" alt="logo">
</p>

<h1 align="center">FlowSnap</h1>

Este projeto é uma extensão Chrome pensada para gravar fluxos de navegação e, futuramente, exportá-los como testes automatizados para Cypress e Playwright.

<h1 aign="center">FlowSnap</h1>

FlowSnap é uma extensão Chrome para gravar fluxos de navegação e, futuramente, exportá-los como testes automatizados.

O Side Panel permite iniciar e parar uma sessão na aba ativa. O FlowSnap solicita acesso somente ao site atual e registra os cliques localmente no navegador.

Cada clique armazena a URL, o horário, informações básicas do elemento e candidatos de seletor. Digitação, navegação e outros eventos ainda não são capturados.

## Requisitos

- Node.js 24 ou superior
- npm 11 ou superior
- Google Chrome com suporte a extensões Manifest V3

## Desenvolvimento

```bash
npm install
npm run dev
```

## Testes e validação

```bash
npm run lint
npm test
npm run build
```

## Carregando a extensão no Chrome

1. Execute `npm run build`.
2. Abra `chrome://extensions` no Chrome.
3. Ative o **Modo do desenvolvedor**.
4. Clique em **Carregar sem compactação**.
5. Selecione a pasta `dist` gerada neste projeto.
6. Fixe o FlowSnap na barra de ferramentas e clique no ícone para abrir o painel lateral.
7. Abra um site HTTP ou HTTPS, clique em **Iniciar Gravação** e autorize o acesso quando o navegador solicitar.

O FlowSnap não grava páginas internas, como `brave://extensions` e `chrome://extensions`.

Depois de alterações no código, gere um novo build e clique em **Atualizar** no cartão da extensão.

## Pacote para distribuição

```bash
npm run package:extension
```

O comando cria `flowsnap-extension.zip` na raiz do projeto. O arquivo é ignorado pelo Git.
