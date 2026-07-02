"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, Check, Delete, Eraser, Lightbulb, RotateCcw, Share2, Trophy } from "lucide-react";
import Link from "next/link";
import { getAlbumBrand } from "@/lib/albumBrand";
import type { Album, Artist, Board, Direction, Entry } from "@/lib/types";
import { buildBoard, cellKey, entryCells } from "@/lib/puzzle";
import { processJamo, compose, emptyComp, type Comp } from "@/lib/hangul";
import { readModeProgress, saveProgress, markCleared } from "@/lib/progress";
import Confetti from "@/components/Confetti";
import { drawShareCard, shareOrDownload } from "@/lib/shareCard";

const KEYPAD_ROWS = ["QWERTYUIOP", "ASDFGHJKL", "ZXCVBNM"];

// 2벌식 keypad, laid out to mirror the QWERTY positions the physical map uses.
const KEYPAD_ROWS_KO = [
  ["ㅂ", "ㅈ", "ㄷ", "ㄱ", "ㅅ", "ㅛ", "ㅕ", "ㅑ", "ㅐ", "ㅔ"],
  ["ㅁ", "ㄴ", "ㅇ", "ㄹ", "ㅎ", "ㅗ", "ㅓ", "ㅏ", "ㅣ"],
  ["ㅋ", "ㅌ", "ㅊ", "ㅍ", "ㅠ", "ㅜ", "ㅡ"],
];
// Shift row — double consonants and the two wide vowels (2벌식 shift layer).
const KEYPAD_ROW_KO_SHIFT = ["ㄲ", "ㄸ", "ㅃ", "ㅆ", "ㅉ", "ㅒ", "ㅖ"];

// Physical QWERTY (by KeyboardEvent.code) → 2벌식 jamo, IME-independent.
const QWERTY_TO_JAMO: Record<string, string> = {
  KeyQ: "ㅂ", KeyW: "ㅈ", KeyE: "ㄷ", KeyR: "ㄱ", KeyT: "ㅅ",
  KeyY: "ㅛ", KeyU: "ㅕ", KeyI: "ㅑ", KeyO: "ㅐ", KeyP: "ㅔ",
  KeyA: "ㅁ", KeyS: "ㄴ", KeyD: "ㅇ", KeyF: "ㄹ", KeyG: "ㅎ",
  KeyH: "ㅗ", KeyJ: "ㅓ", KeyK: "ㅏ", KeyL: "ㅣ",
  KeyZ: "ㅋ", KeyX: "ㅌ", KeyC: "ㅊ", KeyV: "ㅍ", KeyB: "ㅠ",
  KeyN: "ㅜ", KeyM: "ㅡ",
};
const QWERTY_TO_JAMO_SHIFT: Record<string, string> = {
  KeyQ: "ㅃ", KeyW: "ㅉ", KeyE: "ㄸ", KeyR: "ㄲ", KeyT: "ㅆ",
  KeyO: "ㅒ", KeyP: "ㅖ",
};

