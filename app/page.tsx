"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, Circle, Download, MoonStar, SunMedium, Waves } from "lucide-react";
import {
  buildDashboardState,
  createInitialDashboardState,
  dashboardStorageKey,
  parseDashboardState,
  ProjectCard,
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

export default function Home() {
  const [theme, setTheme] = useState<ThemeMode>(() => {
    if (typeof window === "undefined") return "dark";
    return parseDashboardState(window.localStorage.getItem(dashboardStorageKey)).theme;
  });
  const [projects, setProjects] = useState<ProjectCard[]>(() => {
    if (typeof window === "undefined") return createInitialDashboardState().projects;
    return parseDashboardState(window.localStorage.getItem(dashboardStorageKey)).projects;
  });
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState("");
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
  const [editingProjectTitle, setEditingProjectTitle] = useState("");
  const [creatingProjectId, setCreatingProjectId] = useState<string | null>(null);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    window.localStorage.setItem(
      dashboardStorageKey,
      JSON.stringify(buildDashboardState(theme, projects)),
    );
  }, [theme, projects]);

  const totalItems = projects.reduce((acc, project) => acc + project.items.length, 0);
  const completedItems = projects.reduce(
    (acc, project) => acc + project.items.filter((item) => item.done).length,
    0,
  );

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
    const json = JSON.stringify(buildDashboardState(theme, projects), null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");

    anchor.href = url;
    anchor.download = "kids-projects-dashboard.json";
    anchor.click();

    URL.revokeObjectURL(url);
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

          <div className="flex items-center gap-1.5">
            <Metric label="Projetos" value={projects.length.toString().padStart(2, "0")} />
            <Metric label="Itens" value={totalItems.toString().padStart(2, "0")} />
            <Metric label="Done" value={completedItems.toString().padStart(2, "0")} />

            <button
              type="button"
              onClick={exportDashboardJson}
              className="theme-button"
              aria-label="Exportar JSON do dashboard"
            >
              <Download className="h-4 w-4" />
            </button>

            <div className="theme-switcher">
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
          </div>
        </header>

        <div className="grid h-[calc(100%-2.75rem-0.625rem)] grid-cols-4 grid-rows-2 gap-2">
          {projects.map((project, index) => {
            const doneCount = project.items.filter((item) => item.done).length;
            const progress = project.items.length ? (doneCount / project.items.length) * 100 : 0;

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
                      {String(index + 1).padStart(2, "0")}
                    </span>
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
                        className="title-edit-input"
                      />
                    ) : (
                      <button
                        type="button"
                        onClick={() => startEditingProject(project.id, project.title)}
                        className="title-edit-button"
                      >
                        {project.title}
                      </button>
                    )}
                  </div>
                  <div className="rounded-[5px] border border-[var(--border-strong)] px-2 py-0.5 font-mono text-[10px] text-[var(--text-secondary)]">
                    {doneCount}/{project.items.length}
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
                      if (event.target === event.currentTarget) {
                        startCreatingItem(project.id);
                      }
                    }}
                  >
                    <AnimatePresence initial={false}>
                      <ul
                        className="space-y-0.5"
                        onClick={(event) => {
                          if (event.target === event.currentTarget) {
                            startCreatingItem(project.id);
                          }
                        }}
                      >
                        {project.items.map((item) => (
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
                                className="task-edit-input"
                              />
                            ) : (
                              <button
                                type="button"
                                onClick={() => startEditing(item.id, item.text)}
                                className={item.done ? "task-item is-done" : "task-item"}
                              >
                                <span>{item.text}</span>
                              </button>
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
                              className="task-edit-input"
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
