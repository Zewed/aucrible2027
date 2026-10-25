import { execFileSync } from "node:child_process";

/** Avant les tests : la base Postgres locale tourne (scripts/base-locale.sh, un conteneur Docker). */
export default function demarrerLaBase() {
  execFileSync("sh", ["scripts/base-locale.sh"], { stdio: "inherit" });
}
