"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

/** Native lazy loading looks far beyond a horizontal rail; mount nearby photos only. */
export function CarouselItem({ eager, children }: { eager: boolean; children: (loadPhoto: boolean) => ReactNode }) {
  const item = useRef<HTMLLIElement>(null);
  const [loadPhoto, setLoadPhoto] = useState(eager);
  useEffect(() => {
    const element = item.current;
    if (loadPhoto || !element) return;
    const root = element.closest("ul");
    const observer = new IntersectionObserver(entries => {
      if (entries.some(entry => entry.isIntersecting)) {
        setLoadPhoto(true);
        observer.disconnect();
      }
    }, { root, rootMargin: "0px 240px" });
    observer.observe(element);
    return () => observer.disconnect();
  }, [loadPhoto]);
  return <li ref={item}>{children(loadPhoto)}</li>;
}
