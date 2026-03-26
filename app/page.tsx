"use client";

import { startTransition, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Circle,
  Download,
  Eye,
  EyeOff,
  Filter,
  Github,
  MoonStar,
  Plus,
  SunMedium,
  Trash2,
  Type,
  Waves,
} from "lucide-react";
import {
  buildSuggestionKey,
  buildDashboardState,
  createInitialDashboardState,
  dashboardStorageKey,
  fakeProjects,
  isInitialDashboardProjects,
  mergeLocalProjectSuggestions,
  parseDashboardState,
  ProjectCard,
  ProjectTitleSize,
  ThemeMode,
} from "./dashboard-state";

const themes: {
  value: ThemeMode;
  label: string;
  icon: typeof SunMedium;
}[] = [
  { value: "light", label: "Light", icon: SunMedium },
  { value: "dark", label: "Dark", icon: MoonStar },
  { value: "blue", label: "Blue", icon: Waves },
];

type PanelMode = "tasks" | "github";

type GithubProject = {
  id: number;
  name: string;
  owner: string;
  description: string | null;
  htmlUrl: string;
  isPrivate: boolean;
  language: string | null;
  updatedAt: string;
};

export default function Home() {
  const initialState = createInitialDashboardState();
  const [theme, setTheme] = useState<ThemeMode>(initialState.theme);
  const [projectTitleSize, setProjectTitleSize] = useState<ProjectTitleSize>(
    initialState.projectTitleSize,
  );
  const [privacyMode, setPrivacyMode] = useState<boolean>(initialState.privacyMode);
  const [hideCompletedItems, setHideCompletedItems] = useState<boolean>(
    initialState.hideCompletedItems,
  );
  const [projects, setProjects] = useState<ProjectCard[]>(initialState.projects);
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState("");
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
  const [editingProjectTitle, setEditingProjectTitle] = useState("");
  const [creatingProjectId, setCreatingProjectId] = useState<string | null>(null);
  const [hasHydrated, setHasHydrated] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [isCompactViewport, setIsCompactViewport] = useState(false);
  const [panelMode, setPanelMode] = useState<PanelMode>("tasks");
  const [githubProjects, setGithubProjects] = useState<GithubProject[]>([]);
  const [isGithubLoading, setIsGithubLoading] = useState(false);
  const [githubError, setGithubError] = useState<string | null>(null);
  const [githubFilter, setGithubFilter] = useState("");
  const [editingGithubProjectId, setEditingGithubProjectId] = useState<number | null>(null);
  const [editingGithubDescription, setEditingGithubDescription] = useState("");
  const [savingGithubProjectId, setSavingGithubProjectId] = useState<number | null>(null);
  const lastKnownUpdatedAtRef = useRef(initialState.updatedAt);
  const lastKnownRevisionRef = useRef(initialState.revision);
  const latestDraftStateRef = useRef(initialState);
  const skipNextServerPersistRef = useRef(false);
  const isPersistingStateRef = useRef(false);
  const hasQueuedPersistRef = useRef(false);

  function applyDashboardState(
    nextState: ReturnType<typeof createInitialDashboardState>,
    options?: {
      serverManaged?: boolean;
      markHydrated?: boolean;
    },
  ) {
    const enrichedProjects = mergeLocalProjectSuggestions(nextState.projects);
    const resolvedState = {
      ...nextState,
      projects: enrichedProjects,
    };

    if (options?.serverManaged) {
      skipNextServerPersistRef.current = true;
    }

    latestDraftStateRef.current = resolvedState;
    lastKnownUpdatedAtRef.current = resolvedState.updatedAt;
    lastKnownRevisionRef.current = resolvedState.revision;

    startTransition(() => {
      setTheme(resolvedState.theme);
      setProjectTitleSize(resolvedState.projectTitleSize);
      setPrivacyMode(resolvedState.privacyMode);
      setHideCompletedItems(resolvedState.hideCompletedItems);
      setProjects(resolvedState.projects);

      if (options?.markHydrated) {
        setHasHydrated(true);
      }
    });
  }

  async function persistLatestDashboardState() {
    if (isPersistingStateRef.current) {
      hasQueuedPersistRef.current = true;
      return;
    }

    isPersistingStateRef.current = true;

    try {
      do {
        hasQueuedPersistRef.current = false;
        let attempts = 0;

        while (attempts < 3) {
          const requestState = {
            ...latestDraftStateRef.current,
            revision: lastKnownRevisionRef.current,
          };

          try {
            const response = await fetch("/api/dashboard-state/update", {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(requestState),
            });
            const payload = (await response.json()) as {
              ok: boolean;
              error?: string;
              state?: ReturnType<typeof createInitialDashboardState>;
            };

            if (response.ok && payload.ok && payload.state) {
              const savedState = parseDashboardState(JSON.stringify(payload.state));
              latestDraftStateRef.current = savedState;
              lastKnownUpdatedAtRef.current = savedState.updatedAt;
              lastKnownRevisionRef.current = savedState.revision;
              window.localStorage.setItem(
                dashboardStorageKey,
                JSON.stringify(savedState),
              );
              break;
            }

            if (response.status === 409 && payload.state) {
              const currentServerState = parseDashboardState(
                JSON.stringify(payload.state),
              );
              lastKnownUpdatedAtRef.current = currentServerState.updatedAt;
              lastKnownRevisionRef.current = currentServerState.revision;
              attempts += 1;
              continue;
            }

            break;
          } catch {
            break;
          }
        }
      } while (hasQueuedPersistRef.current);
    } finally {
      isPersistingStateRef.current = false;
    }
  }

  useEffect(() => {
    let cancelled = false;

    async function hydrateDashboard() {
      const browserState = parseDashboardState(window.localStorage.getItem(dashboardStorageKey));

      try {
        const response = await fetch("/api/dashboard-state/read", { cache: "no-store" });
        const fileState = response.ok
          ? parseDashboardState(JSON.stringify((await response.json()).state))
          : createInitialDashboardState();
        const browserIsInitial = isInitialDashboardProjects(browserState.projects);
        const fileIsInitial = isInitialDashboardProjects(fileState.projects);
        const browserUpdatedAt = new Date(browserState.updatedAt).getTime();
        const fileUpdatedAt = new Date(fileState.updatedAt).getTime();
        const shouldPreferBrowserState =
          (!browserIsInitial &&
            fileIsInitial) ||
          browserState.revision > fileState.revision ||
          (browserState.revision === fileState.revision &&
            browserUpdatedAt > fileUpdatedAt);
        const chosenState = shouldPreferBrowserState ? browserState : fileState;

        if (cancelled) return;

        applyDashboardState(chosenState, {
          serverManaged: !shouldPreferBrowserState,
          markHydrated: true,
        });
      } catch {
        if (cancelled) return;

        applyDashboardState(browserState, {
          markHydrated: true,
        });
      }
    }

    hydrateDashboard();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  useEffect(() => {
    function syncViewportMode() {
      setIsCompactViewport(
        window.innerWidth <= 1200 || window.innerHeight > window.innerWidth,
      );
    }

    syncViewportMode();
    window.addEventListener("resize", syncViewportMode);

    return () => {
      window.removeEventListener("resize", syncViewportMode);
    };
  }, []);

  useEffect(() => {
    setCurrentPage(0);
  }, [panelMode]);

  useEffect(() => {
    if (!hasHydrated) return;

    const nextState = skipNextServerPersistRef.current
      ? latestDraftStateRef.current
      : buildDashboardState(
          theme,
          projectTitleSize,
          privacyMode,
          hideCompletedItems,
          projects,
          {
            revision: lastKnownRevisionRef.current,
          },
        );

    latestDraftStateRef.current = nextState;
    lastKnownUpdatedAtRef.current = nextState.updatedAt;
    window.localStorage.setItem(dashboardStorageKey, JSON.stringify(nextState));

    if (skipNextServerPersistRef.current) {
      skipNextServerPersistRef.current = false;
      return;
    }

    const timeoutId = window.setTimeout(() => {
      void persistLatestDashboardState();
    }, 250);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [hasHydrated, theme, projectTitleSize, privacyMode, hideCompletedItems, projects]);

  useEffect(() => {
    if (!hasHydrated) return;

    let cancelled = false;

    async function syncRemoteState() {
      if (
        editingItemId ||
        editingProjectId ||
        creatingProjectId ||
        isPersistingStateRef.current ||
        hasQueuedPersistRef.current
      ) {
        return;
      }

      try {
        const response = await fetch("/api/dashboard-state/read", { cache: "no-store" });
        if (!response.ok) return;

        const payload = (await response.json()) as { state?: ReturnType<typeof createInitialDashboardState> };
        if (!payload.state) return;

        const remoteState = parseDashboardState(JSON.stringify(payload.state));
        if (remoteState.revision <= lastKnownRevisionRef.current) {
          return;
        }

        if (cancelled) return;

        applyDashboardState(remoteState, {
          serverManaged: true,
        });
      } catch {
        return;
      }
    }

    const intervalId = window.setInterval(syncRemoteState, 4000);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, [
    creatingProjectId,
    editingItemId,
    editingProjectId,
    hasHydrated,
  ]);

  useEffect(() => {
    if (panelMode !== "github") return;

    let cancelled = false;

    async function loadGithubProjects() {
      if (editingGithubProjectId !== null) {
        return;
      }

      setIsGithubLoading(true);
      setGithubError(null);

      try {
        const response = await fetch("/api/github-projects", { cache: "no-store" });
        const payload = (await response.json()) as {
          ok: boolean;
          repos?: GithubProject[];
          error?: string;
        };

        if (!response.ok || !payload.ok || !payload.repos) {
          throw new Error(payload.error || "Falha ao carregar os repositorios do GitHub.");
        }

        if (cancelled) return;

        startTransition(() => {
          setGithubProjects(payload.repos ?? []);
        });
      } catch (error) {
        if (cancelled) return;
        setGithubError(
          error instanceof Error ? error.message : "Falha ao carregar os repositorios do GitHub.",
        );
      } finally {
        if (!cancelled) {
          setIsGithubLoading(false);
        }
      }
    }

    void loadGithubProjects();
    const intervalId = window.setInterval(loadGithubProjects, 60000);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, [editingGithubProjectId, panelMode]);

  const visibleProjects = privacyMode ? fakeProjects : projects;
  const isGithubPanel = panelMode === "github";
  const normalizedGithubFilter = githubFilter.trim().toLowerCase();
  const filteredGithubProjects = githubProjects.filter((project) => {
    if (!normalizedGithubFilter) return true;

    return (
      project.name.toLowerCase().includes(normalizedGithubFilter) ||
      (project.description || "").toLowerCase().includes(normalizedGithubFilter)
    );
  });
  const githubColumns = isCompactViewport ? 4 : 8;
  const githubRows = isCompactViewport ? 8 : 4;
  const githubCardsPerPage = githubColumns * githubRows;
  const taskCardsPerPage = 8;
  const cardsPerPage = isGithubPanel ? githubCardsPerPage : taskCardsPerPage;
  const totalCards = isGithubPanel ? filteredGithubProjects.length : visibleProjects.length;
  const totalPages = Math.max(1, Math.ceil(totalCards / cardsPerPage));
  const safeCurrentPage = Math.min(currentPage, totalPages - 1);
  const paginatedProjects = visibleProjects.slice(
    safeCurrentPage * taskCardsPerPage,
    safeCurrentPage * taskCardsPerPage + taskCardsPerPage,
  );
  const paginatedGithubProjects = filteredGithubProjects.slice(
    safeCurrentPage * githubCardsPerPage,
    safeCurrentPage * githubCardsPerPage + githubCardsPerPage,
  );

  const totalItems = visibleProjects.reduce((acc, project) => acc + project.items.length, 0);
  const completedItems = visibleProjects.reduce(
    (acc, project) => acc + project.items.filter((item) => item.done).length,
    0,
  );
  const githubProjectsWithDescription = filteredGithubProjects.filter(
    (project) => project.description,
  ).length;
  const githubPrivateProjects = filteredGithubProjects.filter(
    (project) => project.isPrivate,
  ).length;

  function toggleTodo(projectId: string, itemId: string) {
    setProjects((current) =>
      current.map((project) =>
        project.id !== projectId
          ? project
          : {
              ...project,
              items: project.items.map((item) =>
                item.id === itemId ? { ...item, done: !item.done } : item,
              ),
            },
      ),
    );
  }

  function deleteTodo(projectId: string, itemId: string) {
    setProjects((current) =>
      current.map((project) =>
        project.id !== projectId
          ? project
          : {
              ...project,
              items: project.items.filter((item) => item.id !== itemId),
              dismissedSuggestionKeys: (() => {
                const removedItem = project.items.find((item) => item.id === itemId);

                if (!removedItem || !removedItem.id.startsWith(`${projectId}-suggested-`)) {
                  return project.dismissedSuggestionKeys;
                }

                return Array.from(
                  new Set([
                    ...(project.dismissedSuggestionKeys ?? []),
                    buildSuggestionKey(removedItem.text),
                  ]),
                );
              })(),
            },
      ),
    );

    if (editingItemId === itemId) {
      cancelEditing();
    }
  }

  function deleteProjectCard(projectId: string) {
    setProjects((current) => current.filter((project) => project.id !== projectId));

    if (editingProjectId === projectId) {
      cancelProjectEditing();
    }

    if (creatingProjectId === projectId) {
      cancelCreatingItem(projectId);
    }
  }

  function addTodo(projectId: string) {
    const text = drafts[projectId]?.trim();
    if (!text) return;

    setProjects((current) =>
      current.map((project) =>
        project.id !== projectId
          ? project
          : {
              ...project,
              items: [
                ...project.items,
                { id: `${projectId}-${Date.now()}`, text, done: false },
              ],
            },
      ),
    );

    setDrafts((current) => ({ ...current, [projectId]: "" }));
    setCreatingProjectId(null);
  }

  function createProjectCard() {
    const newProjectId = `p${Date.now()}`;

    setProjects((current) => [
      ...current,
      {
        id: newProjectId,
        title: "Novo Projeto",
        items: [],
      },
    ]);

    setCurrentPage(totalPages);
  }

  function startEditing(itemId: string, text: string) {
    setEditingProjectId(null);
    setEditingProjectTitle("");
    setCreatingProjectId(null);
    setEditingItemId(itemId);
    setEditingText(text);
  }

  function saveEditing(projectId: string, itemId: string) {
    const text = editingText.trim();

    if (!text) {
      setEditingItemId(null);
      setEditingText("");
      return;
    }

    setProjects((current) =>
      current.map((project) =>
        project.id !== projectId
          ? project
          : {
              ...project,
              items: project.items.map((item) =>
                item.id === itemId ? { ...item, text } : item,
              ),
            },
      ),
    );

    setEditingItemId(null);
    setEditingText("");
  }

  function cancelEditing() {
    setEditingItemId(null);
    setEditingText("");
  }

  function startEditingProject(projectId: string, title: string) {
    setEditingItemId(null);
    setEditingText("");
    setCreatingProjectId(null);
    setEditingProjectId(projectId);
    setEditingProjectTitle(title);
  }

  function saveProjectTitle(projectId: string) {
    const title = editingProjectTitle.trim();

    if (!title) {
      setEditingProjectId(null);
      setEditingProjectTitle("");
      return;
    }

    setProjects((current) =>
      current.map((project) =>
        project.id === projectId ? { ...project, title } : project,
      ),
    );

    setEditingProjectId(null);
    setEditingProjectTitle("");
  }

  function cancelProjectEditing() {
    setEditingProjectId(null);
    setEditingProjectTitle("");
  }

  function startCreatingItem(projectId: string) {
    setEditingItemId(null);
    setEditingText("");
    setEditingProjectId(null);
    setEditingProjectTitle("");
    setCreatingProjectId(projectId);
    setDrafts((current) => ({ ...current, [projectId]: current[projectId] ?? "" }));
  }

  function cancelCreatingItem(projectId: string) {
    setCreatingProjectId((current) => (current === projectId ? null : current));
    setDrafts((current) => ({ ...current, [projectId]: "" }));
  }

  function exportDashboardJson() {
    const json = JSON.stringify(
      buildDashboardState(
        theme,
        projectTitleSize,
        privacyMode,
        hideCompletedItems,
        projects,
      ),
      null,
      2,
    );
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");

    anchor.href = url;
    anchor.download = "kids-projects-dashboard.json";
    anchor.click();

    URL.revokeObjectURL(url);
  }

  function startEditingGithubDescription(project: GithubProject) {
    setEditingGithubProjectId(project.id);
    setEditingGithubDescription(project.description ?? "");
  }

  function cancelEditingGithubDescription() {
    setEditingGithubProjectId(null);
    setEditingGithubDescription("");
  }

  async function saveGithubDescription(project: GithubProject) {
    const nextDescription = editingGithubDescription.trim();

    if (nextDescription.length > 200) {
      setGithubError("A descricao deve ter no maximo 200 caracteres.");
      return;
    }

    if ((project.description ?? "") === nextDescription) {
      cancelEditingGithubDescription();
      return;
    }

    setSavingGithubProjectId(project.id);
    setGithubError(null);

    try {
      const response = await fetch("/api/github-projects", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          owner: project.owner,
          name: project.name,
          description: nextDescription,
        }),
      });

      const payload = (await response.json()) as {
        ok: boolean;
        error?: string;
        repo?: GithubProject;
      };

      if (!response.ok || !payload.ok || !payload.repo) {
        throw new Error(payload.error || "Falha ao atualizar a descricao do repositorio.");
      }

      setGithubProjects((current) =>
        current.map((item) => (item.id === project.id ? payload.repo! : item)),
      );
      cancelEditingGithubDescription();
    } catch (error) {
      setGithubError(
        error instanceof Error
          ? error.message
          : "Falha ao atualizar a descricao do repositorio.",
      );
    } finally {
      setSavingGithubProjectId(null);
    }
  }

  return (
    <main className="dashboard-shell h-screen w-screen overflow-hidden p-2.5">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(72,164,255,0.18),transparent_26%),radial-gradient(circle_at_bottom_right,rgba(24,255,188,0.14),transparent_28%)]" />

      <section className="relative flex h-full flex-col gap-2.5">
        <header className="dashboard-panel flex h-11 items-center justify-between gap-2 px-2.5">
          <div className="flex min-w-0 items-center gap-2">
            <span className="rounded-[5px] border border-[var(--border-color)] px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-[0.18em] text-[var(--text-muted)]">
              KP
            </span>
            <h1 className="truncate text-[13px] font-semibold tracking-tight">
              Projetos
            </h1>
          </div>

          <div className="header-controls">
            {isGithubPanel ? (
              <input
                type="text"
                value={githubFilter}
                onChange={(event) => {
                  setGithubFilter(event.target.value);
                  setCurrentPage(0);
                }}
                placeholder="Filtrar repositorio"
                className="github-filter-input"
                aria-label="Filtrar repositorios por titulo ou descricao"
              />
            ) : null}

            <Metric
              label={isGithubPanel ? "Repos" : "Projetos"}
              value={totalCards.toString().padStart(2, "0")}
            />
            <Metric
              label={isGithubPanel ? "Descr" : "Itens"}
              value={
                isGithubPanel
                  ? githubProjectsWithDescription.toString().padStart(2, "0")
                  : totalItems.toString().padStart(2, "0")
              }
            />
            <Metric
              label={isGithubPanel ? "Priv" : "Done"}
              value={
                isGithubPanel
                  ? githubPrivateProjects.toString().padStart(2, "0")
                  : completedItems.toString().padStart(2, "0")
              }
            />

            <button
              type="button"
              onClick={() => setCurrentPage((current) => Math.max(0, current - 1))}
              className="theme-button"
              aria-label="Pagina anterior"
              disabled={safeCurrentPage === 0}
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="page-indicator">
              {String(safeCurrentPage + 1).padStart(2, "0")}/{String(totalPages).padStart(2, "0")}
            </span>
            <button
              type="button"
              onClick={() =>
                setCurrentPage((current) => Math.min(totalPages - 1, current + 1))
              }
              className="theme-button"
              aria-label="Proxima pagina"
              disabled={safeCurrentPage >= totalPages - 1}
            >
              <ChevronRight className="h-4 w-4" />
            </button>

            <button
              type="button"
              onClick={() =>
                setPanelMode((current) => (current === "tasks" ? "github" : "tasks"))
              }
              className={isGithubPanel ? "theme-button active" : "theme-button"}
              aria-label="Alternar painel de projetos do GitHub"
            >
              <Github className="h-4 w-4" />
            </button>

            <button
              type="button"
              onClick={createProjectCard}
              className="theme-button"
              aria-label="Criar novo card"
              disabled={privacyMode || isGithubPanel}
            >
              <Plus className="h-4 w-4" />
            </button>

            <button
              type="button"
              onClick={exportDashboardJson}
              className="theme-button"
              aria-label="Exportar JSON do dashboard"
              disabled={isGithubPanel}
            >
              <Download className="h-4 w-4" />
            </button>

            <button
              type="button"
              onClick={() => setPrivacyMode((current) => !current)}
              className={privacyMode ? "theme-button active" : "theme-button"}
              aria-label="Alternar modo com dados fake"
              disabled={isGithubPanel}
            >
              {privacyMode ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>

            <button
              type="button"
              onClick={() => setHideCompletedItems((current) => !current)}
              className={hideCompletedItems ? "theme-button active" : "theme-button"}
              aria-label="Ocultar itens concluidos"
              disabled={isGithubPanel}
            >
              <Filter className="h-4 w-4" />
            </button>

            <button
              type="button"
              onClick={() =>
                setProjectTitleSize((current) =>
                  current === "normal" ? "large" : "normal",
                )
              }
              className={projectTitleSize === "large" ? "theme-button active" : "theme-button"}
              aria-label="Alternar tamanho da fonte dos projetos"
            >
              <Type className="h-4 w-4" />
            </button>

            {themes.map(({ value, label, icon: Icon }) => (
              <button
                key={value}
                type="button"
                onClick={() => setTheme(value)}
                className={theme === value ? "theme-button active" : "theme-button"}
                aria-pressed={theme === value}
              >
                <Icon className="h-4 w-4" />
                <span className="sr-only">{label}</span>
              </button>
            ))}
          </div>
        </header>

        <div
          className="projects-grid h-[calc(100%-2.75rem-0.625rem)]"
          style={{
            gridTemplateColumns: isCompactViewport
              ? isGithubPanel
                ? "repeat(4, minmax(0, 1fr))"
                : "repeat(2, minmax(0, 1fr))"
              : isGithubPanel
                ? "repeat(8, minmax(0, 1fr))"
                : "repeat(4, minmax(0, 1fr))",
            gridTemplateRows: isCompactViewport
              ? isGithubPanel
                ? "repeat(8, minmax(0, 1fr))"
                : "repeat(4, minmax(0, 1fr))"
              : isGithubPanel
                ? "repeat(4, minmax(0, 1fr))"
                : "repeat(2, minmax(0, 1fr))",
          }}
        >
          {isGithubPanel
            ? paginatedGithubProjects.map((project, index) => {
                const projectNumber = safeCurrentPage * githubCardsPerPage + index + 1;

                return (
                  <motion.article
                    key={project.id}
                    initial={{ opacity: 0, y: 24 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.35, delay: index * 0.04 }}
                    className="dashboard-panel flex min-h-0 flex-col overflow-hidden"
                  >
                    <div className="github-card-button">
                      <div className="flex items-center justify-between gap-2 border-b border-[var(--border-color)] px-2.5 py-1.5">
                        <div className="flex min-w-0 items-center gap-1.5">
                          <span className="rounded-[5px] border border-[var(--border-color)] px-1 py-0.5 font-mono text-[8px] uppercase tracking-[0.08em] text-[var(--text-muted)]">
                            {String(projectNumber).padStart(2, "0")}
                          </span>
                          <div className="title-slot">
                            <button
                              type="button"
                              className="title-edit-button github-title-button"
                              onClick={() =>
                                window.open(project.htmlUrl, "_blank", "noopener,noreferrer")
                              }
                            >
                              {project.name}
                            </button>
                          </div>
                        </div>
                        <div className="card-meta">
                          <span className="card-counter">
                            {savingGithubProjectId === project.id
                              ? "Save"
                              : project.isPrivate
                                ? "Priv"
                                : "Pub"}
                          </span>
                        </div>
                      </div>

                      <div className="flex min-h-0 flex-1 flex-col px-2.5 py-2">
                        {editingGithubProjectId === project.id ? (
                          <div
                            className="github-description-editor"
                            onClick={(event) => event.stopPropagation()}
                            onKeyDown={(event) => event.stopPropagation()}
                          >
                            <textarea
                              value={editingGithubDescription}
                              maxLength={200}
                              autoFocus
                              onChange={(event) =>
                                setEditingGithubDescription(event.target.value.slice(0, 200))
                              }
                              onBlur={() => void saveGithubDescription(project)}
                              onKeyDown={(event) => {
                                if (event.key === "Enter" && !event.shiftKey) {
                                  event.preventDefault();
                                  event.stopPropagation();
                                  void saveGithubDescription(project);
                                }

                                if (event.key === "Escape") {
                                  event.preventDefault();
                                  event.stopPropagation();
                                  cancelEditingGithubDescription();
                                }
                              }}
                              className="github-description-input"
                            />
                            <div className="github-description-count">
                              {editingGithubDescription.length}/200
                            </div>
                          </div>
                        ) : (
                          <button
                            type="button"
                            className="github-description-button"
                            onClick={(event) => {
                              event.preventDefault();
                              event.stopPropagation();
                              startEditingGithubDescription(project);
                            }}
                          >
                            <span className="github-card-description">
                              {project.description || "Repositorio sem descricao informada."}
                            </span>
                          </button>
                        )}
                        <div className="github-card-meta-line">
                          <span>{project.language || "Sem stack informada"}</span>
                          <span>
                            {new Date(project.updatedAt).toLocaleDateString("pt-BR")}
                          </span>
                        </div>
                      </div>
                    </div>
                  </motion.article>
                );
              })
            : paginatedProjects.map((project, index) => {
            const doneCount = project.items.filter((item) => item.done).length;
            const progress = project.items.length ? (doneCount / project.items.length) * 100 : 0;
            const visibleItems = hideCompletedItems
              ? project.items.filter((item) => !item.done)
              : project.items;
            const projectNumber = safeCurrentPage * taskCardsPerPage + index + 1;

            return (
              <motion.article
                key={project.id}
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.35, delay: index * 0.04 }}
                className="dashboard-panel flex min-h-0 flex-col overflow-hidden"
              >
                <div className="flex items-center justify-between gap-2 border-b border-[var(--border-color)] px-2.5 py-1.5">
                  <div className="flex min-w-0 items-center gap-1.5">
                    <span className="rounded-[5px] border border-[var(--border-color)] px-1 py-0.5 font-mono text-[8px] uppercase tracking-[0.08em] text-[var(--text-muted)]">
                      {String(projectNumber).padStart(2, "0")}
                    </span>
                    <div className="title-slot">
                      {editingProjectId === project.id ? (
                        <input
                          value={editingProjectTitle}
                          autoFocus
                          onChange={(event) => setEditingProjectTitle(event.target.value)}
                          onBlur={() => saveProjectTitle(project.id)}
                          onKeyDown={(event) => {
                            if (event.key === "Enter") {
                              event.preventDefault();
                              saveProjectTitle(project.id);
                            }

                            if (event.key === "Escape") {
                              event.preventDefault();
                              cancelProjectEditing();
                            }
                          }}
                          className={
                            projectTitleSize === "large"
                              ? "title-edit-input title-edit-input-large"
                              : "title-edit-input"
                          }
                        />
                      ) : (
                        <button
                          type="button"
                          disabled={privacyMode}
                          onClick={() => startEditingProject(project.id, project.title)}
                          className={
                            projectTitleSize === "large"
                              ? "title-edit-button title-edit-button-large"
                              : "title-edit-button"
                          }
                        >
                          {project.title}
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="card-meta">
                    <span className="card-counter">
                      {doneCount}/{project.items.length}
                    </span>
                    <button
                      type="button"
                      onClick={() => deleteProjectCard(project.id)}
                      className="card-delete"
                      aria-label="Excluir card"
                      disabled={privacyMode}
                    >
                      Excluir
                    </button>
                  </div>
                </div>

                <div className="px-2.5 pt-1.5">
                  <div className="h-1 overflow-hidden rounded-full bg-[var(--track-bg)]">
                    <motion.div
                      className="h-full rounded-full bg-[var(--accent)]"
                      initial={{ width: 0 }}
                      animate={{ width: `${progress}%` }}
                      transition={{ duration: 0.4, delay: 0.1 + index * 0.04 }}
                    />
                  </div>
                </div>

                <div className="flex min-h-0 flex-1 flex-col px-2.5 py-1.5">
                  <div
                    className="min-h-0 flex-1 overflow-auto pr-1"
                    onClick={(event) => {
                      if (privacyMode) return;
                      if (event.target === event.currentTarget) {
                        startCreatingItem(project.id);
                      }
                    }}
                  >
                    <AnimatePresence initial={false}>
                      <ul
                        className="space-y-0.5"
                        onClick={(event) => {
                          if (privacyMode) return;
                          if (event.target === event.currentTarget) {
                            startCreatingItem(project.id);
                          }
                        }}
                      >
                        {visibleItems.map((item) => (
                          <motion.li
                            key={item.id}
                            layout
                            initial={{ opacity: 0, x: -12 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 12 }}
                            className="task-row"
                          >
                            <button
                              type="button"
                              disabled={privacyMode}
                              onClick={() => toggleTodo(project.id, item.id)}
                              className="task-check"
                              aria-label={item.done ? "Marcar como nao concluido" : "Marcar como concluido"}
                            >
                              {item.done ? (
                                <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-[var(--accent)]" />
                              ) : (
                                <Circle className="h-3.5 w-3.5 shrink-0 text-[var(--text-muted)]" />
                              )}
                            </button>

                            {editingItemId === item.id ? (
                              <div className="task-content-slot">
                                <input
                                  value={editingText}
                                  autoFocus
                                  onChange={(event) => setEditingText(event.target.value)}
                                  onBlur={() => saveEditing(project.id, item.id)}
                                  onKeyDown={(event) => {
                                    if (event.key === "Enter") {
                                      event.preventDefault();
                                      saveEditing(project.id, item.id);
                                    }

                                    if (event.key === "Escape") {
                                      event.preventDefault();
                                      cancelEditing();
                                    }
                                  }}
                                  className={
                                    projectTitleSize === "large"
                                      ? "task-edit-input task-edit-input-large"
                                      : "task-edit-input"
                                  }
                                />
                              </div>
                            ) : (
                              privacyMode ? (
                                <div className="task-content-slot">
                                  <div
                                    className={
                                      item.done
                                        ? projectTitleSize === "large"
                                          ? "task-item task-item-large is-done"
                                          : "task-item is-done"
                                        : projectTitleSize === "large"
                                          ? "task-item task-item-large"
                                          : "task-item"
                                    }
                                  >
                                    <span>{item.text}</span>
                                  </div>
                                </div>
                              ) : (
                                <>
                                  <div className="task-content-slot">
                                    <button
                                      type="button"
                                      onClick={() => startEditing(item.id, item.text)}
                                      className={
                                        item.done
                                          ? projectTitleSize === "large"
                                            ? "task-item task-item-large is-done"
                                            : "task-item is-done"
                                          : projectTitleSize === "large"
                                            ? "task-item task-item-large"
                                            : "task-item"
                                      }
                                    >
                                      <span>{item.text}</span>
                                    </button>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => deleteTodo(project.id, item.id)}
                                    className="task-delete"
                                    aria-label="Excluir item"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </button>
                                </>
                              )
                            )}
                          </motion.li>
                        ))}

                        {creatingProjectId === project.id ? (
                          <motion.li
                            layout
                            initial={{ opacity: 0, x: -12 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 12 }}
                            className="task-row"
                          >
                            <span className="task-check-placeholder" aria-hidden="true">
                              <Circle className="h-3.5 w-3.5 shrink-0 text-[var(--text-muted)]" />
                            </span>
                            <input
                              value={drafts[project.id] ?? ""}
                              autoFocus
                              onChange={(event) =>
                                setDrafts((current) => ({
                                  ...current,
                                  [project.id]: event.target.value,
                                }))
                              }
                              onBlur={() => {
                                if (!(drafts[project.id] ?? "").trim()) {
                                  cancelCreatingItem(project.id);
                                }
                              }}
                              onKeyDown={(event) => {
                                if (event.key === "Enter") {
                                  event.preventDefault();
                                  addTodo(project.id);
                                }

                                if (event.key === "Escape") {
                                  event.preventDefault();
                                  cancelCreatingItem(project.id);
                                }
                              }}
                              placeholder="Novo item"
                              className={
                                projectTitleSize === "large"
                                  ? "task-edit-input task-edit-input-large"
                                  : "task-edit-input"
                              }
                            />
                          </motion.li>
                        ) : null}
                      </ul>
                    </AnimatePresence>
                  </div>
                </div>
              </motion.article>
            );
              })}

          {isGithubPanel && !paginatedGithubProjects.length ? (
            <div className="dashboard-panel github-empty-state">
              {isGithubLoading
                ? "Carregando repositorios do GitHub..."
                : githubError || "Nenhum repositorio encontrado no GitHub."}
            </div>
          ) : null}
        </div>
      </section>
    </main>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="metric-chip">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}
