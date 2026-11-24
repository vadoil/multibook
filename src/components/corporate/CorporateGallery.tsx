"use client";

import Image from "next/image";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import { StoreTabButton } from "../store/StoreTab";

export type CorporatePhoto = { id: number; title: string; src: string; preview: string; width: number; height: number };

function GalleryPhoto({ photo, variant, priority, onOpen }: { photo: CorporatePhoto; variant: "portfolio" | "details"; priority: boolean; onOpen: () => void }) {
  const button = useRef<HTMLButtonElement>(null);
  const [load, setLoad] = useState(priority);
  useEffect(() => {
    const element = button.current;
    if (!element || load) return;
    const observer = new IntersectionObserver(entries => {
      if (entries.some(entry => entry.isIntersecting)) { setLoad(true); observer.disconnect(); }
    }, { root: element.closest("ul"), rootMargin: "0px 240px" });
    observer.observe(element);
    return () => observer.disconnect();
  }, [load]);
  return <button ref={button} className="corporate-photo" type="button" aria-label={`Открыть крупно: ${photo.title}`} aria-haspopup="dialog" onClick={onOpen}>
    {load && <Image src={variant === "details" ? photo.preview : photo.src} alt={photo.title} fill sizes={variant === "details" ? "380px" : "(max-width:760px) 100vw, 60vw"} unoptimized priority={priority} className="object-contain" />}
    <span className="corporate-photo-zoom" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M9 4H4v5m11-5h5v5M4 15v5h5m6 0h5v-5" /></svg></span>
  </button>;
}

export function CorporateGallery({ photos, label, variant = "portfolio" }: { photos: CorporatePhoto[]; label: string; variant?: "portfolio" | "details" }) {
  const rail = useRef<HTMLUListElement>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const [selected, setSelected] = useState<CorporatePhoto | null>(null);
  const [position, setPosition] = useState({ first: 1, last: 1, start: true, end: false });
  const id = useId();
  const heading = useId();
  const update = useCallback(() => {
    const element = rail.current;
    if (!element) return;
    const left = element.scrollLeft, right = left + element.clientWidth;
    const visible = [...element.children].map((child, index) => ({ index, left: (child as HTMLElement).offsetLeft, right: (child as HTMLElement).offsetLeft + (child as HTMLElement).offsetWidth })).filter(item => item.right > left + 8 && item.left < right - 8);
    const next = { first: (visible[0]?.index ?? 0) + 1, last: (visible.at(-1)?.index ?? 0) + 1, start: left < 2, end: right >= element.scrollWidth - 2 };
    setPosition(old => old.first === next.first && old.last === next.last && old.start === next.start && old.end === next.end ? old : next);
  }, []);
  useEffect(() => {
    if (!rail.current) return;
    const observer = new ResizeObserver(update);
    observer.observe(rail.current);
    update();
    return () => observer.disconnect();
  }, [update]);
  const move = (direction: -1 | 1) => {
    const element = rail.current;
    if (!element) return;
    element.scrollBy({ left: element.clientWidth * direction, behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
  };
  return (
    <div className={`corporate-gallery corporate-gallery-${variant}`} role="region" aria-label={label} aria-roledescription="карусель">
      <div className="corporate-gallery-controls">
        <span aria-live="polite" aria-atomic="true">{position.first}{position.last > position.first ? `–${position.last}` : ""} из {photos.length}</span>
        <div className="store-tabs-row">
          {([-1, 1] as const).map(direction => <StoreTabButton key={direction} className="store-tab-compact corporate-gallery-arrow" aria-label={`${direction < 0 ? "Назад" : "Вперёд"}: ${label}`} aria-controls={id} disabled={direction < 0 ? position.start : position.end} onClick={() => move(direction)}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true"><path d={direction < 0 ? "m14 5-7 7 7 7" : "m10 5 7 7-7 7"} /></svg></StoreTabButton>)}
        </div>
      </div>
      <ul id={id} ref={rail} className="corporate-gallery-rail" tabIndex={0} aria-label={label} onScroll={update} onKeyDown={event => {
        if (event.target === event.currentTarget && (event.key === "ArrowLeft" || event.key === "ArrowRight")) { event.preventDefault(); move(event.key === "ArrowLeft" ? -1 : 1); }
      }}>
        {photos.map((photo, index) => <li key={photo.id} data-corporate-photo={photo.id}>
          <GalleryPhoto photo={photo} variant={variant} priority={variant === "portfolio" && index === 0} onOpen={() => { setSelected(photo); dialog.current?.showModal(); }} />
          <p>{photo.title}</p>
        </li>)}
      </ul>
      <dialog ref={dialog} className="corporate-lightbox" aria-labelledby={heading} onClose={() => setSelected(null)}>
        <div className="corporate-lightbox-heading"><h2 id={heading}>{selected?.title ?? "Фотография работы"}</h2><StoreTabButton className="store-tab-compact" onClick={() => dialog.current?.close()} aria-label="Закрыть фотографию">Закрыть <span aria-hidden="true">×</span></StoreTabButton></div>
        {selected && <div className="corporate-lightbox-photo"><Image src={selected.src} alt={selected.title} width={selected.width} height={selected.height} unoptimized /></div>}
        {selected && <a href={selected.src} target="_blank" rel="noopener noreferrer" className="corporate-full-photo">Открыть фотографию отдельно <span aria-hidden="true">↗</span></a>}
      </dialog>
    </div>
  );
}
