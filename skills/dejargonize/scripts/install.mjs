#!/usr/bin/env node

import { spawnSync } from "node:child_process";
import { access, chmod, copyFile, mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { homedir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const SKILL_ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const HOME = homedir();
const CLAUDE_ROOT = join(HOME, ".claude");
const RUNTIME_ROOT = join(CLAUDE_ROOT, "plain-language");
const EVAL_ROOT = join(CLAUDE_ROOT, "plain-language-evals");
const HOOK_PATH = join(CLAUDE_ROOT, "hooks", "plain-language-display.mjs");
const SETTINGS_PATH = join(CLAUDE_ROOT, "settings.json");
const MODEL = "qwen3:8b";
const skipModel = process.argv.includes("--skip-model");
const resetConfig = process.argv.includes("--reset-config");

async function exists(path) {
  return access(path).then(() => true, () => false);
}

async function readJson(path, fallback) {
  if (!(await exists(path))) return fallback;
  try {
    return JSON.parse(await readFile(path, "utf8"));
  } catch (error) {
    throw new Error(`Cannot parse ${path}: ${error.message}`);
  }
}

async function writeJsonAtomic(path, value, mode = 0o600) {
  await mkdir(dirname(path), { recursive: true });
  const temporary = `${path}.${process.pid}.tmp`;
  await writeFile(temporary, `${JSON.stringify(value, null, 2)}\n`, { mode });
  await rename(temporary, path);
  await chmod(path, mode).catch(() => {});
}

function ollamaModels() {
  const result = spawnSync("ollama", ["list"], { encoding: "utf8", timeout: 15_000 });
  if (result.error?.code === "ENOENT") {
    throw new Error("Ollama is not installed. Install it from https://ollama.com, then run /dejargonize install again.");
  }
  if (result.status !== 0) {
    throw new Error(`Ollama is not available. Start Ollama, then retry.\n${(result.stderr || "").trim()}`);
  }
  return result.stdout.split("\n").slice(1).map((line) => line.trim().split(/\s+/)[0]).filter(Boolean);
}

function isManagedHook(hook) {
  return hook?.type === "command"
    && (hook.args || []).some((argument) => argument === HOOK_PATH || String(argument).endsWith("/plain-language-display.mjs"));
}

function registerHook(settings) {
  settings.hooks ||= {};
  const groups = Array.isArray(settings.hooks.MessageDisplay) ? settings.hooks.MessageDisplay : [];
  settings.hooks.MessageDisplay = groups.flatMap((group) => {
    if (!Array.isArray(group?.hooks)) return [group];
    const hooks = group.hooks.filter((hook) => !isManagedHook(hook));
    return hooks.length ? [{ ...group, hooks }] : [];
  });
  settings.hooks.MessageDisplay.push({
    hooks: [{
      type: "command",
      command: "node",
      args: [HOOK_PATH],
      timeout: 120,
      statusMessage: "Rewriting in plain language",
    }],
  });
  return settings;
}

async function installFiles() {
  await mkdir(join(RUNTIME_ROOT, "prompts"), { recursive: true, mode: 0o700 });
  await mkdir(dirname(HOOK_PATH), { recursive: true, mode: 0o700 });
  await mkdir(EVAL_ROOT, { recursive: true, mode: 0o700 });

  for (const name of ["rewrite.mjs", "transcript.mjs", "eval.mjs"]) {
    await copyFile(join(SKILL_ROOT, "assets", "plain-language", name), join(RUNTIME_ROOT, name));
  }
  for (const version of ["v1", "v2", "v3"]) {
    await copyFile(
      join(SKILL_ROOT, "assets", "plain-language", "prompts", `${version}.txt`),
      join(RUNTIME_ROOT, "prompts", `${version}.txt`),
    );
  }
  await copyFile(join(SKILL_ROOT, "assets", "hooks", "plain-language-display.mjs"), HOOK_PATH);
  await chmod(HOOK_PATH, 0o700);

  const defaultConfig = await readJson(join(SKILL_ROOT, "assets", "plain-language", "config.default.json"), {});
  const currentConfig = resetConfig ? {} : await readJson(join(RUNTIME_ROOT, "config.json"), {});
  await writeJsonAtomic(join(RUNTIME_ROOT, "config.json"), { ...defaultConfig, ...currentConfig });

  const datasetPath = join(EVAL_ROOT, "dataset.example.jsonl");
  if (!(await exists(datasetPath))) {
    await copyFile(join(SKILL_ROOT, "assets", "plain-language-evals", "dataset.example.jsonl"), datasetPath);
    await chmod(datasetPath, 0o600).catch(() => {});
  }
}

async function ensureModel() {
  const models = ollamaModels();
  if (models.includes(MODEL) || skipModel) return models.includes(MODEL) ? "already installed" : "skipped";
  process.stderr.write(`Downloading ${MODEL}; this is about 5.2 GB...\n`);
  const result = spawnSync("ollama", ["pull", MODEL], { stdio: "inherit" });
  if (result.status !== 0) throw new Error(`Could not download ${MODEL}`);
  return "installed";
}

async function main() {
  const modelStatus = await ensureModel();
  await installFiles();
  const settings = registerHook(await readJson(SETTINGS_PATH, {}));
  await writeJsonAtomic(SETTINGS_PATH, settings);
  process.stdout.write([
    "Dejargonize installed.",
    `Hook: ${HOOK_PATH}`,
    `Runtime: ${RUNTIME_ROOT}`,
    `Model: ${MODEL} (${modelStatus})`,
    "Restart Claude Code if the hook is not picked up automatically.",
    "Run /dejargonize status to verify the installation.",
  ].join("\n") + "\n");
}

main().catch((error) => {
  process.stderr.write(`dejargonize install: ${error instanceof Error ? error.message : String(error)}\n`);
  process.exitCode = 1;
});
