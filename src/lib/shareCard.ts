// Generates a shareable result card (Instagram-story ratio) on a canvas,
// then downloads it or hands it to the Web Share API. No external assets.

export interface ShareCardOpts {
  artist: string;
  album: string;
  time: string; // mm:ss
  accent: string;
  accent2: string;
  bg: string;
  fg: string;
  concept?: string;
  fandom?: string;
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

export function drawShareCard(opts: ShareCardOpts): HTMLCanvasElement {
  const W = 1080;
  const H = 1920;
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d")!;

  // Background gradient (album bg -> slightly toward accent)
  const grad = ctx.createLinearGradient(0, 0, W, H);
  grad.addColorStop(0, opts.bg);
  grad.addColorStop(1, mix(opts.bg, opts.accent, 0.22));
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);

  const font = '"Pretendard Variable", Pretendard, system-ui, Arial, sans-serif';

  // Faux retro window card in the center
  const cardX = 90;
  const cardW = W - cardX * 2;
  const cardY = 360;
  const cardH = 1180;
  ctx.save();
  ctx.shadowColor = "rgba(0,0,0,0.45)";
  ctx.shadowBlur = 50;
  ctx.shadowOffsetY = 20;
  ctx.fillStyle = withAlpha(opts.fg, 0.06);
  roundRect(ctx, cardX, cardY, cardW, cardH, 36);
  ctx.fill();
  ctx.restore();
  // card border
  ctx.strokeStyle = withAlpha(opts.fg, 0.18);
  ctx.lineWidth = 2;
  roundRect(ctx, cardX, cardY, cardW, cardH, 36);
  ctx.stroke();

  // Title bar
  ctx.fillStyle = opts.accent;
  roundRect(ctx, cardX, cardY, cardW, 76, 36);
  ctx.fill();
  ctx.fillStyle = opts.accent;
  ctx.fillRect(cardX, cardY + 38, cardW, 38);
  ctx.fillStyle = "#fff";
  ctx.font = `600 30px ${font}`;
  ctx.textBaseline = "middle";
  ctx.textAlign = "left";
  ctx.fillText("K-POP CROSSWORD", cardX + 36, cardY + 39);
  // window dots
  for (let i = 0; i < 3; i++) {
    ctx.beginPath();
    ctx.arc(cardX + cardW - 50 - i * 46, cardY + 38, 13, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(255,255,255,0.85)";
    ctx.fill();
  }

  ctx.textAlign = "center";

  // "CLEAR!"
  ctx.fillStyle = opts.accent;
  ctx.font = `800 188px ${font}`;
  ctx.fillText("CLEAR!", W / 2, cardY + 360);

  // Artist
  ctx.fillStyle = opts.fg;
  ctx.font = `800 76px ${font}`;
  wrapText(ctx, opts.artist, W / 2, cardY + 560, cardW - 120, 84);

  // Album
  ctx.fillStyle = withAlpha(opts.fg, 0.82);
  ctx.font = `600 50px ${font}`;
  wrapText(ctx, opts.album, W / 2, cardY + 660, cardW - 140, 60);

  // Time pill
  const pillW = 420;
  const pillH = 116;
  const pillX = W / 2 - pillW / 2;
  const pillY = cardY + 780;
  ctx.fillStyle = withAlpha(opts.accent, 0.18);
  roundRect(ctx, pillX, pillY, pillW, pillH, 58);
  ctx.fill();
  ctx.fillStyle = withAlpha(opts.fg, 0.7);
  ctx.font = `600 34px ${font}`;
  ctx.fillText("CLEAR TIME", W / 2, pillY + 34);
  ctx.fillStyle = opts.accent;
  ctx.font = `800 64px ${font}`;
  ctx.fillText(opts.time, W / 2, pillY + 80);

  // Concept
  if (opts.concept) {
    ctx.fillStyle = withAlpha(opts.fg, 0.6);
    ctx.font = `400 38px ${font}`;
    wrapText(ctx, `“${opts.concept}”`, W / 2, cardY + 1020, cardW - 140, 50);
  }

  // Footer
  ctx.fillStyle = withAlpha(opts.fg, 0.7);
  ctx.font = `600 40px ${font}`;
  ctx.fillText(opts.fandom ? `#${opts.fandom}` : "#KPOPCROSSWORD", W / 2, H - 150);

  return canvas;
}

export async function shareOrDownload(canvas: HTMLCanvasElement, filename: string, shareText: string) {
  const blob: Blob | null = await new Promise((res) => canvas.toBlob(res, "image/png"));
  if (!blob) return;

  const file = new File([blob], filename, { type: "image/png" });
  const nav = navigator as Navigator & { canShare?: (d: ShareData) => boolean };
  if (nav.share && nav.canShare?.({ files: [file] })) {
    try {
      await nav.share({ files: [file], text: shareText });
      return;
    } catch {
      // user cancelled or share failed — fall through to download
    }
  }
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// ── color helpers ──
function parseHex(hex: string): [number, number, number] {
  let h = hex.replace("#", "");
  if (h.length === 3) h = h.split("").map((c) => c + c).join("");
  const n = parseInt(h, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
function mix(a: string, b: string, t: number): string {
  const [r1, g1, b1] = parseHex(a);
  const [r2, g2, b2] = parseHex(b);
  const r = Math.round(r1 + (r2 - r1) * t);
  const g = Math.round(g1 + (g2 - g1) * t);
  const bl = Math.round(b1 + (b2 - b1) * t);
  return `rgb(${r},${g},${bl})`;
}
function withAlpha(hex: string, a: number): string {
  const [r, g, b] = parseHex(hex);
  return `rgba(${r},${g},${b},${a})`;
}
function wrapText(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, maxW: number, lh: number) {
  const words = text.split(" ");
  let line = "";
  const lines: string[] = [];
  for (const w of words) {
    const test = line ? `${line} ${w}` : w;
    if (ctx.measureText(test).width > maxW && line) {
      lines.push(line);
      line = w;
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);
  lines.forEach((ln, i) => ctx.fillText(ln, x, y + i * lh));
}
