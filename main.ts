// GTA 6 Trophy Guide & Tracker — entry program (Node 22, standard library only).
//
// The guide itself is app/: plain static files (app/index.html, app.js,
// style.css, app/data/trophies.json) that any static server can serve and a
// desktop browser opens with the network off. No build step, no fetch at
// run time beyond the app's own trophies.json.
//
// This program hands the guide in: it checks the trophy file first (it
// must hold all 55 trophies, each with a name and a non-blank guide),
// copies app/ and screenshots/ from beside this file to /output, and
// writes /output/dossier.json with the vendored make.fun library.
// vendor/makefun-frontend.ts is the kit's copy, left unchanged: the scorer
// requires dossier.json to be byte for byte what its own copy writes.
//
// Run it locally with:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
// (Outside the grader, MAKEFUN_OUTPUT_DIR stands in for /output.)

import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-frontend.ts';

const EXPECTED_TROPHIES = 55;
const MAX_SCREENSHOTS = 4;
const MAX_SCREENSHOT_BYTES = 262144;

const here = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

function checkTrophyFile() {
  const raw = readFileSync(join(here, 'app', 'data', 'trophies.json'), 'utf8');
  const doc = JSON.parse(raw);
  const trophies = Array.isArray(doc) ? doc : doc.trophies;
  if (!Array.isArray(trophies) || trophies.length !== EXPECTED_TROPHIES) {
    throw new Error(`app/data/trophies.json must hold ${EXPECTED_TROPHIES} trophies, found ${Array.isArray(trophies) ? trophies.length : 'none'}`);
  }
  const missing = trophies.filter((t) => !t || typeof t.name !== 'string' || !t.name.trim() || typeof t.guide !== 'string' || !t.guide.trim());
  if (missing.length > 0) {
    throw new Error(`app/data/trophies.json has ${missing.length} trophies without a name or a guide`);
  }
  const names = new Set(trophies.map((t) => t.name));
  if (names.size !== EXPECTED_TROPHIES) throw new Error('app/data/trophies.json holds duplicate trophy names');
}

function checkScreenshots() {
  const dir = join(here, 'screenshots');
  if (!existsSync(dir)) throw new Error('screenshots/ is missing: the entry needs 3 or 4 real renders of the guide');
  const files = readdirSync(dir).filter((f) => !f.startsWith('.') && statSync(join(dir, f)).isFile());
  if (files.length < 3 || files.length > MAX_SCREENSHOTS) {
    throw new Error(`screenshots/ must hold 3 or 4 images, found ${files.length}`);
  }
  for (const f of files) {
    if (!/\.(png|jpe?g)$/i.test(f)) throw new Error(`screenshots/${f} is not a PNG or JPEG`);
    if (statSync(join(dir, f)).size > MAX_SCREENSHOT_BYTES) throw new Error(`screenshots/${f} is over 256 KiB`);
  }
}

checkTrophyFile();
checkScreenshots();

mkdirSync(out, { recursive: true });
cpSync(join(here, 'app'), join(out, 'app'), { recursive: true });
mkdirSync(join(out, 'screenshots'), { recursive: true });
cpSync(join(here, 'screenshots'), join(out, 'screenshots'), { recursive: true });

// The scorer's own caps: only text_max_bytes shapes the bytes; the others
// refuse an entry the scorer would refuse (more than 4 screenshots or one
// over 256 KiB; more than 993 files and directories in app/ or 48 MiB of
// app files: app/ counts beside /output's own 1000-entry cap, its
// screenshots/ and dossier.json).
writeFileSync(
  join(out, 'dossier.json'),
  buildDossier(out, { text_max_bytes: 163840, screenshots: { max: 4, max_bytes: 262144 }, app_max_files: 993, app_max_bytes: 50331648 }),
);
