import { promises as fs } from "node:fs";
import path from "node:path";
import {
  buildDashboardState,
  createInitialDashboardStateWithTimestamp,
  parseDashboardState,
} from "@/app/dashboard-state";

const dataDir = path.join(process.cwd(), "data");
const dataFile = path.join(dataDir, "dashboard-state.json");
const backupDir = path.join(dataDir, "backups");
const maxBackupFiles = 20;

async function ensureDashboardStateFile() {
  await fs.mkdir(dataDir, { recursive: true });
  await fs.mkdir(backupDir, { recursive: true });

  try {
    await fs.access(dataFile);
  } catch {
    const initialState = createInitialDashboardStateWithTimestamp(
      "1970-01-01T00:00:00.000Z",
    );
    await fs.writeFile(dataFile, JSON.stringify(initialState, null, 2), "utf8");
  }
}

function buildBackupFileName() {
  const stamp = new Date().toISOString().replaceAll(":", "-");
  return path.join(backupDir, `dashboard-state.${stamp}.json`);
}

async function createDashboardBackup(raw: string) {
  if (!raw.trim()) return;

  await fs.writeFile(buildBackupFileName(), raw, "utf8");

  const entries = await fs.readdir(backupDir);
  const backupFiles = entries
    .filter((entry) => entry.startsWith("dashboard-state.") && entry.endsWith(".json"))
    .sort();

  if (backupFiles.length <= maxBackupFiles) {
    return;
  }

  const filesToDelete = backupFiles.slice(0, backupFiles.length - maxBackupFiles);

  await Promise.all(
    filesToDelete.map((fileName) => fs.unlink(path.join(backupDir, fileName))),
  );
}

export async function readDashboardState() {
  await ensureDashboardStateFile();
  const raw = await fs.readFile(dataFile, "utf8");

  return parseDashboardState(raw);
}

export async function writeDashboardState(payload: unknown) {
  await ensureDashboardStateFile();
  const currentRaw = await fs.readFile(dataFile, "utf8");
  const parsed = parseDashboardState(JSON.stringify(payload));
  const state = buildDashboardState(
    parsed.theme,
    parsed.projectTitleSize,
    parsed.privacyMode,
    parsed.hideCompletedItems,
    parsed.projects,
  );
  const nextRaw = JSON.stringify(state, null, 2);

  if (currentRaw.trim() && currentRaw !== nextRaw) {
    await createDashboardBackup(currentRaw);
  }

  await fs.writeFile(dataFile, nextRaw, "utf8");

  return state;
}

export async function patchDashboardItem(payload: {
  projectId?: string;
  itemId?: string;
  text?: string;
  done?: boolean;
}) {
  const state = await readDashboardState();

  if (!payload.projectId || !payload.itemId) {
    return {
      ok: false as const,
      status: 400,
      error: "projectId e itemId sao obrigatorios.",
    };
  }

  let itemFound = false;

  const projects = state.projects.map((project) => {
    if (project.id !== payload.projectId) {
      return project;
    }

    return {
      ...project,
      items: project.items.map((item) => {
        if (item.id !== payload.itemId) {
          return item;
        }

        itemFound = true;

        return {
          ...item,
          text: typeof payload.text === "string" ? payload.text : item.text,
          done: typeof payload.done === "boolean" ? payload.done : item.done,
        };
      }),
    };
  });

  if (!itemFound) {
    return {
      ok: false as const,
      status: 404,
      error: "Item nao encontrado para o projectId e itemId informados.",
    };
  }

  const nextState = await writeDashboardState({
    ...state,
    projects,
  });

  return {
    ok: true as const,
    status: 200,
    state: nextState,
  };
}
