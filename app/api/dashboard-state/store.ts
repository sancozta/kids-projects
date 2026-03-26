import {
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  renameSync,
  rmSync,
  statSync,
  unlinkSync,
  writeFileSync,
} from "node:fs";
import path from "node:path";
import BetterSqlite3 from "better-sqlite3";
import {
  buildDashboardState,
  createInitialDashboardStateWithTimestamp,
  parseDashboardStatePayload,
  tryParseDashboardState,
  type DashboardState,
} from "@/app/dashboard-state";

type SqliteDatabase = InstanceType<typeof BetterSqlite3>;

type WriteDashboardStateResult =
  | {
      ok: true;
      status: 200;
      state: DashboardState;
    }
  | {
      ok: false;
      status: 400 | 409;
      error: string;
      state?: DashboardState;
    };

type PatchDashboardItemResult =
  | {
      ok: true;
      status: 200;
      state: DashboardState;
    }
  | {
      ok: false;
      status: 400 | 404;
      error: string;
    };

export type DashboardStoreHealth = {
  ok: boolean;
  store: "sqlite";
  databasePath: string;
  backupDir: string;
  canRead: boolean;
  canWrite: boolean;
  integrity: string;
  stateRevision: number | null;
  stateUpdatedAt: string | null;
  lastBackupPath: string | null;
  lastBackupAt: string | null;
  error?: string;
};

const dataDir = path.join(process.cwd(), "data");
const legacyDataFile = path.join(dataDir, "dashboard-state.json");
const databaseFile = path.join(dataDir, "dashboard-state.sqlite");
const backupDir = path.join(dataDir, "backups");
const maxBackupFiles = 20;
const sqliteSidecars = [`${databaseFile}-shm`, `${databaseFile}-wal`];

let database: SqliteDatabase | null = null;

function ensureDataDirectories() {
  mkdirSync(dataDir, { recursive: true });
  mkdirSync(backupDir, { recursive: true });
}

function writeFileAtomic(targetPath: string, content: string) {
  const tempPath = `${targetPath}.tmp-${process.pid}-${Date.now()}`;
  writeFileSync(tempPath, content, "utf8");
  renameSync(tempPath, targetPath);
}

function buildBackupFileName() {
  const stamp = new Date().toISOString().replaceAll(":", "-");
  return path.join(backupDir, `dashboard-state.${stamp}.json`);
}

function buildCorruptDatabaseFileName() {
  const stamp = new Date().toISOString().replaceAll(":", "-");
  return path.join(dataDir, `dashboard-state.corrupt.${stamp}.sqlite`);
}

function listBackupFiles() {
  if (!existsSync(backupDir)) {
    return [];
  }

  return readdirSync(backupDir)
    .filter((entry) => entry.startsWith("dashboard-state.") && entry.endsWith(".json"))
    .sort()
    .map((entry) => path.join(backupDir, entry));
}

function pruneBackups() {
  const files = listBackupFiles();

  if (files.length <= maxBackupFiles) {
    return;
  }

  for (const filePath of files.slice(0, files.length - maxBackupFiles)) {
    unlinkSync(filePath);
  }
}

function createDashboardBackup(state: DashboardState) {
  writeFileAtomic(buildBackupFileName(), JSON.stringify(state, null, 2));
  pruneBackups();
}

function rotateDatabaseFileAside() {
  if (existsSync(databaseFile)) {
    renameSync(databaseFile, buildCorruptDatabaseFileName());
  }

  for (const sidecar of sqliteSidecars) {
    if (existsSync(sidecar)) {
      rmSync(sidecar, { force: true });
    }
  }
}

function createSchema(db: SqliteDatabase) {
  db.pragma("journal_mode = WAL");
  db.pragma("busy_timeout = 5000");
  db.pragma("synchronous = NORMAL");
  db.exec(`
    CREATE TABLE IF NOT EXISTS dashboard_state (
      singleton INTEGER PRIMARY KEY CHECK (singleton = 1),
      revision INTEGER NOT NULL,
      updated_at TEXT NOT NULL,
      state_json TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS store_health (
      singleton INTEGER PRIMARY KEY CHECK (singleton = 1),
      checked_at TEXT NOT NULL,
      details_json TEXT NOT NULL
    );
  `);
}

