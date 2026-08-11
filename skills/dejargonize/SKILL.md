---
name: dejargonize
description: Install, configure, evaluate, or remove the local Ollama-powered plain-language MessageDisplay hook. Use only when the user invokes /dejargonize or explicitly asks to manage the dejargonizer/plain-language rewrite hook.
allowed-tools: Bash(node ${CLAUDE_SKILL_DIR}/scripts/configure.mjs *), Bash(node ${CLAUDE_SKILL_DIR}/scripts/install.mjs *), Bash(node ${CLAUDE_SKILL_DIR}/scripts/uninstall.mjs *)
---

# Dejargonize

Dispatch the user's arguments to the deterministic helper scripts.

- For `install`, run:
  ```bash
  node "${CLAUDE_SKILL_DIR}/scripts/install.mjs" <remaining arguments>
  ```
- For `uninstall`, run:
  ```bash
  node "${CLAUDE_SKILL_DIR}/scripts/uninstall.mjs" <remaining arguments>
  ```
- For every other command, run:
  ```bash
  node "${CLAUDE_SKILL_DIR}/scripts/configure.mjs" $ARGUMENTS
  ```
- With no arguments, run the configuration helper with `help`.

Reply with the exact marker `<!-- DEJARGONIZE_BYPASS -->` followed by the helper's output. Do not change, summarize, or manually reproduce the output. Do not edit Claude settings or dejargonizer configuration by hand.

Installation downloads `qwen3:8b` when it is missing. Pass `--skip-model` only when the user explicitly requests it. Uninstall preserves configuration and eval data by default; pass `--purge` only when explicitly requested.
