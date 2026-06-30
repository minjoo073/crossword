import type { Album, Artist } from "./types";

type PosterVariant =
  | "sunset"
  | "club"
  | "romance"
  | "sticker"
  | "chrome"
  | "summer"
  | "noir"
  | "athletic"
  | "paper";

function pickVariant(album: Album): PosterVariant {
  const joined = `${album.title} ${album.titleTrack} ${album.theme?.mood.join(" ") ?? ""}`.toLowerCase();
  if (/(golden|sunset|summer|sparkling|hello|beat)/.test(joined)) return "sunset";
  if (/(crazy|whiplash|drip|armageddon|ate|rock)/.test(joined)) return "club";
  if (/(romance|sanctuary|tomorrow|like you|dark blood)/.test(joined)) return "romance";
  if (/(steady|wish|riizing|color)/.test(joined)) return "athletic";
  if (/(caligo|odyssey|asterum)/.test(joined)) return "noir";
  if (/(ive|unforgiven|babymons7er)/.test(joined)) return "chrome";
  if (/(1999|how|super real me)/.test(joined)) return "sticker";
  if (/(cinema|blue)/.test(joined)) return "summer";
  return "paper";
}

function formatReleaseDate(value: string) {
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(date);
}

function slugifyAlbumId(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

const ALBUM_COPY: Record<
  string,
  {
    facts?: string[];
    stamp?: string;
    boardLabel?: string;
    clueLabel?: string;
  }
> = {
  "romance-untold": {
    facts: ["타이틀 XO", "12문항", "ENGENE"],
    stamp: "ONLY IF YOU SAY YES",
    boardLabel: "고백 직전의 로맨스 보드",
    clueLabel: "사랑 서사 단서집",
  },
  "star-chapter-sanctuary": {
    facts: ["타이틀 Over The Moon", "12문항", "MOA"],
    stamp: "SANCTUARY ARCHIVE",
    boardLabel: "별빛 감정 보드",
    clueLabel: "성역 단서 목록",
  },
  ate: {
    facts: ["타이틀 Chk Chk Boom", "12문항", "STAY"],
    stamp: "WE ATE",
    boardLabel: "폭주 에너지 보드",
    clueLabel: "ATE 작전 단서집",
  },
};

export function getAlbumBrand(artist: Artist, album: Album) {
  const concept = album.theme?.concept ?? `${album.title} era crossword`;
  const conceptLine = concept.split("—").at(-1)?.trim() || concept;
  const albumKey = slugifyAlbumId(album.id);
  const copy = ALBUM_COPY[albumKey];

  return {
    albumKey,
    imageSrc: album.coverUrl,
    glyph: album.titleTrack.toUpperCase(),
    mood: album.theme?.mood ?? [],
    concept,
    conceptLine,
    variant: pickVariant(album),
    releaseLabel: formatReleaseDate(album.releaseDate),
    yearLabel: album.releaseDate.slice(0, 4),
    titleTrackLabel: copy?.stamp ?? album.titleTrack.toUpperCase(),
    facts: copy?.facts ?? [`타이틀 ${album.titleTrack}`, `${album.entries.length}문항`, artist.fandom],
    boardLabel: copy?.boardLabel ?? "앨범 퀴즈 보드",
    clueLabel: copy?.clueLabel ?? "단서 목록",
  };
}
