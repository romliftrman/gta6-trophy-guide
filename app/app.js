// GTA 6 Trophy Guide & Tracker: checklist saved in localStorage, with
// export/import, kind + grade filters, search, and a spoiler setting that
// hides hidden story trophies until they are earned. No network use: the
// only fetch is the app's own data/trophies.json.
const STORAGE_KEY = 'gta6-trophy-guide-earned-v1';
const SPOILER_KEY = 'gta6-trophy-guide-spoilers-v1';

const listEl = document.getElementById('trophyList');
const statusEl = document.getElementById('status');
const searchEl = document.getElementById('search');
const kindEl = document.getElementById('kind');
const gradeEl = document.getElementById('grade');
const earnedOnlyEl = document.getElementById('earnedOnly');
const hideEarnedEl = document.getElementById('hideEarned');
const spoilersEl = document.getElementById('spoilers');

const params = new URLSearchParams(location.search);
const openId = Number(params.get('open') || 0);
if (params.get('kind')) kindEl.value = params.get('kind');
if (params.get('grade')) gradeEl.value = params.get('grade');
if (params.get('spoilers') === '1') spoilersEl.checked = true;

let earned = loadEarned();
let openGuides = new Set(openId ? [openId] : []);
let doc = null;

function loadEarned() {
  try {
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]');
    return new Set(Array.isArray(raw) ? raw.filter((n) => typeof n === 'string') : []);
  } catch {
    return new Set();
  }
}

function saveEarned() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify([...earned].sort()));
}

function setStatus(text) {
  statusEl.textContent = text;
  if (text) window.setTimeout(() => { if (statusEl.textContent === text) statusEl.textContent = ''; }, 6000);
}

function sourceUrl(shortName) {
  const hit = (doc.sources || []).find((s) => s.name.startsWith(shortName));
  return hit ? hit.url : null;
}

function isSpoilerHidden(trophy) {
  return trophy.hidden && !spoilersEl.checked && !earned.has(trophy.name);
}

function gradeLabel(grade) {
  return grade.charAt(0).toUpperCase() + grade.slice(1);
}

function renderRoadmap() {
  const roadmap = doc.roadmap;
  document.getElementById('roadmapMeta').textContent =
    `55 trophies: 1 platinum, 2 gold, 6 silver, 46 bronze · ${roadmap.time} · Difficulty ${roadmap.difficulty} · ${roadmap.playthroughs} playthrough · ${roadmap.online} online trophies.`;
  document.getElementById('phases').replaceChildren(
    ...roadmap.phases.map((phase) => {
      const li = document.createElement('li');
      const title = document.createElement('h3');
      const num = document.createElement('span');
      num.className = 'phase-no';
      num.textContent = phase.phase;
      title.append(num, document.createTextNode(phase.title));
      const time = document.createElement('p');
      time.className = 'time';
      time.textContent = phase.time;
      const text = document.createElement('p');
      text.textContent = phase.text;
      li.append(title, time, text);
      return li;
    }),
  );
  document.getElementById('missableText').textContent = roadmap.missableNote;
  document.getElementById('saveText').textContent = roadmap.saveAdvice;
}

function renderProgress() {
  const total = doc.trophies.length;
  const count = doc.trophies.filter((t) => earned.has(t.name)).length;
  const pct = Math.round((count / total) * 100);
  document.getElementById('progressText').textContent = `${count} of ${total} earned`;
  document.getElementById('progressPct').textContent = `${pct}%`;
  document.getElementById('progressFill').style.width = `${pct}%`;
  const byGrade = {};
  for (const t of doc.trophies) {
    byGrade[t.grade] = byGrade[t.grade] || { got: 0, total: 0 };
    byGrade[t.grade].total += 1;
    if (earned.has(t.name)) byGrade[t.grade].got += 1;
  }
  document.getElementById('gradeChips').replaceChildren(
    ...['platinum', 'gold', 'silver', 'bronze'].map((grade) => {
      const chip = document.createElement('span');
      chip.className = 'chip';
      chip.innerHTML = '';
      const label = document.createElement('span');
      label.textContent = `${gradeLabel(grade)} `;
      const bold = document.createElement('b');
      bold.textContent = `${byGrade[grade].got}/${byGrade[grade].total}`;
      chip.append(label, bold);
      return chip;
    }),
  );
}

