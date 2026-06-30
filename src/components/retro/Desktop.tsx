import Link from "next/link";
import type { ReactNode } from "react";
import Clock from "./Clock";

interface DesktopProps {
  children: ReactNode;
  taskbarLabel?: string;
  fill?: boolean;
  dream?: boolean;
}

/** Full-screen retro desktop: CSS wallpaper + taskbar with Start button and clock. */
export default function Desktop({ children, taskbarLabel, fill, dream }: DesktopProps) {
  return (
    <div className={`desktop ${fill ? "desktop--fill" : ""}`}>
      {dream && <div className="dream-bg dream-bg--hero" aria-hidden="true" />}
      <div className="desktop__stage">{children}</div>
      <div className="taskbar">
        <Link href="/" className="start-btn">
          <span className="start-btn__flag" aria-hidden />
          start
        </Link>
        {taskbarLabel && <span className="taskbar__tab">{taskbarLabel}</span>}
        <span className="taskbar__spacer" />
        <Clock />
      </div>
    </div>
  );
}
