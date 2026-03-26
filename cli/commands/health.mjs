#!/usr/bin/env node
// desc: Consulta o healthcheck HTTP do kids-projects

import { accessSync, constants, existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { setTimeout as sleep } from "node:timers/promises";
import BetterSqlite3 from "better-sqlite3";

const args = new Set(process.argv.slice(2));
const asJson = args.has("--json");
const localOnly = args.has("--local");

const host = process.env.KIDS_PROJECTS_HOST ?? "127.0.0.1";
const port = process.env.KIDS_PROJECTS_PORT ?? "46321";
const url = `http://${host}:${port}/api/health`;
const launchdLabel = process.env.KIDS_PROJECTS_LAUNCHD_LABEL ?? "com.sancozta.kids-projects";

const repoDir = process.cwd();
const dataDir = path.join(repoDir, "data");
const databasePath = path.join(dataDir, "dashboard-state.sqlite");
const backupDir = path.join(dataDir, "backups");
const legacyDataFile = path.join(dataDir, "dashboard-state.json");
const launchdPlist = path.join(
  process.env.HOME ?? "",
  "Library",
  "LaunchAgents",
  `${launchdLabel}.plist`,
);
const launchdDomain = `gui/${process.getuid?.() ?? ""}/${launchdLabel}`;

function getLatestBackupInfo() {
  if (!existsSync(backupDir)) {
    return {
      lastBackupPath: null,
      lastBackupAt: null,
    };
  }

  const backups = readdirSync(backupDir)
    .filter((entry) => entry.startsWith("dashboard-state.") && entry.endsWith(".json"))
    .sort();

  const latestBackup = backups.at(-1);

  if (!latestBackup) {
    return {
      lastBackupPath: null,
      lastBackupAt: null,
    };
  }

  const fullPath = path.join(backupDir, latestBackup);

  return {
    lastBackupPath: fullPath,
    lastBackupAt: statSync(fullPath).mtime.toISOString(),
  };
}

function readLegacyStateMeta() {
  if (!existsSync(legacyDataFile)) {
    return null;
  }

  try {
    const payload = JSON.parse(readFileSync(legacyDataFile, "utf8"));

    return {
      revision:
        typeof payload?.revision === "number" && Number.isFinite(payload.revision)
          ? payload.revision
          : null,
      updatedAt: typeof payload?.updatedAt === "string" ? payload.updatedAt : null,
    };
  } catch {
    return null;
  }
}

function canWriteTo(filePath, fallbackDir) {
  try {
    accessSync(filePath, constants.R_OK | constants.W_OK);
    return true;
  } catch {
    try {
      accessSync(fallbackDir, constants.R_OK | constants.W_OK);
      return true;
    } catch {
      return false;
    }
  }
}

function readLocalStoreHealth() {
  const backupInfo = getLatestBackupInfo();

  if (!existsSync(databasePath)) {
    const legacyMeta = readLegacyStateMeta();

    return {
      ok: false,
      store: "sqlite",
      databasePath,
      backupDir,
      canRead: false,
      canWrite: canWriteTo(dataDir, repoDir),
      integrity: "missing",
      stateRevision: legacyMeta?.revision ?? null,
      stateUpdatedAt: legacyMeta?.updatedAt ?? null,
      ...backupInfo,
      error: existsSync(legacyDataFile)
        ? "Banco SQLite ainda nao foi inicializado; existe apenas o estado legado em JSON."
        : "Banco SQLite ainda nao foi inicializado.",
    };
  }

  let db;

  try {
    db = new BetterSqlite3(databasePath, { fileMustExist: true });

    const integrity = String(
      db.prepare("PRAGMA quick_check").pluck().get() ?? "unknown",
    );
    const row = db
      .prepare(
        "SELECT revision, updated_at FROM dashboard_state WHERE singleton = 1",
      )
      .get();

    return {
      ok: integrity === "ok" && !!row,
      store: "sqlite",
      databasePath,
      backupDir,
      canRead: true,
      canWrite: canWriteTo(databasePath, dataDir),
      integrity,
      stateRevision:
        typeof row?.revision === "number" && Number.isFinite(row.revision)
          ? row.revision
          : null,
      stateUpdatedAt: typeof row?.updated_at === "string" ? row.updated_at : null,
      ...backupInfo,
      ...(row ? {} : { error: "Tabela dashboard_state vazia ou ausente." }),
    };
  } catch (error) {
    return {
      ok: false,
      store: "sqlite",
      databasePath,
      backupDir,
      canRead: false,
      canWrite: canWriteTo(databasePath, dataDir),
      integrity: "failed",
      stateRevision: null,
      stateUpdatedAt: null,
      ...backupInfo,
      error: error instanceof Error ? error.message : "Falha ao abrir o SQLite local.",
    };
  } finally {
    db?.close();
  }
}

function hasInstalledLaunchdAgent() {
  return process.platform === "darwin" && existsSync(launchdPlist);
}

function readLaunchdRuntimeInfo() {
  if (!hasInstalledLaunchdAgent()) {
    return {
      installed: false,
      state: null,
      port: null,
    };
  }

  const result = spawnSync("launchctl", ["print", launchdDomain], {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "ignore"],
  });

  if (result.status !== 0) {
    return {
      installed: true,
      state: null,
      port: null,
    };
  }

  const output = result.stdout ?? "";
  const stateMatch = output.match(/state = ([^\n]+)/);
  const portMatch = output.match(/KIDS_PROJECTS_PORT => ([0-9]+)/);

  return {
    installed: true,
    state: stateMatch?.[1]?.trim() ?? null,
    port: portMatch?.[1]?.trim() ?? null,
  };
}

