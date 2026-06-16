#!/usr/bin/env node
/**
 * GENIUS GIRL WEEKLY DIGEST — research engine
 *
 * Runs once a week. Calls the Anthropic API with web search enabled,
 * gathers the week's intelligence across four tracks, and writes a dated
 * JSON file into ../data. The dashboard reads those JSON files.
 *
 * Nothing here updates itself. A scheduler runs this file. That is the
 * "agentic" part: a scheduled command, fully under your control.
 *
 * Required env var: ANTHROPIC_API_KEY
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, "..", "data");

const API_KEY = process.env.ANTHROPIC_API_KEY;
if (!API_KEY) {
  console.error("Missing ANTHROPIC_API_KEY. Set it before running.");
  process.exit(1);
}

const MODEL = "claude-opus-4-8";

// ---- The four research tracks -------------------------------------------
// Each track is one API call. Splitting them keeps each answer focused and
// makes a single failure non-fatal: three tracks still publish.

const TRACKS = [
  {
    id: "product",
    label: "Product Management",
    prompt: `You are briefing a new AI Automations Product Manager at Vocal Media, where the work centers on AI content pipelines, creator and editorial tooling, and audience automation. Frame every result for that specific context.
Search the web for this week's most useful product management thinking, with a bias toward AI product work.
Favor material that builds AI product judgment for someone early in an AI PM role. Skip introductory "what is product management" content.
Return 4 to 6 items. For each: a short headline, a 2 sentence plain-language summary, why it matters to a working PM, and the source name plus URL.
Cover a mix of: frameworks, real shipped-product stories, how teams measure AI product success (metrics, evaluation, and what good looks like), how AI PM roles are being scoped across the industry, and one genuinely useful tactic she can apply this week.
Use clear simple language. No hype words.`,
  },
  {
    id: "automations",
    label: "AI Automations & Claude Craft",
    prompt: `You are briefing a fluent AI practitioner who builds AI automations and uses Claude daily. Assume they already know prompting basics. Skip beginner advice. Surface things that would be new even to someone experienced.
Search the web for this week's new and genuinely useful: Claude features, prompting techniques, automation patterns, agent workflows, MCP tools, and clever tricks people are actually shipping.
Keep most items applicable to someone who uses Claude daily, but always include at least one technique or tool from the broader AI automation world so the digest is not Claude-only.
Return 4 to 6 items. For each: headline, a 2 sentence summary, a concrete "try this" takeaway, and source name plus URL.
The "try this" takeaway must include the actual artifact, not a description of it. If the item is a prompt, write out the full copyable prompt text. If it is an automation or agent pattern, spell out the trigger and the action steps. If it is a feature, give the exact steps to use it. The reader should be able to paste or follow it directly with no reconstruction.
Favor specific, copyable techniques over think-pieces. Plain language, no hype.`,
  },
  {
    id: "world",
    label: "AI Tech World",
    prompt: `You are briefing someone who wants to follow the AI industry, US and international.
Search the web for this week's notable AI stories: model releases, company moves, funding, regulation, research, and international developments (China, EU, UK, India, Gulf states).
Treat AI developments in media, publishing, and creator platforms abroad as in-scope, since the reader works at a media company.
Return 4 to 5 items. For each: headline, a short paragraph of 3 to 4 sentences that explains what happened, the context behind it, and why it matters (enough that the reader actually understands the story, not just registers it), region tag, and source name plus URL.
At least half of the items must be non-US stories, and never fewer than 2 non-US items. Do not let US news crowd out international coverage even in a heavy US week. Plain language, no hype.`,
  },
  {
    id: "politics",
    label: "US Political Spectrum",
    prompt: `You are briefing someone at a very progressive media company who wants to read ACROSS the spectrum, not just her own side.
Search the web for this week's most significant US political developments, with election-season relevance. Use sources from the past week only. Do not recirculate older framings; recency matters especially in election season.
Pick the 3 to 4 biggest stories of the week. For EACH story, give three reads:
1. PROGRESSIVE framing — how left-leaning outlets present it
2. NEUTRAL framing — straight wire-service / centrist reporting of the facts
3. CONSERVATIVE framing — how right-leaning outlets present it
For each framing: name the specific outlet plus URL, mark whether it comes from news reporting or from an opinion/editorial piece (those are different things), and write 2 to 3 sentences — enough to convey that side's actual reasoning, not a single thin line.
For each story also give a "what actually happened" factual anchor: something the reader could state confidently to anyone of any politics, written with no loaded or partisan language. Make it the neutral spine of the story.
Be fair and accurate to each side's strongest version. Steel-manning applies to genuine disagreements of value, priority, and interpretation. But when a framing depends on a claim that is demonstrably and factually false, state that plainly rather than presenting it at its "strongest." Do not launder a false factual claim into something that sounds reasonable. This protects the reader from spin on every side, including her own.
Do not editorialize. Plain language.`,
  },
];

// ---- Narration stripper -------------------------------------------------
// Removes the model's search narration from the front of a briefing, leaving
// only the briefing itself. Mirrors the same logic in index.html.

const NARR =
  /^(i'?ll\b|i will\b|i now\b|let me\b|let'?s\b|i have\b|i've\b|i need\b|here'?s (your|the)\b|here is (your|the)\b|now[,. ]|first[,. ]|good[.,! ]|searching\b|i found\b|i can see\b|okay\b|got it\b)/i;

function stripNarration(body) {
  let paras = String(body || "").split(/\n\n+/);
  while (paras.length) {
    const p = paras[0].trim();
    const structured = /^(#|\*\*|\d+[.)]|-{3,}$|>|\|)/.test(p) || /https?:\/\//.test(p);
    if (p === "---" || p === "" || (NARR.test(p) && p.length < 360 && !structured)) {
      paras.shift();
    } else break;
  }
  return paras.join("\n\n").trim();
}

// ---- API call -----------------------------------------------------------

async function runTrack(track) {
  const body = {
    model: MODEL,
    max_tokens: 4000,
    messages: [
      {
        role: "user",
        content:
          track.prompt +
          `\n\nOutput ONLY the final briefing in clean markdown. Do not narrate your search process or include lead-in lines like "I'll search…", "Let me…", or "Here's your briefing." Start directly with the briefing content.`,
      },
    ],
    tools: [{ type: "web_search_20250305", name: "web_search", max_uses: 8 }],
  };

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": API_KEY,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Track ${track.id} failed: ${res.status} ${text}`);
  }

  const data = await res.json();

  // The final briefing lives in the text block(s) AFTER the last web search.
  // Text emitted *between* searches is just the model narrating ("Let me
  // search…"), so we take only what comes after the last tool block.
  const blocks = data.content || [];
  let lastTool = -1;
  blocks.forEach((b, i) => {
    if (b.type === "server_tool_use" || b.type === "web_search_tool_result") lastTool = i;
  });
  const answer = (lastTool >= 0 ? blocks.slice(lastTool + 1) : blocks)
    .filter((b) => b.type === "text")
    .map((b) => b.text)
    .join("\n\n")
    .trim();
  // Fallback to all text if the answer somehow landed before the final search,
  // then strip any leftover narration lead-in from the front.
  const allText = blocks.filter((b) => b.type === "text").map((b) => b.text).join("\n\n").trim();
  const text = stripNarration(answer || allText);

  // Collect cited source URLs from any web_search_tool_result blocks so we
  // keep a clean source list even if the prose misses one.
  const sources = [];
  for (const block of data.content || []) {
    if (block.type === "web_search_tool_result" && Array.isArray(block.content)) {
      for (const r of block.content) {
        if (r.url) sources.push({ title: r.title || r.url, url: r.url });
      }
    }
  }

  return { id: track.id, label: track.label, body: text, sources };
}

// ---- ISO week helper ----------------------------------------------------

function isoWeek(d) {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const dayNum = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((date - yearStart) / 86400000 + 1) / 7);
  return { year: date.getUTCFullYear(), week };
}

// ---- Main ---------------------------------------------------------------

async function main() {
  const now = new Date();
  const { year, week } = isoWeek(now);
  const id = `${year}-W${String(week).padStart(2, "0")}`;

  console.log(`Running digest for ${id} ...`);

  const tracks = [];
  for (const t of TRACKS) {
    try {
      console.log(`  -> ${t.label}`);
      tracks.push(await runTrack(t));
    } catch (err) {
      console.error(`  !! ${t.label} failed: ${err.message}`);
      tracks.push({
        id: t.id,
        label: t.label,
        body: "This track could not be generated this week.",
        sources: [],
        error: true,
      });
    }
  }

  const digest = {
    id,
    year,
    week,
    generatedAt: now.toISOString(),
    dateLabel: now.toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    }),
    tracks,
  };

  fs.mkdirSync(DATA_DIR, { recursive: true });

  // Save this week's file.
  fs.writeFileSync(
    path.join(DATA_DIR, `${id}.json`),
    JSON.stringify(digest, null, 2)
  );

  // Rebuild the index of all weeks, newest first.
  const files = fs
    .readdirSync(DATA_DIR)
    .filter((f) => /^\d{4}-W\d{2}\.json$/.test(f))
    .sort()
    .reverse();

  const index = files.map((f) => {
    const d = JSON.parse(fs.readFileSync(path.join(DATA_DIR, f), "utf8"));
    return { id: d.id, dateLabel: d.dateLabel, generatedAt: d.generatedAt };
  });

  fs.writeFileSync(
    path.join(DATA_DIR, "index.json"),
    JSON.stringify(index, null, 2)
  );

  console.log(`Done. Wrote ${id}.json and refreshed index.json (${index.length} weeks archived).`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
