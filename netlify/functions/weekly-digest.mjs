/**
 * Netlify scheduled function — Option B trigger.
 *
 * By default the GitHub Actions cron does everything (see the README, Option A)
 * and you do not need this. This function is for people who want Netlify to hold
 * the schedule instead. It fires every Monday and tells GitHub to run the
 * "Weekly Digest" workflow via a workflow_dispatch event.
 *
 * Required environment variables (set in Netlify -> Site settings -> Env vars):
 *   GH_DISPATCH_TOKEN  a GitHub fine-grained token with Actions: read and write
 *   GH_REPO            e.g. "leerokii/big-brain-palace"
 *
 * Keep the schedule below in sync with .github/workflows/weekly-digest.yml.
 */

export const config = {
  // Monday at 13:00 UTC. Standard cron format.
  schedule: "0 13 * * 1",
};

export default async (req) => {
  const token = process.env.GH_DISPATCH_TOKEN;
  const repo = process.env.GH_REPO;

  if (!token || !repo) {
    console.error("Missing GH_DISPATCH_TOKEN or GH_REPO. Skipping dispatch.");
    return new Response("Not configured", { status: 500 });
  }

  const url = `https://api.github.com/repos/${repo}/actions/workflows/weekly-digest.yml/dispatches`;

  const res = await fetch(url, {
    method: "POST",
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${token}`,
      "X-GitHub-Api-Version": "2022-11-28",
      "User-Agent": "big-brain-palace-scheduler",
    },
    body: JSON.stringify({ ref: "main" }),
  });

  if (!res.ok) {
    const text = await res.text();
    console.error(`GitHub dispatch failed: ${res.status} ${text}`);
    return new Response("Dispatch failed", { status: 502 });
  }

  console.log("Weekly digest workflow dispatched to GitHub.");
  return new Response("Dispatched", { status: 200 });
};