function kickstartLaunchdAgent() {
  if (!hasInstalledLaunchdAgent()) {
    return false;
  }

  const result = spawnSync(
    "launchctl",
    ["kickstart", "-k", launchdDomain],
    {
      stdio: "ignore",
    },
  );

  return result.status === 0;
}

async function fetchHealthAt(targetUrl) {
  try {
    const response = await fetch(targetUrl, {
      signal: AbortSignal.timeout(5_000),
    });
    const rawBody = await response.text();
    let payload = null;

    if (rawBody.trim().length > 0) {
      try {
        payload = JSON.parse(rawBody);
      } catch {
        payload = null;
      }
    }

    return {
      reachable: true,
      responseOk: response.ok,
      payload,
      status: response.status,
      rawBody,
      url: targetUrl,
    };
  } catch (error) {
    return {
      reachable: false,
      responseOk: false,
      payload: null,
      status: null,
      rawBody: null,
      url: targetUrl,
      error: error instanceof Error ? error.message : "fetch failed",
    };
  }
}

async function recoverHttpHealth() {
  const runtimeInfo = readLaunchdRuntimeInfo();
  const candidateUrls = [url];

  if (runtimeInfo.port && runtimeInfo.port !== port) {
    candidateUrls.push(`http://${host}:${runtimeInfo.port}/api/health`);
  }

  for (const candidateUrl of candidateUrls) {
    const attempt = await fetchHealthAt(candidateUrl);

    if (attempt.reachable) {
      return {
        attempt,
        launchdInstalled: runtimeInfo.installed,
        launchdKickstarted: false,
        launchdState: runtimeInfo.state,
        launchdPort: runtimeInfo.port,
      };
    }
  }

  if (localOnly) {
    return {
      attempt: await fetchHealthAt(url),
      launchdInstalled: runtimeInfo.installed,
      launchdKickstarted: false,
      launchdState: runtimeInfo.state,
      launchdPort: runtimeInfo.port,
    };
  }

  const launchdKickstarted = runtimeInfo.installed ? kickstartLaunchdAgent() : false;

  if (!launchdKickstarted) {
    return {
      attempt: await fetchHealthAt(url),
      launchdInstalled: runtimeInfo.installed,
      launchdKickstarted,
      launchdState: runtimeInfo.state,
      launchdPort: runtimeInfo.port,
    };
  }

  for (let attemptIndex = 0; attemptIndex < 3; attemptIndex += 1) {
    await sleep(800);

    for (const candidateUrl of candidateUrls) {
      const retry = await fetchHealthAt(candidateUrl);

      if (retry.reachable) {
        return {
          attempt: retry,
          launchdInstalled: runtimeInfo.installed,
          launchdKickstarted,
          launchdState: runtimeInfo.state,
          launchdPort: runtimeInfo.port,
        };
      }
    }
  }

  return {
    attempt: await fetchHealthAt(url),
    launchdInstalled: runtimeInfo.installed,
    launchdKickstarted,
    launchdState: runtimeInfo.state,
    launchdPort: runtimeInfo.port,
  };
}

