export type ThemeMode = "light" | "dark" | "blue";
export type ProjectTitleSize = "normal" | "large";

export type TodoItem = {
  id: string;
  text: string;
  done: boolean;
};

export type ProjectCard = {
  id: string;
  title: string;
  items: TodoItem[];
  dismissedSuggestionKeys?: string[];
};

export type DashboardState = {
  version: 1;
  revision: number;
  updatedAt: string;
  theme: ThemeMode;
  projectTitleSize: ProjectTitleSize;
  privacyMode: boolean;
  hideCompletedItems: boolean;
  projects: ProjectCard[];
};

export const dashboardStorageKey = "kids-projects-dashboard-state";

export const initialProjects: ProjectCard[] = [
  {
    id: "p1",
    title: "Landing Page",
    items: [
      { id: "p1-1", text: "Definir headline principal", done: true },
      { id: "p1-2", text: "Separar prints de tela", done: false },
      { id: "p1-3", text: "Revisar CTA final", done: false },
    ],
  },
  {
    id: "p2",
    title: "Conteudo Instagram",
    items: [
      { id: "p2-1", text: "Mapear 12 posts do mes", done: true },
      { id: "p2-2", text: "Criar roteiro de reels", done: false },
      { id: "p2-3", text: "Aprovar identidade visual", done: false },
    ],
  },
  {
    id: "p3",
    title: "App Mobile",
    items: [
      { id: "p3-1", text: "Desenhar fluxo onboarding", done: false },
      { id: "p3-2", text: "Validar login social", done: false },
      { id: "p3-3", text: "Montar backlog v1", done: false },
    ],
  },
  {
    id: "p4",
    title: "Comercial",
    items: [
      { id: "p4-1", text: "Atualizar proposta padrao", done: true },
      { id: "p4-2", text: "Enviar follow-up para leads", done: false },
      { id: "p4-3", text: "Organizar funil do CRM", done: false },
    ],
  },
  {
    id: "p5",
    title: "Financeiro",
    items: [
      { id: "p5-1", text: "Fechar projecao trimestral", done: true },
      { id: "p5-2", text: "Listar custos fixos", done: true },
      { id: "p5-3", text: "Rever margem por produto", done: false },
    ],
  },
  {
    id: "p6",
    title: "Operacao",
    items: [
      { id: "p6-1", text: "Padronizar checklist interno", done: false },
      { id: "p6-2", text: "Ajustar SLA de entrega", done: false },
      { id: "p6-3", text: "Treinar novo responsavel", done: false },
    ],
  },
  {
    id: "p7",
    title: "Parcerias",
    items: [
      { id: "p7-1", text: "Montar lista de parceiros", done: true },
      { id: "p7-2", text: "Criar proposta de afiliacao", done: false },
      { id: "p7-3", text: "Agendar 3 reunioes", done: false },
    ],
  },
  {
    id: "p8",
    title: "Suporte",
    items: [
      { id: "p8-1", text: "Documentar perguntas frequentes", done: false },
      { id: "p8-2", text: "Criar respostas rapidas", done: false },
      { id: "p8-3", text: "Medir tempo medio de atendimento", done: false },
    ],
  },
];

