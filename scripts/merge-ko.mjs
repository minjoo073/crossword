// Merges data/quizzes-ko-{A,B,C}.json into data/quizzes-ko.json.
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const artists = [];
for (const b of ["A", "B", "C"]) {
  const path = resolve(root, `data/quizzes-ko-${b}.json`);
  try {
    const j = JSON.parse(readFileSync(path, "utf8"));
    (j.artists || []).forEach((a) => artists.push(a));
    console.log(`[merge-ko] ${b}: ${j.artists?.length ?? 0} artists`);
  } catch (e) {
    console.warn(`[merge-ko] ${b}: missing/invalid (${e.message})`);
  }
}
const out = {
  meta: { title: "K-pop Album Crossword — Korean answers", lastUpdated: "2026-06-30" },
  artists,
};
writeFileSync(resolve(root, "data/quizzes-ko.json"), JSON.stringify(out, null, 2));
const words = artists.reduce((n, a) => n + a.albums.reduce((m, al) => m + al.words.length, 0), 0);
console.log(`[merge-ko] wrote data/quizzes-ko.json — ${artists.length} artists, ${words} words.`);
