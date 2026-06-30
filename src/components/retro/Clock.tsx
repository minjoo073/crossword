"use client";

import { useEffect, useState } from "react";

export default function Clock() {
  const [time, setTime] = useState("");
  useEffect(() => {
    const fmt = () =>
      new Date().toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
    setTime(fmt());
    const id = setInterval(() => setTime(fmt()), 10000);
    return () => clearInterval(id);
  }, []);
  return (
    <span className="clock" suppressHydrationWarning>
      {time || "--:--"}
    </span>
  );
}
