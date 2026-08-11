#!/usr/bin/env node

import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { homedir } from "node:os";
import { basename, join, resolve } from "node:path";
import { EVAL_ROOT, loadConfig, rewriteText, textMetrics } from "./rewrite.mjs";

function parseArgs(argv) {
  const args = {};
  for (let index = 0; index < argv.length; index += 1) {
    const item = argv[index];
    if (!item.startsWith("--")) continue;
    const [key, inline] = item.slice(2).split("=", 2);
    if (inline !== undefined) args[key] = inline;
    else if (index + 1 < argv.length && !argv[index + 1].startsWith("--")) args[key] = argv[++index];
    else args[key] = true;
  }
  return args;
}

function hash(value) {
  return createHash("sha256").update(value).digest("hex").slice(0, 12);
}

async function loadDataset(path) {
  const raw = await readFile(path, "utf8");
  const records = path.endsWith(".json") && !path.endsWith(".jsonl")
    ? JSON.parse(raw)
    : raw.split("\n").filter(Boolean).map((line, index) => {
        try { return JSON.parse(line); }
        catch (error) { throw new Error(`Invalid JSON on ${path}:${index + 1}: ${error.message}`); }
      });
  const list = Array.isArray(records) ? records : records.cases;
  if (!Array.isArray(list)) throw new Error("Dataset must be a JSON array, {cases: []}, or JSONL");

  const seen = new Set();
  const cases = [];
  for (const [index, record] of list.entries()) {
    const original = record.original ?? record.input ?? record.text;
    if (typeof original !== "string" || !original.trim()) continue;
    const contentHash = hash(original);
    if (seen.has(contentHash)) continue;
    seen.add(contentHash);
    cases.push({
      id: record.id ?? `case-${index + 1}-${contentHash}`,
      category: record.category ?? "uncategorized",
      title: record.title ?? `Case ${index + 1}`,
      userIntent: typeof (record.userIntent ?? record.latestUserPrompt) === "string"
        ? (record.userIntent ?? record.latestUserPrompt)
        : null,
      original,
    });
  }
  if (cases.length === 0) throw new Error("Dataset contains no usable text cases");
  return cases;
}

