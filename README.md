# Big Brain Palace — Setup Guide

A self-updating intelligence terminal. Every Monday it researches four tracks, writes that week's briefing, archives it forever and redeploys itself. You set it up once. After that it runs in the background.

The four tracks:

- Product Management
- AI Automations and Claude Craft
- AI Tech World (US and international)
- US Political Spectrum (progressive, neutral and conservative reads side by side)

## How it actually works

An HTML file cannot update itself. So three pieces do the work together.

- A research script (`scripts/research.mjs`) calls Claude with web search, gathers the week's intel and saves a dated JSON file.
- GitHub Actions runs that script on a schedule, then commits the new JSON back to your repo.
- Netlify hosts the site and redeploys automatically every time the repo changes. A Netlify scheduled function pokes GitHub each Monday to start the run.

The dashboard reads every JSON file in `data/`. New weeks appear at the top. Old weeks stay in the archive forever.

## What you need

- A GitHub account (your handle: leerokii)
- A Netlify account, connected to GitHub
- An Anthropic API key from console.anthropic.com

## Step 1. Put the project on GitHub

From the project folder:

```
git init
git add .
git commit -m "Big Brain Palace digest"
git branch -M main
git remote add origin https://github.com/leerokii/big-brain-palace.git
git push -u origin main
```

Create the empty `big-brain-palace` repo on GitHub first, then run the push.

## Step 2. Add your Anthropic key to GitHub

This is the key that powers the weekly research. It lives in GitHub, never in your code.

1. Repo on GitHub. Settings. Secrets and variables. Actions.
2. New repository secret.
3. Name: `ANTHROPIC_API_KEY`. Value: your key.
4. Save.

## Step 3. Test the research run once, by hand

Before automating, confirm a real run works.

1. Repo on GitHub. Actions tab.
2. Pick "Weekly Digest" on the left.
3. Run workflow. Run workflow.

Wait two or three minutes. The job researches all four tracks and commits a fresh JSON file into `data/`. Open that file to read your first real digest.

If it fails, the most common cause is the API key. Check the secret name matches exactly.

## Step 4. Deploy to Netlify

1. Netlify. Add new site. Import an existing project.
2. Pick your `big-brain-palace` repo.
3. Build command: leave blank. Publish directory: `.`
4. Deploy.

Your terminal goes live at a Netlify URL. The dashboard reads whatever is in `data/`, so it shows the digest from Step 3 right away.

## Step 5. Turn on the weekly automation

You have two ways to fire the weekly run. Pick one.

### Option A — GitHub does everything (simplest)

The workflow already has a built-in Monday cron. Do nothing. It runs every Monday at 13:00 UTC, commits the new week and Netlify redeploys. This is the cleanest path and needs no extra setup.

### Option B — Netlify triggers GitHub (use if you want Netlify in control)

1. Create a GitHub fine-grained token. GitHub. Settings. Developer settings. Fine-grained tokens. Give it "Actions: read and write" on the `big-brain-palace` repo only.
2. In Netlify. Site settings. Environment variables. Add:
   - `GH_DISPATCH_TOKEN` = your fine-grained token
   - `GH_REPO` = `leerokii/big-brain-palace`
3. The scheduled function in `netlify/functions/weekly-digest.mjs` now fires every Monday and tells GitHub to run.

Most people use Option A. Keep Option B only if you prefer Netlify holding the schedule.

## Step 6. Make it public

Your Netlify URL is already public. To put it on your own domain:

1. Netlify. Domain settings. Add a custom domain.
2. Point your DNS as Netlify instructs.

You now have a living research terminal anyone can read.

## Reading past weeks

The left rail is your archive. The newest week shows a LIVE badge. Click any older week to load that snapshot. Archived weeks are read-only and marked with an amber flag, so you always know whether you are reading current or historical intel.

## Changing what it researches

Open `scripts/research.mjs`. The `TRACKS` array holds the four prompts. Edit any prompt to change focus, add a track or drop one. The dashboard adapts automatically to however many tracks each week contains.

## Changing how often it runs

The cron lives in two places. To change the schedule, edit both so they stay in sync.

- `.github/workflows/weekly-digest.yml` (the `cron:` line)
- `netlify/functions/weekly-digest.mjs` (the `schedule` value), only if you use Option B

Cron format is standard. `0 13 * * 1` means Monday at 13:00 UTC. For a different day, change the last number. Sunday is 0, Saturday is 6.

## Running it locally to test

```
cp .env.example .env
# paste your key into .env
node scripts/research.mjs
```

Then serve the folder so the dashboard can fetch the data:

```
npx serve .
```

Open the local URL it prints. Opening `index.html` directly with a double-click will not load data, because browsers block file-based fetches. Always serve it.

## A note on the political track

This track reads across the spectrum on purpose. For each major story it gives a progressive framing, a neutral wire-service framing and a conservative framing, plus a one-line factual anchor all sides agree on. At a progressive company this protects you. You understand your own side in depth and you are never surprised by how the other side reads the same event. The prompt is fair to each side's strongest version and does not editorialize.

## Costs

- GitHub Actions: free for this volume.
- Netlify: free tier covers it.
- Anthropic API: roughly one cent to a few cents per weekly run, depending on how much search happens. Four calls a week is tiny.
