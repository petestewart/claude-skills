#!/usr/bin/env node

import { access, chmod, readFile, rename, rm, writeFile } from "node:fs/promises";
import { homedir } from "node:os";
import { dirname, join } from "node:path";

const HOME = homedir();
const CLAUDE_ROOT = join(HOME, ".claude");
const RUNTIME_ROOT = join(CLAUDE_ROOT, "plain-language");
const EVAL_ROOT = join(CLAUDE_ROOT, "plain-language-evals");
const HOOK_PATH = join(CLAUDE_ROOT, "hooks", "plain-language-display.mjs");
const SETTINGS_PATH = join(CLAUDE_ROOT, "settings.json");
const purge = process.argv.includes("--purge");

async function exists(path) {
  return access(path).then(() => true, () => false);
}

async function writeJsonAtomic(path, value) {
  const temporary = `${path}.${process.pid}.tmp`;
  await writeFile(temporary, `${JSON.stringify(value, null, 2)}\n`, { mode: 0o600 });
  await rename(temporary, path);
  await chmod(path, 0o600).catch(() => {});
}

function isManagedHook(hook) {
  return hook?.type === "command"
    && (hook.args || []).some((argument) => argument === HOOK_PATH || String(argument).endsWith("/plain-language-display.mjs"));
}

async function removeHookRegistration() {
  if (!(await exists(SETTINGS_PATH))) return;
  const settings = JSON.parse(await readFile(SETTINGS_PATH, "utf8"));
  const groups = settings.hooks?.MessageDisplay;
  if (!Array.isArray(groups)) return;
  settings.hooks.MessageDisplay = groups.flatMap((group) => {
    if (!Array.isArray(group?.hooks)) return [group];
    const hooks = group.hooks.filter((hook) => !isManagedHook(hook));
    return hooks.length ? [{ ...group, hooks }] : [];
  });
  if (settings.hooks.MessageDisplay.length === 0) delete settings.hooks.MessageDisplay;
  if (Object.keys(settings.hooks).length === 0) delete settings.hooks;
  await writeJsonAtomic(SETTINGS_PATH, settings);
}

async function main() {
  await removeHookRegistration();
  await rm(HOOK_PATH, { force: true });
  if (purge) {
    await rm(RUNTIME_ROOT, { recursive: true, force: true });
    await rm(EVAL_ROOT, { recursive: true, force: true });
  } else {
    for (const name of ["rewrite.mjs", "transcript.mjs", "eval.mjs"]) {
      await rm(join(RUNTIME_ROOT, name), { force: true });
    }
    await rm(join(RUNTIME_ROOT, "prompts"), { recursive: true, force: true });
  }
  process.stdout.write(purge
    ? "Dejargonize uninstalled. Configuration and evaluation data were removed.\n"
    : "Dejargonize uninstalled. Configuration and evaluation data were preserved.\n");
  process.stdout.write("The Ollama model was left installed.\n");
}

main().catch((error) => {
  process.stderr.write(`dejargonize uninstall: ${error instanceof Error ? error.message : String(error)}\n`);
  process.exitCode = 1;
});