export const fakeProjects: ProjectCard[] = [
  {
    id: "f1",
    title: "Projeto Atlas",
    items: [
      { id: "f1-1", text: "Consolidar requisitos da sprint", done: true },
      { id: "f1-2", text: "Fechar wireframe da home", done: false },
      { id: "f1-3", text: "Validar escopo com time interno", done: false },
      { id: "f1-4", text: "Ajustar copy da proposta comercial", done: true },
      { id: "f1-5", text: "Preparar apresentacao para decisores", done: false },
      { id: "f1-6", text: "Revisar fluxo principal do onboarding", done: false },
    ],
  },
  {
    id: "f2",
    title: "Operacao Boreal",
    items: [
      { id: "f2-1", text: "Organizar backlog de automacoes", done: true },
      { id: "f2-2", text: "Revisar prioridades do mes", done: false },
      { id: "f2-3", text: "Documentar fluxo principal", done: false },
      { id: "f2-4", text: "Definir SLA das rotinas operacionais", done: false },
      { id: "f2-5", text: "Consolidar indicadores da semana", done: true },
      { id: "f2-6", text: "Padronizar checklist de execucao", done: false },
    ],
  },
  {
    id: "f3",
    title: "Studio Nimbus",
    items: [
      { id: "f3-1", text: "Aprovar conceito visual", done: true },
      { id: "f3-2", text: "Ajustar textos da landing", done: false },
      { id: "f3-3", text: "Separar referencia de campanha", done: false },
      { id: "f3-4", text: "Montar versao inicial do media kit", done: false },
      { id: "f3-5", text: "Validar grid visual do feed", done: true },
      { id: "f3-6", text: "Planejar pauta das proximas pecas", done: false },
    ],
  },
  {
    id: "f4",
    title: "Core Delta",
    items: [
      { id: "f4-1", text: "Definir plano de deploy", done: false },
      { id: "f4-2", text: "Criar checklist de homologacao", done: false },
      { id: "f4-3", text: "Mapear riscos tecnicos", done: false },
      { id: "f4-4", text: "Revisar estrutura dos ambientes", done: true },
      { id: "f4-5", text: "Catalogar dependencias criticas", done: false },
      { id: "f4-6", text: "Fechar plano de rollback", done: false },
    ],
  },
  {
    id: "f5",
    title: "Lab Aurora",
    items: [
      { id: "f5-1", text: "Refinar experiencia inicial", done: true },
      { id: "f5-2", text: "Padronizar componentes base", done: true },
      { id: "f5-3", text: "Planejar iteracao seguinte", done: false },
      { id: "f5-4", text: "Ajustar navegacao entre modulos", done: false },
      { id: "f5-5", text: "Testar legibilidade em telas pequenas", done: false },
      { id: "f5-6", text: "Revisar contraste e estados interativos", done: true },
    ],
  },
  {
    id: "f6",
    title: "Hub Prisma",
    items: [
      { id: "f6-1", text: "Conferir integracoes externas", done: false },
      { id: "f6-2", text: "Atualizar relatorio executivo", done: false },
      { id: "f6-3", text: "Preparar reuniao semanal", done: false },
      { id: "f6-4", text: "Mapear pendencias entre squads", done: true },
      { id: "f6-5", text: "Consolidar status das entregas", done: false },
      { id: "f6-6", text: "Definir pauta do comite interno", done: false },
    ],
  },
  {
    id: "f7",
    title: "Sprint Vertex",
    items: [
      { id: "f7-1", text: "Revisar dependencias abertas", done: true },
      { id: "f7-2", text: "Quebrar entregas por modulo", done: false },
      { id: "f7-3", text: "Fechar estimativas finais", done: false },
      { id: "f7-4", text: "Atualizar roadmap da sprint", done: false },
      { id: "f7-5", text: "Confirmar capacidade do time", done: true },
      { id: "f7-6", text: "Ajustar criterio de pronto", done: false },
    ],
  },
  {
    id: "f8",
    title: "Console Orbit",
    items: [
      { id: "f8-1", text: "Organizar base de conhecimento", done: false },
      { id: "f8-2", text: "Revisar respostas padrao", done: false },
      { id: "f8-3", text: "Mapear melhorias operacionais", done: false },
      { id: "f8-4", text: "Atualizar macros de atendimento", done: true },
      { id: "f8-5", text: "Separar top 10 duvidas recorrentes", done: false },
      { id: "f8-6", text: "Padronizar fluxo de escalonamento", done: false },
    ],
  },
];

export function createInitialDashboardState(): DashboardState {
  return createInitialDashboardStateWithTimestamp(new Date().toISOString());
}

export function createInitialDashboardStateWithTimestamp(
  updatedAt: string,
  revision = 0,
): DashboardState {
  return {
    version: 1,
    revision,
    updatedAt,
    theme: "dark",
    projectTitleSize: "large",
    privacyMode: false,
    hideCompletedItems: false,
    projects: sanitizeProjects(initialProjects),
  };
}

