#!/usr/bin/env node

import { execFileSync, spawnSync } from "node:child_process";
import { readdir, readFile, rename, stat, writeFile } from "node:fs/promises";
import { homedir } from "node:os";
import { join } from "node:path";

const HOME = homedir();
const ROOT = join(HOME, ".claude", "plain-language");
const CONFIG_PATH = join(ROOT, "config.json");
const PROMPTS_DIR = join(ROOT, "prompts");
const EVAL_ROOT = join(HOME, ".claude", "plain-language-evals");
const EVAL_SCRIPT = join(ROOT, "eval.mjs");

const HELP = `Usage: /dejargonize <command>

Commands:
  help                         Show this help
  install [--skip-model]       Install the hook and local runtime
  uninstall [--purge]          Remove the hook; preserve data unless purged
  status                       Show the active configuration
  on | off                     Enable or disable rewriting immediately
  model <name>                 Select an installed Ollama model
  models                       List installed Ollama models
  prompt <version>             Select a prompt, such as v2 or v3
  prompts                      List available prompt versions
  temperature <0-2>            Set rewrite creativity (lower is safer)
  minimum-length <characters>  Skip rewriting very short replies
  context latest-user | none   Use the latest user prompt to preserve intent
  capture on | off             Save before/after pairs for evaluation
  eval [prompt-list]           Evaluate captures, e.g. eval v1,v2
  report                       Open the latest HTML eval report

Examples:
  /dejargonize status
  /dejargonize prompt v3
  /dejargonize model qwen3:8b
  /dejargonize capture on
  /dejargonize eval v1,v2,v3`;

async function loadConfig() {
  return JSON.parse(await readFile(CONFIG_PATH, "utf8"));
}

async function saveConfig(config) {
  const temporary = `${CONFIG_PATH}.${process.pid}.tmp`;
  await writeFile(temporary, JSON.stringify(config, null, 2) + "\n", { mode: 0o600 });
  await rename(temporary, CONFIG_PATH);
}

function ollamaModels() {
  try {
    const output = execFileSync("ollama", ["list"], { encoding: "utf8", timeout: 10_000 });
    return output.split("\n").slice(1).map((line) => line.trim().split(/\s+/)[0]).filter(Boolean);
  } catch {
    return [];
  }
}

async function promptVersions() {
  return (await readdir(PROMPTS_DIR))
    .filter((name) => name.endsWith(".txt"))
    .map((name) => name.slice(0, -4))
    .sort();
}

function boolValue(value) {
  if (["on", "true", "1"].includes(value)) return true;
  if (["off", "false", "0"].includes(value)) return false;
  throw new Error("Expected on or off");
}

async function latestReport() {
  const runsDir = join(EVAL_ROOT, "runs");
  const entries = await readdir(runsDir, { withFileTypes: true }).catch(() => []);
  const reports = [];
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const path = join(runsDir, entry.name, "report.html");
    const info = await stat(path).catch(() => null);
    if (info) reports.push({ path, modified: info.mtimeMs });
  }
  return reports.sort((a, b) => b.modified - a.modified)[0]?.path ?? null;
}

async function status() {
  const config = await loadConfig();
  const models = ollamaModels();
  const prompts = await promptVersions();
  return [
    `Dejargonizer: ${config.enabled === false ? "off" : "on"}`,
    `Model: ${config.model}${models.includes(config.model) ? " (installed)" : " (not installed)"}`,
    `Prompt: ${config.promptVersion}${prompts.includes(config.promptVersion) ? "" : " (missing)"}`,
    `Temperature: ${config.temperature}`,
    `Minimum length: ${config.minimumLength} characters`,
    `Context: ${config.contextMode}${config.contextMode === "latest-user" && !config.intentAwarePrompts?.includes(config.promptVersion) ? " (not supported by this prompt)" : ""}`,
    `Capture: ${config.capture === true ? "on" : "off"}`,
    `Ollama models: ${models.length ? models.join(", ") : "none found"}`,
  ].join("\n");
}

async function main() {
  const [rawCommand = "help", ...args] = process.argv.slice(2);
  const command = rawCommand.toLowerCase();
  if (["help", "-h", "--help"].includes(command)) return HELP;
  if (command === "status") return status();
  if (command === "models") return `Installed Ollama models:\n${ollamaModels().map((x) => `- ${x}`).join("\n") || "- none"}`;
  if (command === "prompts") return `Available prompts:\n${(await promptVersions()).map((x) => `- ${x}`).join("\n")}`;

  if (command === "report") {
    const report = await latestReport();
    if (!report) throw new Error("No eval report found. Run /dejargonize eval first.");
    const opened = spawnSync("open", [report], { encoding: "utf8" });
    if (opened.status !== 0) throw new Error(opened.stderr || "Could not open report");
    return `Opened ${report}`;
  }

  if (command === "eval") {
    const captures = join(EVAL_ROOT, "captures.jsonl");
    if (!(await stat(captures).catch(() => null))) {
      throw new Error("No captured replies yet. Run /dejargonize capture on, use Claude, then run the eval again.");
    }
    const childArgs = [EVAL_SCRIPT, "--dataset", captures];
    if (args[0]) childArgs.push("--prompts", args[0]);
    const result = spawnSync(process.execPath, childArgs, { encoding: "utf8", timeout: 30 * 60_000 });
    if (result.status !== 0) throw new Error(result.stderr || "Eval failed");
    const report = result.stdout.trim().split("\n").at(-1);
    return `Eval complete. Report: ${report}\nRun /dejargonize report to open it.`;
  }

  const config = await loadConfig();
  if (command === "on" || command === "off") {
    config.enabled = command === "on";
  } else if (command === "capture") {
    config.capture = boolValue((args[0] || "").toLowerCase());
  } else if (command === "model") {
    const model = args[0];
    if (!model || !/^[A-Za-z0-9._:/-]+$/.test(model)) throw new Error("Provide a valid model name");
    if (!ollamaModels().includes(model)) throw new Error(`Model ${model} is not installed. Install it with: ollama pull ${model}`);
    config.model = model;
  } else if (command === "prompt") {
    const prompt = args[0];
    if (!prompt || !(await promptVersions()).includes(prompt)) throw new Error(`Unknown prompt. Available: ${(await promptVersions()).join(", ")}`);
    config.promptVersion = prompt;
  } else if (command === "context") {
    const value = (args[0] || "").toLowerCase();
    if (!["latest-user", "none"].includes(value)) throw new Error("Context must be latest-user or none");
    config.contextMode = value;
  } else if (command === "temperature") {
    const value = Number(args[0]);
    if (!Number.isFinite(value) || value < 0 || value > 2) throw new Error("Temperature must be between 0 and 2");
    config.temperature = value;
  } else if (command === "minimum-length") {
    const value = Number(args[0]);
    if (!Number.isInteger(value) || value < 0 || value > 10_000) throw new Error("Minimum length must be an integer from 0 to 10000");
    config.minimumLength = value;
  } else {
    throw new Error(`Unknown command: ${command}\n\n${HELP}`);
  }

  await saveConfig(config);
  return status();
}

main().then((output) => {
  process.stdout.write(`${output}\n`);
}).catch((error) => {
  process.stderr.write(`dejargonize: ${error instanceof Error ? error.message : String(error)}\n`);
  process.exitCode = 1;
});
