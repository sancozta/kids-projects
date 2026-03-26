import path from "node:path";
import { fileURLToPath } from "node:url";

const currentFile = fileURLToPath(import.meta.url);
const cliDir = path.dirname(path.dirname(currentFile));
const repoDir = path.dirname(cliDir);

export function getRepoDir() {
  return repoDir;
}

export function getDataDir() {
  return path.join(repoDir, "data");
}

export function getDatabasePath() {
  return path.join(getDataDir(), "dashboard-state.sqlite");
}