export function isInitialDashboardProjects(projects: ProjectCard[]): boolean {
  const normalizedProjects = sanitizeProjects(projects);

  if (normalizedProjects.length !== initialProjects.length) {
    return false;
  }

  return normalizedProjects.every((project, index) => {
    const initialProject = initialProjects[index];

    return (
      project.title === initialProject.title &&
      project.items.length === initialProject.items.length &&
      project.items.every((item, itemIndex) => {
        const initialItem = initialProject.items[itemIndex];
        return item.text === initialItem.text && item.done === initialItem.done;
      })
    );
  });
}

export function parseDashboardState(value: string | null): DashboardState {
  const parsed = tryParseDashboardState(value);

  return parsed ?? createInitialDashboardState();
}

export function buildDashboardState(
  theme: ThemeMode,
  projectTitleSize: ProjectTitleSize,
  privacyMode: boolean,
  hideCompletedItems: boolean,
  projects: ProjectCard[],
  options?: {
    revision?: number;
    updatedAt?: string;
  },
): DashboardState {
  return {
    version: 1,
    revision: options?.revision ?? 0,
    updatedAt: options?.updatedAt ?? new Date().toISOString(),
    theme,
    projectTitleSize,
    privacyMode,
    hideCompletedItems,
    projects: sanitizeProjects(projects),
  };
}

const localProjectSuggestions: Array<{
  match: string[];
  items: string[];
}> = [
  {
    match: ["kids-projects", "kids projects", "dashboard"],
    items: [
      "Criar sincronizacao com backend para salvar o json na nuvem",
      "Adicionar ordenacao manual dos cards e itens",
      "Permitir importar json salvo para restaurar o painel",
    ],
  },
  {
    match: ["kids-architect", "hunt architect", "architect"],
    items: [
      "Melhorar a heuristica de leitura da planta 2D para paredes",
      "Salvar e recarregar plantas importadas no editor",
      "Validar performance do viewer 3D e dos gestos em sessao longa",
    ],
  },
  {
    match: ["kids-envboard", "envboard"],
    items: [
      "Criar backup e restore da store ~/.envboard/vars.json",
      "Adicionar diff antes de aplicar alteracoes no zshrc e launchd",
      "Cobrir com testes os fluxos de salvar, excluir e sincronizar envs",
    ],
  },
  {
    match: ["cnpj-hosting", "cnpj hosting"],
    items: [
      "Revisar pipeline de deploy firebase e credenciais do projeto",
      "Atualizar textos e projetos exibidos na home portfolio",
      "Validar build production e corrigir assets pesados antigos",
    ],
  },
  {
    match: ["pscc-hosting", "pscc hosting", "pscc"],
    items: [
      "Revisar o white-label e consolidar configuracoes por cliente",
      "Organizar a pasta jobs e definir o que deve virar asset publico",
      "Validar deploy firebase e consistencia de i18n nas paginas",
    ],
  },
  {
    match: ["legacy", "acervo legacy"],
    items: [
      "Catalogar os arquivos zip por cliente, stack e dominio",
      "Criar um indice resumido com prioridade de migracao",
      "Separar projetos reaproveitaveis dos arquivos apenas historicos",
    ],
  },
];

function normalizeTitle(value: string): string {
  return value.trim().toLowerCase();
}

