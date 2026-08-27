<p align="center">
  <img src="assets/qaquest.png" width="150" alt="logo">
</p>

<h1 align="center">FlowSnap</h1>

FlowSnap é uma extensão Chrome que grava fluxos de navegação e gera passos reutilizáveis e código Playwright. A exportação para Cypress está planejada.

## Recursos

- Captura cliques, preenchimentos, seleções, controles e teclas de interação.
- Registra navegação por `Tab`, mudanças de URL, carregamentos e recarregamentos.
- Gera descrições e recomenda seletores confiáveis para cada passo.
- Protege dados sensíveis e mantém as gravações localmente no navegador.
- Permite copiar seletores e editar, reordenar, excluir ou limpar passos pelo Side Panel.

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
npm run test:integration
npm run build
```

`npm run test:integration` valida a jornada completa da extensão em um Chrome simulado em memória.

## Carregando a extensão no Chrome

1. Execute `npm run build`.
2. Abra `chrome://extensions`, ative o **Modo do desenvolvedor** e selecione **Carregar sem compactação**.
3. Escolha a pasta `dist`.
4. Abra o FlowSnap em uma página HTTP ou HTTPS e inicie a gravação.

Após alterações, gere um novo build e atualize a extensão no Chrome.

## Pacote para distribuição

```bash
npm run package:extension
```

O comando cria `flowsnap-extension.zip` na raiz do projeto. O arquivo é ignorado pelo Git.