/** Relative luminance of a hex color (0=dark .. 1=light), for picking sticker contrast. */
function luminance(hex: string): number {
  const h = hex.replace("#", "");
  const f = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  const n = parseInt(f, 16);
  const r = ((n >> 16) & 255) / 255;
  const g = ((n >> 8) & 255) / 255;
  const b = (n & 255) / 255;
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function normalizeHex(hex: string): string {
  const raw = hex.replace("#", "").trim();
  if (raw.length === 3) return raw.split("").map((c) => c + c).join("");
  return raw.padEnd(6, "0").slice(0, 6);
}

function mixHex(a: string, b: string, weight = 0.5): string {
  const ah = normalizeHex(a);
  const bh = normalizeHex(b);
  const ratio = Math.min(1, Math.max(0, weight));
  const av = parseInt(ah, 16);
  const bv = parseInt(bh, 16);
  const ar = (av >> 16) & 255;
  const ag = (av >> 8) & 255;
  const ab = av & 255;
  const br = (bv >> 16) & 255;
  const bg = (bv >> 8) & 255;
  const bb = bv & 255;
  const rr = Math.round(ar * (1 - ratio) + br * ratio);
  const rg = Math.round(ag * (1 - ratio) + bg * ratio);
  const rb = Math.round(ab * (1 - ratio) + bb * ratio);
  return `#${[rr, rg, rb].map((v) => v.toString(16).padStart(2, "0")).join("")}`;
}

type CheckState = Record<string, "correct" | "wrong">;

export default function CrosswordGame({
  artist,
  album,
  backHref = "/",
}: {
  artist: Artist;
  album: Album;
  backHref?: string;
}) {
  // A Korean-answer puzzle isn't generated for every album (e.g. ATEEZ
  // GOLDEN HOUR : Part.1). Without one, KO mode must never engage: start in EN
  // and keep the 한글 toggle disabled so the board, keypad, clue language, and
  // the toggle's own highlight all stay consistent (QA P2-2).
  const hasKo = !!album.ko;
  const [mode, setMode] = useState<"en" | "ko">(hasKo ? "ko" : "en");
  // KO board is only playable when a Korean-answer puzzle was generated for this album.
  const koActive = mode === "ko" && !!album.ko;
  const puzzle = useMemo(
    () =>
      koActive && album.ko
        ? { grid: album.ko.grid, entries: album.ko.entries }
        : { grid: album.grid, entries: album.entries },
    [album, koActive]
  );
  const board = useMemo<Board>(() => buildBoard(puzzle), [puzzle]);

  // Map "r,c" + dir -> entry, for fast active-word lookups.
  const entryAt = useMemo(() => {
    const acrossMap = new Map<string, Entry>();
    const downMap = new Map<string, Entry>();
    for (const e of board.entries) {
      for (const { row, col } of entryCells(e)) {
        (e.dir === "across" ? acrossMap : downMap).set(cellKey(row, col), e);
      }
    }
    return { across: acrossMap, down: downMap };
  }, [board]);

  const [values, setValues] = useState<Record<string, string>>({});
  const [check, setCheck] = useState<CheckState>({});
  const [active, setActive] = useState<{ row: number; col: number }>(() => {
    const first = board.across[0] ?? board.down[0];
    return { row: first.row, col: first.col };
  });
  const [dir, setDir] = useState<Direction>(board.across[0] ? "across" : "down");
  const [seconds, setSeconds] = useState(0);
  const [done, setDone] = useState(false);
  const [popped, setPopped] = useState<Set<string>>(new Set());
  const [zoom, setZoom] = useState(1);
  // clearAll is destructive, so it is gated behind a confirm dialog (UX #1).
  const [confirmClear, setConfirmClear] = useState(false);
  // First-run onboarding coachmark (C1). Starts false so SSR and the first
  // client render agree (localStorage is client-only); a mount effect flips it
  // on when the player hasn't seen it yet, avoiding a hydration mismatch.
  const [showCoach, setShowCoach] = useState(false);
  const completedRef = useRef<Set<string>>(new Set());
  // Which mode's data currently lives in `values` (null until first load).
  // Drives save-outgoing / load-incoming on language toggle (#1 / #2).
  const loadedModeRef = useRef<"en" | "ko" | null>(null);
  // Latest values/seconds mirrored into refs so the unmount save reads the
  // freshest state without re-subscribing effects on every keystroke/tick.
  const valuesRef = useRef(values);
  valuesRef.current = values;
  const secondsRef = useRef(seconds);
  secondsRef.current = seconds;
  const boardRef = useRef<HTMLDivElement>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);
  // Round-robin cursor over the wrong cells for the "다음 오답으로" jump (UX #2).
  const wrongCursor = useRef(0);
  // Hangul composition buffer for the cell currently being typed into (KO mode).
  const composeRef = useRef<{ key: string; comp: Comp }>({ key: "", comp: emptyComp() });

  const clueOf = useCallback((e: Entry) => (mode === "ko" ? e.clueKo ?? e.clue : e.clue), [mode]);

  const activeEntry = useMemo(() => {
    const key = cellKey(active.row, active.col);
    return entryAt[dir].get(key) ?? entryAt[dir === "across" ? "down" : "across"].get(key) ?? null;
  }, [active, dir, entryAt]);

  const activeCellKeys = useMemo(() => {
    if (!activeEntry) return new Set<string>();
    return new Set(entryCells(activeEntry).map((c) => cellKey(c.row, c.col)));
  }, [activeEntry]);

  // Timer — runs until solved.
  useEffect(() => {
    if (done) return;
    const id = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, [done]);

  // Pop a word's cells the moment it becomes fully correct.
  useEffect(() => {
    const fresh = new Set<string>();
    for (const e of board.entries) {
      const id = `${e.number}-${e.dir}`;
      const cells = entryCells(e);
      const full = cells.every((c) => values[cellKey(c.row, c.col)] === board.cells[c.row]?.[c.col]?.solution);
      if (full) {
        if (!completedRef.current.has(id)) {
          completedRef.current.add(id);
          cells.forEach((c) => fresh.add(cellKey(c.row, c.col)));
        }
      } else {
        completedRef.current.delete(id);
      }
    }
    if (fresh.size) {
      const show = setTimeout(() => setPopped(fresh), 0);
      const t = setTimeout(() => setPopped(new Set()), 480);
      return () => {
        clearTimeout(show);
        clearTimeout(t);
      };
    }
  }, [values, board]);

  // Load saved progress when the board (i.e. the language mode) changes, and
  // save the mode we're leaving. This runs on mount too (loadedModeRef starts
  // null → nothing to save, just load the initial mode), so restoring is
  // client-only: the server and first client render both show the empty
  // props-based board, then this mount effect fills in the saved values —
  // no hydration mismatch (#1 이어풀기, #2 토글 진행 보존).
  useEffect(() => {
    const prevMode = loadedModeRef.current;
    if (prevMode && prevMode !== mode) {
      // Persist the outgoing mode's board before we swap it out.
      saveProgress(artist.id, album.id, prevMode, {
        values: valuesRef.current,
        seconds: secondsRef.current,
      });
    }

    const saved = readModeProgress(artist.id, album.id, mode);
    const nextValues = saved?.values ?? {};

    // Prime completedRef with words that are already fully correct in the
    // restored board, so the "word solved" pop effect doesn't fire on load.
    const completed = new Set<string>();
    for (const e of board.entries) {
      const cells = entryCells(e);
      const full = cells.every(
        (c) => nextValues[cellKey(c.row, c.col)] === board.cells[c.row]?.[c.col]?.solution
      );
      if (full) completed.add(`${e.number}-${e.dir}`);
    }

    setValues(nextValues);
    setCheck({});
    setPopped(new Set());
    completedRef.current = completed;
    composeRef.current = { key: "", comp: emptyComp() };
    // Resuming a cleared board does not re-open the victory modal; the album's
    // completion badge already signals it. `done` only re-fires the modal when
    // the player actually solves it again this session.
    setDone(false);
    setSeconds(saved?.seconds ?? 0);
    loadedModeRef.current = mode;

    const first = board.across[0] ?? board.down[0];
    if (first) {
      setActive({ row: first.row, col: first.col });
      setDir(board.across[0] ? "across" : "down");
    }
    // board is derived from `mode` (same album per mount), so [mode, board] fire
    // together; artist/album ids are constant for the component's lifetime.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  // Persist the current mode's board whenever the values change. Cheap: a
  // single JSON write per keystroke, and cleared/bestSeconds are preserved.
  useEffect(() => {
    const m = loadedModeRef.current;
    if (!m) return; // initial load hasn't run yet
    saveProgress(artist.id, album.id, m, { values, seconds: secondsRef.current });
    // secondsRef read intentionally (avoid re-saving every timer tick).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [values, artist.id, album.id]);

  // Flush the latest board on unmount (route change away) so the timer and any
  // unsaved keystrokes survive without saving on every tick.
  useEffect(() => {
    return () => {
      const m = loadedModeRef.current;
      if (m) {
        saveProgress(artist.id, album.id, m, {
          values: valuesRef.current,
          seconds: secondsRef.current,
        });
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // On solve, mark this album+mode cleared and record the best time.
  useEffect(() => {
    if (!done) return;
    const m = loadedModeRef.current;
    if (!m) return;
    markCleared(artist.id, album.id, m, secondsRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [done]);

  const isSolved = useCallback(
    (v: Record<string, string>) => {
      for (const row of board.cells) {
        for (const cell of row) {
          if (cell && v[cellKey(cell.row, cell.col)] !== cell.solution) return false;
        }
      }
      return true;
    },
    [board]
  );

  const cellAt = useCallback((r: number, c: number) => board.cells[r]?.[c] ?? null, [board]);

  const selectCell = useCallback(
    (r: number, c: number) => {
      const cell = cellAt(r, c);
      if (!cell) return;
      if (active.row === r && active.col === c) {
        // toggle direction if the other orientation exists here
        const other = dir === "across" ? "down" : "across";
        if (entryAt[other].has(cellKey(r, c))) setDir(other);
      } else {
        setActive({ row: r, col: c });
        if (!entryAt[dir].has(cellKey(r, c))) {
          setDir(dir === "across" ? "down" : "across");
        }
      }
    },
    [active, cellAt, dir, entryAt]
  );

  const advance = useCallback(
    (delta: number) => {
      if (!activeEntry) return;
      const cells = entryCells(activeEntry);
      const idx = cells.findIndex((c) => c.row === active.row && c.col === active.col);
      const next = cells[idx + delta];
      if (next) setActive({ row: next.row, col: next.col });
    },
    [active, activeEntry]
  );

  const setLetter = useCallback(
    (r: number, c: number, letter: string) => {
      const cell = cellAt(r, c);
      if (!cell) return;
      const key = cellKey(r, c);
      if (check[key] === "correct") return; // locked
      setValues((prev) => {
        const next = { ...prev, [key]: letter };
        if (letter && isSolved(next)) setDone(true);
        return next;
      });
      setCheck((prev) => {
        if (!prev[key]) return prev;
        const n = { ...prev };
        delete n[key];
        return n;
      });
    },
    [cellAt, check, isSolved]
  );

  const handleChar = useCallback(
    (ch: string) => {
      setLetter(active.row, active.col, ch);
      advance(1);
    },
    [active, advance, setLetter]
  );

  // Feed one Hangul jamo into the active cell, composing via the automaton.
  // On `advance`, the active cell is finalized and the carried composition
  // continues in the next cell of the current word.
  const handleJamo = useCallback(
    (jamo: string) => {
      const key = cellKey(active.row, active.col);
      const buf = composeRef.current.key === key ? composeRef.current.comp : emptyComp();
      const res = processJamo(buf, jamo);
      setLetter(active.row, active.col, res.display);

      if (!res.advance) {
        composeRef.current = { key, comp: res.next };
        return;
      }
      // Finalize current cell, carry the composition into the next word cell.
      const cells = activeEntry ? entryCells(activeEntry) : [];
      const idx = cells.findIndex((c) => c.row === active.row && c.col === active.col);
      const nextCell = cells[idx + 1];
      if (nextCell) {
        setActive({ row: nextCell.row, col: nextCell.col });
        setLetter(nextCell.row, nextCell.col, compose(res.next));
        composeRef.current = { key: cellKey(nextCell.row, nextCell.col), comp: res.next };
      } else {
        // End of word — nowhere to carry the spilled jamo. `res.display` is the
        // split syllable (any 종성 that would migrate has been stripped), so
        // restore the finalized cell to its full pre-jamo syllable to keep the
        // 종성, and drop the un-place-able jamo (QA P3-2).
        setLetter(active.row, active.col, compose(buf));
        composeRef.current = { key, comp: buf };
      }
    },
    [active, activeEntry, setLetter]
  );

  const handleBackspace = useCallback(() => {
    // Any deletion resets the in-progress Hangul composition.
    composeRef.current = { key: "", comp: emptyComp() };
    const key = cellKey(active.row, active.col);
    if (values[key]) {
      setLetter(active.row, active.col, "");
    } else {
      advance(-1);
      // clear the previous cell after moving
      setValues((prev) => {
        if (!activeEntry) return prev;
        const cells = entryCells(activeEntry);
        const idx = cells.findIndex((c) => c.row === active.row && c.col === active.col);
        const prevCell = cells[idx - 1];
        if (!prevCell) return prev;
        const pk = cellKey(prevCell.row, prevCell.col);
        if (check[pk] === "correct") return prev;
        const n = { ...prev };
        delete n[pk];
        return n;
      });
    }
  }, [active, activeEntry, advance, check, setLetter, values]);

  const move = useCallback(
    (dr: number, dc: number) => {
      let r = active.row + dr;
      let c = active.col + dc;
      while (r >= 0 && r < board.rows && c >= 0 && c < board.cols) {
        if (cellAt(r, c)) {
          setActive({ row: r, col: c });
          const wantDir: Direction = dr !== 0 ? "down" : "across";
          if (entryAt[wantDir].has(cellKey(r, c))) setDir(wantDir);
          return;
        }
        r += dr;
        c += dc;
      }
    },
    [active, board, cellAt, entryAt]
  );

  // Physical keyboard
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (confirmClear || showCoach) return; // an open modal owns the keyboard
      if (koActive) {
        // Map physical QWERTY position → 2벌식 jamo (independent of OS IME state).
        const jamo = e.shiftKey ? QWERTY_TO_JAMO_SHIFT[e.code] : QWERTY_TO_JAMO[e.code];
        if (jamo) {
          e.preventDefault();
          handleJamo(jamo);
          return;
        }
      }
      if (!koActive && /^[a-zA-Z]$/.test(e.key)) {
        e.preventDefault();
        handleChar(e.key.toUpperCase());
      } else if (e.key === "Backspace") {
        e.preventDefault();
        handleBackspace();
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        move(-1, 0);
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        move(1, 0);
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        move(0, -1);
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        move(0, 1);
      }
      else if (e.key === " " || e.key === "Tab") {
        e.preventDefault();
        setDir((d) => (d === "across" ? "down" : "across"));
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [handleChar, handleBackspace, handleJamo, move, koActive, confirmClear, showCoach]);

  // Confirm dialog: focus 취소 on open (never the destructive button) and let
  // Esc cancel (UX #1).
  useEffect(() => {
    if (!confirmClear) return;
    cancelRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        setConfirmClear(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [confirmClear]);

  const COACH_KEY = "kpx.coach.v1";
  const dismissCoach = useCallback(() => {
    try {
      localStorage.setItem(COACH_KEY, "1");
    } catch {
      // Private-mode / storage-disabled: still close so the overlay never
      // traps the player. It may re-show next visit — acceptable, not silenced.
      console.warn("coachmark: localStorage unavailable, dismissing without persist");
    }
    setShowCoach(false);
  }, []);

  // Show the coachmark once, after mount (never during SSR/first render), and
  // only if this browser hasn't dismissed it before (C1).
  useEffect(() => {
    let seen = true;
    try {
      seen = localStorage.getItem(COACH_KEY) === "1";
    } catch {
      seen = false; // storage blocked → treat as first run
    }
    if (seen) return;
    // Defer the setState out of the effect body (same idiom as the pop/reset
    // effects above) so it never runs synchronously during commit.
    const id = setTimeout(() => setShowCoach(true), 0);
    return () => clearTimeout(id);
  }, []);

  // Esc closes the coachmark; the overlay owns the keyboard while open (below).
  useEffect(() => {
    if (!showCoach) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        dismissCoach();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [showCoach, dismissCoach]);

  const runCheck = useCallback(() => {
    const next: CheckState = {};
    for (const row of board.cells) {
      for (const cell of row) {
        if (!cell) continue;
        const key = cellKey(cell.row, cell.col);
        const v = values[key];
        if (v) next[key] = v === cell.solution ? "correct" : "wrong";
      }
    }
    wrongCursor.current = 0;
    setCheck(next);
  }, [board, values]);

  // Wrong cells in reading order (row, then col) — drives the summary banner
  // and the "다음 오답으로" jump. Empty (unfilled) cells are never counted here
  // because runCheck only records cells that had a value (UX #2).
  const wrongCells = useMemo(() => {
    const out: { row: number; col: number }[] = [];
    for (const row of board.cells) {
      for (const cell of row) {
        if (cell && check[cellKey(cell.row, cell.col)] === "wrong") {
          out.push({ row: cell.row, col: cell.col });
        }
      }
    }
    return out;
  }, [board, check]);

  // Non-null only after a check ran (check map non-empty). Live-updates as the
  // player fixes a cell, because setLetter drops that cell's check mark.
  const checkSummary = useMemo(() => {
    const keys = Object.keys(check);
    if (keys.length === 0) return null;
    let wrong = 0;
    for (const k of keys) if (check[k] === "wrong") wrong++;
    return { filled: keys.length, wrong };
  }, [check]);

  const jumpNextWrong = useCallback(() => {
    if (wrongCells.length === 0) return;
    const idx = wrongCursor.current % wrongCells.length;
    const target = wrongCells[idx];
    wrongCursor.current = idx + 1;
    selectCell(target.row, target.col);
    boardRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [wrongCells, selectCell]);

  const revealCell = useCallback(() => {
    const cell = cellAt(active.row, active.col);
    if (!cell) return;
    setLetter(active.row, active.col, cell.solution);
    setCheck((prev) => ({ ...prev, [cellKey(active.row, active.col)]: "correct" }));
    advance(1);
  }, [active, advance, cellAt, setLetter]);

  const clearAll = useCallback(() => {
    setValues({});
    setCheck({});
    setDone(false);
    setSeconds(0);
  }, []);

  const goToEntry = useCallback((entry: Entry) => {
    setActive({ row: entry.row, col: entry.col });
    setDir(entry.dir);
    boardRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, []);

  const mmss = `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;

  const handleShare = useCallback(() => {
    const th = album.theme;
    const canvas = drawShareCard({
      artist: artist.name,
      album: album.title,
      time: mmss,
      accent: th?.accent[0] ?? "#8a38f5",
      accent2: th?.accent[1] ?? "#d53a6b",
      bg: th?.bg ?? "#0e0e12",
      fg: th?.fg ?? "#f5f5f7",
      concept: th?.concept,
      fandom: artist.fandom.replace(/\s+/g, ""),
    });
    void shareOrDownload(
      canvas,
      `kpop-crossword-${artist.id}-${album.id}.png`,
      `${artist.name} ${album.title} 크로스워드 ${mmss}에 클리어! #KPOPCROSSWORD`
    );
  }, [album, artist, mmss]);

  const filled = Object.values(values).filter(Boolean).length;
  const total = board.cells.flat().filter(Boolean).length;
  const fillRate = total ? Math.round((filled / total) * 100) : 0;

  const t = album.theme;
  const brand = getAlbumBrand(artist, album);
  const cellBase =
    board.cols >= 18 ? "clamp(18px, 5vw, 29px)" : board.cols >= 16 ? "clamp(21px, 5.8vw, 32px)" : "clamp(24px, 6.8vw, 36px)";
  const paperBase = t ? mixHex(t.accent[0], "#f8f9fc", 0.88) : "#f9fafc";
  const paperDeep = t ? mixHex(t.accent[1] ?? t.accent[0], "#e8ecf2", 0.82) : "#e9edf3";
  const posterBg = t ? mixHex(t.bg, "#eef1f6", 0.9) : "#eef1f6";
  const boardBase = t ? mixHex(t.accent[0], "#fcfdff", 0.94) : "#fcfdff";
  const themeStyle = t
    ? ({
        ["--accent"]: t.accent[0],
        ["--accent-2"]: t.accent[1] ?? t.accent[0],
        ["--accent-3"]: t.accent[2] ?? t.accent[0],
        ["--album-bg"]: t.bg,
        ["--album-fg"]: t.fg,
        ["--paper"]: paperBase,
        ["--paper-deep"]: paperDeep,
        ["--poster-bg"]: posterBg,
        ["--board-base"]: boardBase,
        // Contrast ink for text sitting ON the accent fill (seg toggle, primary
        // + danger buttons). Light accent → dark ink, dark accent → white. CSS
        // reads it via color: var(--on-accent, …) (Spec #3).
        ["--on-accent"]: luminance(t.accent[0]) > 0.45 ? "#111111" : "#ffffff",
      } as React.CSSProperties)
    : undefined;
  return (
    <div
      className={`game game--poster game--${brand.variant}`}
      data-themed={t ? "" : undefined}
      data-album={brand.albumKey}
      style={themeStyle}
    >
      <div className={`game__albumskin game__albumskin--${brand.albumKey}`} aria-hidden="true" />
      {/* Control bar */}
      <div className="game__bar">
        <Link href={backHref} className="game__back" aria-label="뒤로">
          <ArrowLeft size={18} />
        </Link>
        <span className="game__art-spacer" />
        <div className="seg-mini" role="group" aria-label="문제 언어">
          <button
            data-on={mode === "ko"}
            disabled={!hasKo}
            onClick={() => setMode("ko")}
            title={hasKo ? undefined : "이 앨범은 한글 퀴즈가 아직 없어요"}
          >
            한글
          </button>
          <button data-on={mode === "en"} onClick={() => setMode("en")}>
            영문
          </button>
        </div>
        <div className="game__timer" aria-label="Elapsed time">{mmss}</div>
      </div>

      {/* Album hero */}
      <div className={`game__art game__art--${brand.variant}`}>
        <div className="game__art-noise" aria-hidden="true" />
        <div className="game__art-copy">
          <div className="game__art-kicker">
            <span>{artist.name}</span>
            <span>{brand.releaseLabel}</span>
          </div>
          <span className="game__art-artist">{artist.name}</span>
          <span className="game__art-album">{album.title}</span>
          <p className="game__concept">{brand.concept}</p>
          <div className="game__art-tags">
            {brand.facts.map((fact) => (
              <span key={fact}>{fact}</span>
            ))}
          </div>
        </div>
        <div className="game__art-visual" aria-hidden="true">
          {brand.imageSrc ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img className="game__art-motif" src={brand.imageSrc} alt={`${artist.name} ${album.title} cover`} />
          ) : (
            <span className="game__art-glyph">{brand.glyph}</span>
          )}
          <span className="game__art-stamp">{brand.titleTrackLabel}</span>
        </div>
        <div className="game__art-tabs" aria-hidden="true">
          {[brand.releaseLabel, artist.name, artist.fandom].map((fact) => (
            <span key={fact}>{fact}</span>
          ))}
        </div>
      </div>

      <div className="game__progress">
        <div className="game__progress-bar" style={{ width: `${fillRate}%` }} />
        <span className="game__progress-label">{filled}/{total} · {fillRate}%</span>
      </div>

      {/* Active clue bar — sticky above the board */}
      <div className="game__top">
        {activeEntry && (
          <div className="cluebar">
            <button className="cluebar__nav" onClick={() => stepEntry(-1)} aria-label="이전 단서">
              ‹
            </button>
            <div className="cluebar__text">
              <span className="cluebar__tag">
                {activeEntry.number} {activeEntry.dir === "across" ? "가로 ›" : "세로 ⌄"} · {activeEntry.len}칸
              </span>
              <span>{clueOf(activeEntry)}</span>
            </div>
            <button className="cluebar__nav" onClick={() => stepEntry(1)} aria-label="다음 단서">
              ›
            </button>
          </div>
        )}
      </div>

      <div className="game__play">
      <div className="game__playmain">
      <section className="game__sheet">
      <div className="game__sectionhead">
        <span>QUIZ BOARD</span>
        <strong>{brand.boardLabel}</strong>
      </div>
      {/* Board zoom */}
      <div className="board-zoom">
        <button
          onClick={() => setZoom((z) => Math.max(0.55, Math.round((z - 0.15) * 100) / 100))}
          disabled={zoom <= 0.55}
          aria-label="격자 축소"
        >
          −
        </button>
        <span className="board-zoom__label">{Math.round(zoom * 100)}%</span>
        <button
          onClick={() => setZoom((z) => Math.min(1.3, Math.round((z + 0.15) * 100) / 100))}
          disabled={zoom >= 1.3}
          aria-label="격자 확대"
        >
          +
        </button>
      </div>

      {/* Board */}
      <div className="game__boardwrap">
        <div
          ref={boardRef}
          className="board"
          style={{
            gridTemplateColumns: `repeat(${board.cols}, var(--cell))`,
            gridTemplateRows: `repeat(${board.rows}, var(--cell))`,
            ["--cell"]: `calc(var(--cell-base) * ${zoom})`,
            ["--cell-base"]: cellBase,
          } as React.CSSProperties}
        >
          {board.cells.map((row, r) =>
            row.map((cell, c) => {
              if (!cell) return <div key={cellKey(r, c)} className="cell cell--void" />;
              const key = cellKey(r, c);
              const isActive = active.row === r && active.col === c;
              const inWord = activeCellKeys.has(key);
              const st = check[key];
              return (
                <button
                  type="button"
                  key={key}
                  onClick={() => selectCell(r, c)}
                  className={[
                    "cell",
                    inWord && !isActive ? "cell--word" : "",
                    isActive ? "cell--active" : "",
                    st === "correct" ? "cell--correct" : "",
                    st === "wrong" ? "cell--wrong" : "",
                    popped.has(key) ? "cell--pop" : "",
                  ].join(" ")}
                >
                  {cell.number !== null && <span className="cell__num">{cell.number}</span>}
                  <span className="cell__letter">{values[key] ?? ""}</span>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Toolbar */}
      <div className="toolbar">
        <button className="tool" onClick={runCheck}><Check size={16} /> 정답 확인</button>
        <button className="tool" onClick={revealCell}><Lightbulb size={16} /> 한 칸 힌트</button>
        <button className="tool" onClick={() => setCheck({})}><Eraser size={16} /> 표시 지우기</button>
        <button className="tool" onClick={() => setConfirmClear(true)}><RotateCcw size={16} /> 처음부터</button>
      </div>

      {checkSummary && (
        <div
          className={`check-summary ${checkSummary.wrong > 0 ? "check-summary--error" : ""}`}
          role="status"
          aria-live="polite"
        >
          <span className="check-summary__text">
            {checkSummary.wrong === 0
              ? `${checkSummary.filled}칸 전부 정답 ✓`
              : `${checkSummary.filled}칸 채움 · ${checkSummary.wrong}칸 오답`}
          </span>
          <button
            className="tool check-summary__jump"
            onClick={jumpNextWrong}
            disabled={checkSummary.wrong === 0}
          >
            다음 오답으로
          </button>
        </div>
      )}

      <div className="keypad-spacer" aria-hidden="true" />

      {/* Keypad (mobile-first) */}
      {koActive ? (
        <div className="keypad">
          <div className="keypad__row">
            {KEYPAD_ROW_KO_SHIFT.map((ch) => (
              <button key={ch} className="key" onClick={() => handleJamo(ch)}>
                {ch}
              </button>
            ))}
          </div>
          {KEYPAD_ROWS_KO.map((row, i, arr) => (
            <div className="keypad__row" key={i}>
              {row.map((ch) => (
                <button key={ch} className="key" onClick={() => handleJamo(ch)}>
                  {ch}
                </button>
              ))}
              {i === arr.length - 1 && (
                <button className="key key--del" onClick={handleBackspace} aria-label="Delete">
                  <Delete size={18} />
                </button>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="keypad">
          {KEYPAD_ROWS.map((rowStr, i, arr) => (
            <div className="keypad__row" key={i}>
              {rowStr.split("").map((ch) => (
                <button
                  key={ch}
                  className="key"
                  onClick={() => handleChar(ch)}
                >
                  {ch}
                </button>
              ))}
              {i === arr.length - 1 && (
                <button className="key key--del" onClick={handleBackspace} aria-label="Delete">
                  <Delete size={18} />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
      </section>

      </div>
      {/* /game__playmain */}

      {/* Clue lists */}
      <aside className="clues game__sheet game__sheet--clues">
        <div className="game__sectionhead">
          <span>CLUE FILE</span>
          <strong>{brand.clueLabel}</strong>
        </div>
        <ClueColumn title={mode === "ko" ? "가로" : "ACROSS"} entries={board.across} active={activeEntry} clueOf={clueOf} onPick={goToEntry} />
        <ClueColumn title={mode === "ko" ? "세로" : "DOWN"} entries={board.down} active={activeEntry} clueOf={clueOf} onPick={goToEntry} />
      </aside>
      </div>
      {/* /game__play */}

      {showCoach && (
        <div
          className="coachmark"
          role="dialog"
          aria-modal="true"
          aria-labelledby="coach-title"
          onClick={dismissCoach}
        >
          <div className="coachmark__card" onClick={(e) => e.stopPropagation()}>
            <strong className="coachmark__title" id="coach-title">이렇게 풀어요</strong>
            <ul className="coachmark__list">
              <li className="coachmark__step">
                <span className="coachmark__badge">1</span> 칸을 눌러 단어 선택
              </li>
              <li className="coachmark__step">
                <span className="coachmark__badge">2</span> 아래 키패드로 입력 · ENG↔한글 전환
              </li>
              <li className="coachmark__step">
                <span className="coachmark__badge">3</span> 정답 확인으로 오답 점검
              </li>
            </ul>
            <button className="coachmark__dismiss" onClick={dismissCoach}>
              시작하기
            </button>
          </div>
        </div>
      )}

      {confirmClear && (
        <div
          className="victory"
          role="dialog"
          aria-modal="true"
          aria-labelledby="confirm-title"
        >
          <div className="victory__card confirm">
            <strong className="confirm__title" id="confirm-title">처음부터 다시?</strong>
            <div className="confirm__body">입력한 답과 표시가 모두 지워져요. 되돌릴 수 없어요.</div>
            <div className="victory__actions">
              <button className="tool" ref={cancelRef} onClick={() => setConfirmClear(false)}>
                취소
              </button>
              <button
                className="tool tool--danger"
                onClick={() => {
                  clearAll();
                  setConfirmClear(false);
                }}
              >
                <RotateCcw size={16} /> 전부 지우기
              </button>
            </div>
          </div>
        </div>
      )}

      {done && (
        <div className="victory" role="dialog" aria-modal="true">
          <Confetti colors={t?.accent ?? ["#8a38f5", "#d53a6b", "#ffd23f"]} />
          <div className="victory__card">
            <Trophy className="victory__trophy" size={40} />
            <h2>CLEAR!</h2>
            <p>{artist.name} — {album.title}</p>
            <p className="victory__time">{mmss} 클리어</p>
            <div className="victory__actions">
              <button className="tool tool--primary" onClick={handleShare}>
                <Share2 size={16} /> 결과 공유
              </button>
            </div>
            <div className="victory__actions">
              <button className="tool" onClick={clearAll}><RotateCcw size={16} /> 다시 풀기</button>
              <Link href={backHref} className="tool"><ArrowLeft size={16} /> 다른 앨범</Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  // Move active selection to the previous/next entry in reading order.
  function stepEntry(delta: number) {
    const ordered = [...board.across, ...board.down];
    if (!activeEntry) return;
    const idx = ordered.findIndex((e) => e === activeEntry);
    const next = ordered[(idx + delta + ordered.length) % ordered.length];
    goToEntry(next);
  }
}

function ClueColumn({
  title,
  entries,
  active,
  clueOf,
  onPick,
}: {
  title: string;
  entries: Entry[];
  active: Entry | null;
  clueOf: (e: Entry) => string;
  onPick: (e: Entry) => void;
}) {
  return (
    <div className="clues__col">
      <h3 className="clues__title">{title}</h3>
      <ol className="clues__list">
        {entries.map((e) => {
          const on = active === e;
          return (
            <li key={`${e.dir}-${e.row}-${e.col}`}>
              <button className={`clueitem ${on ? "clueitem--active" : ""}`} onClick={() => onPick(e)}>
                <span className="clueitem__num">{e.number}</span>
                <span className="clueitem__clue">{clueOf(e)}</span>
                <span className="clueitem__len">{e.len}</span>
              </button>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