function slugify(value: string): string {
  return normalizeTitle(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function buildSuggestionKey(value: string): string {
  return slugify(value) || "item";
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export function parseDashboardStatePayload(value: unknown): DashboardState | null {
  if (!isRecord(value)) {
    return null;
  }

  if (
    value.version !== 1 ||
    typeof value.updatedAt !== "string" ||
    !Array.isArray(value.projects) ||
    (value.theme !== "light" && value.theme !== "dark" && value.theme !== "blue")
  ) {
    return null;
  }

  return {
    version: 1,
    revision:
      typeof value.revision === "number" &&
      Number.isFinite(value.revision) &&
      value.revision >= 0
        ? Math.trunc(value.revision)
        : 0,
    updatedAt: value.updatedAt,
    theme: value.theme,
    projectTitleSize: value.projectTitleSize === "normal" ? "normal" : "large",
    privacyMode: value.privacyMode === true,
    hideCompletedItems: value.hideCompletedItems === true,
    projects: sanitizeProjects(value.projects),
  };
}

export function tryParseDashboardState(value: string | null): DashboardState | null {
  if (!value) return null;

  try {
    return parseDashboardStatePayload(JSON.parse(value));
  } catch {
    return null;
  }
}

function sanitizeTodoItem(item: unknown, projectId: string, index: number): TodoItem {
  if (!isRecord(item)) {
    return {
      id: `${projectId}-item-${index + 1}`,
      text: `Item ${index + 1}`,
      done: false,
    };
  }

  const text =
    typeof item.text === "string" && item.text.trim()
      ? item.text.trim()
      : `Item ${index + 1}`;

  return {
    id:
      typeof item.id === "string" && item.id.trim()
        ? item.id.trim()
        : `${projectId}-item-${index + 1}`,
    text,
    done: item.done === true,
  };
}

function sanitizeProjectCard(project: unknown, index: number): ProjectCard | null {
  if (!isRecord(project)) {
    return null;
  }

  const fallbackId = `p${index + 1}`;
  const id =
    typeof project.id === "string" && project.id.trim()
      ? project.id.trim()
      : fallbackId;
  const title =
    typeof project.title === "string" && project.title.trim()
      ? project.title.trim()
      : `Projeto ${index + 1}`;
  const itemsSource = Array.isArray(project.items) ? project.items : [];
  const dismissedSuggestionKeys = Array.isArray(project.dismissedSuggestionKeys)
    ? project.dismissedSuggestionKeys.map((value) => String(value))
    : [];

  return sanitizeProjectItems({
    id,
    title,
    items: itemsSource.map((item, itemIndex) => sanitizeTodoItem(item, id, itemIndex)),
    dismissedSuggestionKeys,
  });
}

function sanitizeProjectItems(project: ProjectCard): ProjectCard {
  const usedIds = new Set<string>();
  const dismissedSuggestionKeys = Array.from(
    new Set(
      (project.dismissedSuggestionKeys ?? [])
        .map((value) => buildSuggestionKey(String(value)))
        .filter(Boolean),
    ),
  );
  const items = project.items.map((item, index) => {
    const rawId = item.id?.trim() || `${project.id}-item-${index + 1}`;
    const textSuffix = buildSuggestionKey(item.text) || `item-${index + 1}`;
    let nextId = rawId;
    let duplicateIndex = 1;

    while (usedIds.has(nextId)) {
      duplicateIndex += 1;
      nextId = `${rawId}-${textSuffix}-${duplicateIndex}`;
    }

    usedIds.add(nextId);

    return {
      ...item,
      id: nextId,
      text: item.text.trim() || `Item ${index + 1}`,
      done: item.done === true,
    };
  });

  return {
    ...project,
    title: project.title.trim() || "Projeto",
    items,
    dismissedSuggestionKeys,
  };
}

function sanitizeProjects(projects: unknown[]): ProjectCard[] {
  return projects
    .map(sanitizeProjectCard)
    .filter((project): project is ProjectCard => project !== null);
}

export function mergeLocalProjectSuggestions(projects: ProjectCard[]): ProjectCard[] {
  return sanitizeProjects(projects).map((project) => {
    const normalizedTitle = normalizeTitle(project.title);
    const suggestion = localProjectSuggestions.find(({ match }) =>
      match.some((pattern) => normalizedTitle.includes(pattern)),
    );

    if (!suggestion) {
      return project;
    }

    const existingTexts = new Set(project.items.map((item) => normalizeTitle(item.text)));
    const existingIds = new Set(project.items.map((item) => item.id));
    const dismissedSuggestionKeys = new Set(project.dismissedSuggestionKeys ?? []);
    const newItems = suggestion.items
      .filter((text) => {
        const suggestionKey = buildSuggestionKey(text);

        return (
          !existingTexts.has(normalizeTitle(text)) &&
          !dismissedSuggestionKeys.has(suggestionKey)
        );
      })
      .map((text) => {
        const baseId = `${project.id}-suggested-${buildSuggestionKey(text)}`;
        let nextId = baseId;
        let duplicateIndex = 1;

        while (existingIds.has(nextId)) {
          duplicateIndex += 1;
          nextId = `${baseId}-${duplicateIndex}`;
        }

        existingIds.add(nextId);

        return {
          id: nextId,
          text,
          done: false,
        };
      });

    if (!newItems.length) {
      return project;
    }

    return {
      ...project,
      items: [...project.items, ...newItems],
    };
  });
}
