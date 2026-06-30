import Link from "next/link";
import Desktop from "@/components/retro/Desktop";

export default function Landing() {
  return (
    <Desktop taskbarLabel="K-POP CROSSWORD" dream>
      <div className="landing">
        <span className="sticker sticker--star sticker--lg" style={{ top: "6%", left: "12%" }} aria-hidden="true" />
        <span className="sticker sticker--sparkle sticker--md" style={{ top: "16%", right: "16%" }} aria-hidden="true" />
        <span className="sticker sticker--star sticker--md sticker--delay" style={{ bottom: "20%", left: "20%" }} aria-hidden="true" />
        <span className="sticker sticker--bubble sticker--lg" style={{ bottom: "12%", right: "14%" }} aria-hidden="true" />

        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo.svg" alt="K-POP CROSSWORD" className="landing__logo-img" />
        <span className="y2k-tag y2k-tag--sky y2k-tag--straight">Is it time?</span>
        <Link href="/artists" className="cta-glossy">
          ▶ 게임 시작
        </Link>
      </div>
    </Desktop>
  );
}
