"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, Check, Delete, Eraser, Lightbulb, RotateCcw, Share2, Trophy } from "lucide-react";
import Link from "next/link";
import type { Album, Artist, Board, Direction, Entry } from "@/lib/types";
import { buildBoard, cellKey, entryCells } from "@/lib/puzzle";
import Confetti from "@/components/Confetti";
import { drawShareCard, shareOrDownload } from "@/lib/shareCard";
import { compose, emptyComp, processJamo, type Comp } from "@/lib/hangul";

const KEYPAD_ROWS = ["QWERTYUIOP", "ASDFGHJKL", "ZXCVBNM"];
// Korean (2-beolsik) jamo layout — for Korean-answer puzzles (toggle).
const KEYPAD_ROWS_KO = ["ㅂㅈㄷㄱㅅㅛㅕㅑㅐㅔ", "ㅁㄴㅇㄹㅎㅗㅓㅏㅣ", "ㅋㅌㅊㅍㅠㅜㅡ"];

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
  const [mode, setMode] = useState<"en" | "ko">("en");
  const puzzle = useMemo(
    () => (mode === "ko" && album.ko ? album.ko : { grid: album.grid, entries: album.entries }),
    [mode, album]
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
  const [hangul, setHangul] = useState<(Comp & { key: string }) | null>(null);
  const completedRef = useRef<Set<string>>(new Set());
  const boardRef = useRef<HTMLDivElement>(null);

  const clueOf = useCallback((e: Entry) => e.clue, []);

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
      setPopped(fresh);
      const t = setTimeout(() => setPopped(new Set()), 480);
      return () => clearTimeout(t);
    }
  }, [values, board]);

  // Reset the game when switching puzzle mode (영문 <-> 한글).
  const modeInit = useRef(true);
  useEffect(() => {
    if (modeInit.current) {
      modeInit.current = false;
      return;
    }
    setValues({});
    setCheck({});
    setPopped(new Set());
    completedRef.current = new Set();
    setDone(false);
    setSeconds(0);
    setHangul(null);
    const first = board.across[0] ?? board.down[0];
    if (first) {
      setActive({ row: first.row, col: first.col });
      setDir(board.across[0] ? "across" : "down");
    }
  }, [mode, board]);

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

  const cellAt = (r: number, c: number) => (board.cells[r]?.[c] ?? null);

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
    [active, dir, entryAt]
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
    [check, isSolved]
  );

  const handleChar = useCallback(
    (ch: string) => {
      setLetter(active.row, active.col, ch);
      advance(1);
    },
    [active, advance, setLetter]
  );

  // Korean jamo input — compose syllables into the active cell, carry over to the next.
  const handleJamo = useCallback(
    (jamo: string) => {
      const activeKey = cellKey(active.row, active.col);
      const cur: Comp =
        hangul && hangul.key === activeKey
          ? { cho: hangul.cho, jung: hangul.jung, jong: hangul.jong }
          : emptyComp();
      const r = processJamo(cur, jamo);
      setLetter(active.row, active.col, r.display);
      if (!r.advance) {
        setHangul({ key: activeKey, ...r.next });
        return;
      }
      if (!activeEntry) {
        setHangul(null);
        return;
      }
      const cells = entryCells(activeEntry);
      const idx = cells.findIndex((c) => c.row === active.row && c.col === active.col);
      const next = cells[idx + 1];
      if (next) {
        setActive({ row: next.row, col: next.col });
        setLetter(next.row, next.col, compose(r.next));
        setHangul({ key: cellKey(next.row, next.col), ...r.next });
      } else {
        setHangul(null);
      }
    },
    [active, activeEntry, hangul, setLetter]
  );

  const handleBackspace = useCallback(() => {
    setHangul(null);
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
  }, [active, activeEntry, check, setLetter, values]);

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
    [active, board, entryAt]
  );

  // Physical keyboard
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (/^[a-zA-Z]$/.test(e.key)) {
        if (mode === "ko") return; // Korean answers use the on-screen jamo keypad
        e.preventDefault();
        handleChar(e.key.toUpperCase());
      } else if (e.key === "Backspace") {
        e.preventDefault();
        handleBackspace();
      } else if (e.key === "ArrowUp") (e.preventDefault(), move(-1, 0));
      else if (e.key === "ArrowDown") (e.preventDefault(), move(1, 0));
      else if (e.key === "ArrowLeft") (e.preventDefault(), move(0, -1));
      else if (e.key === "ArrowRight") (e.preventDefault(), move(0, 1));
      else if (e.key === " " || e.key === "Tab") {
        e.preventDefault();
        setDir((d) => (d === "across" ? "down" : "across"));
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [handleChar, handleBackspace, move, mode]);

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
    setCheck(next);
  }, [board, values]);

  const revealCell = useCallback(() => {
    const cell = cellAt(active.row, active.col);
    if (!cell) return;
    setLetter(active.row, active.col, cell.solution);
    setCheck((prev) => ({ ...prev, [cellKey(active.row, active.col)]: "correct" }));
    advance(1);
  }, [active, advance, setLetter]);

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

  const t = album.theme;
  const themeStyle = t
    ? ({
        ["--accent"]: t.accent[0],
        ["--accent-2"]: t.accent[1] ?? t.accent[0],
        ["--accent-3"]: t.accent[2] ?? t.accent[0],
        ["--album-bg"]: t.bg,
        ["--album-fg"]: t.fg,
      } as React.CSSProperties)
    : undefined;
  const scope = t ? (luminance(t.bg) > 0.5 ? "light" : "dark") : "dark";

  return (
    <div className={`game dream-scope dream-scope--${scope}`} data-themed={t ? "" : undefined} style={themeStyle}>
      {/* Control bar */}
      <div className="game__bar">
        <Link href={backHref} className="game__back" aria-label="뒤로">
          <ArrowLeft size={18} />
        </Link>
        <span className="game__art-spacer" />
        {album.ko && (
          <div className="seg-mini" role="group" aria-label="퍼즐 버전">
            <button data-on={mode === "en"} onClick={() => setMode("en")}>
              ENG
            </button>
            <button data-on={mode === "ko"} onClick={() => setMode("ko")}>
              한글
            </button>
          </div>
        )}
        <div className="game__timer" aria-label="Elapsed time">{mmss}</div>
      </div>

      {/* Album hero — real cover in a dreamcore frame */}
      <div className="game__art">
        {album.coverUrl && (
          <div className="halftone-frame game__art-cover">
            <figure className="cover-tile cover-tile--flush">
              <span className="cover-tile__glow" aria-hidden="true" />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img className="cover-tile__img" src={album.coverUrl} alt={`${artist.name} — ${album.title} 앨범 커버`} />
            </figure>
          </div>
        )}
        <div className="game__art-meta">
          <span className="game__art-artist">{artist.name}</span>
          <span className="game__art-album">{album.title}</span>
          {album.theme?.concept && <p className="game__concept">“{album.theme.concept}”</p>}
        </div>
        <span className="sticker sticker--star sticker--lg sticker--tr" aria-hidden="true" />
        <span className="sticker sticker--sparkle sticker--sm" style={{ top: "14%", left: "-6px" }} aria-hidden="true" />
        <span className="sticker sticker--bubble sticker--md sticker--delay" style={{ bottom: "6%", right: "12%" }} aria-hidden="true" />
      </div>

      <div className="game__progress">
        <div className="game__progress-bar" style={{ width: `${(filled / total) * 100}%` }} />
        <span className="game__progress-label">{filled}/{total}</span>
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
        <button className="tool" onClick={runCheck}><Check size={16} /> Check</button>
        <button className="tool" onClick={revealCell}><Lightbulb size={16} /> Hint</button>
        <button className="tool" onClick={() => setCheck({})}><Eraser size={16} /> Clear marks</button>
        <button className="tool" onClick={clearAll}><RotateCcw size={16} /> Reset</button>
      </div>

      {/* Keypad (mobile-first) — follows puzzle mode (영문 QWERTY / 한글 자모) */}
      <div className="keypad">
        {(mode === "ko" ? KEYPAD_ROWS_KO : KEYPAD_ROWS).map((rowStr, i, arr) => (
          <div className="keypad__row" key={i}>
            {rowStr.split("").map((ch) => (
              <button
                key={ch}
                className="key"
                onClick={() => (mode === "ko" ? handleJamo(ch) : handleChar(ch))}
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

      </div>
      {/* /game__playmain */}

      {/* Clue lists */}
      <div className="clues">
        <ClueColumn title={mode === "ko" ? "가로" : "ACROSS"} entries={board.across} active={activeEntry} clueOf={clueOf} onPick={goToEntry} />
        <ClueColumn title={mode === "ko" ? "세로" : "DOWN"} entries={board.down} active={activeEntry} clueOf={clueOf} onPick={goToEntry} />
      </div>
      </div>
      {/* /game__play */}

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
