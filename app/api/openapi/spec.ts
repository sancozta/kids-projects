const dashboardStateExample = {
  version: 1,
  revision: 4,
  updatedAt: "2026-03-13T15:00:00.000Z",
  theme: "dark",
  projectTitleSize: "large",
  privacyMode: false,
  hideCompletedItems: false,
  projects: [
    {
      id: "p1",
      title: "kids-projects",
      items: [
        {
          id: "p1-1",
          text: "Criar sincronizacao com backend para salvar o json na nuvem",
          done: false,
        },
        {
          id: "p1-2",
          text: "Adicionar ordenacao manual dos cards e itens",
          done: true,
        },
      ],
    },
  ],
} as const;

export const openApiDocument = {
  openapi: "3.1.0",
  info: {
    title: "Kids Projects Dashboard API",
    version: "1.0.0",
    summary: "API central para leitura e atualizacao do status dos projetos.",
    description: `
Esta API existe para transformar o dashboard em uma fonte central de verdade para projetos e tarefas.

Objetivo do produto:
- centralizar o status operacional dos projetos em um unico documento persistido localmente
- permitir que pessoas e agentes de IA consultem o estado atual
- permitir que agentes atualizem tarefas, titulos e status de conclusao com persistencia local

Guia operacional para agentes:
1. Leia o estado atual antes de qualquer escrita.
2. Atualize o JSON de forma consciente, preservando campos existentes.
3. Ao concluir uma tarefa, altere apenas o campo \`done\` do item para \`true\`.
4. Ao renomear um projeto ou item, preserve o \`id\` existente sempre que possivel.
5. A rota de update recebe o documento inteiro do dashboard. Envie sempre um JSON valido e completo.
6. Para alterar somente um item, prefira a rota operacional \`PATCH /api/dashboard-state/item\`.

Fonte persistida:
- SQLite local em \`data/dashboard-state.sqlite\`
- backups JSON incrementais em \`data/backups/\`

Contrato principal:
- leitura via \`GET /api/dashboard-state/read\`
- atualizacao via \`PUT /api/dashboard-state/update\`
- atualizacao pontual de item via \`PATCH /api/dashboard-state/item\`
- healthcheck via \`GET /api/health\`
    `.trim(),
  },
  servers: [
    {
      url: "http://localhost:46321",
      description: "Servidor local de desenvolvimento do dashboard",
    },
  ],
  tags: [
    {
      name: "Dashboard State",
      description:
        "Operacoes de leitura e escrita do estado centralizado dos projetos, tarefas e preferencias do painel.",
    },
    {
      name: "OpenAPI",
      description:
        "Descoberta da especificacao da API para humanos e agentes de IA.",
    },
    {
      name: "Health",
      description:
        "Verificacao operacional do store local e do estado geral da API.",
    },
  ],
  paths: {
    "/api/dashboard-state/read": {
      get: {
        tags: ["Dashboard State"],
        operationId: "readDashboardState",
        summary: "Ler o estado atual do dashboard",
        description: `
Retorna o documento completo do dashboard.

Use esta rota antes de qualquer alteracao. Ela entrega a estrutura completa com projetos, itens, tema e preferencias de visualizacao.

Como agentes devem interpretar o JSON retornado em \`state\`:
- \`state\` e a fonte de verdade do painel naquele momento
- \`projects\` e a lista canonica de cards; a ordem do array define a ordem visual
- cada objeto em \`projects\` representa um projeto independente
- \`items\` contem as tarefas do projeto e tambem preservam ordem visual
- \`done: true\` significa tarefa concluida
- \`done: false\` significa tarefa pendente
- \`id\` de projeto e de item devem ser tratados como identidades estaveis, nao como labels editaveis
- \`title\` e \`text\` sao os campos semanticos que podem ser reescritos
- \`updatedAt\` representa o timestamp mais recente conhecido do documento inteiro
- \`revision\` representa a revisao canonica do servidor e deve ser reenviada no PUT seguinte

Fluxo recomendado para agentes:
1. Leia \`state\`
2. Localize o projeto por \`id\` ou por \`title\`
3. Localize o item por \`id\` ou por comparacao semantica de \`text\`
4. Preserve todos os elementos nao relacionados a alteracao
5. Para mudanca pontual de item, prefira \`PATCH /api/dashboard-state/item\`
6. Para reescrever o documento inteiro, envie o JSON completo para \`PUT /api/dashboard-state/update\`
        `.trim(),
        responses: {
          "200": {
            description: "Estado atual do dashboard retornado com sucesso.",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ReadDashboardStateResponse" },
                examples: {
                  success: {
                    summary: "Leitura do documento atual",
                    value: {
                      ok: true,
                      state: dashboardStateExample,
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    "/api/dashboard-state/update": {
      put: {
        tags: ["Dashboard State"],
        operationId: "updateDashboardState",
        summary: "Atualizar o estado completo do dashboard",
        description: `
Persiste o documento inteiro do dashboard.

Fluxo recomendado para agentes:
- primeiro leia o estado atual
- aplique apenas as alteracoes necessarias
- envie o JSON completo atualizado

Exemplos de uso:
- marcar uma tarefa como concluida
- renomear um projeto
- adicionar um novo item em um card existente
- reorganizar o conteudo preservando os ids
        `.trim(),
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/DashboardState" },
              examples: {
                markTaskDone: {
                  summary: "Marcar item como concluido",
                  value: {
                    ...dashboardStateExample,
                    projects: [
                      {
                        ...dashboardStateExample.projects[0],
                        items: [
                          {
                            ...dashboardStateExample.projects[0].items[0],
                            done: true,
                          },
                          dashboardStateExample.projects[0].items[1],
                        ],
                      },
                    ],
                  },
                },
                addTask: {
                  summary: "Adicionar novo item em um projeto existente",
                  value: {
                    ...dashboardStateExample,
                    projects: [
                      {
                        ...dashboardStateExample.projects[0],
                        items: [
                          ...dashboardStateExample.projects[0].items,
                          {
                            id: "p1-3",
                            text: "Permitir importar json salvo para restaurar o painel",
                            done: false,
                          },
                        ],
                      },
                    ],
                  },
                },
              },
            },
          },
        },
        responses: {
          "200": {
            description: "Estado salvo com sucesso.",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["ok", "state", "updatedAt"],
                  properties: {
                    ok: { type: "boolean", const: true },
                    state: { $ref: "#/components/schemas/DashboardState" },
                    updatedAt: {
                      type: "string",
                      format: "date-time",
                      description:
                        "Timestamp final persistido pelo servidor apos validacao do documento.",
                    },
                  },
                },
                examples: {
                  success: {
                    summary: "Documento salvo",
                    value: {
                      ok: true,
                      state: dashboardStateExample,
                      updatedAt: "2026-03-13T15:01:00.000Z",
                    },
                  },
                },
              },
            },
          },
          "400": {
            description: "Payload invalido.",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
          "409": {
            description:
              "Conflito de revisao. O cliente deve reler o estado atual antes de tentar salvar novamente.",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ConflictResponse" },
              },
            },
          },
        },
      },
    },
    "/api/dashboard-state/item": {
      patch: {
        tags: ["Dashboard State"],
        operationId: "patchDashboardItem",
        summary: "Atualizar um item especifico sem enviar o JSON inteiro",
        description: `
Rota operacional para agentes que precisam alterar apenas um item de checklist.

Casos ideais:
- marcar uma tarefa como concluida
- reabrir uma tarefa
- ajustar o texto de uma tarefa especifica
- atualizar texto e status no mesmo request

Campos atualizaveis:
- \`text\`
- \`done\`

Campos obrigatorios para localizar o item:
- \`projectId\`
- \`itemId\`
        `.trim(),
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/PatchDashboardItemRequest" },
              examples: {
                markDone: {
                  summary: "Marcar item como concluido",
                  value: {
                    projectId: "p1",
                    itemId: "p1-1",
                    done: true,
                  },
                },
                renameItem: {
                  summary: "Renomear item sem mudar status",
                  value: {
                    projectId: "p1",
                    itemId: "p1-1",
                    text: "Criar sincronizacao com backend e fila de retry",
                  },
                },
                updateBoth: {
                  summary: "Atualizar texto e status no mesmo request",
                  value: {
                    projectId: "p1",
                    itemId: "p1-1",
                    text: "Criar sincronizacao com backend para salvar o json na nuvem",
                    done: true,
                  },
                },
              },
            },
          },
        },
        responses: {
          "200": {
            description: "Item atualizado com sucesso.",
            content: {
              "application/json": {
                schema: {
                  type: "object",
                  required: ["ok", "state", "updatedAt"],
                  properties: {
                    ok: { type: "boolean", const: true },
                    state: { $ref: "#/components/schemas/DashboardState" },
                    updatedAt: {
                      type: "string",
                      format: "date-time",
                    },
                  },
                },
              },
            },
          },
          "400": {
            description: "Request invalido ou sem identificadores obrigatorios.",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
          "404": {
            description: "Item nao encontrado.",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/ErrorResponse" },
              },
            },
          },
        },
      },
    },
    "/api/health": {
      get: {
        tags: ["Health"],
        operationId: "readDashboardHealth",
        summary: "Executar healthcheck operacional do dashboard",
        description: `
Valida o store local, executa uma leitura do estado persistido e grava um heartbeat operacional no SQLite.

Use esta rota para watchdogs, launchd e monitoramento local.
        `.trim(),
        responses: {
          "200": {
            description: "Store saudavel para leitura e escrita.",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/HealthResponse" },
              },
            },
          },
          "503": {
            description: "Falha no healthcheck do store local.",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/HealthResponse" },
              },
            },
          },
        },
      },
    },
    "/swagger.json": {
      get: {
        tags: ["OpenAPI"],
        operationId: "readSwaggerDocument",
        summary: "Ler a especificacao Swagger/OpenAPI desta API",
        description:
          "Retorna o documento principal Swagger/OpenAPI em um endpoint padrao e facil de consumir por ferramentas.",
        responses: {
          "200": {
            description: "Especificacao OpenAPI retornada com sucesso.",
          },
        },
      },
    },
    "/api/openapi": {
      get: {
        tags: ["OpenAPI"],
        operationId: "readOpenApiCompatibilityDocument",
        summary: "Ler a especificacao OpenAPI em rota de compatibilidade",
        description:
          "Alias de compatibilidade para a mesma especificacao disponivel em /swagger.json.",
        responses: {
          "200": {
            description: "Especificacao OpenAPI retornada com sucesso.",
          },
        },
      },
    },
  },
  components: {
    schemas: {
      TodoItem: {
        type: "object",
        additionalProperties: false,
        required: ["id", "text", "done"],
        description:
          "Item de checklist pertencente a um projeto. Cada item representa uma tarefa operacional rastreavel.",
        properties: {
          id: {
            type: "string",
            description:
              "Identificador estavel do item. Deve ser preservado em updates para manter a identidade da tarefa.",
          },
          text: {
            type: "string",
            description: "Descricao objetiva da tarefa.",
          },
          done: {
            type: "boolean",
            description: "Indica se a tarefa ja foi concluida.",
          },
        },
      },
      ProjectCard: {
        type: "object",
        additionalProperties: false,
        required: ["id", "title", "items"],
        description:
          "Card de projeto exibido no dashboard. Cada card agrega um titulo e uma lista de tarefas.",
        properties: {
          id: {
            type: "string",
            description:
              "Identificador estavel do projeto. Preserve esse valor ao editar o conteudo do card.",
          },
          title: {
            type: "string",
            description: "Nome visivel do projeto no dashboard.",
          },
          items: {
            type: "array",
            description: "Lista ordenada de tarefas do projeto.",
            items: { $ref: "#/components/schemas/TodoItem" },
          },
        },
      },
      DashboardState: {
        type: "object",
        additionalProperties: false,
        required: [
          "version",
          "revision",
          "updatedAt",
          "theme",
          "projectTitleSize",
          "privacyMode",
          "hideCompletedItems",
          "projects",
        ],
        description:
          "Documento principal do dashboard. Esse JSON centraliza o estado operacional dos projetos e deve ser tratado como a fonte de verdade. Agentes devem interpretar projects como a lista canonica de projetos, items como a lista canonica de tarefas dentro de cada projeto, e ids como identidades estaveis que devem ser preservadas durante updates.",
        properties: {
          version: {
            type: "integer",
            const: 1,
            description: "Versao atual do contrato do documento.",
          },
          revision: {
            type: "integer",
            minimum: 0,
            description:
              "Revisao canonica emitida pelo servidor. Deve ser reenviada em updates completos para evitar conflito de escrita.",
          },
          updatedAt: {
            type: "string",
            format: "date-time",
            description:
              "Timestamp de ultima atualizacao do documento. Usado para reconciliar estado salvo.",
          },
          theme: {
            type: "string",
            enum: ["light", "dark", "blue"],
            description: "Tema visual ativo no painel.",
          },
          projectTitleSize: {
            type: "string",
            enum: ["normal", "large"],
            description: "Tamanho visual aplicado a titulos e itens do painel.",
          },
          privacyMode: {
            type: "boolean",
            description:
              "Quando verdadeiro, a interface humana pode exibir dados fake. O estado real ainda permanece neste documento.",
          },
          hideCompletedItems: {
            type: "boolean",
            description:
              "Controla se a interface oculta itens concluidos durante a visualizacao.",
          },
          projects: {
            type: "array",
            description:
              "Lista de projetos exibidos no dashboard. A ordem desse array define a ordem visual dos cards.",
            items: { $ref: "#/components/schemas/ProjectCard" },
          },
        },
        example: dashboardStateExample,
      },
      ReadDashboardStateResponse: {
        type: "object",
        additionalProperties: false,
        required: ["ok", "state"],
        description:
          "Envelope de leitura do dashboard. O campo state contem o documento canonico que deve ser usado como base para qualquer decisao ou escrita posterior.",
        properties: {
          ok: {
            type: "boolean",
            const: true,
          },
          state: {
            allOf: [{ $ref: "#/components/schemas/DashboardState" }],
            description:
              "Documento completo do painel. Interprete projects como a lista ordenada de projetos e items como a lista ordenada de tarefas de cada projeto.",
          },
        },
      },
      HealthResponse: {
        type: "object",
        additionalProperties: false,
        required: [
          "ok",
          "store",
          "databasePath",
          "backupDir",
          "canRead",
          "canWrite",
          "integrity",
          "stateRevision",
          "stateUpdatedAt",
          "lastBackupPath",
          "lastBackupAt",
        ],
        properties: {
          ok: {
            type: "boolean",
          },
          store: {
            type: "string",
            const: "sqlite",
          },
          databasePath: {
            type: "string",
          },
          backupDir: {
            type: "string",
          },
          canRead: {
            type: "boolean",
          },
          canWrite: {
            type: "boolean",
          },
          integrity: {
            type: "string",
            description: "Resultado do PRAGMA quick_check do SQLite.",
          },
          stateRevision: {
            type: ["integer", "null"],
          },
          stateUpdatedAt: {
            type: ["string", "null"],
            format: "date-time",
          },
          lastBackupPath: {
            type: ["string", "null"],
          },
          lastBackupAt: {
            type: ["string", "null"],
            format: "date-time",
          },
          error: {
            type: "string",
          },
        },
      },
      PatchDashboardItemRequest: {
        type: "object",
        additionalProperties: false,
        required: ["projectId", "itemId"],
        description:
          "Payload parcial para alterar um item especifico do checklist sem reenviar o documento inteiro.",
        properties: {
          projectId: {
            type: "string",
            description: "Id do projeto que contem o item.",
          },
          itemId: {
            type: "string",
            description: "Id do item que sera alterado.",
          },
          text: {
            type: "string",
            description:
              "Novo texto do item. Se omitido, o texto atual e preservado.",
          },
          done: {
            type: "boolean",
            description:
              "Novo status de conclusao. Se omitido, o status atual e preservado.",
          },
        },
      },
      ErrorResponse: {
        type: "object",
        additionalProperties: false,
        required: ["ok", "error"],
        properties: {
          ok: {
            type: "boolean",
            const: false,
          },
          error: {
            type: "string",
            description: "Mensagem objetiva para orientar o agente ou cliente.",
          },
        },
      },
      ConflictResponse: {
        type: "object",
        additionalProperties: false,
        required: ["ok", "error", "state"],
        properties: {
          ok: {
            type: "boolean",
            const: false,
          },
          error: {
            type: "string",
          },
          state: {
            $ref: "#/components/schemas/DashboardState",
          },
        },
      },
    },
  },
} as const;