function visibleTrophies() {
  const query = searchEl.value.trim().toLowerCase();
  return doc.trophies.filter((t) => {
    if (kindEl.value === 'missable' && !t.missable) return false;
    if (kindEl.value === 'online') return false;
    if (kindEl.value !== 'all' && kindEl.value !== 'missable' && kindEl.value !== 'online' && t.kind !== kindEl.value) return false;
    if (gradeEl.value !== 'all' && t.grade !== gradeEl.value) return false;
    if (earnedOnlyEl.checked && !earned.has(t.name)) return false;
    if (hideEarnedEl.checked && earned.has(t.name)) return false;
    if (query && !(t.name.toLowerCase().includes(query) || t.description.toLowerCase().includes(query) || (t.target || '').toLowerCase().includes(query))) return false;
    return true;
  });
}

function renderTrophy(trophy) {
  const li = document.createElement('li');
  li.className = 'trophy';
  if (earned.has(trophy.name)) li.classList.add('earned');
  if (trophy.missable) li.classList.add('missable-flag');

  const head = document.createElement('div');
  head.className = 'trophy-head';
  const box = document.createElement('input');
  box.type = 'checkbox';
  box.checked = earned.has(trophy.name);
  box.setAttribute('aria-label', `Mark ${trophy.name} as earned`);
  box.addEventListener('change', () => {
    if (box.checked) earned.add(trophy.name);
    else earned.delete(trophy.name);
    saveEarned();
    renderAll();
  });
  const main = document.createElement('div');
  main.className = 'trophy-main';
  const name = document.createElement('div');
  name.className = 'trophy-name';
  const desc = document.createElement('div');
  desc.className = 'trophy-desc';

  if (isSpoilerHidden(trophy)) {
    name.textContent = `Hidden story trophy #${trophy.id}`;
    const note = document.createElement('span');
    note.className = 'spoiler-hidden';
    note.textContent = 'Story trophy — name and description hidden until earned (spoilers off).';
    desc.append(note);
  } else {
    name.textContent = trophy.name;
    const official = document.createElement('span');
    official.className = 'official';
    official.textContent = trophy.description;
    desc.append(document.createTextNode('Official: '), official);
  }

  const meta = document.createElement('div');
  meta.className = 'trophy-meta';
  const gradeBadge = document.createElement('span');
  gradeBadge.className = `badge ${trophy.grade}`;
  gradeBadge.textContent = gradeLabel(trophy.grade);
  meta.append(gradeBadge);
  const kindTag = document.createElement('span');
  kindTag.className = 'tag';
  kindTag.textContent = trophy.kind === 'mischief' ? 'Open-world' : trophy.kind;
  meta.append(kindTag);
  if (trophy.target) {
    const target = document.createElement('span');
    target.className = 'tag target';
    target.textContent = trophy.target;
    meta.append(target);
  }
  if (trophy.hidden) {
    const hiddenTag = document.createElement('span');
    hiddenTag.className = 'tag hidden-tag';
    hiddenTag.textContent = 'Hidden on PSN';
    meta.append(hiddenTag);
  }
  if (trophy.missable) {
    const miss = document.createElement('span');
    miss.className = 'tag missable';
    miss.textContent = '⚠ Possibly missable';
    meta.append(miss);
  }

  main.append(name, desc, meta);

  if (isSpoilerHidden(trophy)) {
    const locked = document.createElement('p');
    locked.className = 'guide spoiler-hidden';
    locked.textContent = 'Guide hidden with the trophy — earn it, or turn “Show story spoilers” on.';
    main.append(locked);
  } else {
    const toggle = document.createElement('button');
    toggle.type = 'button';
    toggle.className = 'guide-toggle';
    const isOpen = openGuides.has(trophy.id);
    toggle.textContent = isOpen ? '▾ Hide guide' : '▸ Show guide';
    toggle.setAttribute('aria-expanded', String(isOpen));
    toggle.addEventListener('click', () => {
      if (openGuides.has(trophy.id)) openGuides.delete(trophy.id);
      else openGuides.add(trophy.id);
      renderAll();
    });
    main.append(toggle);
    if (isOpen) {
      const guide = document.createElement('div');
      guide.className = 'guide';
      const text = document.createElement('p');
      text.textContent = trophy.guide;
      guide.append(text);
      const src = document.createElement('p');
      src.className = 'src';
      src.append(document.createTextNode('Sources: '));
      trophy.sources.forEach((shortName, i) => {
        if (i > 0) src.append(document.createTextNode(' · '));
        const url = sourceUrl(shortName);
        if (url) {
          const a = document.createElement('a');
          a.href = url;
          a.target = '_blank';
          a.rel = 'noopener';
          a.textContent = shortName;
          src.append(a);
        } else {
          src.append(document.createTextNode(shortName));
        }
      });
      guide.append(src);
      main.append(guide);
    }
  }

  head.append(box, main);
  li.append(head);
  return li;
}

