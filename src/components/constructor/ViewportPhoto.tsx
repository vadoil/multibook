"use client";

import Image, { type ImageProps } from "next/image";
import { useEffect, useRef, useState } from "react";

/** Keep distant paper blocks/discs from joining the carousel's initial image burst. */
export function ViewportPhoto(props: ImageProps) {
  const frame = useRef<HTMLSpanElement>(null);
  const [near, setNear] = useState(false);
  useEffect(() => {
    const element = frame.current;
    if (!element) return;
    const observer = new IntersectionObserver(entries => {
      if (entries.some(entry => entry.isIntersecting)) {
        setNear(true);
        observer.disconnect();
      }
    }, { rootMargin: "320px 0px" });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  return <span ref={frame} className="constructor-viewport-photo">{near && <Image {...props} />}</span>;
}
