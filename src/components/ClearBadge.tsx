"use client";

// Completion badges + counter for the SSG album/artist screens.
//
// These pages are statically generated, but cleared-state lives only in the
// visitor's localStorage. To avoid a hydration mismatch, every component here
// renders nothing on the server and on the first client render (store === null),
// then reads localStorage in a mount effect and re-renders with the real state.
// The markup/classNames are wired here; visual styling is 강디's (CSS) job.

import { useEffect, useState } from "react";
import { readStore, isAlbumCleared, type ProgressStore } from "@/lib/progress";

/** Returns the progress store after mount, or null during SSR / first paint. */
export function useProgressStore(): ProgressStore | null {
  const [store, setStore] = useState<ProgressStore | null>(null);
  useEffect(() => {
    setStore(readStore());
  }, []);
  return store;
}

export function AlbumClearBadge({ artistId, albumId }: { artistId: string; albumId: string }) {
  const store = useProgressStore();
  if (!store || !isAlbumCleared(store, artistId, albumId)) return null;
  return (
    <span className="clear-badge" aria-label="완료한 앨범">
      완료
    </span>
  );
}

/**
 * "N/M 클리어" counter over a list of albums. Renders nothing until the store
 * is loaded so the count never flashes 0 → N.
 */
export function ClearCounter({
  albums,
}: {
  albums: { artistId: string; albumId: string }[];
}) {
  const store = useProgressStore();
  if (!store) return null;
  const done = albums.filter((a) => isAlbumCleared(store, a.artistId, a.albumId)).length;
  if (done === 0) return null;
  return (
    <span className="clear-counter" aria-label={`전체 ${albums.length}개 중 ${done}개 완료`}>
      {done}/{albums.length} 클리어
    </span>
  );
}
