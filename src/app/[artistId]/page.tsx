import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Desktop from "@/components/retro/Desktop";
import RetroWindow from "@/components/retro/RetroWindow";
import { getAlbumBrand } from "@/lib/albumBrand";
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
            {artist.albums.map((album) => {
              const brand = getAlbumBrand(artist, album);

              return (
                <Link
                  key={album.id}
                  href={`/${artist.id}/${album.id}`}
                  className={`album-card album-card--${brand.variant}`}
                  style={
                    {
                      ["--accent"]: album.theme?.accent[0] ?? "#8a38f5",
                      ["--accent-2"]: album.theme?.accent[1] ?? "#d53a6b",
                      ["--accent-3"]: album.theme?.accent[2] ?? "#111111",
                      ["--album-bg"]: album.theme?.bg ?? "#ffffff",
                      ["--album-fg"]: album.theme?.fg ?? "#111111",
                    } as React.CSSProperties
                  }
                >
                  <div className="album-card__paper">
                    <div className="album-card__head">
                      <span>{brand.releaseLabel}</span>
                      <span>{brand.yearLabel} ERA</span>
                    </div>
                    <div className="album-card__title">{album.title}</div>
                    <p className="album-card__concept">{brand.conceptLine}</p>
                    <div className="album-card__visual">
                      {brand.imageSrc ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img className="album-card__motif" src={brand.imageSrc} alt={`${album.title} cover`} />
                      ) : (
                        <span className="album-card__big" aria-hidden>
                          {brand.glyph}
                        </span>
                      )}
                      <span className="album-card__stamp">{brand.titleTrackLabel}</span>
                    </div>
                    <div className="album-card__tabs" aria-hidden="true">
                      {brand.facts.map((fact) => (
                        <span key={fact}>{fact}</span>
                      ))}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </RetroWindow>
    </Desktop>
  );
}
