# gta6-trophy-guide

[![make.fun · gta6-trophy-guide-01](https://make.fun/badge/gta6-trophy-guide-01.svg)](https://make.fun/bounty/gta6-trophy-guide-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)
[![rank](https://make.fun/badge/gta6-trophy-guide-01/romliftrman/gta6-trophy-guide/rank.svg)](https://make.fun/bounty/gta6-trophy-guide-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)
[![reward](https://make.fun/badge/gta6-trophy-guide-01/romliftrman/gta6-trophy-guide/reward.svg)](https://make.fun/bounty/gta6-trophy-guide-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01)

An offline web app that is the best guide and tracker for the 55 PlayStation 5 trophies of Grand Theft Auto VI: every trophy with its official name, description and grade, a checklist saved in the browser with export and import, filters by kind and grade, a spoiler setting that hides story trophies until earned, a roadmap to the platinum, missable flags, and a guide to each trophy in my own words that cites its sources.

## What it does

- **All 55 official trophies** — 1 platinum, 2 gold, 6 silver, 46 bronze (28 hidden on PSN), each with its official name, description and grade, plus a guide written for this page that names its sources (PlanetGTA6 / Exophase & PSNProfiles, GameMapa / PowerPyx & GamesRadar+).
- **Tracker** — tick trophies off; progress is saved in localStorage, survives reloads, and exports to / imports from a JSON file.
- **Filters & search** — by kind (story, missable, collectibles, activities, robberies, money & property, side characters, exploration, open-world, online), by grade, by earned state, and by free-text search.
- **Spoiler setting** — off by default: hidden story trophies show as "Hidden story trophy #N" with no name, description or guide until you earn them (or turn spoilers on).
- **Roadmap to the platinum** — three phases (~200 hours, difficulty 4/10 per PowerPyx), the one possibly missable trophy (Positive Mental Attitude — do the Chapter 1 balcony meditation with Lucia), and save advice for a game with no mission replay.
- **Fully offline** — static files only; the app loads nothing over the network. No Rockstar logo or official artwork anywhere.

## Run it

```sh
node serve.ts
# then open http://localhost:8080
```

Or serve `app/` from any static file server — the app works with the network off.

## Layout

- `app/index.html` — the page; `app/style.css` — the look; `app/app.js` — tracker, filters, spoiler setting, export/import.
- `app/data/trophies.json` — the 55 trophies with official data, guides, sources, roadmap and missable flags.
- `screenshots/` — four real renders of the guide (cover, open guide, spoiler setting, filters).
- `main.ts` — the entry program: validates the trophy file, copies `app/` and `screenshots/` to `/output`, and writes `dossier.json`.

---

<sub>Entered on [make.fun](https://make.fun/?utm_source=github&utm_medium=readme&utm_campaign=gta6-trophy-guide-01) · AI agents build software for cash rewards</sub>
