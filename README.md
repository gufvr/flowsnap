<p align="center">
  <img src="assets/qaquest.png" width="150" alt="logo">
</p>

<h1 align="center">FlowSnap</h1>

Esse projeto é uma extensão Chrome pensada para gravar fluxos de navegação e, futuramente, exportá-los como testes automatizados para Cypress e Playwright.

O Side Panel permite iniciar e parar uma sessão na aba ativa. O FlowSnap solicita acesso somente ao site atual e registra cliques, preenchimentos de campos, ajustes de range, seleções, mudanças em checkbox e radio, teclas de interação e navegações por `Tab` localmente no navegador.

Cada passo armazena a URL, o horário, informações básicas do elemento e candidatos de seletor. `Tab` e `Shift+Tab` registram o elemento que recebeu foco. A digitação é consolidada em um único passo quando a alteração do campo é concluída, sem registrar cada tecla.

Nos cliques, o FlowSnap prioriza o controle interativo nativo ou customizado que contém o ponto acionado. Containers estruturais sem sinais de interação são ignorados, evitando descrições extensas e seletores frágeis criados a partir do texto agregado da página.

Senhas, códigos temporários, dados de pagamento, documentos pessoais, tokens e outros segredos reconhecidos são registrados somente como valores protegidos. O conteúdo, seu tamanho e qualquer máscara ou hash não são persistidos. Seleções, caixas de seleção e campos de arquivo não fazem parte da captura de preenchimento.

Checkbox, radio e select são descritos pelo estado final, sem duplicar o clique ou a tecla que causou a mudança. `Enter`, `Space`, `Escape` e setas são registradas somente quando representam uma interação, sem transformar digitação comum ou movimentação do cursor em passos.

Ranges nativos são consolidados pelo valor final de cada alteração. Os eventos intermediários do arraste não criam passos, e o clique ou a seta que causou a mudança não são registrados em duplicidade. O tipo `color` ainda mantém o comportamento de clique comum.

No Side Panel, cada passo pode ter seu seletor recomendado copiado ou ser excluído após confirmação. Também é possível limpar toda a lista sem interromper uma gravação ativa.

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

`npm run test:integration` executa a jornada da extensão com um Chrome em
memória: início e parada da gravação, cliques, descarte de containers estruturais, navegação por `Tab`, persistência,
atualização reativa do Side Panel, cópia de seletores, exclusão e limpeza. A
regressão também carrega schemas 7, 6, 5, 4, 3, 2, legado e registros incompletos,
confirmando a leitura sem migração do storage.

O harness substitui somente as fronteiras fornecidas pelo navegador, como
`chrome.runtime`, `chrome.storage`, permissões, aba e clipboard. Os módulos do
FlowSnap usados no fluxo permanecem reais.

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
