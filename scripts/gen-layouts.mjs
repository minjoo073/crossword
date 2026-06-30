// Pre-generates crossword layouts into src/data/puzzles.json.
// English answers from data/quizzes.json (+ Korean clues from data/clues-ko.json),
// and optional Korean-answer puzzles from data/quizzes-ko.json (one syllable per cell).
// Run: node scripts/gen-layouts.mjs

import { createRequire } from "node:module";
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const require = createRequire(import.meta.url);
const clg = require("crossword-layout-generator");

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");

const readJson = (rel, fallback) => {
  try {
    return JSON.parse(readFileSync(resolve(root, rel), "utf8"));
  } catch {
    console.warn(`[gen-layouts] ${rel} not found — skipping.`);
    return fallback;
  }
};

const quizzes = readJson("data/quizzes.json", { artists: [] });
const themes = readJson("design/album-themes.json", { albums: [] });
const koClues = readJson("data/clues-ko.json", {});
const covers = readJson("data/covers.json", {});
const quizzesKo = readJson("data/quizzes-ko.json", { artists: [] });

const themeFor = (artistId, albumId) =>
  themes.albums?.find((t) => t.artistId === artistId && t.albumId === albumId) || null;
const koAlbumFor = (artistId, albumId) =>
  quizzesKo.artists?.find((a) => a.id === artistId)?.albums?.find((al) => al.id === albumId) || null;

const ATTEMPTS = 100;

const wcells = (w) => {
  const syl = [...w.answer];
  return syl.map((ch, i) => ({
    ch,
    r: w.starty - 1 + (w.orientation === "down" ? i : 0),
    c: w.startx - 1 + (w.orientation === "across" ? i : 0),
  }));
};

/** Greedily keep only words consistent with the accumulated grid — drops the
 *  generator's stacked/conflicting placements (common on dense Korean grids). */
function cleanPlaced(placed) {
  const grid = {};
  const kept = [];
  for (const w of placed) {
    const cells = wcells(w);
    if (cells.every((x) => !grid[`${x.r},${x.c}`] || grid[`${x.r},${x.c}`] === x.ch)) {
      cells.forEach((x) => (grid[`${x.r},${x.c}`] = x.ch));
      kept.push(w);
    }
  }
  return kept;
}

/** Build normalized, properly-numbered entries + tight grid from placed words. */
function toPuzzle(placed, mkClueKo) {
  const kept = cleanPlaced(placed);
  if (kept.length === 0) return { entries: [], rows: 1, cols: 1, count: 0 };
  const raw = kept.map((w) => ({
    answer: w.answer,
    clue: w.clue,
    clueKo: mkClueKo ? mkClueKo(w.answer) : w.clue,
    len: [...w.answer].length,
    row: w.starty - 1,
    col: w.startx - 1,
    dir: w.orientation,
  }));
  const allCells = kept.flatMap(wcells);
  const minR = Math.min(...allCells.map((x) => x.r));
  const minC = Math.min(...allCells.map((x) => x.c));
  const rows = Math.max(...allCells.map((x) => x.r)) - minR + 1;
  const cols = Math.max(...allCells.map((x) => x.c)) - minC + 1;
  raw.forEach((e) => {
    e.row -= minR;
    e.col -= minC;
  });
  // Standard crossword numbering by start cell, scanned row-major.
  const starts = [...new Set(raw.map((e) => `${e.row},${e.col}`))]
    .map((s) => s.split(",").map(Number))
    .sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  const num = new Map(starts.map(([r, c], i) => [`${r},${c}`, i + 1]));
  const entries = raw
    .map((e) => ({ ...e, number: num.get(`${e.row},${e.col}`) }))
    .sort((a, b) => a.number - b.number || (a.dir === "across" ? -1 : 1));
  return { entries, rows, cols, count: entries.length };
}

function bestLayout(words, mkClueKo) {
  const input = words.map((w) => ({ answer: w.answer, clue: w.clue }));
  let best = null;
  let bestScore = -Infinity;
  for (let i = 0; i < ATTEMPTS; i++) {
    const layout = clg.generateLayout(input);
    const placed = layout.result.filter((w) => w.orientation !== "none");
    const pz = toPuzzle(placed, mkClueKo);
    const score = pz.count * 100000 - pz.rows * pz.cols * 10 - Math.abs(pz.rows - pz.cols);
    if (score > bestScore) {
      bestScore = score;
      best = pz;
    }
  }
  return best ?? { entries: [], rows: 1, cols: 1, count: 0 };
}

const out = { meta: { ...quizzes.meta, generatedAt: "build" }, artists: [] };
let totalDropped = 0;

for (const artist of quizzes.artists) {
  const outArtist = {
    id: artist.id,
    name: artist.name,
    gender: artist.gender,
    agency: artist.agency,
    fandom: artist.fandom,
    albums: [],
  };
  for (const album of artist.albums) {
    // English puzzle
    const en = bestLayout(
      album.words.map((w) => ({ answer: w.answer.toUpperCase(), clue: w.clue })),
      (ans) => koClues[`${artist.id}/${album.id}/${ans}`] ?? null
    );
    const dropped = album.words.length - en.count;
    totalDropped += dropped;
    if (dropped > 0) console.warn(`[gen-layouts] EN ${artist.name}/${album.title}: placed ${en.count}/${album.words.length}`);

    // Korean puzzle (optional)
    let ko = null;
    const koAlbum = koAlbumFor(artist.id, album.id);
    if (koAlbum?.words?.length) {
      const k = bestLayout(koAlbum.words.map((w) => ({ answer: w.answer, clue: w.clue })), null);
      if (k.count >= 5) {
        ko = { grid: { rows: k.rows, cols: k.cols }, entries: k.entries };
      }
      console.log(`[gen-layouts] KO ${artist.name}/${album.title}: placed ${k.count}/${koAlbum.words.length}${k.count < 5 ? " (too few → no KO mode)" : ""}`);
    }

    outArtist.albums.push({
      id: album.id,
      title: album.title,
      releaseDate: album.releaseDate,
      titleTrack: album.titleTrack,
      lightstick: album.lightstick ?? null,
      coverUrl: covers[`${artist.id}/${album.id}`]?.url ?? null,
      theme: themeFor(artist.id, album.id),
      grid: { rows: en.rows, cols: en.cols },
      entries: en.entries.map((e) => ({ ...e, clueKo: e.clueKo ?? e.clue })),
      ko,
    });
  }
  out.artists.push(outArtist);
}

mkdirSync(resolve(root, "src/data"), { recursive: true });
writeFileSync(resolve(root, "src/data/puzzles.json"), JSON.stringify(out, null, 2));
const koCount = out.artists.reduce((n, a) => n + a.albums.filter((al) => al.ko).length, 0);
console.log(
  `[gen-layouts] wrote src/data/puzzles.json — ${out.artists.length} artists, ${out.artists.reduce((n, a) => n + a.albums.length, 0)} EN puzzles (${totalDropped} dropped), ${koCount} KO puzzles.`
);
