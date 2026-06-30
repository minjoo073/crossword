import type { Metadata } from "next";
import "./globals.css";
import "./retro.css";
import "./dream.css";
import "./anim.css";

export const metadata: Metadata = {
  title: "K-POP Album Crossword",
  description: "최애 앨범 컨셉으로 즐기는 K-pop 크로스워드 퍼즐. 4·5세대 아이돌 앨범 퀴즈.",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
