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
};

export type DashboardState = {
  version: 1;
  updatedAt: string;
  theme: ThemeMode;
  projectTitleSize: ProjectTitleSize;
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

export function createInitialDashboardState(): DashboardState {
  return {
    version: 1,
    updatedAt: new Date().toISOString(),
    theme: "dark",
    projectTitleSize: "normal",
    projects: initialProjects,
  };
}

export function parseDashboardState(value: string | null): DashboardState {
  if (!value) return createInitialDashboardState();

  try {
    const parsed = JSON.parse(value) as Partial<DashboardState>;

    if (
      parsed.version !== 1 ||
      typeof parsed.updatedAt !== "string" ||
      !Array.isArray(parsed.projects) ||
      (parsed.theme !== "light" && parsed.theme !== "dark" && parsed.theme !== "blue")
    ) {
      return createInitialDashboardState();
    }

    return {
      version: 1,
      updatedAt: parsed.updatedAt,
      theme: parsed.theme,
      projectTitleSize:
        parsed.projectTitleSize === "large" ? "large" : "normal",
      projects: parsed.projects,
    };
  } catch {
    return createInitialDashboardState();
  }
}

export function buildDashboardState(
  theme: ThemeMode,
  projectTitleSize: ProjectTitleSize,
  projects: ProjectCard[],
): DashboardState {
  return {
    version: 1,
    updatedAt: new Date().toISOString(),
    theme,
    projectTitleSize,
    projects,
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

export function mergeLocalProjectSuggestions(projects: ProjectCard[]): ProjectCard[] {
  return projects.map((project) => {
    const normalizedTitle = normalizeTitle(project.title);
    const suggestion = localProjectSuggestions.find(({ match }) =>
      match.some((pattern) => normalizedTitle.includes(pattern)),
    );

    if (!suggestion) {
      return project;
    }

    const existingTexts = new Set(project.items.map((item) => normalizeTitle(item.text)));
    const newItems = suggestion.items
      .filter((text) => !existingTexts.has(normalizeTitle(text)))
      .map((text, index) => ({
        id: `${project.id}-suggested-${index + 1}`,
        text,
        done: false,
      }));

    if (!newItems.length) {
      return project;
    }

    return {
      ...project,
      items: [...project.items, ...newItems],
    };
  });
}
