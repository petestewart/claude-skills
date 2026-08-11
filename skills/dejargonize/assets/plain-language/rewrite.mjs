import { readFile } from "node:fs/promises";
import { homedir } from "node:os";
import { join } from "node:path";

export const ROOT = join(homedir(), ".claude", "plain-language");
export const EVAL_ROOT = join(homedir(), ".claude", "plain-language-evals");

const JARGON = [
  "actionable", "alignment", "bandwidth", "best-in-class", "circle back", "cross-functional",
  "deep dive", "deliverable", "ecosystem", "enablement", "end-to-end", "facilitate", "framework",
  "holistic", "impactful", "leverage", "low-hanging fruit", "north star", "operationalize",
  "optimize", "paradigm", "proactive", "robust", "scalable", "stakeholder", "strategic",
  "streamline", "synergy", "touch base", "utilize", "value-add", "visibility",
];

export async function loadConfig(overrides = {}) {
  const configured = JSON.parse(await readFile(join(ROOT, "config.json"), "utf8"));
  const config = { ...configured, ...overrides };
  config.prompt = await readFile(join(ROOT, "prompts", `${config.promptVersion}.txt`), "utf8");
  return config;
}

export function protectText(input) {
  const values = [];
  const protect = (value) => {
    const token = `__PLAIN_PROTECTED_${String(values.length).padStart(6, "0")}__`;
    values.push(value);
    return token;
  };

  let text = input;
  text = text.replace(/(^|\n)(```|~~~)[^\n]*\n[\s\S]*?\n\2(?=\n|$)/g, (match) => protect(match));
  text = text.replace(/`[^`\n]+`/g, (match) => protect(match));
  text = text.replace(/https?:\/\/[^\s)>\]}]+/g, (match) => protect(match));
  text = text.replace(/\b(?:[A-Za-z]:\\|~?\/)[^\s,;:!?"'<>()[\]{}]+/g, (match) => protect(match));
  text = text.replace(/\b[0-9a-f]{7,40}\b/gi, (match) => protect(match));
  return { text, values };
}

export function restoreText(output, values) {
  let restored = output;
  for (let index = 0; index < values.length; index += 1) {
    const token = `__PLAIN_PROTECTED_${String(index).padStart(6, "0")}__`;
    const occurrences = restored.split(token).length - 1;
    if (occurrences !== 1) throw new Error(`protected token ${index} occurred ${occurrences} times`);
    restored = restored.replace(token, values[index]);
  }
  if (/__PLAIN_PROTECTED_\d{6}__/.test(restored)) throw new Error("unknown protected token returned");
  return restored;
}

function cleanModelOutput(output) {
  let text = output.trim();
  const wrapped = text.match(/^<content>\s*([\s\S]*?)\s*<\/content>$/i);
  if (wrapped) text = wrapped[1];
  return text;
}

export function textMetrics(text) {
  const prose = text
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`[^`]*`/g, " ")
    .replace(/https?:\/\/\S+/g, " ");
  const words = prose.match(/[A-Za-z][A-Za-z'-]*/g) || [];
  const sentences = prose.split(/[.!?]+(?:\s|$)/).filter((part) => part.trim()).length || 1;
  const lower = prose.toLowerCase();
  const jargonTerms = JARGON.filter((term) => new RegExp(`\\b${term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i").test(lower));
  return {
    characters: text.length,
    words: words.length,
    sentences,
    averageSentenceWords: Number((words.length / sentences).toFixed(1)),
    jargonCount: jargonTerms.length,
    jargonTerms,
  };
}

export async function rewriteText(original, overrides = {}) {
  const config = await loadConfig(overrides);
  const startedAt = performance.now();
  if (original.trim().length < config.minimumLength) {
    return {
      text: original,
      metadata: {
        model: config.model,
        promptVersion: config.promptVersion,
        latencyMs: 0,
        skipped: true,
        protectedCount: 0,
      },
    };
  }

  const { text: protectedText, values } = protectText(original);
  const intentContext = typeof config.intentContext === "string" && config.intentContext.trim()
    ? config.intentContext.trim()
    : null;
  const intentAware = Array.isArray(config.intentAwarePrompts)
    && config.intentAwarePrompts.includes(config.promptVersion);
  const editingRequest = intentAware
    ? JSON.stringify({ user_intent: intentContext, response_to_edit: protectedText })
    : `<content>\n${protectedText}\n</content>`;
  const response = await fetch(config.ollamaUrl, {
    method: "POST",
    headers: { "content-type": "application/json" },
    signal: AbortSignal.timeout(config.timeoutMs),
    body: JSON.stringify({
      model: config.model,
      stream: false,
      think: false,
      keep_alive: config.keepAlive,
      messages: [
        { role: "system", content: config.prompt },
        { role: "user", content: editingRequest },
      ],
      options: {
        temperature: config.temperature,
        num_ctx: config.contextTokens,
        num_predict: Math.min(8192, Math.max(256, Math.ceil(original.length / 2))),
      },
    }),
  });

  if (!response.ok) throw new Error(`Ollama returned HTTP ${response.status}`);
  const body = await response.json();
  const candidate = cleanModelOutput(body?.message?.content || "");
  if (!candidate) throw new Error("Ollama returned an empty rewrite");
  const restored = restoreText(candidate, values);

  const originalSize = original.replace(/\s/g, "").length;
  const restoredSize = restored.replace(/\s/g, "").length;
  if (originalSize > 0 && restoredSize < originalSize * 0.55) throw new Error("rewrite was unexpectedly short");

  const text = restored + (original.endsWith("\n") && !restored.endsWith("\n") ? "\n" : "");
  return {
    text,
    metadata: {
      model: config.model,
      promptVersion: config.promptVersion,
      latencyMs: Math.round(performance.now() - startedAt),
      skipped: false,
      protectedCount: values.length,
      intentContextCharacters: intentAware ? (intentContext?.length ?? 0) : 0,
      ollamaEvalCount: body.eval_count ?? null,
    },
  };
}
