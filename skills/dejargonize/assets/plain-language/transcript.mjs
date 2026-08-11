import { open } from "node:fs/promises";

const MAX_TRANSCRIPT_TAIL_BYTES = 8 * 1024 * 1024;

function stripInjectedContext(text) {
  return text
    .replace(/<system-reminder>[\s\S]*?<\/system-reminder>/gi, "")
    .replace(/<local-command-caveat>[\s\S]*?<\/local-command-caveat>/gi, "")
    .replace(/<local-command-stdout>[\s\S]*?<\/local-command-stdout>/gi, "")
    .trim();
}

function userText(record) {
  if (!record || record.type !== "user" || !record.message) return null;
  const content = record.message.content;
  if (typeof content === "string") return stripInjectedContext(content) || null;
  if (!Array.isArray(content)) return null;

  // Tool results use the user role in Anthropic's message format but are not user prompts.
  if (content.some((part) => part && typeof part === "object" && part.type === "tool_result")) return null;
  const parts = [];
  for (const part of content) {
    if (typeof part === "string") parts.push(part);
    else if (part && typeof part === "object" && part.type === "text" && typeof part.text === "string") parts.push(part.text);
  }
  const text = stripInjectedContext(parts.join("\n"));
  return text || null;
}

function limitIntent(text, maximumCharacters) {
  if (text.length <= maximumCharacters) return text;
  const beginningLength = Math.floor(maximumCharacters * 0.25);
  const endingLength = maximumCharacters - beginningLength;
  return `${text.slice(0, beginningLength)}\n\n[...user prompt shortened...]\n\n${text.slice(-endingLength)}`;
}

export async function latestUserIntent(transcriptPath, maximumCharacters = 6000) {
  if (typeof transcriptPath !== "string" || !transcriptPath || maximumCharacters <= 0) return null;
  let handle;
  try {
    handle = await open(transcriptPath, "r");
    const info = await handle.stat();
    const length = Math.min(info.size, MAX_TRANSCRIPT_TAIL_BYTES);
    const start = Math.max(0, info.size - length);
    const buffer = Buffer.alloc(length);
    await handle.read(buffer, 0, length, start);
    const lines = buffer.toString("utf8").split("\n");
    if (start > 0) lines.shift(); // The first line may be a partial JSON record.

    for (let index = lines.length - 1; index >= 0; index -= 1) {
      if (!lines[index]?.trim()) continue;
      try {
        const text = userText(JSON.parse(lines[index]));
        if (text) return limitIntent(text, maximumCharacters);
      } catch {
        // Ignore malformed or partial transcript records.
      }
    }
    return null;
  } catch {
    return null;
  } finally {
    await handle?.close().catch(() => {});
  }
}
