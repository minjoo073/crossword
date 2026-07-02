import Link from "next/link";
import Desktop from "@/components/retro/Desktop";
import RetroWindow from "@/components/retro/RetroWindow";

export default function Landing() {
  return (
    <Desktop taskbarLabel="K-POP CROSSWORD">
      {/* B3: home now lives inside the same RetroWindow chrome as every other
          screen, so the retro-window shell identity holds from the first view. */}
      <RetroWindow title="K-POP CROSSWORD" menus={["파일", "보기", "도움말"]}>
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
            {/* C3: static decorative mini-board preview — reuses .cell tones so
                the poster shows what the game looks like. aria-hidden ornament,
                no interaction. Vertical "PICK" crosses across "KPOP". */}
            <div className="landing__preview" aria-hidden="true">
              <span className="cell cell--word"><span className="cell__num">1</span><span className="cell__letter">K</span></span>
              <span className="cell cell--active"><span className="cell__num">2</span><span className="cell__letter">P</span></span>
              <span className="cell cell--word"><span className="cell__letter">O</span></span>
              <span className="cell cell--word"><span className="cell__letter">P</span></span>
              <span className="cell cell--void" />
              <span className="cell"><span className="cell__letter">I</span></span>
              <span className="cell cell--void" />
              <span className="cell cell--void" />
              <span className="cell cell--void" />
              <span className="cell"><span className="cell__letter">C</span></span>
              <span className="cell cell--void" />
              <span className="cell cell--void" />
              <span className="cell cell--void" />
              <span className="cell cell--correct"><span className="cell__letter">K</span></span>
              <span className="cell cell--void" />
              <span className="cell cell--void" />
            </div>
            <Link href="/artists" className="landing__cta">
              게임 시작
            </Link>
          </div>
        </div>
      </RetroWindow>
    </Desktop>
  );
}
