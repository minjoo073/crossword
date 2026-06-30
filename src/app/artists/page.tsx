import Desktop from "@/components/retro/Desktop";
import RetroWindow from "@/components/retro/RetroWindow";
import ArtistBrowser, { type ArtistItem } from "@/components/ArtistBrowser";
import { getArtists } from "@/lib/puzzle";

export const metadata = { title: "아티스트 선택 | K-POP Crossword" };

export default function ArtistsPage() {
  const artists: ArtistItem[] = getArtists().map((a) => {
    const first = a.albums[0];
    return {
      id: a.id,
      name: a.name,
      gender: a.gender,
      fandom: a.fandom,
      albumCount: a.albums.length,
      // Skip the album-select screen when there's only one album.
      href: a.albums.length > 1 ? `/${a.id}` : `/${a.id}/${a.albums[0].id}`,
      initial: a.name[0],
      cover: first?.coverUrl ?? null,
      ca1: first?.theme?.accent[0] ?? "#8a38f5",
      ca2: first?.theme?.bg ?? "#d53a6b",
      caFg: first?.theme?.fg ?? "#ffffff",
    };
  });

  return (
    <Desktop taskbarLabel="아티스트 선택">
      <RetroWindow title="K-POP CROSSWORD — 카테고리" menus={["파일", "보기", "도움말"]} closeHref="/">
        <ArtistBrowser artists={artists} />
      </RetroWindow>
    </Desktop>
  );
}
