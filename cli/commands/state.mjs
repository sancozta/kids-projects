#!/usr/bin/env node
// desc: Le o estado canonico persistido no SQLite local

import fs from "node:fs";
import Database from "better-sqlite3";
import { getDataDir, getDatabasePath } from "../lib/util_paths.mjs";

const args = new Set(process.argv.slice(2));
const summaryOnly = args.has("--summary");
const databasePath = getDatabasePath();
const legacyJsonPath = `${getDataDir()}/dashboard-state.json`;

function readStateFromLegacyJson() {
  if (!fs.existsSync(legacyJsonPath)) {
    return null;
  }

  return JSON.parse(fs.readFileSync(legacyJsonPath, "utf8"));
}

function printState(state) {
  if (!summaryOnly) {
    console.log(JSON.stringify(state, null, 2));
    process.exit(0);
  }

  const totalProjects = Array.isArray(state.projects) ? state.projects.length : 0;
  const totalItems = Array.isArray(state.projects)
    ? state.projects.reduce(
        (accumulator, project) =>
          accumulator + (Array.isArray(project.items) ? project.items.length : 0),
        0,
      )
    : 0;
  const completedItems = Array.isArray(state.projects)
    ? state.projects.reduce(
        (accumulator, project) =>
          accumulator +
          (Array.isArray(project.items)
            ? project.items.filter((item) => item.done === true).length
            : 0),
        0,
      )
    : 0;

  console.log(`Revision: ${state.revision ?? 0}`);
  console.log(`Updated at: ${state.updatedAt ?? "n/a"}`);
  console.log(`Theme: ${state.theme ?? "n/a"}`);
  console.log(`Projects: ${totalProjects}`);
  console.log(`Items: ${totalItems}`);
  console.log(`Done: ${completedItems}`);
}

try {
  if (!fs.existsSync(databasePath)) {
    const legacyState = readStateFromLegacyJson();

    if (!legacyState) {
      console.error("Nenhum estado persistido foi encontrado.");
      process.exit(1);
    }

    printState(legacyState);
    process.exit(0);
  }

  const db = new Database(databasePath, { readonly: true });
  const row = db
    .prepare("SELECT state_json FROM dashboard_state WHERE singleton = 1")
    .get();

  db.close();

  if (!row || typeof row.state_json !== "string") {
    const legacyState = readStateFromLegacyJson();

    if (!legacyState) {
      console.error("Nenhum estado persistido foi encontrado.");
      process.exit(1);
    }

    printState(legacyState);
    process.exit(0);
  }

  const state = JSON.parse(row.state_json);
  printState(state);
} catch (error) {
  console.error(
    error instanceof Error
      ? `Falha ao ler o estado local: ${error.message}`
      : "Falha ao ler o estado local.",
  );
  process.exit(1);
}
