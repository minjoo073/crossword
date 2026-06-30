"use client";

import { useEffect, useState } from "react";

const formatClock = () => new Date().toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });

export default function Clock() {
  const [time, setTime] = useState(formatClock);

  useEffect(() => {
    const id = setInterval(() => setTime(formatClock()), 10000);
    return () => clearInterval(id);
  }, []);

  return (
    <span className="clock" suppressHydrationWarning>
      {time || "--:--"}
    </span>
  );
}
