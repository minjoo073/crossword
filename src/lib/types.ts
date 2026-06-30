export type Direction = "across" | "down";

export interface Entry {
  number: number;
  answer: string;
  clue: string;
  clueKo?: string;
  len: number;
  row: number;
  col: number;
  dir: Direction;
}

export interface AlbumTheme {
  artistId: string;
  albumId: string;
  accent: string[];
  bg: string;
  fg: string;
  mood: string[];
  concept: string;
}

export interface Album {
  id: string;
  title: string;
  releaseDate: string;
  titleTrack: string;
  lightstick: string | null;
  coverUrl: string | null;
  theme: AlbumTheme | null;
  grid: { rows: number; cols: number };
  entries: Entry[];
  /** Optional Korean-answer puzzle (Hangul, one syllable per cell). */
  ko?: { grid: { rows: number; cols: number }; entries: Entry[] } | null;
}

export interface Puzzle {
  grid: { rows: number; cols: number };
  entries: Entry[];
}

export interface Artist {
  id: string;
  name: string;
  gender: "male" | "female";
  agency: string;
  fandom: string;
  albums: Album[];
}

export interface PuzzleData {
  meta: Record<string, unknown>;
  artists: Artist[];
}

/** A single playable square in the grid. */
export interface Cell {
  row: number;
  col: number;
  solution: string;
  number: number | null;
  across: number | null; // entry number of the across word through this cell
  down: number | null; // entry number of the down word through this cell
}

export interface Board {
  rows: number;
  cols: number;
  cells: (Cell | null)[][];
  entries: Entry[];
  across: Entry[];
  down: Entry[];
}
