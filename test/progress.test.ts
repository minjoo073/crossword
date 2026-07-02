import { test, beforeEach } from "node:test";
import assert from "node:assert/strict";

// Minimal in-memory localStorage + window so the SSR/storage guards in
// progress.ts engage exactly as they do in a real browser. Set before the
// module import runs any function (top-level of progress.ts touches no window).
class FakeStorage {
  private m = new Map<string, string>();
  getItem(k: string): string | null {
    return this.m.has(k) ? (this.m.get(k) as string) : null;
  }
  setItem(k: string, v: string): void {
    this.m.set(k, String(v));
  }
  removeItem(k: string): void {
    this.m.delete(k);
  }
  clear(): void {
    this.m.clear();
  }
}

const fakeWindow = { localStorage: new FakeStorage() };
(globalThis as unknown as { window: typeof fakeWindow }).window = fakeWindow;

import {
  saveProgress,
  markCleared,
  readModeProgress,
  readStore,
  isAlbumCleared,
} from "../src/lib/progress.ts";

beforeEach(() => {
  fakeWindow.localStorage.clear();
});

test("golden: write→read round-trip preserves values and seconds", () => {
  saveProgress("ateez", "golden-hour", "en", { values: { "0,0": "A", "0,1": "B" }, seconds: 42 });
  const got = readModeProgress("ateez", "golden-hour", "en");
  assert.deepEqual(got?.values, { "0,0": "A", "0,1": "B" });
  assert.equal(got?.seconds, 42);
  assert.equal(got?.cleared, false);
});

test("golden: EN and KO are stored separately (no cross-contamination)", () => {
  saveProgress("ateez", "golden-hour", "en", { values: { "0,0": "A" }, seconds: 10 });
  saveProgress("ateez", "golden-hour", "ko", { values: { "0,0": "가" }, seconds: 20 });

  assert.deepEqual(readModeProgress("ateez", "golden-hour", "en")?.values, { "0,0": "A" });
  assert.deepEqual(readModeProgress("ateez", "golden-hour", "ko")?.values, { "0,0": "가" });
  assert.equal(readModeProgress("ateez", "golden-hour", "en")?.seconds, 10);
  assert.equal(readModeProgress("ateez", "golden-hour", "ko")?.seconds, 20);
});

test("golden: markCleared sets cleared + bestSeconds and keeps the lowest time", () => {
  saveProgress("iu", "the-winning", "en", { values: { "0,0": "X" }, seconds: 5 });
  markCleared("iu", "the-winning", "en", 90);
  let m = readModeProgress("iu", "the-winning", "en");
  assert.equal(m?.cleared, true);
  assert.equal(m?.bestSeconds, 90);
  assert.deepEqual(m?.values, { "0,0": "X" }); // values preserved through clear

  markCleared("iu", "the-winning", "en", 120); // slower run must not raise best
  m = readModeProgress("iu", "the-winning", "en");
  assert.equal(m?.bestSeconds, 90);

  markCleared("iu", "the-winning", "en", 60); // faster run lowers best
  m = readModeProgress("iu", "the-winning", "en");
  assert.equal(m?.bestSeconds, 60);
});

test("golden: replaying a cleared album (save over it) keeps cleared + bestSeconds", () => {
  markCleared("nct", "walk", "ko", 77);
  // "다시 풀기" clears the board → saveProgress with empty values.
  saveProgress("nct", "walk", "ko", { values: {}, seconds: 0 });
  const m = readModeProgress("nct", "walk", "ko");
  assert.equal(m?.cleared, true);
  assert.equal(m?.bestSeconds, 77);
  assert.deepEqual(m?.values, {});
});

test("golden: isAlbumCleared is true when either mode is cleared", () => {
  saveProgress("bts", "map", "en", { values: {}, seconds: 0 });
  assert.equal(isAlbumCleared(readStore(), "bts", "map"), false);
  markCleared("bts", "map", "ko", 30);
  assert.equal(isAlbumCleared(readStore(), "bts", "map"), true);
});
