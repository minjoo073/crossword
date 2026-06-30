import puzzles from "@/data/puzzles.json";
import type { Artist, Board, Cell, Entry, Puzzle, PuzzleData } from "./types";
import type { Album } from "./types";

const data = puzzles as unknown as PuzzleData;

export function getArtists(): Artist[] {
  return data.artists;
}

export function getArtist(artistId: string): Artist | undefined {
  return data.artists.find((a) => a.id === artistId);
}

export function getAlbum(artistId: string, albumId: string): { artist: Artist; album: Album } | undefined {
  const artist = getArtist(artistId);
  const album = artist?.albums.find((al) => al.id === albumId);
  if (!artist || !album) return undefined;
  return { artist, album };
}

export function allAlbumParams(): { artistId: string; albumId: string }[] {
  return data.artists.flatMap((a) => a.albums.map((al) => ({ artistId: a.id, albumId: al.id })));
}

/** Builds a 2D cell grid + across/down clue lists from a puzzle's placed entries. */
export function buildBoard(puzzle: Puzzle): Board {
  const { rows, cols } = puzzle.grid;
  const cells: (Cell | null)[][] = Array.from({ length: rows }, () =>
    Array.from({ length: cols }, () => null)
  );

  const ensure = (r: number, c: number): Cell => {
    let cell = cells[r][c];
    if (!cell) {
      cell = { row: r, col: c, solution: "", number: null, across: null, down: null };
      cells[r][c] = cell;
    }
    return cell;
  };

  for (const entry of puzzle.entries) {
    for (let i = 0; i < entry.len; i++) {
      const r = entry.row + (entry.dir === "down" ? i : 0);
      const c = entry.col + (entry.dir === "across" ? i : 0);
      const cell = ensure(r, c);
      cell.solution = entry.answer[i];
      if (entry.dir === "across") cell.across = entry.number;
      else cell.down = entry.number;
      if (i === 0) {
        cell.number = cell.number === null ? entry.number : Math.min(cell.number, entry.number);
      }
    }
  }

  const across = puzzle.entries
    .filter((e) => e.dir === "across")
    .sort((a, b) => a.number - b.number);
  const down = puzzle.entries
    .filter((e) => e.dir === "down")
    .sort((a, b) => a.number - b.number);

  return { rows, cols, cells, entries: puzzle.entries, across, down };
}

export function entryCells(entry: Entry): { row: number; col: number }[] {
  const out: { row: number; col: number }[] = [];
  for (let i = 0; i < entry.len; i++) {
    out.push({
      row: entry.row + (entry.dir === "down" ? i : 0),
      col: entry.col + (entry.dir === "across" ? i : 0),
    });
  }
  return out;
}

export const cellKey = (r: number, c: number) => `${r},${c}`;
