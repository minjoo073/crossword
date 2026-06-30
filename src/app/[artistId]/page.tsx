import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Desktop from "@/components/retro/Desktop";
import RetroWindow from "@/components/retro/RetroWindow";
import { getArtist, getArtists } from "@/lib/puzzle";

export function generateStaticParams() {
  return getArtists().map((a) => ({ artistId: a.id }));
}

export async function generateMetadata(props: PageProps<"/[artistId]">): Promise<Metadata> {
  const { artistId } = await props.params;
  const artist = getArtist(artistId);
  return { title: artist ? `${artist.name} — 앨범 선택 | K-POP Crossword` : "Not found" };
}

export default async function ArtistAlbumsPage(props: PageProps<"/[artistId]">) {
  const { artistId } = await props.params;
  const artist = getArtist(artistId);
  if (!artist) notFound();

  return (
    <Desktop taskbarLabel={`${artist.name} — 앨범`}>
      <RetroWindow title={`${artist.name} — 앨범 선택`} menus={["파일", "보기", "도움말"]} closeHref="/artists">
        <div className="pick">
          <div className="pick__head">
            <span className="pick__title">{artist.name}</span>
            <span className="pick__crumb">
              <Link href="/artists">아티스트</Link> › {artist.name} · {artist.fandom} 팬덤
            </span>
          </div>
          <div className="pick__section">최근 2년 앨범 · {artist.albums.length}게임</div>
          <div className="albums">
            {artist.albums.map((album) => (
              <Link key={album.id} href={`/${artist.id}/${album.id}`} className="album-card">
                <figure
                  className="cover-tile cover-tile--flush album-card__cover"
                  style={{ ["--accent"]: album.theme?.accent[0] ?? "#8a38f5" } as React.CSSProperties}
                >
                  <span className="cover-tile__glow" aria-hidden="true" />
                  {album.coverUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img className="cover-tile__img" src={album.coverUrl} alt={`${album.title} 커버`} />
                  ) : (
                    <span className="album-card__big" aria-hidden>
                      {album.title[0]}
                    </span>
                  )}
                </figure>
                <div className="album-card__body">
                  <div className="album-card__title">{album.title}</div>
                  <div className="album-card__meta">{album.entries.length}문항 · 크로스워드</div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </RetroWindow>
    </Desktop>
  );
}
