import Link from "next/link";
import type { ReactNode } from "react";

interface RetroWindowProps {
  title: string;
  menus?: string[];
  closeHref?: string;
  children: ReactNode;
  className?: string;
  fill?: boolean;
}

/** Old-Windows window chrome: title bar + menu bar + min/max/close controls. */
export default function RetroWindow({
  title,
  menus = ["파일", "편집", "보기", "도움말"],
  closeHref,
  children,
  className,
  fill,
}: RetroWindowProps) {
  return (
    <div className={`win win--app ${fill ? "win--fill" : ""} ${className ?? ""}`}>
      <div className="win__title">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo-mark.svg" alt="" className="win__title-ico" aria-hidden="true" />
        <span className="win__title-text">{title}</span>
        <span className="win__ctrls">
          <span className="win__ctrl" aria-hidden>
            _
          </span>
          <span className="win__ctrl" aria-hidden>
            □
          </span>
          {closeHref ? (
            <Link href={closeHref} className="win__ctrl win__ctrl--close" aria-label="닫기">
              ✕
            </Link>
          ) : (
            <span className="win__ctrl win__ctrl--close" aria-hidden>
              ✕
            </span>
          )}
        </span>
      </div>
      {menus.length > 0 && (
        <div className="win__menu">
          {menus.map((m) => (
            <span key={m}>
              <u>{m.slice(0, 1)}</u>
              {m.slice(1)}
            </span>
          ))}
        </div>
      )}
      <div className="win__body">{children}</div>
    </div>
  );
}
