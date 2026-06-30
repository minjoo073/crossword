// Merges data/gen-1..5.json (album-concept quizzes, EN + KO + theme) into:
//   data/quizzes.json        (English answers)
//   data/quizzes-ko.json     (Korean answers)
//   design/album-themes.json (per-album dreamcore theme)
// Artist meta (name/gender/agency/fandom) + order preserved from the old quizzes.json.

import { readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const readJson = (p, f) => { try { return JSON.parse(readFileSync(resolve(root, p), "utf8")); } catch { return f; } };

const old = readJson("data/quizzes.json", { artists: [] });
const meta = new Map(old.artists.map((a) => [a.id, a]));
const order = old.artists.map((a) => a.id);

// Collect gen artists
const gen = new Map();
for (const n of [1, 2, 3, 4, 5]) {
  const g = readJson(`data/gen-${n}.json`, null);
  if (!g) { console.warn(`[merge-gen] gen-${n}.json missing`); continue; }
  for (const a of g.artists) gen.set(a.id, a);
  console.log(`[merge-gen] gen-${n}: ${g.artists.map((a) => a.id).join(", ")}`);
}

const enArtists = [];
const koArtists = [];
const themeAlbums = [];

for (const id of order) {
  const m = meta.get(id);
  const ga = gen.get(id);
  if (!ga) { console.warn(`[merge-gen] no gen data for ${id} — keeping old`); }
  const albums = ga ? ga.albums : meta.get(id).albums;

  enArtists.push({
    id,
    name: m.name,
    gender: m.gender,
    agency: m.agency,
    fandom: m.fandom,
    albums: albums.map((al) => ({
      id: al.id,
      title: al.title,
      releaseDate: al.releaseDate ?? null,
      titleTrack: al.titleTrack ?? null,
      lightstick: al.lightstick ?? null,
      words: al.words ?? [],
    })),
  });

  koArtists.push({
    id,
    name: m.name,
    albums: albums.map((al) => ({ id: al.id, title: al.title, words: al.wordsKo ?? [] })),
  });

  for (const al of albums) {
    if (al.theme) themeAlbums.push({ artistId: id, albumId: al.id, ...al.theme });
  }
}

writeFileSync(resolve(root, "data/quizzes.json"), JSON.stringify({ meta: old.meta ?? {}, artists: enArtists }, null, 2));
writeFileSync(resolve(root, "data/quizzes-ko.json"), JSON.stringify({ meta: { lastUpdated: "2026-06-30" }, artists: koArtists }, null, 2));
writeFileSync(resolve(root, "design/album-themes.json"), JSON.stringify({ _meta: { note: "per-album dreamcore theme; concept-driven" }, albums: themeAlbums }, null, 2));

const enW = enArtists.reduce((n, a) => n + a.albums.reduce((m, al) => m + al.words.length, 0), 0);
const koW = koArtists.reduce((n, a) => n + a.albums.reduce((m, al) => m + al.words.length, 0), 0);
const albs = enArtists.reduce((n, a) => n + a.albums.length, 0);
console.log(`[merge-gen] ${enArtists.length} artists, ${albs} albums, EN ${enW} words, KO ${koW} words, ${themeAlbums.length} themes.`);
