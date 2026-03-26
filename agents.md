# AGENTS.md

## Objetivo

- Este projeto e um dashboard fullscreen para organizar projetos em uma grade fixa `4 x 2`.
- Cada card representa um projeto com titulo, contador de progresso e lista to-do editavel.
- A interface deve priorizar alta densidade de informacao, leitura rapida e uso operacional diario.

## Stack

- Next.js 16 com App Router
- TypeScript
- Tailwind CSS v4
- Framer Motion
- Lucide React

## Estado atual

- A tela principal esta em `app/page.tsx`.
- O dashboard ocupa `100vh` e `100vw`, sem scroll na pagina inteira.
- O scroll deve existir apenas dentro da lista de cada card.
- Existem tres temas: `light`, `dark` e `blue`.
- Tema e dados dos projetos sao reconciliados entre `localStorage` e o store local SQLite.

## Estrutura importante

- `app/page.tsx`: composicao da tela, dados iniciais, logica de tema e tarefas.
- `app/dashboard-state.ts`: contrato do estado, sanitizacao e sugestoes locais.
- `app/globals.css`: tokens visuais, temas e classes utilitarias principais do dashboard.
- `app/layout.tsx`: fontes, metadata e shell raiz.
- `app/api/dashboard-state/store.ts`: store SQLite, revisoes, migracao do JSON legado e backups.
- `app/api/dashboard-state/read/route.ts`: leitura do estado central dos projetos.
- `app/api/dashboard-state/item/route.ts`: alteracao parcial de um item especifico.
- `app/api/dashboard-state/update/route.ts`: atualizacao do documento central dos projetos.
- `app/api/health/route.ts`: healthcheck operacional do store.
- `app/swagger.json/route.ts`: endpoint padrao Swagger/OpenAPI em JSON.
- `app/api/openapi/route.ts`: alias de compatibilidade para a especificacao OpenAPI.
- `app/swagger/page.tsx`: rota visual com Swagger UI padrao para explorar a API.
- `cli/`: CLI local do projeto, inspirada no `mark-cli`, com descoberta automatica de comandos.
- `scripts/`: scripts operacionais de start, watchdog, backup e launchd.

## API para agentes

- `GET /api/dashboard-state/read`: retorna `{ ok, state }` com o estado completo do dashboard.
- `PATCH /api/dashboard-state/item`: atualiza um item especifico com `projectId`, `itemId`, `text` e/ou `done`.
- `PUT /api/dashboard-state/update`: recebe o documento inteiro do dashboard, exige `revision` atual e persiste no store local.
- `GET /api/health`: retorna a saude do store SQLite para watchdogs e automacoes.
- `GET /swagger.json`: retorna a especificacao Swagger/OpenAPI principal.
- `GET /api/openapi`: retorna a mesma especificacao em rota de compatibilidade.
- `GET /swagger`: interface Swagger UI padrao para consulta humana e para descoberta rapida do contrato.
- O store principal e `data/dashboard-state.sqlite`.
- Backups incrementais sao gravados em `data/backups/`.
- Agentes devem ler antes de escrever e preservar `id` de projetos e tarefas sempre que possivel.
- Em updates completos, agentes devem reenviar a `revision` mais recente para evitar conflito `409`.

## CLI para agentes

- Use `./cli/kids.sh help` ou `npm run cli -- help` para descobrir comandos.
- Para leitura rapida do estado local, prefira `./cli/kids.sh state --summary`.
- Para validar a operacao do app em execucao, prefira `./cli/kids.sh health`.
- Para criar um backup manual antes de mudancas estruturais, use `./cli/kids.sh backup`.
- Para instalar o comando `kids` no zsh com autocomplete, use `source ./cli/install.sh`.
- Comandos da CLI vivem em `cli/commands/` e seguem estas convencoes:
- `# desc:` ou `// desc:` alimenta o help automatico.
- Prefixo `_` cria comandos privados.
- Prefixo `util_` indica utilitarios internos nao expostos no help.

## Regras de interface

- Manter a grade `4 colunas x 2 linhas`.
- As duas linhas devem continuar visualmente equilibradas em `50% / 50%`.
- A interface deve ser compacta e pixel perfect.
- Evitar aumentar header, paddings, inputs e tipografia sem necessidade.
- Preservar o uso full screen e o aproveitamento maximo da area util.
- Preferir densidade alta com boa legibilidade em vez de elementos decorativos grandes.

## Regras de implementacao

- Nao introduzir bibliotecas novas sem necessidade clara.
- Antes de mudar a estrutura, preservar a experiencia principal: cards de projetos + checklist + temas.
- Se criar componentes novos, manter nomes objetivos e coesos com o dominio.
- Validar sempre com `npm run lint` e `npm run build`.

## Direcao visual

- Estetica inspirada em dashboard tecnico.
- Contraste alto, linhas finas, ritmo consistente e espacamentos pequenos.
- Animacoes devem ser discretas e nao atrapalhar a densidade da interface.
