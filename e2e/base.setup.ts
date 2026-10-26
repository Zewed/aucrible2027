import { execFileSync } from "node:child_process";

/**
 * Avant les tests : la base Postgres locale tourne (scripts/base-locale.sh, un conteneur Docker), et la base des tests
 * repart vide. L'app recrée ses tables au premier besoin, à jour de son code.
 */
export default function demarrerLaBase() {
  execFileSync("sh", ["scripts/base-locale.sh"], { stdio: "inherit" });
  execFileSync("docker", ["exec", "aucrible-db", "psql", "-U", "aucrible", "-d", "aucrible_test", "-qc", "DROP TABLE IF EXISTS signalements"], { stdio: "inherit" });
}
