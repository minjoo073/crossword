import Link from "next/link";
import Desktop from "@/components/retro/Desktop";

export default function Landing() {
  return (
    <Desktop taskbarLabel="K-POP CROSSWORD">
      <div className="landing">
        <div className="landing__poster">
          <div className="landing__strip">4TH & 5TH GEN IDOLS</div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.svg" alt="K-POP CROSSWORD" className="landing__logo-img" />
          <p className="landing__copy">최애 앨범 컨셉으로 푸는 K-POP 팬 전용 크로스워드.</p>
          <div className="landing__meta" aria-hidden="true">
            <span>ALBUM ERA</span>
            <span>TYPE QUIZ</span>
            <span>MOBILE FIRST</span>
          </div>
          <Link href="/artists" className="landing__cta">
            게임 시작
          </Link>
        </div>
      </div>
    </Desktop>
  );
}