function renderList() {
  const shown = visibleTrophies();
  listEl.replaceChildren(...shown.map(renderTrophy));
  const empty = document.getElementById('emptyState');
  empty.hidden = shown.length > 0;
  if (kindEl.value === 'online' && shown.length === 0) {
    empty.textContent = 'There are no online trophies: all 55 GTA 6 trophies are single-player and offline, so this filter is empty by design.';
  } else {
    empty.textContent = 'No trophies match these filters. Clear the search or pick another kind or grade.';
  }
  const earnedCount = doc.trophies.filter((t) => earned.has(t.name)).length;
  document.getElementById('listMeta').textContent =
    `Showing ${shown.length} of ${doc.trophies.length} trophies · ${earnedCount} earned · ${doc.trophies.filter((t) => t.missable).length} possibly missable · ${doc.trophies.filter((t) => t.hidden).length} hidden on PSN.`;
}

function renderSources() {
  document.getElementById('sourceList').replaceChildren(
    ...(doc.sources || []).map((s) => {
      const li = document.createElement('li');
      const a = document.createElement('a');
      a.href = s.url;
      a.target = '_blank';
      a.rel = 'noopener';
      a.textContent = s.name;
      li.append(a);
      return li;
    }),
  );
}

function renderAll() {
  renderProgress();
  renderList();
}

function exportProgress() {
  const payload = {
    game: doc.game,
    platform: doc.platform,
    exportedAt: new Date().toISOString(),
    earned: [...earned].sort(),
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'gta6-trophy-progress.json';
  a.click();
  window.setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  setStatus(`Exported ${earned.size} earned trophies to gta6-trophy-progress.json.`);
}

async function importProgress(file) {
  if (!file) return;
  try {
    const parsed = JSON.parse(await file.text());
    const names = Array.isArray(parsed) ? parsed : parsed.earned;
    if (!Array.isArray(names)) throw new Error('no earned list');
    const known = new Set(doc.trophies.map((t) => t.name));
    const good = names.filter((n) => typeof n === 'string' && known.has(n));
    const bad = names.length - good.length;
    earned = new Set(good);
    saveEarned();
    renderAll();
    setStatus(`Imported ${good.length} earned trophies${bad ? ` (${bad} unknown names skipped)` : ''}.`);
  } catch {
    setStatus('Import failed: that file is not a trophy-progress export (JSON with an "earned" list of trophy names).');
  }
}

function initControls() {
  spoilersEl.checked = localStorage.getItem(SPOILER_KEY) === '1' || spoilersEl.checked;
  spoilersEl.addEventListener('change', () => {
    localStorage.setItem(SPOILER_KEY, spoilersEl.checked ? '1' : '0');
    renderAll();
  });
  searchEl.addEventListener('input', renderList);
  kindEl.addEventListener('change', renderList);
  gradeEl.addEventListener('change', renderList);
  earnedOnlyEl.addEventListener('change', renderList);
  hideEarnedEl.addEventListener('change', renderList);
  document.getElementById('exportBtn').addEventListener('click', exportProgress);
  document.getElementById('importFile').addEventListener('change', (e) => {
    importProgress(e.target.files[0]);
    e.target.value = '';
  });
  document.getElementById('resetBtn').addEventListener('click', () => {
    if (window.confirm('Clear all earned ticks? This cannot be undone (export first if you want a backup).')) {
      earned = new Set();
      saveEarned();
      renderAll();
      setStatus('Progress reset — 0 of 55 earned.');
    }
  });
}

async function init() {
  const res = await fetch('data/trophies.json');
  if (!res.ok) throw new Error(`trophies.json failed to load (${res.status})`);
  doc = await res.json();
  if (!Array.isArray(doc.trophies) || doc.trophies.length !== 55) {
    throw new Error('trophies.json does not hold all 55 trophies');
  }
  initControls();
  renderRoadmap();
  renderSources();
  renderAll();
}

init().catch((err) => {
  listEl.replaceChildren();
  const li = document.createElement('li');
  li.className = 'trophy';
  li.textContent = `Could not load the trophy list: ${err.message}. Check that data/trophies.json sits beside this page.`;
  listEl.append(li);
});
