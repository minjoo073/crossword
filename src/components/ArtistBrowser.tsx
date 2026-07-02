"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Search } from "lucide-react";
import { useProgressStore } from "@/components/ClearBadge";
import { isAlbumCleared } from "@/lib/progress";

export interface ArtistItem {
  id: string;
  name: string;
  gender: "male" | "female";
  fandom: string;
  albumCount: number;
  /** Album ids for this artist, to compute the "all cleared" tile badge. */
  albumIds: string[];
  href: string;
  initial: string;
  cover: string | null;
  ca1: string;
  ca2: string;
  caFg: string;
}

type Filter = "all" | "male" | "female";

export default function ArtistBrowser({ artists }: { artists: ArtistItem[] }) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  // Read once after mount; null on SSR/first paint so tile badges stay
  // hydration-safe (server renders no badge, client fills them in post-mount).
  const store = useProgressStore();

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return artists.filter((a) => {
      if (filter !== "all" && a.gender !== filter) return false;
      if (!q) return true;
      return a.name.toLowerCase().includes(q) || a.fandom.toLowerCase().includes(q);
    });
  }, [artists, query, filter]);

  const groups: { key: "male" | "female"; label: string }[] = [
    { key: "male", label: "남자 아이돌" },
    { key: "female", label: "여자 아이돌" },
  ];

  return (
    <div className="pick">
      <div className="pick__head">
        <span className="pick__title">아티스트 선택</span>
        <span className="pick__spacer" />
        <label className="pick__search">
          <Search size={15} color="#5a6b85" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="아티스트 · 팬덤 검색"
            aria-label="검색"
          />
        </label>
        <div className="pick__seg" role="group" aria-label="성별 필터">
          {(["all", "male", "female"] as Filter[]).map((f) => (
            <button key={f} data-on={filter === f} onClick={() => setFilter(f)}>
              {f === "all" ? "전체" : f === "male" ? "남돌" : "여돌"}
            </button>
          ))}
        </div>
      </div>

      {groups
        .filter((g) => filter === "all" || filter === g.key)
        .map((g) => {
          const list = filtered.filter((a) => a.gender === g.key);
          if (!list.length) return null;
          return (
            <section key={g.key}>
              <div className="pick__section">
                {g.label} · {list.length}팀
              </div>
              <div className="icons">
                {list.map((a) => {
                  const allCleared =
                    !!store &&
                    a.albumIds.length > 0 &&
                    a.albumIds.every((id) => isAlbumCleared(store, a.id, id));
                  return (
                  <Link key={a.id} href={a.href} className="icon-btn">
                    {allCleared && (
                      <span className="clear-badge clear-badge--tile" aria-label="이 아티스트의 앨범 전부 완료">
                        ★
                      </span>
                    )}
                    {a.cover ? (
                      <figure
                        className="cover-frame icon-cover"
                        style={{ ["--accent"]: a.ca1 } as React.CSSProperties}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img className="cover-frame__img" src={a.cover} alt={a.name} />
                      </figure>
                    ) : (
                      <span
                        className="icon-tile"
                        style={
                          { ["--ca1"]: a.ca1, ["--ca2"]: a.ca2, ["--ca-fg"]: a.caFg } as React.CSSProperties
                        }
                      >
                        {a.initial}
                      </span>
                    )}
                    <span className="icon-btn__name">{a.name}</span>
                    <span className="icon-btn__sub">
                      {a.fandom} · {a.albumCount}게임
                    </span>
                  </Link>
                  );
                })}
              </div>
            </section>
          );
        })}

      {filtered.length === 0 && (
        <div className="pick__empty">
          <p className="pick__empty-text">“{query}” 에 맞는 아티스트가 없어요.</p>
          <button
            type="button"
            className="pick__empty-clear"
            onClick={() => {
              setQuery("");
              setFilter("all");
            }}
          >
            검색 지우기
          </button>
        </div>
      )}
    </div>
  );
}
