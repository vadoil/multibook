"use client";

import { useCallback, useEffect, useId, useRef, useState, type ReactNode } from "react";
import { StoreTabButton } from "../store/StoreTab";

/** A native horizontal list: touch, trackpad, keyboard and explicit arrows. */
export function ChoiceCarousel({ label, itemKeys, selectedKey, children }: {
  label: string;
  itemKeys: number[];
  selectedKey?: number;
  children: ReactNode;
}) {
  const id = useId();
  const rail = useRef<HTMLUListElement>(null);
  const [position, setPosition] = useState({ start: true, end: false, first: 1, last: 1 });
  const signature = itemKeys.join(",");
  const update = useCallback(() => {
    const element = rail.current;
    if (!element) return;
    const items = [...element.children] as HTMLElement[];
    const left = element.scrollLeft;
    const right = left + element.clientWidth;
    const visible = items.map((item, i) => ({ i, left: item.offsetLeft, right: item.offsetLeft + item.offsetWidth }))
      .filter(item => item.right > left + 8 && item.left < right - 8);
    const next = {
      start: left < 2,
      end: right >= element.scrollWidth - 2,
      first: visible.length ? visible[0].i + 1 : 0,
      last: visible.length ? visible[visible.length - 1].i + 1 : 0,
    };
    setPosition(previous => Object.keys(next).every(key => previous[key as keyof typeof next] === next[key as keyof typeof next]) ? previous : next);
  }, []);

  useEffect(() => {
    const element = rail.current;
    if (!element) return;
    element.scrollLeft = 0;
    update();
    const observer = new ResizeObserver(update);
    observer.observe(element);
    return () => observer.disconnect();
  }, [signature, update]);

  useEffect(() => {
    const element = rail.current;
    if (!element || selectedKey === undefined) return;
    const index = signature.split(",").indexOf(String(selectedKey));
    const item = element.children[index] as HTMLElement | undefined;
    if (!item) return;
    const left = item.offsetLeft - 8;
    const right = item.offsetLeft + item.offsetWidth + 8;
    if (left < element.scrollLeft) element.scrollLeft = Math.max(0, left);
    else if (right > element.scrollLeft + element.clientWidth) element.scrollLeft = right - element.clientWidth;
    update();
  }, [signature, selectedKey, update]);

  const move = (direction: -1 | 1) => {
    const element = rail.current;
    if (!element) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    element.scrollBy({ left: direction * element.clientWidth * .8, behavior: reduce ? "auto" : "smooth" });
  };

  return (
    <div className="constructor-carousel" role="region" aria-roledescription="карусель" aria-label={label}>
      <div className="constructor-carousel-controls">
        <span className="constructor-carousel-count" aria-live="polite" aria-atomic="true">
          {position.first}–{position.last} из {itemKeys.length}
        </span>
        <div className="store-tabs-row">
          {([-1, 1] as const).map(direction => (
            <StoreTabButton key={direction} className="store-tab-compact constructor-carousel-arrow" aria-label={`${direction === -1 ? "Назад" : "Вперёд"}: ${label}`} aria-controls={id} disabled={direction === -1 ? position.start : position.end} onClick={() => move(direction)}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><path d={direction === -1 ? "m14 5-7 7 7 7" : "m10 5 7 7-7 7"} /></svg>
            </StoreTabButton>
          ))}
        </div>
      </div>
      <ul ref={rail} id={id} className="constructor-carousel-track" tabIndex={0} aria-label={label} onScroll={update} onKeyDown={event => {
        if (event.target !== event.currentTarget) return;
        if (event.key === "ArrowRight" || event.key === "ArrowLeft") {
          event.preventDefault();
          move(event.key === "ArrowRight" ? 1 : -1);
        }
      }}>
        {children}
      </ul>
    </div>
  );
}
