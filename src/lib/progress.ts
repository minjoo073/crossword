// Per-album crossword progress, persisted in localStorage.
//
// Storage shape (single object under STORAGE_KEY):
//   {
//     "<artistId>/<albumId>": {
//       en?: { values, seconds, cleared, bestSeconds? },
//       ko?: { values, seconds, cleared, bestSeconds? }
//     },
//     ...
//   }
//
// EN and KO are stored under separate keys on purpose: they are different
// puzzles (different answers), so toggling language must not leak one mode's
// answers into the other's board or clear-state (#2 / P2-1).
//
// Every access is SSR-safe (typeof window guard) and wrapped in try/catch so a
// blocked localStorage (private mode, disabled storage) degrades to a no-op —
// never a thrown error, and never a silently swallowed one (a single
// console.warn is emitted so the failure is visible in the console).

export type Mode = "en" | "ko";

export interface ModeProgress {
  /** cellKey ("r,c") -> current letter/syllable the player typed. */
  values: Record<string, string>;
  /** Elapsed play time (seconds) at the last save, for resuming the timer. */
  seconds: number;
  /** Whether this mode's puzzle has ever been fully solved. */
  cleared: boolean;
  /** Best (lowest) solve time in seconds, set once cleared. */
  bestSeconds?: number;
}

export type AlbumProgress = {
  [M in Mode]?: ModeProgress;
};

export type ProgressStore = Record<string, AlbumProgress>;

const STORAGE_KEY = "kpx.progress.v1";

export const albumKey = (artistId: string, albumId: string): string => `${artistId}/${albumId}`;

function hasStorage(): boolean {
  return typeof window !== "undefined" && !!window.localStorage;
}

/** Read the whole store. Returns {} on SSR, empty storage, or any failure. */
export function readStore(): ProgressStore {
  if (!hasStorage()) return {};
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return {};
    return parsed as ProgressStore;
  } catch (err) {
    console.warn("progress: read failed", err);
    return {};
  }
}

function writeStore(store: ProgressStore): void {
  if (!hasStorage()) return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch (err) {
    console.warn("progress: write failed (private mode / storage full?)", err);
  }
}

/** All saved progress for one album (both modes), or {} if none. */
export function readAlbumProgress(artistId: string, albumId: string): AlbumProgress {
  return readStore()[albumKey(artistId, albumId)] ?? {};
}

/** Saved progress for one album + mode, or undefined if never played. */
export function readModeProgress(
  artistId: string,
  albumId: string,
  mode: Mode
): ModeProgress | undefined {
  return readAlbumProgress(artistId, albumId)[mode];
}

/**
 * Persist the in-progress board (values + elapsed seconds) for one mode.
 * Preserves any existing cleared / bestSeconds so replaying a solved puzzle
 * never drops its completion badge.
 */
export function saveProgress(
  artistId: string,
  albumId: string,
  mode: Mode,
  data: { values: Record<string, string>; seconds: number }
): void {
  if (!hasStorage()) return;
  const store = readStore();
  const key = albumKey(artistId, albumId);
  const album = store[key] ?? {};
  const prev = album[mode];
  album[mode] = {
    values: data.values,
    seconds: data.seconds,
    cleared: prev?.cleared ?? false,
    ...(prev?.bestSeconds !== undefined ? { bestSeconds: prev.bestSeconds } : {}),
  };
  store[key] = album;
  writeStore(store);
}

/**
 * Mark one mode of an album as cleared and update its best time.
 * bestSeconds keeps the lowest of the previous best and this solve.
 */
export function markCleared(
  artistId: string,
  albumId: string,
  mode: Mode,
  seconds: number
): void {
  if (!hasStorage()) return;
  const store = readStore();
  const key = albumKey(artistId, albumId);
  const album = store[key] ?? {};
  const prev = album[mode];
  const bestSeconds =
    prev?.bestSeconds !== undefined ? Math.min(prev.bestSeconds, seconds) : seconds;
  album[mode] = {
    values: prev?.values ?? {},
    seconds: prev?.seconds ?? seconds,
    cleared: true,
    bestSeconds,
  };
  store[key] = album;
  writeStore(store);
}

/** True if either language mode of the album has been cleared. */
export function isAlbumCleared(store: ProgressStore, artistId: string, albumId: string): boolean {
  const a = store[albumKey(artistId, albumId)];
  return !!(a?.en?.cleared || a?.ko?.cleared);
}
