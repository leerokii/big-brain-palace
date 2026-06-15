# Big Brain Palace — Claude Code Playbook

You start from working files. Claude Code walks you through each one so you understand it, shape it to your taste, then deploy. You're present for every step. Nothing is broken on day one.

Paste each prompt into Claude Code one at a time. Read what it does. Push back where you want changes. Move on only when you're happy.

---

## Before you open Claude Code

Three browser tabs ready.

- Your Anthropic API key from console.anthropic.com
- A new empty GitHub repo called `big-brain-palace`
- Netlify, logged in

Put the `big-brain-palace` folder (the one you downloaded) somewhere you can find it.

---

## Step 1. Open Claude Code inside the folder

In your terminal:

```
cd path/to/big-brain-palace
claude
```

Claude Code opens inside your project with all the files already there.

---

## Step 2. Have it read and explain the project

Paste this first. You're orienting yourself before changing anything.

```
This is Big Brain Palace, a self-updating weekly research dashboard. Read every file in this project and give me a plain-language map: what each file does, how the weekly update flows from research script to JSON to dashboard, and where the four research tracks are defined. Don't change anything yet. I want to understand what I have before I customize it.
```

Read its summary. Ask follow-up questions on anything unclear. This is your foundation.

---

## Step 3. Customize the research tracks

The four prompts that decide what gets researched live in `scripts/research.mjs`. Tune them to you.

```
Open scripts/research.mjs and show me the four track prompts. I want to customize them. For each, explain what it currently asks for, then help me sharpen it. Specifically:
- Product Management: bias it toward AI product management at a media company.
- AI Automations and Claude Craft: I want copyable prompts and automation tricks I can use that week, not think-pieces.
- AI Tech World: keep the US and international balance.
- US Political Spectrum: keep the progressive, neutral and conservative three-way read with a factual anchor. This is the one I care most about getting right.
Make the edits, then show me the before and after for each.
```

Read each change. Tell it to adjust anything that doesn't sound like you.

---

## Step 4. Run one real digest

Prove the engine works with your key before touching anything else.

```
Walk me through running this locally with my real Anthropic API key so I can see one real week of research. Tell me exactly what to type, including how to set up the .env file safely so my key never gets committed.
```

Follow its steps. When it finishes, open the new file in `data/`. Read your first real Big Brain Palace digest. If a track reads wrong, go back to Step 3 and refine.

---

## Step 5. Customize the design

The look is yours to shape. Have Claude Code show you, then change it live.

```
Serve the project locally and screenshot index.html so I can see the current design. Browsers block file:// fetches, so use a local server. Then walk me through the design choices: the colors, the fonts, the week archive rail, the track tabs. I want to make it feel more mine.
```

Now react to what you see. Be specific and blunt. Examples that work well:

- "The cyan is too cold, warm it slightly"
- "Make the headline bigger and heavier"
- "I want the archive rail wider"
- "Add a soft glow behind the live week"

After each change:

```
Screenshot it again so I can see the change.
```

Loop until you love it.

---

## Step 6. Check the automation, then push live

```
Explain the automation to me: open .github/workflows/weekly-digest.yml and netlify.toml and tell me in plain language how the weekly run fires, where my API key lives, and how a new week ends up on the live site. Then give me the exact git commands to push this to github.com/leerokii/big-brain-palace.
```

Then the deploy checklist:

```
Give me a numbered checklist for going live:
1. Adding ANTHROPIC_API_KEY as a GitHub Actions secret
2. Running one manual test from the Actions tab to confirm it commits a real week
3. Connecting the repo to Netlify with the right publish settings
Walk me through each as if I've never used GitHub Actions or Netlify before.
```

Follow it in your browser. Once the manual run commits a week and Netlify deploys, Big Brain Palace is live and updating itself every Monday.

---

## The rhythm that keeps Claude Code on track

- One step at a time. Don't say "do all of it."
- Test after each step. Run the script. Screenshot the page.
- Be blunt with feedback. "That gold is muddy, try brass" beats a polite hint.
- When a step looks right, say so, then move on.

---

## If you ever want to change things later

- New research focus: edit the prompts in `scripts/research.mjs`.
- Different schedule: edit the `cron` line in `.github/workflows/weekly-digest.yml`. `0 13 * * 1` is Monday 13:00 UTC.
- A new track: ask Claude Code to add one to the `TRACKS` array. The dashboard adapts automatically.
