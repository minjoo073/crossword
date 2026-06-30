import { notFound } from "next/navigation";
import type { Metadata } from "next";
import CrosswordGame from "@/components/CrosswordGame";
import Desktop from "@/components/retro/Desktop";
import RetroWindow from "@/components/retro/RetroWindow";
import { allAlbumParams, getAlbum } from "@/lib/puzzle";

export function generateStaticParams() {
  return allAlbumParams();
}

export async function generateMetadata(props: PageProps<"/[artistId]/[albumId]">): Promise<Metadata> {
  const { artistId, albumId } = await props.params;
  const found = getAlbum(artistId, albumId);
  if (!found) return { title: "Not found" };
  return {
    title: `${found.artist.name} — ${found.album.title} | K-POP Crossword`,
    description: found.album.theme?.concept ?? `${found.artist.name} ${found.album.title} 앨범 크로스워드`,
  };
}

export default async function AlbumPuzzlePage(props: PageProps<"/[artistId]/[albumId]">) {
  const { artistId, albumId } = await props.params;
  const found = getAlbum(artistId, albumId);
  if (!found) notFound();

  // If the artist has multiple albums, go back to album-select; otherwise to categories.
  const backHref = found.artist.albums.length > 1 ? `/${artistId}` : "/artists";

  return (
    <Desktop taskbarLabel={`${found.artist.name} — ${found.album.title}`}>
      <RetroWindow
        title={`${found.artist.name} — ${found.album.title}.xword`}
        menus={["파일", "편집", "보기", "힌트", "도움말"]}
        closeHref={backHref}
        className="win--game"
      >
        <CrosswordGame artist={found.artist} album={found.album} backHref={backHref} />
      </RetroWindow>
    </Desktop>
  );
}
