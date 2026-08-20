# FlowSnap

FlowSnap é uma extensão Chrome para gravar fluxos de navegação e, futuramente, exportá-los como testes automatizados.

Nesta primeira versão, o Side Panel permite iniciar e parar uma sessão visual de gravação. O estado é salvo no próprio navegador, mas nenhuma interação com páginas é capturada ainda.

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

Depois de alterações no código, gere um novo build e clique em **Atualizar** no cartão da extensão.

## Pacote para distribuição

```bash
npm run package:extension
```

O comando cria `flowsnap-extension.zip` na raiz do projeto. O arquivo é ignorado pelo Git.