function readPersistedState(db: SqliteDatabase) {
  const row = db
    .prepare("SELECT state_json FROM dashboard_state WHERE singleton = 1")
    .get() as { state_json: string } | undefined;

  if (!row) {
    return null;
  }

  return tryParseDashboardState(row.state_json);
}

function persistState(db: SqliteDatabase, state: DashboardState) {
  const rawState = JSON.stringify(state);
  db.prepare(
    `
      INSERT INTO dashboard_state (singleton, revision, updated_at, state_json)
      VALUES (1, @revision, @updatedAt, @stateJson)
      ON CONFLICT (singleton) DO UPDATE SET
        revision = excluded.revision,
        updated_at = excluded.updated_at,
        state_json = excluded.state_json
    `,
  ).run({
    revision: state.revision,
    updatedAt: state.updatedAt,
    stateJson: rawState,
  });
}

function restoreStateFromLatestBackup(db: SqliteDatabase) {
  const backupFiles = listBackupFiles().reverse();

  for (const backupFile of backupFiles) {
    try {
      const restored = tryParseDashboardState(readFileSync(backupFile, "utf8"));

      if (!restored) {
        continue;
      }

      persistState(db, restored);
      return restored;
    } catch {
      continue;
    }
  }

  return null;
}

function migrateLegacyJsonState(db: SqliteDatabase) {
  if (!existsSync(legacyDataFile)) {
    return null;
  }

  try {
    const migrated = tryParseDashboardState(readFileSync(legacyDataFile, "utf8"));

    if (!migrated) {
      return null;
    }

    persistState(db, migrated);
    createDashboardBackup(migrated);
    return migrated;
  } catch {
    return null;
  }
}

function ensureSeedState(db: SqliteDatabase) {
  const current = readPersistedState(db);

  if (current) {
    return current;
  }

  const restored =
    migrateLegacyJsonState(db) ??
    restoreStateFromLatestBackup(db) ??
    createInitialDashboardStateWithTimestamp("1970-01-01T00:00:00.000Z", 0);

  persistState(db, restored);

  if (!listBackupFiles().length) {
    createDashboardBackup(restored);
  }

  return restored;
}

function createDatabase() {
  ensureDataDirectories();

  let db: SqliteDatabase | null = null;

  try {
    db = new BetterSqlite3(databaseFile);
    createSchema(db);
    ensureSeedState(db);
    return db;
  } catch {
    db?.close();
    rotateDatabaseFileAside();

    const recovered = new BetterSqlite3(databaseFile);
    createSchema(recovered);

    const restored =
      restoreStateFromLatestBackup(recovered) ??
      migrateLegacyJsonState(recovered) ??
      createInitialDashboardStateWithTimestamp("1970-01-01T00:00:00.000Z", 0);

    persistState(recovered, restored);
    createDashboardBackup(restored);

    return recovered;
  }
}

function getDatabase() {
  if (!database) {
    database = createDatabase();
  }

  return database;
}

function getLatestBackupInfo() {
  const latestBackup = listBackupFiles().at(-1) ?? null;

  if (!latestBackup) {
    return {
      lastBackupPath: null,
      lastBackupAt: null,
    };
  }

  return {
    lastBackupPath: latestBackup,
    lastBackupAt: statSync(latestBackup).mtime.toISOString(),
  };
}

