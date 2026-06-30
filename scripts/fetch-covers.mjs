// Fetches real album cover-art URLs from the iTunes Search API (display-only,
// served from Apple's CDN — not re-hosted). Writes data/covers.json keyed by
// "artistId/albumId". Run: node scripts/fetch-covers.mjs
//
// Covers are referenced by URL at display time; we do not download/re-host them.

import { readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");
const quizzes = JSON.parse(readFileSync(resolve(root, "data/quizzes.json"), "utf8"));

const norm = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, "");
const BAD = ["instrumental", "version", "karaoke", "remixes", "sped up", "live"];
// Editorial / commentary entries reuse the album name but carry different artwork.
const EDITORIAL = ["track by track", "commentary", "소개하는", "about the album", "comment", "코멘트", "コメント", "解説", "트랙 바이 트랙"];

function pick(results, artistName, albumTitle) {
  const a = norm(albumTitle);
  const ar = norm(artistName);
  let best = null;
  let bestScore = -Infinity;
  for (const r of results) {
    const coll = norm(r.collectionName || "");
    const art = norm(r.artistName || "");
    let score = 0;
    if (coll === a) score += 120;
    else if (coll.includes(a) || a.includes(coll)) score += 80;
    // shared-prefix credit for partial title matches
    let p = 0;
    while (p < a.length && p < coll.length && a[p] === coll[p]) p++;
    score += Math.min(p, 40);
    if (art.includes(ar) || ar.includes(art)) score += 40;
    const lc = (r.collectionName || "").toLowerCase();
    if (BAD.some((b) => lc.includes(b)) && !albumTitle.toLowerCase().match(/version/)) score -= 35;
    if (EDITORIAL.some((b) => lc.includes(b))) score -= 300;
    if (score > bestScore) {
      bestScore = score;
      best = r;
    }
  }
  return { best, score: bestScore };
}

async function search(term) {
  const url = `https://itunes.apple.com/search?term=${encodeURIComponent(term)}&entity=album&limit=12&country=US`;
  const res = await fetch(url, { headers: { "User-Agent": "kpop-crossword/1.0" } });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const json = await res.json();
  return json.results || [];
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const out = {};
const report = [];

for (const artist of quizzes.artists) {
  for (const album of artist.albums) {
    const key = `${artist.id}/${album.id}`;
    const queries = [
      `${artist.name} ${album.title}`,
      `${artist.name} ${album.title.split(/[:(]/)[0].trim()}`,
      `${artist.name} ${album.titleTrack}`,
    ];
    let chosen = null;
    for (const q of queries) {
      try {
        const results = await search(q);
        const { best, score } = pick(results, artist.name, album.title);
        if (best && score >= 60) {
          chosen = best;
          break;
        }
        if (best && !chosen) chosen = best; // weak fallback, keep trying better
      } catch (e) {
        console.warn(`  [${key}] query "${q}" failed: ${e.message}`);
      }
      await sleep(250);
    }
    if (chosen) {
      const url = (chosen.artworkUrl100 || "").replace("100x100bb", "600x600bb");
      out[key] = { url, collectionName: chosen.collectionName, artistName: chosen.artistName };
      report.push(`✓ ${key.padEnd(34)} → ${chosen.artistName} / ${chosen.collectionName}`);
    } else {
      out[key] = { url: null };
      report.push(`✗ ${key.padEnd(34)} → NO MATCH`);
    }
    await sleep(200);
  }
}

writeFileSync(resolve(root, "data/covers.json"), JSON.stringify(out, null, 2));
console.log(report.join("\n"));
console.log(`\n[fetch-covers] wrote data/covers.json — ${Object.values(out).filter((v) => v.url).length}/${Object.keys(out).length} matched.`);