function htmlDocument(report) {
  const data = JSON.stringify(report).replace(/</g, "\\u003c");
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Plain-language rewrite eval</title>
<style>
:root{color-scheme:dark;--bg:#0b0d10;--panel:#14181d;--line:#29313a;--text:#e8edf2;--muted:#94a0ad;--green:#5bd69a;--red:#ff7b84;--blue:#79b8ff;--amber:#f4c66a}*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--text);font:14px/1.55 ui-sans-serif,system-ui,-apple-system,sans-serif}header{position:sticky;top:0;z-index:2;background:rgba(11,13,16,.94);backdrop-filter:blur(12px);border-bottom:1px solid var(--line);padding:18px 24px}h1{font-size:20px;margin:0 0 8px}.meta,.muted{color:var(--muted)}main{max-width:1500px;margin:auto;padding:24px}.toolbar{display:flex;gap:10px;flex-wrap:wrap;margin:14px 0}.toolbar select,.toolbar button{background:var(--panel);color:var(--text);border:1px solid var(--line);border-radius:7px;padding:7px 10px}.summary{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:10px;margin:18px 0}.stat{background:var(--panel);border:1px solid var(--line);border-radius:9px;padding:12px}.stat strong{display:block;font-size:20px}.case{background:var(--panel);border:1px solid var(--line);border-radius:10px;margin:16px 0;overflow:hidden}.case-head{padding:12px 15px;border-bottom:1px solid var(--line);display:flex;justify-content:space-between;gap:12px;flex-wrap:wrap}.bad{color:var(--red)}.good{color:var(--green)}.columns{display:grid;grid-template-columns:1fr 1fr}.column{padding:15px;min-width:0}.column+ .column{border-left:1px solid var(--line)}.label{font-weight:700;color:var(--blue);margin-bottom:8px}pre{white-space:pre-wrap;overflow-wrap:anywhere;margin:0;font:13px/1.55 ui-monospace,SFMono-Regular,Menlo,monospace}.metrics{padding:10px 15px;border-top:1px solid var(--line);color:var(--muted);display:flex;gap:16px;flex-wrap:wrap}.ratings{padding:10px 15px;border-top:1px solid var(--line);display:flex;gap:18px;align-items:center;flex-wrap:wrap}.ratings label{color:var(--muted)}.ratings select{margin-left:6px;background:var(--bg);color:var(--text);border:1px solid var(--line);padding:4px}.diff{padding:15px;border-top:1px solid var(--line);background:#101318}.diff ins{background:#163b2a;color:#b8f5d4;text-decoration:none}.diff del{background:#492329;color:#ffd0d4}details summary{cursor:pointer;color:var(--blue)}@media(max-width:850px){.columns{grid-template-columns:1fr}.column+ .column{border-left:0;border-top:1px solid var(--line)}}
</style></head>
<body><header><h1>Plain-language rewrite eval</h1><div class="meta" id="meta"></div><div class="toolbar"><select id="combo"></select><select id="category"></select><button id="export">Export ratings</button></div></header><main><section class="summary" id="summary"></section><section id="cases"></section></main>
<script>
const REPORT=${data};
const ratings=JSON.parse(localStorage.getItem('plain-language-ratings:'+REPORT.runId)||'{}');
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const comboKey=r=>r.model+' / '+r.promptVersion;
const combos=[...new Set(REPORT.results.map(comboKey))];
const categories=[...new Set(REPORT.results.map(r=>r.category))];
const combo=document.querySelector('#combo'),category=document.querySelector('#category');
combo.innerHTML='<option value="all">All model/prompt combinations</option>'+combos.map(x=>'<option>'+esc(x)+'</option>').join('');
category.innerHTML='<option value="all">All categories</option>'+categories.map(x=>'<option>'+esc(x)+'</option>').join('');
document.querySelector('#meta').textContent=REPORT.createdAt+' · '+REPORT.dataset+' · '+REPORT.caseCount+' cases';
function tokens(s){return s.match(/(\\s+|[A-Za-z0-9_]+|[^\\sA-Za-z0-9_])/g)||[]}
function diff(a,b){const A=tokens(a),B=tokens(b);if(A.length*B.length>400000)return '<span class="muted">Diff omitted for long response.</span>';const dp=Array.from({length:A.length+1},()=>new Uint16Array(B.length+1));for(let i=A.length-1;i>=0;i--)for(let j=B.length-1;j>=0;j--)dp[i][j]=A[i]===B[j]?dp[i+1][j+1]+1:Math.max(dp[i+1][j],dp[i][j+1]);let i=0,j=0,out='';while(i<A.length||j<B.length){if(i<A.length&&j<B.length&&A[i]===B[j]){out+=esc(A[i]);i++;j++}else if(j<B.length&&(i===A.length||dp[i][j+1]>=dp[i+1][j])){out+='<ins>'+esc(B[j++])+'</ins>'}else{out+='<del>'+esc(A[i++])+'</del>'}}return out}
function filtered(){return REPORT.results.filter(r=>(combo.value==='all'||comboKey(r)===combo.value)&&(category.value==='all'||r.category===category.value))}
function ratingSelect(id,field,value){return '<label>'+field+'<select data-id="'+esc(id)+'" data-field="'+field+'"><option value="">—</option>'+[1,2,3,4,5].map(n=>'<option '+(String(value)===String(n)?'selected':'')+'>'+n+'</option>').join('')+'</select></label>'}
function render(){const rows=filtered();const ok=rows.filter(r=>!r.error);const latency=ok.map(r=>r.latencyMs).sort((a,b)=>a-b);const median=latency.length?latency[Math.floor(latency.length/2)]:0;const jargon=ok.reduce((n,r)=>n+r.beforeMetrics.jargonCount-r.afterMetrics.jargonCount,0);document.querySelector('#summary').innerHTML='<div class="stat"><strong>'+rows.length+'</strong><span class="muted">results</span></div><div class="stat"><strong>'+ok.length+'</strong><span class="muted">successful</span></div><div class="stat"><strong>'+median+' ms</strong><span class="muted">median latency</span></div><div class="stat"><strong>'+jargon+'</strong><span class="muted">jargon terms removed</span></div>';
document.querySelector('#cases').innerHTML=rows.map(r=>{const rate=ratings[r.resultId]||{};return '<article class="case"><div class="case-head"><strong>'+esc(r.title)+'</strong><span>'+esc(comboKey(r))+' · '+esc(r.category)+(r.error?' · <span class="bad">'+esc(r.error)+'</span>':'')+'</span></div>'+(r.userIntent?'<details><summary class="metrics">Show user intent</summary><pre class="diff">'+esc(r.userIntent)+'</pre></details>':'')+'<div class="columns"><div class="column"><div class="label">Before</div><pre>'+esc(r.original)+'</pre></div><div class="column"><div class="label">After</div><pre>'+esc(r.rewritten)+'</pre></div></div><div class="metrics"><span>Latency: '+r.latencyMs+' ms</span><span>Words: '+r.beforeMetrics.words+' → '+r.afterMetrics.words+'</span><span>Avg sentence: '+r.beforeMetrics.averageSentenceWords+' → '+r.afterMetrics.averageSentenceWords+'</span><span>Jargon: '+r.beforeMetrics.jargonCount+' → '+r.afterMetrics.jargonCount+'</span><span>Protected: '+r.protectedCount+'</span></div><div class="ratings">'+ratingSelect(r.resultId,'clarity',rate.clarity)+ratingSelect(r.resultId,'meaning',rate.meaning)+ratingSelect(r.resultId,'style',rate.style)+'</div><details><summary class="metrics">Show word diff</summary><pre class="diff">'+diff(r.original,r.rewritten)+'</pre></details></article>'}).join('');document.querySelectorAll('.ratings select').forEach(el=>el.onchange=()=>{ratings[el.dataset.id]||={};ratings[el.dataset.id][el.dataset.field]=el.value;localStorage.setItem('plain-language-ratings:'+REPORT.runId,JSON.stringify(ratings))})}
combo.onchange=category.onchange=render;document.querySelector('#export').onclick=()=>{const blob=new Blob([JSON.stringify({runId:REPORT.runId,ratings},null,2)],{type:'application/json'});const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='ratings-'+REPORT.runId+'.json';a.click();URL.revokeObjectURL(a.href)};render();
</script></body></html>`;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    console.log("Usage: node eval.mjs --dataset FILE [--models qwen3:8b,...] [--prompts v1,v2] [--output DIR]");
    return;
  }
  const config = await loadConfig();
  const datasetPath = resolve(args.dataset || join(EVAL_ROOT, "captures.jsonl"));
  const models = (args.models || config.model).split(",").map((x) => x.trim()).filter(Boolean);
  const prompts = (args.prompts || config.promptVersion).split(",").map((x) => x.trim()).filter(Boolean);
  const cases = await loadDataset(datasetPath);
  const runId = new Date().toISOString().replace(/[:.]/g, "-");
  const outputDir = resolve(args.output || join(EVAL_ROOT, "runs", runId));
  await mkdir(outputDir, { recursive: true });

  const results = [];
  const total = cases.length * models.length * prompts.length;
  let completed = 0;
  for (const testCase of cases) {
    for (const model of models) {
      for (const promptVersion of prompts) {
        completed += 1;
        process.stderr.write(`[${completed}/${total}] ${testCase.id} · ${model} · ${promptVersion}\n`);
        const started = performance.now();
        let rewritten = testCase.original;
        let metadata = { latencyMs: 0, protectedCount: 0 };
        let error = null;
        try {
          const outcome = await rewriteText(testCase.original, {
            model,
            promptVersion,
            intentContext: testCase.userIntent,
          });
          rewritten = outcome.text;
          metadata = outcome.metadata;
        } catch (cause) {
          error = cause instanceof Error ? cause.message : String(cause);
          metadata.latencyMs = Math.round(performance.now() - started);
        }
        results.push({
          resultId: hash(`${testCase.id}\0${model}\0${promptVersion}`),
          ...testCase,
          model,
          promptVersion,
          rewritten,
          latencyMs: metadata.latencyMs,
          protectedCount: metadata.protectedCount ?? 0,
          skipped: metadata.skipped ?? false,
          error,
          beforeMetrics: textMetrics(testCase.original),
          afterMetrics: textMetrics(rewritten),
        });
      }
    }
  }

  const report = {
    runId,
    createdAt: new Date().toISOString(),
    dataset: basename(datasetPath),
    datasetPath,
    caseCount: cases.length,
    models,
    prompts,
    results,
  };
  await writeFile(join(outputDir, "results.json"), JSON.stringify(report, null, 2) + "\n");
  await writeFile(join(outputDir, "report.html"), htmlDocument(report));
  console.log(join(outputDir, "report.html"));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.stack : error);
  process.exitCode = 1;
});