function buildHint(payload) {
  if (payload.transport === "http") {
    return null;
  }

  if (payload.launchdPort && payload.launchdPort !== port) {
    return `O launchd instalado ainda usa a porta ${payload.launchdPort}. Reinstale com \`kids uninstall launchd\` e \`kids install launchd\` para alinhar com a porta ${port}.`;
  }

  if (payload.launchdInstalled) {
    return "O HTTP local nao respondeu. Verifique logs/ e rode `kids health` novamente em alguns segundos.";
  }

  if (payload.integrity === "missing") {
    return "Suba a aplicacao com `kids serve` para inicializar o store, ou instale `kids install launchd` para mantela em background no macOS.";
  }

  return "Suba a aplicacao com `kids serve`, ou instale `kids install launchd` para mantela em background no macOS.";
}

function formatPayload(payload) {
  if (payload.transport === "http") {
    return {
      ...payload,
      hint: buildHint(payload),
    };
  }

  return {
    ...payload,
    hint: buildHint(payload),
  };
}

function printPayload(payload) {
  if (asJson) {
    console.log(JSON.stringify(formatPayload(payload), null, 2));
    return;
  }

  const headline = payload.ok ? "ok" : payload.transport === "local-fallback" ? "degraded" : "failed";

  console.log(`Health: ${headline}`);
  console.log(`Transport: ${payload.transport}`);

  if (payload.transport === "http") {
    console.log(`URL: ${payload.url}`);
  } else {
    if (payload.transport !== "local") {
      console.log(`HTTP: ${payload.httpError ?? `status ${payload.httpStatus ?? "unknown"}`}`);
      console.log(`URL: ${payload.url}`);
      console.log(`Launchd instalado: ${payload.launchdInstalled ? "yes" : "no"}`);
      console.log(`Launchd kickstart: ${payload.launchdKickstarted ? "yes" : "no"}`);
      console.log(`Launchd state: ${payload.launchdState ?? "unknown"}`);
      console.log(`Launchd port: ${payload.launchdPort ?? "n/a"}`);
    }
  }

  console.log(`Store: ${payload.store}`);
  console.log(`Integrity: ${payload.integrity}`);
  console.log(`Can read: ${payload.canRead}`);
  console.log(`Can write: ${payload.canWrite}`);
  console.log(`Revision: ${payload.stateRevision ?? "n/a"}`);
  console.log(`Updated at: ${payload.stateUpdatedAt ?? "n/a"}`);
  console.log(`Database: ${payload.databasePath}`);
  console.log(`Last backup: ${payload.lastBackupPath ?? "n/a"}`);

  if (payload.error) {
    console.log(`Error: ${payload.error}`);
  }

  const hint = buildHint(payload);

  if (hint) {
    console.log(`Hint: ${hint}`);
  }
}

const {
  attempt,
  launchdInstalled,
  launchdKickstarted,
  launchdState,
  launchdPort,
} = await recoverHttpHealth();

if (
  !localOnly &&
  attempt.reachable &&
  attempt.payload &&
  typeof attempt.payload === "object"
) {
  const payload = {
    ...attempt.payload,
    transport: "http",
    url: attempt.url,
  };

  printPayload(payload);
  process.exit(attempt.responseOk ? 0 : 1);
}

const localPayload = readLocalStoreHealth();
const payload = {
  ...localPayload,
  ok: localOnly ? localPayload.ok : false,
  transport: localOnly ? "local" : "local-fallback",
  url: attempt.url,
  httpStatus: attempt.status,
  httpError: localOnly
    ? null
    : attempt.error ?? `HTTP respondeu com status ${attempt.status ?? "unknown"}.`,
  launchdInstalled,
  launchdKickstarted,
  launchdState,
  launchdPort,
};

printPayload(payload);
process.exit(payload.ok ? 0 : 1);