function writeNextDashboardState(
  db: SqliteDatabase,
  draft: DashboardState,
  expectedRevision: number,
): WriteDashboardStateResult {
  const current = ensureSeedState(db);

  if (expectedRevision !== current.revision) {
    return {
      ok: false,
      status: 409,
      error: "O estado local esta desatualizado. Leia o estado atual antes de salvar.",
      state: current,
    };
  }

  const nextState = buildDashboardState(
    draft.theme,
    draft.projectTitleSize,
    draft.privacyMode,
    draft.hideCompletedItems,
    draft.projects,
    {
      revision: current.revision + 1,
    },
  );

  persistState(db, nextState);
  createDashboardBackup(nextState);

  return {
    ok: true,
    status: 200,
    state: nextState,
  };
}

export async function readDashboardState() {
  return ensureSeedState(getDatabase());
}

export async function writeDashboardState(payload: unknown): Promise<WriteDashboardStateResult> {
  const parsed = parseDashboardStatePayload(payload);

  if (!parsed) {
    return {
      ok: false,
      status: 400,
      error: "Payload invalido. Envie um documento completo e valido do dashboard.",
    };
  }

  return writeNextDashboardState(getDatabase(), parsed, parsed.revision);
}

export async function patchDashboardItem(payload: {
  projectId?: string;
  itemId?: string;
  text?: string;
  done?: boolean;
}): Promise<PatchDashboardItemResult> {
  if (!payload.projectId || !payload.itemId) {
    return {
      ok: false,
      status: 400,
      error: "projectId e itemId sao obrigatorios.",
    };
  }

  const current = await readDashboardState();
  let itemFound = false;

  const projects = current.projects.map((project) => {
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
      ok: false,
      status: 404,
      error: "Item nao encontrado para o projectId e itemId informados.",
    };
  }

  const result = writeNextDashboardState(
    getDatabase(),
    buildDashboardState(
      current.theme,
      current.projectTitleSize,
      current.privacyMode,
      current.hideCompletedItems,
      projects,
      {
        revision: current.revision,
        updatedAt: current.updatedAt,
      },
    ),
    current.revision,
  );

  return result.ok
    ? result
    : {
        ok: false,
        status: 400,
        error: result.error,
      };
}

export async function readDashboardStoreHealth(): Promise<DashboardStoreHealth> {
  const db = getDatabase();
  const backupInfo = getLatestBackupInfo();

  let state: DashboardState | null = null;

  try {
    state = ensureSeedState(db);
  } catch (error) {
    return {
      ok: false,
      store: "sqlite",
      databasePath: databaseFile,
      backupDir,
      canRead: false,
      canWrite: false,
      integrity: "failed",
      stateRevision: null,
      stateUpdatedAt: null,
      ...backupInfo,
      error: error instanceof Error ? error.message : "Falha ao ler o store.",
    };
  }

  let integrity = "ok";

  try {
    integrity = String(
      db.prepare("PRAGMA quick_check").pluck().get() ?? "unknown",
    );
  } catch {
    integrity = "failed";
  }

  try {
    const checkedAt = new Date().toISOString();
    db.prepare(
      `
        INSERT INTO store_health (singleton, checked_at, details_json)
        VALUES (1, @checkedAt, @detailsJson)
        ON CONFLICT (singleton) DO UPDATE SET
          checked_at = excluded.checked_at,
          details_json = excluded.details_json
      `,
    ).run({
      checkedAt,
      detailsJson: JSON.stringify({
        revision: state.revision,
        updatedAt: state.updatedAt,
        integrity,
      }),
    });

    return {
      ok: integrity === "ok",
      store: "sqlite",
      databasePath: databaseFile,
      backupDir,
      canRead: true,
      canWrite: true,
      integrity,
      stateRevision: state.revision,
      stateUpdatedAt: state.updatedAt,
      ...backupInfo,
    };
  } catch (error) {
    return {
      ok: false,
      store: "sqlite",
      databasePath: databaseFile,
      backupDir,
      canRead: true,
      canWrite: false,
      integrity,
      stateRevision: state.revision,
      stateUpdatedAt: state.updatedAt,
      ...backupInfo,
      error: error instanceof Error ? error.message : "Falha ao gravar no store.",
    };
  }
}
